from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from supabase import (
    create_client,
    Client,
    AuthApiError,
    AuthError,
    AuthInvalidCredentialsError,
    AuthSessionMissingError,
)
from pydantic import BaseModel, ConfigDict, EmailStr, field_validator
from typing import List, Optional, Dict, Any
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Spotnere Admin API",
    description="Backend API for Spotnere Admin Panel",
    version="1.0.0"
)

# CORS middleware to allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://localhost:5173",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:5173",
        "https://spotnere-admin-dashboard.vercel.app"
    ],  # Add your frontend URLs
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Supabase configuration
# Use service_role key to bypass RLS when reading places/users (admin operations).
# The anon key is subject to Row Level Security and may return empty results.
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Prefer service_role key for full database access; fallback to anon key
_SUPABASE_KEY = SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY

if not SUPABASE_URL or not _SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY (or SUPABASE_SERVICE_ROLE_KEY) must be set in environment variables")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, _SUPABASE_KEY)


# Pydantic models for authentication
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class SignupRequest(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone_number: str
    password: str
    address: str
    city: str
    state: str
    country: str
    postal_code: str


class AuthResponse(BaseModel):
    success: bool
    message: str
    user: Optional[Dict[str, Any]] = None
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None


# Pydantic models for response
# Matches the exact database schema from Supabase
class Customer(BaseModel):
    id: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None
    password_hash: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    bookings: Optional[List[Dict[str, Any]]] = None  # JSONB array
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    status: Optional[str] = None  # active, inactive, pending
    
    model_config = ConfigDict(
        from_attributes=True,
        extra="allow"
    )


class Place(BaseModel):
    """Matches public.places table schema."""
    id: Optional[str] = None  # uuid PRIMARY KEY
    name: Optional[str] = None  # text NOT NULL
    address: Optional[str] = None  # text NOT NULL
    city: Optional[str] = None  # text NOT NULL
    state: Optional[str] = None  # text NULL
    country: Optional[str] = None  # text NOT NULL
    banner_image_link: Optional[str] = None  # text NULL
    location_map_link: Optional[str] = None  # text NULL
    created_at: Optional[str] = None  # timestamptz
    updated_at: Optional[str] = None  # timestamptz
    category: Optional[str] = None  # text NULL
    description: Optional[str] = None  # text NULL
    avg_price: Optional[float] = None  # numeric(10,2) NULL
    review_count: Optional[int] = None  # integer NULL DEFAULT 0
    phone_number: Optional[str] = None  # text NULL
    latitude: Optional[float] = None  # double precision NULL
    longitude: Optional[float] = None  # double precision NULL
    hours: Optional[List[Dict[str, Any]]] = None  # jsonb NULL
    amenities: Optional[List[str]] = None  # text[] NULL
    website: Optional[str] = None  # text NULL
    last_updated: Optional[str] = None  # timestamptz NULL
    visible: Optional[bool] = None  # boolean NOT NULL DEFAULT true
    postal_code: Optional[str] = None  # text NULL
    sub_category: Optional[str] = None  # text NOT NULL
    rating: Optional[float] = None  # numeric NULL

    @field_validator("hours", mode="before")
    @classmethod
    def normalize_hours(cls, v: Any) -> Optional[List[Dict[str, Any]]]:
        """Convert hours from dict format {day: {open, close}} to list format [{day, open, close}]."""
        if v is None:
            return None
        if isinstance(v, list):
            return v
        if isinstance(v, dict):
            return [
                {"day": day, **info} if isinstance(info, dict) else {"day": day, "open": "09:00", "close": "17:00"}
                for day, info in v.items()
            ]
        return None

    model_config = ConfigDict(
        from_attributes=True,
        # Allow extra fields from database that aren't in the model
        extra="allow"
    )


class Vendor(BaseModel):
    """Vendor/owner info for a place. Excludes password_hash only."""
    id: Optional[str] = None
    business_name: Optional[str] = None
    vendor_full_name: Optional[str] = None
    vendor_phone_number: Optional[str] = None
    vendor_email: Optional[str] = None
    vendor_address: Optional[str] = None
    vendor_city: Optional[str] = None
    vendor_state: Optional[str] = None
    vendor_country: Optional[str] = None
    vendor_postal_code: Optional[str] = None
    place_id: Optional[str] = None
    account_holder_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    upi_id: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    model_config = ConfigDict(from_attributes=True, extra="allow")


# Health check endpoint
@app.get("/")
async def root():
    return {"message": "Spotnere Admin API is running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "spotnere-admin-api"}


# Authentication endpoints
@app.post("/api/auth/login", response_model=AuthResponse)
async def login(credentials: LoginRequest):
    """
    Login endpoint for user authentication using Supabase Auth.
    
    Args:
        credentials: Login credentials (email and password)
    
    Returns:
        AuthResponse: Authentication response with user data and tokens
    """
    try:
        
        # Authenticate user with Supabase Auth
        # This uses the Supabase Auth table for authentication
        auth_response = supabase.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password
        })
        
        
        # Check if authentication was successful
        if not auth_response.user:
            print("Authentication failed: No user in response")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Check if session exists (required for tokens)
        if not auth_response.session:
            print("Authentication failed: No session in response")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication failed: No session created. Please check if email is confirmed."
            )
        
        
        # Get user data from admins table
        user_data = None
        try:
            admin_profile = supabase.table("admins").select("*").eq("email", credentials.email).execute()
            if admin_profile.data and len(admin_profile.data) > 0:
                user_data = admin_profile.data[0]
            else:
                # If admin profile doesn't exist, create basic user data from auth
                print("No admin profile found, using auth user data")
                user_data = {
                    "id": auth_response.user.id,
                    "email": auth_response.user.email,
                }
        except Exception as profile_error:
            # If admins table query fails, use auth user data
            print(f"Error fetching admin profile: {profile_error}")
            user_data = {
                "id": auth_response.user.id,
                "email": auth_response.user.email,
            }
        
        return AuthResponse(
            success=True,
            message="Login successful",
            user=user_data,
            access_token=auth_response.session.access_token,
            refresh_token=auth_response.session.refresh_token
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except (AuthInvalidCredentialsError, AuthApiError) as e:
        # Handle Supabase authentication errors
        error_message = str(e)
        print(f"Supabase Auth error: {error_message}")
        print(f"Error type: {type(e).__name__}")
        
        # Check for specific error messages
        error_lower = error_message.lower()
        if "email not confirmed" in error_lower or "email_not_confirmed" in error_lower:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Please confirm your email before logging in"
            )
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    except AuthSessionMissingError as e:
        print(f"Session missing error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed: No session created. Please check if email is confirmed."
        )
    except AuthError as e:
        error_message = str(e)
        print(f"General Auth error: {error_message}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication error: {error_message}"
        )
    except Exception as e:
        error_message = str(e)
        error_type = type(e).__name__
        print(f"Login error (type: {error_type}): {error_message}")
        print(f"Full error: {repr(e)}")
        
        # Handle specific error messages in case exception type wasn't caught
        error_lower = error_message.lower()
        
        if "invalid login credentials" in error_lower or "invalid_credentials" in error_lower:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        if "email not confirmed" in error_lower or "email_not_confirmed" in error_lower:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Please confirm your email before logging in"
            )
        if "invalid password" in error_lower:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        if "user not found" in error_lower or "user_not_found" in error_lower:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Generic error response
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during login: {error_message}"
        )


