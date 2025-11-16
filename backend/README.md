# Spotnere Admin Backend

Python FastAPI backend for the Spotnere Admin Panel.

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure environment variables:**
   - Copy `.env.example` to `.env`
   - Fill in your Supabase credentials:
     - `SUPABASE_URL`: Your Supabase project URL
     - `SUPABASE_KEY`: Your Supabase anon/public key

3. **Run the server:**
   ```bash
   python main.py
   ```
   
   Or using uvicorn directly:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

## API Endpoints

### Health Check
- `GET /` - Root endpoint
- `GET /health` - Health check endpoint

### Authentication
- `POST /api/auth/login` - User login
  - Request body: `{ "email": "user@example.com", "password": "password123" }`
  - Returns: User data, access token, and refresh token
  
- `POST /api/auth/signup` - User registration
  - Request body: 
    ```json
    {
      "first_name": "John",
      "last_name": "Doe",
      "email": "user@example.com",
      "phone_number": "+1234567890",
      "password": "password123",
      "address": "123 Main St",
      "city": "New York",
      "state": "NY",
      "country": "USA",
      "postal_code": "10001"
    }
    ```
  - Returns: User data, access token, and refresh token

### Places
- `GET /api/places` - Get all places from the database

## Development

The server runs on `http://localhost:8000` by default.

API documentation is available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

