# API Authentication

The On-Road Vehicle Breakdown API uses JSON Web Tokens (JWT) for authentication.

## Overview

- **Header**: `Authorization`
- **Prefix**: `Bearer`
- **Token**: JWT (HS256)

Example:

```http
Authorization: Bearer <your_token_here>
```

## Auth Endpoints

### 1. Register User

Create a new user account.

- **URL**: `/api/auth/signup`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securePassword123",
    "phone": "+8801711223344",
    "role": "user" // optional: 'user' or 'garage'
  }
  ```
- **Response** (201):
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUz...",
    "user": { ... }
  }
  ```

### 2. Login

Authenticate an existing user.

- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "securePassword123"
  }
  ```
- **Response** (200):
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUz...",
    "user": { ... }
  }
  ```

### 3. Logout

Invalidate the current session (client-side only for JWT).

- **URL**: `/api/auth/logout`
- **Method**: `POST`

## Protected Routes

Most routes under `/api/users/`, `/api/garage/`, and `/api/admin/` require a valid JWT token. If the token is missing or invalid, the API will return `401 Unauthorized`.