@app.post("/api/auth/signup", response_model=AuthResponse)
async def signup(user_data: SignupRequest):
    """
    Signup endpoint for user registration.
    
    Args:
        user_data: User registration data
    
    Returns:
        AuthResponse: Authentication response with user data and tokens
    """
    try:
        # Create user in Supabase Auth
        auth_response = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
            "options": {
                "data": {
                    "first_name": user_data.first_name,
                    "last_name": user_data.last_name,
                    "phone_number": user_data.phone_number,
                }
            }
        })
        
        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create user account"
            )
        
        # Store additional user data in admins table
        try:
            user_profile = {
                "id": auth_response.user.id,
                "email": user_data.email,
                "first_name": user_data.first_name,
                "last_name": user_data.last_name,
                "phone_number": user_data.phone_number,
                "address": user_data.address,
                "city": user_data.city,
                "state": user_data.state,
                "country": user_data.country,
                "postal_code": user_data.postal_code,
            }
            
            # Insert user profile into admins table
            profile_response = supabase.table("admins").insert(user_profile).execute()
            
            if not profile_response.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create admin profile"
                )
            
            user_profile = profile_response.data[0]
        except HTTPException:
            # Re-raise HTTP exceptions
            raise
        except Exception as e:
            # If admins table insert fails, raise error instead of silently continuing
            error_msg = str(e)
            print(f"Error inserting into admins table: {error_msg}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create admin profile: {error_msg}"
            )
        
        return AuthResponse(
            success=True,
            message="Account created successfully",
            user=user_profile,
            access_token=auth_response.session.access_token if auth_response.session else None,
            refresh_token=auth_response.session.refresh_token if auth_response.session else None
        )
        
    except Exception as e:
        error_message = str(e)
        if "User already registered" in error_message or "already exists" in error_message.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email already exists"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during signup: {error_message}"
        )


@app.get("/api/admins/{admin_id}")
async def get_admin_by_id(admin_id: str):
    """
    Get admin details by ID.
    
    Args:
        admin_id: The admin user ID
    
    Returns:
        Admin data from the admins table
    """
    try:
        admin_response = supabase.table("admins").select("*").eq("id", admin_id).execute()
        
        if not admin_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Admin not found"
            )
        
        return admin_response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching admin: {str(e)}"
        )


@app.get("/api/admins/email/{email}")
async def get_admin_by_email(email: str):
    """
    Get admin details by email.
    
    Args:
        email: The admin email address
    
    Returns:
        Admin data from the admins table
    """
    try:
        admin_response = supabase.table("admins").select("*").eq("email", email).execute()
        
        if not admin_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Admin not found"
            )
        
        return admin_response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching admin: {str(e)}"
        )


# Admin roles that qualify for the administration list
_ADMIN_ROLES = {"admin", "super_admin", "super admin", "administrator", "superadmin", "super-admin"}


def _is_admin_role(role: Optional[str]) -> bool:
    if not role:
        return False
    return role.lower().strip() in _ADMIN_ROLES


