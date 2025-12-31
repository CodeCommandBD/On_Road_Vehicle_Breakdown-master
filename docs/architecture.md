# System Architecture

## Technology Stack

The platform is built using a modern, scalable MERN-stack architecture (with Next.js).

### Frontend

- **Framework**: [Next.js 14+](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Redux Toolkit](https://redux-toolkit.js.org/)
- **Maps**: [Leaflet](https://leafletjs.com/) (React Leaflet)
- **Charts**: [Recharts](https://recharts.org/)

### Backend

- **Runtime**: Node.js (via Next.js API Routes)
- **Database**: [MongoDB](https://www.mongodb.com/) (accessed via Mongoose)
- **Authentication**: Custom JWT (JSON Web Tokens)
- **Real-time**: [Pusher Channels](https://pusher.com/)

### Services & Integrations

- **Image Storage**: Cloudinary / Local Storage
- **Emails**: Nodemailer (SMTP)
- **PDF Generation**: PDFKit

## Project Structure

```
/app              # Next.js App Router pages & API routes
  /api            # Backend API endpoints
  /[locale]       # Frontend pages (Internationalized)
/components       # Reusable React components
/lib              # Core utilities
  /db             # Database connection & Models
  /utils          # Helper functions
/providers        # Context providers (Redux, Auth, etc.)
/public           # Static assets
/messages         # Localization files (en.json, bn.json)
```

## Security Measures

- **Rate Limiting**: Custom middleware to prevent abuse.
- **Input Validation**: Zod schemas for strict data validation.
- **Role-Based Access Control (RBAC)**: Middleware to protect Admin/Garage routes.
- **Data Encryption**: Passwords hashed with Bcrypt.
