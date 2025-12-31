# Deployment Guide

## Prerequisites

- Node.js (LTS version)
- MongoDB Connection String (Atlas or Local)
- Email Server Credentials (SMTP)
- Pusher Credentials

## Environment Variables

Create a `.env` file in the root directory with the following keys:

```env
# Database
MONGODB_URI=mongodb+srv://...

# Authentication
JWT_SECRET=your_super_secret_key

# Email (Nodemailer)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Real-time (Pusher)
PUSHER_APP_ID=...
PUSHER_KEY=...
PUSHER_SECRET=...
PUSHER_CLUSTER=ap2

# Base URL
NEXT_PUBLIC_API_URL=http://localhost:3000

# Other
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
```

## Installation & Running Locally

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Deploying to Vercel

1. Push code to GitHub.
2. Import project in Vercel.
3. Add **Environment Variables** in Vercel Project Settings.
4. Click **Deploy**.

## Database Indexing

For better performance, run the optimization script after deployment:

```bash
npm run optimize-db
```