@app.get("/api/administration/admins")
async def list_administration_admins():
    """
    List all admins and super admins from the public.admins table.
    """
    try:
        admins_response = supabase.table("admins").select(
            "id, first_name, last_name, phone_number, email, address, city, state, country, postal_code, role, created_at, updated_at"
        ).execute()
        admins_data = admins_response.data or []
        admin_profiles = [a for a in admins_data if _is_admin_role(a.get("role"))]

        result = []
        for admin in admin_profiles:
            first = admin.get("first_name") or ""
            last = admin.get("last_name") or ""
            display_name = f"{first} {last}".strip()

            result.append({
                "id": admin.get("id"),
                "display_name": display_name or "—",
                "email": admin.get("email") or "",
                "phone": admin.get("phone_number") or "—",
                "address": admin.get("address"),
                "city": admin.get("city"),
                "state": admin.get("state"),
                "country": admin.get("country"),
                "postal_code": admin.get("postal_code"),
                "role": admin.get("role") or "—",
                "created_at": admin.get("created_at"),
                "updated_at": admin.get("updated_at"),
            })

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error listing admins: {str(e)}"
        ) from e


@app.get("/api/payouts")
async def get_payouts():
    """
    Get payout summary per place/vendor with full vendor details.
    Uses vendors.paid_so_far for amount_paid. Aggregates from vendors, places, bookings.
    """
    try:
        # Fetch full vendor details (exclude password_hash)
        vendors_res = supabase.table("vendors").select(
            "id, place_id, business_name, vendor_full_name, vendor_phone_number, vendor_email, "
            "vendor_address, vendor_city, vendor_state, vendor_country, vendor_postal_code, "
            "account_holder_name, account_number, ifsc_code, upi_id, paid_so_far, created_at, updated_at"
        ).execute()
        vendors = vendors_res.data or []
        vendor_by_place = {v["place_id"]: v for v in vendors if v.get("place_id")}

        # Fetch places
        places_res = supabase.table("places").select("id, name, avg_price").execute()
        places = places_res.data or []
        place_by_id = {p["id"]: p for p in places}

        # Fetch all bookings - total_amount = sum of amount_payable_to_vendor
        try:
            bookings_res = supabase.table("bookings").select("place_id, amount_payable_to_vendor").execute()
        except Exception:
            bookings_res = supabase.table("bookings").select("place_id").execute()
        bookings = bookings_res.data or []

        # Aggregate by place_id: count and total_amount (sum of amount_payable_to_vendor)
        place_stats: Dict[str, Dict[str, Any]] = {}
        for b in bookings:
            pid = b.get("place_id")
            if not pid:
                continue
            if pid not in place_stats:
                place_stats[pid] = {"count": 0, "total_amount": 0.0}
            place_stats[pid]["count"] += 1
            amt = b.get("amount_payable_to_vendor")
            if amt is not None:
                try:
                    place_stats[pid]["total_amount"] += float(amt)
                except (TypeError, ValueError):
                    pass

        # Fallback: if amount_payable_to_vendor doesn't exist, use avg_price * count
        for pid, stats in place_stats.items():
            if stats["total_amount"] == 0 and stats["count"] > 0:
                place = place_by_id.get(pid, {})
                avg = place.get("avg_price") or 0
                try:
                    stats["total_amount"] = float(avg) * stats["count"]
                except (TypeError, ValueError):
                    pass

        def _vendor_payout_row(vendor: Dict, place: Dict, stats: Dict[str, Any]) -> Dict:
            pid = vendor.get("place_id")
            total_amount = round(stats.get("total_amount", 0), 2)
            amount_paid = round(float(vendor.get("paid_so_far") or 0), 2)
            balance = round(total_amount - amount_paid, 2)
            return {
                "place_id": pid,
                "vendor_id": vendor.get("id"),
                "name": vendor.get("vendor_full_name") or vendor.get("business_name") or "—",
                "place_name": place.get("name") or "—",
                "num_bookings": stats.get("count", 0),
                "total_amount": total_amount,
                "amount_paid": amount_paid,
                "balance": balance,
                "vendor": {
                    "id": vendor.get("id"),
                    "business_name": vendor.get("business_name"),
                    "vendor_full_name": vendor.get("vendor_full_name"),
                    "vendor_phone_number": vendor.get("vendor_phone_number"),
                    "vendor_email": vendor.get("vendor_email"),
                    "vendor_address": vendor.get("vendor_address"),
                    "vendor_city": vendor.get("vendor_city"),
                    "vendor_state": vendor.get("vendor_state"),
                    "vendor_country": vendor.get("vendor_country"),
                    "vendor_postal_code": vendor.get("vendor_postal_code"),
                    "account_holder_name": vendor.get("account_holder_name"),
                    "account_number": vendor.get("account_number"),
                    "ifsc_code": vendor.get("ifsc_code"),
                    "upi_id": vendor.get("upi_id"),
                    "paid_so_far": amount_paid,
                    "created_at": vendor.get("created_at"),
                    "updated_at": vendor.get("updated_at"),
                },
            }

        # Build result: include places that have bookings
        seen_places = set()
        result = []
        for pid, stats in place_stats.items():
            if pid in seen_places:
                continue
            seen_places.add(pid)
            place = place_by_id.get(pid, {})
            vendor = vendor_by_place.get(pid, {})
            if not vendor:
                vendor = {"place_id": pid, "paid_so_far": 0}
            result.append(_vendor_payout_row(vendor, place, stats))

        # Include vendors with places that have no bookings yet
        for v in vendors:
            pid = v.get("place_id")
            if not pid or pid in seen_places:
                continue
            seen_places.add(pid)
            place = place_by_id.get(pid, {})
            result.append(_vendor_payout_row(v, place, {"count": 0, "total_amount": 0.0}))

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching payouts: {str(e)}"
        ) from e


