from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from supabase import (
    create_client,
    Client,
    AuthApiError,
    AuthError,
    AuthInvalidCredentialsError,
    AuthSessionMissingError,
)
from pydantic import BaseModel, ConfigDict, EmailStr
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
    ],  # Add your frontend URLs
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


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
class Place(BaseModel):
    id: Optional[str] = None  # UUID primary key (not in schema but present in DB)
    name: Optional[str] = None  # TEXT
    category: Optional[str] = None  # TEXT
    description: Optional[str] = None  # TEXT
    banner_image_link: Optional[str] = None  # TEXT
    rating: Optional[float] = None  # NUMERIC
    avg_price: Optional[float] = None  # NUMERIC
    latitude: Optional[float] = None  # DOUBLE PRECISION
    longitude: Optional[float] = None  # DOUBLE PRECISION
    address: Optional[str] = None  # TEXT
    city: Optional[str] = None  # TEXT
    state: Optional[str] = None  # TEXT
    country: Optional[str] = None  # TEXT
    hours: Optional[List[Dict[str, Any]]] = None  # JSONB (array of objects)
    open_now: Optional[bool] = None  # BOOLEAN
    amenities: Optional[List[str]] = None  # TEXT[]
    tags: Optional[List[str]] = None  # TEXT[]
    website: Optional[str] = None  # TEXT
    phone_number: Optional[str] = None  # TEXT
    review_count: Optional[int] = None  # INTEGER
    created_at: Optional[str] = None  # Timestamp (not in schema but present in DB)
    updated_at: Optional[str] = None  # Timestamp (not in schema but present in DB)
    
    model_config = ConfigDict(
        from_attributes=True,
        # Allow extra fields from database that aren't in the model
        extra="allow"
    )


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


# Get a single place by ID
@app.get("/api/places/{place_id}", response_model=Place)
async def get_place_by_id(place_id: str):
    """
    Retrieve a single place by ID from the Supabase database.
    
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
        
        # Convert to Place model
        place = Place(**response.data[0])
        return place
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching place: {str(e)}"
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
    Delete a place from the database.
    
    Args:
        place_id: The UUID of the place to delete
        
    Returns:
        dict: A success message
    """
    try:
        # First, check if place exists
        check_response = supabase.table("places").select("id").eq("id", place_id).execute()
        
        if not check_response.data or len(check_response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Place with id {place_id} not found"
            )
        
        # Delete the place
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
            "message": f"Place {place_id} deleted successfully"
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


if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    uvicorn.run(app, host=host, port=port)

