# 🚀 Deployment Guide

This guide details how to deploy the **On-Road Vehicle Breakdown** platform to production using Vercel, which is the recommended hosting provider for Next.js applications.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Vercel Deployment (Recommended)](#vercel-deployment-recommended)
- [Environment Variables](#environment-variables)
- [Domain Configuration](#domain-configuration)
- [Post-Deployment Checks](#post-deployment-checks)

---

## Prerequisites

Before deploying, ensure you have:

1. A [Vercel Account](https://vercel.com)
2. A [MongoDB Atlas](https://www.mongodb.com/atlas) cluster ready for production
3. Accounts for all third-party services (Cloudinary, Pusher, SSLCommerz, etc.)
4. Access to your GitHub repository

---

## Vercel Deployment (Recommended)

### Method 1: Connected Git Repository (Automatic CI/CD)

1. **Log in to Vercel** and go to your dashboard.
2. Click **"Add New..."** -> **"Project"**.
3. Import your GitHub repository: `On_Road_Vehicle_Breakdown`.
4. **Configure Project**:
   - **Framework Preset**: Next.js (should be auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `next build` (default)
   - **Install Command**: `npm install` (default)
5. **Environment Variables**:
   - Copy all variables from your local `.env` or `ENV_VARIABLES.md`.
   - Paste them into the "Environment Variables" section.
   - **Critical**: Ensure `SSLCOMMERZ_MODE` is set to `live` for production (or `sandbox` for testing).
   - **Critical**: Ensure `NEXT_PUBLIC_APP_URL` matches your Vercel domain (e.g., `https://your-project.vercel.app`).
6. Click **"Deploy"**.

Vercel will build your application and deploy it. Subsequent pushes to the `main` branch will automatically trigger a new deployment.

### Method 2: Vercel CLI

1. Install Vercel CLI globally:
   ```bash
   npm i -g vercel
   ```
2. Log in:
   ```bash
   vercel login
   ```
3. Deploy from root directory:
   ```bash
   vercel --prod
   ```

---

## Environment Variables

Ensure these variables are set in Vercel **Settings > Environment Variables**:

| Variable              | Description                                            |
| :-------------------- | :----------------------------------------------------- |
| `MONGODB_URI`         | Connection string for MongoDB Atlas Production Cluster |
| `JWT_SECRET`          | Strong, random string (use `openssl rand -base64 32`)  |
| `NEXT_PUBLIC_APP_URL` | Your production URL (no trailing slash)                |
| `SSLCOMMERZ_MODE`     | Set to `live` for real payments                        |
| `NODE_ENV`            | `production` (Vercel sets this automatically)          |

Refer to [`ENV_VARIABLES.md`](../ENV_VARIABLES.md) for the complete list.

---

## Domain Configuration

1. Go to **Settings > Domains** in your Vercel project.
2. Enter your custom domain (e.g., `www.bd-breakdown-service.com`).
3. Follow the DNS configuration instructions provided by Vercel (usually adding an A record or CNAME).

---

## Post-Deployment Checks

After deployment, verify the following:

1. **Database Connection**: Try to log in or register a new user to verify MongoDB connection.
2. **Real-time Features**: Open the app in two tabs/browsers and test if updates (like booking status) sync via Pusher.
3. **Image Uploads**: Try updating a profile picture to test Cloudinary.
4. **Payments**: Initiate a test payment (if in sandbox mode) to verify SSLCommerz callback.
5. **Emails**: Trigger a password reset to verify Nodemailer/SMTP.
6. **SEO**: Check if `robots.txt` and `sitemap.xml` are accessible.

---

[← Back to README](../README.md)