# Get total count of places from Supabase
@app.get("/api/places/count")
async def get_places_count():
    """
    Get the total count of places in the database.
    
    Returns:
        dict: A dictionary with the total count of places
    """
    try:
        # Use count() with limit(0) to get only the count without fetching any data
        print("Fetching places count from Supabase")
        response = supabase.table("places").select("*", count="exact").limit(0).execute()
        
        # The count is available in response.count
        # If count is not available, try to get it from the response
        if hasattr(response, 'count') and response.count is not None:
            count = response.count
        elif hasattr(response, 'data') and response.data is not None:
            # Fallback: count the data if available (though with limit(0) this should be empty)
            count = len(response.data) if isinstance(response.data, list) else 0
        else:
            count = 0
        
        return {"count": count}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching places count: {str(e)}"
        )


# Get count of unique countries from places table
@app.get("/api/places/countries/count")
async def get_countries_count():
    """
    Get the count of unique countries in the places table.
    
    Returns:
        dict: A dictionary with the count of unique countries
    """
    try:
        print("Fetching countries count from Supabase")
        # Get distinct countries from places table
        # Using select with distinct on country field
        response = supabase.table("places").select("country").execute()
        
        if not response.data:
            return {"count": 0}
        
        # Extract unique countries (filter out None/null values)
        countries = set()
        for place in response.data:
            if place.get("country") and place["country"].strip():
                countries.add(place["country"].strip())
        
        count = len(countries)
        return {"count": count}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching countries count: {str(e)}"
        )


# Get average rating from places table
@app.get("/api/places/rating/average")
async def get_average_rating():
    """
    Get the average rating from all places in the database.
    
    Returns:
        dict: A dictionary with the average rating
    """
    try:
        print("Fetching average rating from Supabase")
        # Get all places with ratings
        response = supabase.table("places").select("rating").execute()
        
        if not response.data:
            return {"average": 0.0}
        
        # Calculate average rating (filter out None/null values)
        ratings = []
        for place in response.data:
            rating = place.get("rating")
            if rating is not None:
                try:
                    # Convert to float if it's a string
                    rating_float = float(rating)
                    ratings.append(rating_float)
                except (ValueError, TypeError):
                    continue
        
        if not ratings:
            return {"average": 0.0}
        
        average = sum(ratings) / len(ratings)
        # Round to 2 decimal places
        average = round(average, 2)
        
        return {"average": average}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching average rating: {str(e)}"
        )


# Get total count of users/customers
@app.get("/api/users/count")
async def get_users_count():
    """
    Get the total count of users/customers in the database.
    
    Returns:
        dict: A dictionary with the total count of users
    """
    try:
        print("Fetching users count from Supabase")
        # Use count() with limit(0) to get only the count without fetching any data
        response = supabase.table("users").select("*", count="exact").limit(0).execute()
        
        # The count is available in response.count
        if hasattr(response, 'count') and response.count is not None:
            count = response.count
        elif hasattr(response, 'data') and response.data is not None:
            count = len(response.data) if isinstance(response.data, list) else 0
        else:
            count = 0
        
        return {"count": count}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching users count: {str(e)}"
        )


# Get gallery images for a place (must be declared before /api/places/{place_id} for correct route matching)
@app.get("/api/places/{place_id}/gallery-images")
async def get_gallery_images(place_id: str):
    """Get all gallery images for a place."""
    try:
        response = supabase.table("gallery_images").select("*").eq("place_id", place_id).order("created_at", desc=False).execute()
        return response.data if response.data else []
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching gallery images: {str(e)}"
        )


# Get vendor/owner for a place (must be declared before /api/places/{place_id} for correct route matching)
@app.get("/api/places/{place_id}/vendor")
async def get_vendor_by_place_id(place_id: str):
    """
    Retrieve the vendor/owner for a place from the vendors table.
    vendors.place_id references places.id.

    Returns:
        Vendor data or null if no vendor is linked to this place.
    """
    try:
        response = supabase.table("vendors").select(
            "id, business_name, vendor_full_name, vendor_phone_number, vendor_email, "
            "vendor_address, vendor_city, vendor_state, vendor_country, vendor_postal_code, "
            "place_id, account_holder_name, account_number, ifsc_code, upi_id, "
            "razorpay_contact_ref, razorpay_fa_ref, "
            "created_at, updated_at"
        ).eq("place_id", place_id).execute()

        if not response.data or len(response.data) == 0:
            return JSONResponse(status_code=200, content=None)

        return Vendor(**response.data[0])
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching vendor: {str(e)}"
        )


# Get a single place by ID
@app.get("/api/places/{place_id}", response_model=Place)
async def get_place_by_id(place_id: str):
    """
    Retrieve a single place by ID from the Supabase database.
    Rating and review_count are computed from the reviews table for accuracy.
    
    Args:
        place_id: The UUID of the place to retrieve
        
    Returns:
        Place: The place object
    """
    try:
        # Query the places table from Supabase
        response = supabase.table("places").select("*").eq("id", place_id).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Place with id {place_id} not found"
            )
        
        place_data = dict(response.data[0])
        
        # Fetch rating and review_count from reviews table
        try:
            reviews_res = supabase.table("reviews").select("rating").eq("place_id", place_id).execute()
            reviews = reviews_res.data or []
            if reviews:
                ratings = []
                for r in reviews:
                    val = r.get("rating")
                    if val is not None:
                        try:
                            ratings.append(float(val))
                        except (TypeError, ValueError):
                            pass
                place_data["review_count"] = len(reviews)
                place_data["rating"] = round(sum(ratings) / len(ratings), 1) if ratings else None
            else:
                place_data["review_count"] = 0
                place_data["rating"] = None
        except Exception:
            pass  # Keep place table values if reviews fetch fails
        
        # Convert to Place model
        place = Place(**place_data)
        return place
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching place: {str(e)}"
        )


