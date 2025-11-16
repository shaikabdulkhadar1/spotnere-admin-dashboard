from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
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
    allow_origins=["http://localhost:8080", "http://localhost:5173"],  # Add your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
    Login endpoint for user authentication.
    
    Args:
        credentials: Login credentials (email and password)
    
    Returns:
        AuthResponse: Authentication response with user data and tokens
    """
    try:
        # Authenticate user with Supabase Auth
        response = supabase.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password
        })
        
        if not response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Get user data from users table if it exists
        user_data = None
        try:
            user_profile = supabase.table("admins").select("*").eq("email", credentials.email).execute()
            if user_profile.data:
                user_data = user_profile.data[0]
        except Exception:
            # If users table doesn't exist or query fails, use auth user data
            user_data = {
                "id": response.user.id,
                "email": response.user.email,
            }
        
        return AuthResponse(
            success=True,
            message="Login successful",
            user=user_data,
            access_token=response.session.access_token if response.session else None,
            refresh_token=response.session.refresh_token if response.session else None
        )
        
    except Exception as e:
        error_message = str(e)
        if "Invalid login credentials" in error_message or "Email not confirmed" in error_message:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
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
            status_code=500,
            detail=f"Error fetching places: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    uvicorn.run(app, host=host, port=port)

