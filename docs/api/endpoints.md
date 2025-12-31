# API Endpoints Reference

This document lists the primary API endpoints available in the system.

## 👤 User Management

| Method | Endpoint                 | Description                     |
| ------ | ------------------------ | ------------------------------- |
| `GET`  | `/api/user/me`           | Get current user's profile      |
| `PUT`  | `/api/user/profile`      | Update user profile             |
| `GET`  | `/api/user/vehicles`     | List user's vehicles            |
| `POST` | `/api/user/vehicles`     | Add a new vehicle               |
| `GET`  | `/api/user/subscription` | Get subscription status         |
| `GET`  | `/api/user/invoices`     | Get payment and invoice history |
| `GET`  | `/api/user/rewards`      | Get loyalty points and level    |

## 🔧 Garage & Services

| Method | Endpoint                | Description                                     |
| ------ | ----------------------- | ----------------------------------------------- |
| `GET`  | `/api/garages`          | Search and list garages (filters: loc, service) |
| `GET`  | `/api/garages/[id]`     | Get public details of a garage                  |
| `GET`  | `/api/garage/analytics` | (Garage Owner) Get performance stats            |
| `GET`  | `/api/garage/team`      | (Garage Owner) List team members                |

## 📅 Bookings

| Method | Endpoint                | Description                                        |
| ------ | ----------------------- | -------------------------------------------------- |
| `GET`  | `/api/bookings`         | List user's or garage's bookings                   |
| `POST` | `/api/bookings`         | Create a new service booking                       |
| `GET`  | `/api/bookings/[id]`    | Get booking details                                |
| `PUT`  | `/api/bookings/[id]`    | Update booking status (e.g., cancelled, completed) |
| `POST` | `/api/bookings/payment` | Initiate payment for a booking                     |

## 📊 Analytics & Admin

| Method | Endpoint                       | Description                            |
| ------ | ------------------------------ | -------------------------------------- |
| `POST` | `/api/analytics/track`         | Track user events (page views, clicks) |
| `GET`  | `/api/analytics/revenue`       | (Admin) Get revenue reports            |
| `GET`  | `/api/analytics/user-behavior` | (Admin) Get user activity stats        |

## 💬 Communication

| Method | Endpoint             | Description            |
| ------ | -------------------- | ---------------------- |
| `GET`  | `/api/messages`      | List conversations     |
| `POST` | `/api/messages`      | Send a new message     |
| `GET`  | `/api/notifications` | Get user notifications |