# Get all reviews (from reviews table, with user and place info)
@app.get("/api/reviews")
async def get_all_reviews():
    """
    Retrieve all reviews from the reviews table.
    Includes user (first_name, last_name, email) and place (name) via FK joins.
    """
    try:
        response = supabase.table("reviews").select(
            "id, user_id, place_id, review, rating, created_at, "
            "users!user_id(first_name, last_name, email), "
            "places!place_id(name)"
        ).order("created_at", desc=True).execute()

        if not response.data:
            return []

        # Normalize embedded objects (Supabase returns many-to-one as dict or list)
        result = []
        for row in response.data:
            user_data = row.get("users")
            place_data = row.get("places")
            # Handle list (some PostgREST versions return single as [obj])
            if isinstance(user_data, list):
                user_data = user_data[0] if user_data else None
            if isinstance(place_data, list):
                place_data = place_data[0] if place_data else None
            result.append({
                "id": row.get("id"),
                "user_id": row.get("user_id"),
                "place_id": row.get("place_id"),
                "review": row.get("review"),
                "rating": float(row.get("rating", 0)) if row.get("rating") is not None else None,
                "created_at": row.get("created_at"),
                "user_name": (
                    f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip()
                    if isinstance(user_data, dict) else ""
                ),
                "user_email": user_data.get("email", "") if isinstance(user_data, dict) else "",
                "place_name": place_data.get("name", "") if isinstance(place_data, dict) else "",
            })
        return result
    except Exception as e:
        import traceback
        print(f"Error fetching reviews: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching reviews: {str(e)}"
        )


# Get all bookings (from bookings table, with user and place info)
@app.get("/api/bookings")
async def get_all_bookings(place_id: Optional[str] = None):
    """
    Retrieve all bookings from the bookings table.
    Fetches all booking columns plus user (first_name, last_name, email) and place (name) via FK joins.
    Optional place_id: filter bookings for a specific place.
    """
    try:
        try:
            query = supabase.table("bookings").select(
                "*, users!user_id(first_name, last_name, email), places!place_id(name)"
            )
            if place_id:
                query = query.eq("place_id", place_id)
            response = query.order("booking_date_and_time", desc=True).execute()
        except Exception:
            try:
                query = supabase.table("bookings").select(
                    "*, users!user_id(first_name, last_name, email), places!place_id(name)"
                )
                if place_id:
                    query = query.eq("place_id", place_id)
                response = query.execute()
            except Exception:
                query = supabase.table("bookings").select("*")
                if place_id:
                    query = query.eq("place_id", place_id)
                response = query.execute()

        if not response.data:
            return []

        result = []
        for row in response.data:
            user_data = row.get("users")
            place_data = row.get("places")
            if isinstance(user_data, list):
                user_data = user_data[0] if user_data else None
            if isinstance(place_data, list):
                place_data = place_data[0] if place_data else None

            # Build result with all booking columns (exclude nested join objects)
            item = {k: v for k, v in row.items() if k not in ("users", "places")}
            item["user_name"] = (
                f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip()
                if isinstance(user_data, dict) else ""
            )
            item["user_email"] = user_data.get("email", "") if isinstance(user_data, dict) else ""
            item["place_name"] = place_data.get("name", "") if isinstance(place_data, dict) else ""

            # Ensure numeric types for amount fields
            if "amount_paid" in item and item["amount_paid"] is not None:
                try:
                    item["amount_paid"] = float(item["amount_paid"])
                except (TypeError, ValueError):
                    pass
            if "amount_payable_to_vendor" in item and item["amount_payable_to_vendor"] is not None:
                try:
                    item["amount_payable_to_vendor"] = float(item["amount_payable_to_vendor"])
                except (TypeError, ValueError):
                    item["amount_payable_to_vendor"] = 0.0

            result.append(item)
        return result
    except Exception as e:
        import traceback
        print(f"Error fetching bookings: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching bookings: {str(e)}"
        )


# Get sales analytics from bookings (aggregated by period)
@app.get("/api/bookings/sales-analytics")
async def get_bookings_sales_analytics(period: str = "monthly"):
    """
    Get sales data from bookings table aggregated by period.
    period: daily (last 14 days), weekly (last 12 weeks), monthly (last 12 months)
    Returns list of { label, sales, count } for the bar chart.
    """
    try:
        try:
            response = supabase.table("bookings").select(
                "amount_paid, amount_payable_to_vendor, booking_date_and_time, booking_date_time"
            ).execute()
        except Exception:
            response = supabase.table("bookings").select("*").execute()

        bookings = response.data or []
        if not bookings:
            return _empty_analytics(period)

        from datetime import datetime, timedelta, timezone
        from collections import defaultdict

        def get_date(row):
            dt = row.get("booking_date_and_time") or row.get("booking_date_time")
            if not dt:
                return None
            try:
                return datetime.fromisoformat(dt.replace("Z", "+00:00"))
            except Exception:
                return None

        def get_amount(row):
            amt = row.get("amount_paid") or row.get("amount_payable_to_vendor")
            if amt is None:
                return 0.0
            try:
                return float(amt)
            except (TypeError, ValueError):
                return 0.0

        now = datetime.utcnow()
        buckets: Dict[str, Dict[str, Any]] = defaultdict(lambda: {"sales": 0.0, "count": 0})

        for row in bookings:
            dt = get_date(row)
            if not dt:
                continue
            if dt.tzinfo:
                dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
            amt = get_amount(row)

            if period == "daily":
                key = dt.strftime("%Y-%m-%d")
                start = (now - timedelta(days=14)).replace(hour=0, minute=0, second=0, microsecond=0)
                if dt < start:
                    continue
            elif period == "weekly":
                week_start = dt - timedelta(days=dt.weekday())
                key = week_start.strftime("%Y-%m-%d")
                start = (now - timedelta(weeks=12)).replace(hour=0, minute=0, second=0, microsecond=0)
                if dt < start:
                    continue
            else:
                key = dt.strftime("%Y-%m")
                start = (now - timedelta(days=365)).replace(hour=0, minute=0, second=0, microsecond=0)
                if dt < start:
                    continue

            buckets[key]["sales"] += amt
            buckets[key]["count"] += 1

        month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        result = []

        if period == "daily":
            for i in range(14, -1, -1):
                d = now - timedelta(days=i)
                key = d.strftime("%Y-%m-%d")
                data = buckets.get(key, {"sales": 0.0, "count": 0})
                result.append({
                    "label": d.strftime("%b %d"),
                    "sales": round(data["sales"], 2),
                    "count": data["count"],
                })
        elif period == "weekly":
            for i in range(11, -1, -1):
                w = now - timedelta(weeks=i)
                week_start = w - timedelta(days=w.weekday())
                key = week_start.strftime("%Y-%m-%d")
                data = buckets.get(key, {"sales": 0.0, "count": 0})
                result.append({
                    "label": f"W{week_start.isocalendar()[1]}",
                    "sales": round(data["sales"], 2),
                    "count": data["count"],
                })
        else:
            for i in range(11, -1, -1):
                total_months = now.year * 12 + now.month - 1 - i
                y, m = total_months // 12, (total_months % 12) + 1
                key = f"{y}-{m:02d}"
                data = buckets.get(key, {"sales": 0.0, "count": 0})
                result.append({
                    "label": month_names[m - 1],
                    "sales": round(data["sales"], 2),
                    "count": data["count"],
                })

        return result

    except Exception as e:
        import traceback
        print(f"Error fetching sales analytics: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching sales analytics: {str(e)}"
        ) from e


def _empty_analytics(period: str):
    from datetime import datetime, timedelta
    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    now = datetime.utcnow()
    if period == "daily":
        return [
            {"label": (now - timedelta(days=i)).strftime("%b %d"), "sales": 0, "count": 0}
            for i in range(14, -1, -1)
        ]
    if period == "weekly":
        return [
            {"label": f"W{(now - timedelta(weeks=i)).isocalendar()[1]}", "sales": 0, "count": 0}
            for i in range(11, -1, -1)
        ]
    return [
        {"label": month_names[(now.month - 1 - i + 12) % 12], "sales": 0, "count": 0}
        for i in range(11, -1, -1)
    ]


# Get booking counts per user (from bookings table)
@app.get("/api/bookings/counts-by-user")
async def get_booking_counts_by_user():
    """
    Get the count of bookings for each user from the bookings table.
    Returns a dict mapping user_id -> count.
    """
    try:
        response = supabase.table("bookings").select("user_id").execute()
        counts: Dict[str, int] = {}
        for row in (response.data or []):
            uid = row.get("user_id")
            if uid:
                counts[uid] = counts.get(uid, 0) + 1
        return counts
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching booking counts: {str(e)}"
        )


# Get customer distribution for pie chart (New, VIP, Regular, Inactive)
@app.get("/api/users/customer-distribution")
async def get_customer_distribution():
    """
    Get customer counts by segment for the pie chart.
    VIP: 5+ bookings, Regular: 1-4, New: 0 bookings + created last 30 days, Inactive: 0 bookings + older.
    """
    try:
        from datetime import datetime, timedelta, timezone

        users_res = supabase.table("users").select("*").execute()
        users = users_res.data or []

        bookings_res = supabase.table("bookings").select("*").execute()
        bookings = bookings_res.data or []
        counts: Dict[str, int] = {}
        for row in bookings:
            uid = row.get("user_id")
            if uid is not None:
                key = str(uid)
                counts[key] = counts.get(key, 0) + 1

        now = datetime.now(timezone.utc)
        cutoff_new = now - timedelta(days=30)

        new_count = 0
        vip_count = 0
        regular_count = 0
        inactive_count = 0

        for u in users:
            uid = u.get("id")
            if uid is None:
                continue
            bc = counts.get(str(uid), 0)
            created = u.get("created_at")
            created_dt = None
            if created:
                try:
                    created_dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
                    if created_dt.tzinfo is None:
                        created_dt = created_dt.replace(tzinfo=timezone.utc)
                except Exception:
                    pass

            if bc >= 5:
                vip_count += 1
            elif bc >= 1:
                regular_count += 1
            elif created_dt and created_dt >= cutoff_new:
                new_count += 1
            else:
                inactive_count += 1

        return [
            {"segment": "New Customers", "count": new_count},
            {"segment": "VIP Customers", "count": vip_count},
            {"segment": "Regular Customers", "count": regular_count},
            {"segment": "Inactive Customers", "count": inactive_count},
        ]

    except Exception as e:
        import traceback
        print(f"Error fetching customer distribution: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching customer distribution: {str(e)}"
        ) from e


# Get all customers from Supabase
@app.get("/api/customers", response_model=List[Customer])
async def get_all_customers():
    """
    Retrieve all customers from the Supabase users table.
    
    Returns:
        List[Customer]: A list of all customers in the database
    """
    try:
        # Query the users table from Supabase
        response = supabase.table("users").select("*").execute()
        
        if not response.data:
            return []
        
        # Convert to Customer models (handles any extra fields from database)
        customers = []
        for user_data in response.data:
            # Create Customer model, which will accept any extra fields due to extra="allow"
            customer = Customer(**user_data)
            customers.append(customer)
        
        return customers
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching customers: {str(e)}"
        )


# Get all places from Supabase
@app.get("/api/places", response_model=List[Place])
async def get_all_places():
    """
    Retrieve all places from the Supabase database.
    
    Returns:
        List[Place]: A list of all places in the database
    """
    try:
        # Query the places table from Supabase
        response = supabase.table("places").select("*").execute()
        
        if not response.data:
            return []
        
        # Convert to Place models (handles any extra fields from database)
        places = []
        for place_data in response.data:
            # Create Place model, which will accept any extra fields due to extra="allow"
            place = Place(**place_data)
            places.append(place)
        
        return places
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching places: {str(e)}"
        )


# Create a new place
@app.post("/api/places", response_model=Place)
async def create_place(place_data: Place):
    """
    Create a new place in the database.
    
    Args:
        place_data: The Place model with place fields
        
    Returns:
        Place: The created place object
    """
    try:
        # Convert Pydantic model to dict, excluding None values and id
        create_dict = place_data.model_dump(exclude={"id", "created_at", "updated_at"}, exclude_none=True)
        
        # Validate numeric fields
        # Check rating field - NUMERIC(2,1) means max 9.9
        if "rating" in create_dict and create_dict["rating"] is not None:
            rating_value = float(create_dict["rating"])
            if abs(rating_value) > 9.9:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Rating value {rating_value} exceeds maximum allowed value of 9.9. Please enter a value between 0 and 9.9."
                )
            # Round to 1 decimal place (NUMERIC(2,1))
            create_dict["rating"] = round(rating_value, 1)
        
        # Check avg_price field - NUMERIC(10,2) can handle large values
        if "avg_price" in create_dict and create_dict["avg_price"] is not None:
            price_value = float(create_dict["avg_price"])
            # Round to 2 decimal places (NUMERIC(10,2))
            create_dict["avg_price"] = round(price_value, 2)
        
        # Set timestamps if not provided
        from datetime import datetime
        now = datetime.utcnow().isoformat()
        if "created_at" not in create_dict:
            create_dict["created_at"] = now
        if "updated_at" not in create_dict:
            create_dict["updated_at"] = now
        
        # Insert the place
        insert_response = supabase.table("places").insert(create_dict).execute()
        
        if not insert_response.data or len(insert_response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create place"
            )
        
        # Return the created place
        created_place_data = insert_response.data[0]
        created_place = Place(**created_place_data)
        return created_place
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_traceback = traceback.format_exc()
        print(f"Error traceback: {error_traceback}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating place: {str(e)}"
        )


# Update a place
@app.put("/api/places/{place_id}", response_model=Place)
async def update_place(place_id: str, place_data: Place):
    """
    Update a place in the database.
    
    Args:
        place_id: The UUID of the place to update
        place_data: The Place model with updated fields
        
    Returns:
        Place: The updated place object
    """
    try:
        # First, check if place exists
        check_response = supabase.table("places").select("id").eq("id", place_id).execute()
        
        if not check_response.data or len(check_response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Place with id {place_id} not found"
            )
        
        # Convert Pydantic model to dict, excluding None values and id
        update_dict = place_data.model_dump(exclude={"id", "created_at", "updated_at"}, exclude_none=True)
        
        # Validate numeric fields
        # Check rating field - NUMERIC(2,1) means max 9.9
        if "rating" in update_dict and update_dict["rating"] is not None:
            rating_value = float(update_dict["rating"])
            if abs(rating_value) > 9.9:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Rating value {rating_value} exceeds maximum allowed value of 9.9. Please enter a value between 0 and 9.9."
                )
            # Round to 1 decimal place (NUMERIC(2,1))
            update_dict["rating"] = round(rating_value, 1)
        
        # Check avg_price field - NUMERIC(10,2) can handle large values
        if "avg_price" in update_dict and update_dict["avg_price"] is not None:
            price_value = float(update_dict["avg_price"])
            # Round to 2 decimal places (NUMERIC(10,2))
            update_dict["avg_price"] = round(price_value, 2)
        
        # Update the place
        update_response = supabase.table("places").update(update_dict).eq("id", place_id).execute()
        
        # Fetch the complete updated place data
        full_place_response = supabase.table("places").select("*").eq("id", place_id).execute()
        
        if not full_place_response.data or len(full_place_response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch updated place data"
            )
        
        # Return the updated place
        updated_place_data = full_place_response.data[0]
        updated_place = Place(**updated_place_data)
        return updated_place
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_traceback = traceback.format_exc()
        print(f"Error traceback: {error_traceback}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating place: {str(e)}"
        )


# Toggle visibility of a place
@app.patch("/api/places/{place_id}/toggle-visibility", response_model=Place)
async def toggle_place_visibility(place_id: str):
    """
    Toggle the visibility status of a place.
    Switches the visible column value: true -> false, false -> true, null -> true
    
    Args:
        place_id: The UUID of the place to toggle
        
    Returns:
        Place: The updated place object
    """
    try:
        # First, check if place exists and get current visibility status
        current_place_response = supabase.table("places").select("visible, id").eq("id", place_id).execute()
        
        if not current_place_response.data or len(current_place_response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Place with id {place_id} not found"
            )
        
        # Get current visibility status
        current_visible = current_place_response.data[0].get("visible")
        print(f"Current visibility status: {current_visible}, type: {type(current_visible)}")
        
        # Toggle: switch the value regardless of current state
        # True -> False, False/None -> True
        if current_visible is True:
            new_visible = False
        else:
            # Handles False, None, or any other falsy value
            new_visible = True
        
        print(f"New visibility status: {new_visible}")
        
        # Update the visibility status
        update_response = supabase.table("places").update({"visible": new_visible}).eq("id", place_id).execute()
        print(f"Update response type: {type(update_response)}")
        print(f"Update response data: {update_response.data if hasattr(update_response, 'data') else 'No data attr'}")
        
        # Fetch the complete updated place data (always fetch after update to ensure we have latest)
        full_place_response = supabase.table("places").select("*").eq("id", place_id).execute()
        
        if not full_place_response.data or len(full_place_response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch updated place data"
            )
        
        # Return the updated place
        updated_place_data = full_place_response.data[0]
        print(f"Updated place data keys: {updated_place_data.keys()}")
        updated_place = Place(**updated_place_data)
        return updated_place
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_traceback = traceback.format_exc()
        print(f"Error traceback: {error_traceback}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error toggling place visibility: {str(e)}"
        )


# Delete a place
@app.delete("/api/places/{place_id}")
async def delete_place(place_id: str):
    """
    Delete a place from the database and its associated banner image from storage.
    
    Args:
        place_id: The UUID of the place to delete
        
    Returns:
        dict: A success message
    """
    try:
        # First, check if place exists and get its data
        check_response = supabase.table("places").select("*").eq("id", place_id).execute()
        
        if not check_response.data or len(check_response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Place with id {place_id} not found"
            )
        
        place_data = check_response.data[0]
        
        # Delete the banner image from storage if it exists
        # Image path format: place-banners/{placeId}/banner-{placeId}.jpg
        bucket_name = os.getenv("SUPABASE_BUCKET_NAME", "places_images")
        
        try:
            # The image path is: place-banners/{placeId}/banner-{placeId}.jpg
            image_path = f"place-banners/{place_id}/banner-{place_id}.jpg"
            
            # Delete the specific image file
            # Supabase storage remove() takes a list of file paths
            storage_response = supabase.storage.from_(bucket_name).remove([image_path])
            print(f"Successfully deleted banner image: {image_path}")
            
        except Exception as storage_error:
            # Log the error but don't fail the deletion if image deletion fails
            # The image might not exist, which is fine
            print(f"Warning: Failed to delete banner image for place {place_id}: {str(storage_error)}")
            # Continue with place deletion even if image deletion fails
        
        # Delete the place from database
        delete_response = supabase.table("places").delete().eq("id", place_id).execute()
        
        # Check if deletion was successful
        # Supabase delete returns the deleted rows
        if delete_response.data is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete place"
            )
        
        return {
            "success": True,
            "message": f"Place {place_id} and its banner image deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_traceback = traceback.format_exc()
        print(f"Error traceback: {error_traceback}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting place: {str(e)}"
        )


# Gallery Images endpoints
class GalleryImageCreate(BaseModel):
    gallery_image_url: str


@app.post("/api/places/{place_id}/gallery-images")
async def create_gallery_image(place_id: str, gallery_image: GalleryImageCreate):
    """
    Create a gallery image record for a place.
    
    Args:
        place_id: The UUID of the place
        gallery_image: The gallery image data with URL
        
    Returns:
        dict: Success message and created gallery image data
    """
    try:
        # Verify place exists
        place_response = supabase.table("places").select("id").eq("id", place_id).execute()
        
        if not place_response.data or len(place_response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Place with id {place_id} not found"
            )
        
        # Insert gallery image record
        from datetime import datetime
        now = datetime.utcnow().isoformat()
        
        insert_data = {
            "place_id": place_id,
            "gallery_image_url": gallery_image.gallery_image_url,
            "created_at": now
        }
        
        insert_response = supabase.table("gallery_images").insert(insert_data).execute()
        
        if not insert_response.data or len(insert_response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create gallery image record"
            )
        
        return {
            "success": True,
            "data": insert_response.data[0]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_traceback = traceback.format_exc()
        print(f"Error traceback: {error_traceback}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating gallery image: {str(e)}"
        )


@app.delete("/api/places/{place_id}/gallery-images/{gallery_image_id}")
async def delete_gallery_image(place_id: str, gallery_image_id: str):
    """
    Delete a gallery image record.
    
    Args:
        place_id: The UUID of the place
        gallery_image_id: The UUID of the gallery image record
        
    Returns:
        dict: Success message
    """
    try:
        # Verify the gallery image belongs to the place
        check_response = supabase.table("gallery_images").select("*").eq("id", gallery_image_id).eq("place_id", place_id).execute()
        
        if not check_response.data or len(check_response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Gallery image not found"
            )
        
        # Get the image URL before deletion (for potential storage cleanup)
        image_url = check_response.data[0].get("gallery_image_url")
        
        # Delete the record
        delete_response = supabase.table("gallery_images").delete().eq("id", gallery_image_id).execute()
        
        return {
            "success": True,
            "message": "Gallery image deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_traceback = traceback.format_exc()
        print(f"Error traceback: {error_traceback}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting gallery image: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    uvicorn.run(app, host=host, port=port)

