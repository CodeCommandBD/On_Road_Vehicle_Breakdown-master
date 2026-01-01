# 🔐 Complete Environment Variables List

## ✅ REQUIRED (Must Have)

```env
# ==================== DATABASE ====================
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# ==================== AUTHENTICATION ====================
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# ==================== PAYMENT GATEWAY (SSLCommerz) ====================
SSLCOMMERZ_STORE_ID=your_store_id
SSLCOMMERZ_STORE_PASSWORD=your_store_password
SSLCOMMERZ_MODE=sandbox  # or 'live'
SSLCOMMERZ_IS_LIVE=false  # true for production

# ==================== REAL-TIME (PUSHER) ====================
PUSHER_APP_ID=1234567
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
NEXT_PUBLIC_PUSHER_CLUSTER=ap2

# ==================== APP CONFIG ====================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## 📧 EMAIL (Required for notifications)

```env
# ==================== EMAIL (SMTP) ====================
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

---

## 🖼️ CLOUDINARY (Required for image uploads)

```env
# ==================== CLOUDINARY ====================
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 🆕 NEW FEATURES (From Implementation)

```env
# ==================== BACKUP AUTOMATION ====================
CRON_SECRET=your-random-cron-secret-key

# ==================== SMS NOTIFICATIONS (OPTIONAL) ====================
# Option A: Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Option B: Bulk SMS (Bangladesh) - Choose ONE
# BULK_SMS_API_KEY=your_api_key
# BULK_SMS_SENDER_ID=VehicleSOS
# BULK_SMS_API_URL=https://api.sslwireless.com/smsapi
```

---

## 🔍 OPTIONAL (Advanced Features)

```env
# ==================== REDIS CACHE (OPTIONAL) ====================
# Option A: Upstash Redis
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token

# Option B: Regular Redis
# REDIS_URL=redis://localhost:6379

# ==================== SENTRY ERROR TRACKING (OPTIONAL) ====================
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project

# ==================== GOOGLE AI (OPTIONAL) ====================
GOOGLE_API_KEY=your_google_gemini_api_key
```

---

## 📋 Priority Order

### 🔴 Critical (App won't work without these):

1. `MONGODB_URI`
2. `JWT_SECRET`
3. `SSLCOMMERZ_STORE_ID`
4. `SSLCOMMERZ_STORE_PASSWORD`
5. `SSLCOMMERZ_MODE`
6. `PUSHER_APP_ID`
7. `NEXT_PUBLIC_PUSHER_KEY`
8. `PUSHER_SECRET`

### 🟡 Important (Features won't work):

9. `EMAIL_USER` - Email notifications
10. `EMAIL_PASS` - Email notifications
11. `CLOUDINARY_CLOUD_NAME` - Image uploads
12. `CLOUDINARY_API_KEY` - Image uploads
13. `CLOUDINARY_API_SECRET` - Image uploads

### 🟢 New Features:

14. `CRON_SECRET` - Automated backups
15. SMS variables - Emergency alerts (optional)

### ⚪ Optional:

16. Redis - Caching
17. Sentry - Error tracking
18. Google AI - AI features

---

## 🔑 How to Generate Secrets

### JWT_SECRET & CRON_SECRET:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Or use online:

https://randomkeygen.com/

---

## ✅ Minimum Working Configuration

```env
# Bare minimum to run the app
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
SSLCOMMERZ_STORE_ID=your_store_id
SSLCOMMERZ_STORE_PASSWORD=your_password
SSLCOMMERZ_MODE=sandbox
SSLCOMMERZ_IS_LIVE=false
PUSHER_APP_ID=your_app_id
NEXT_PUBLIC_PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
NEXT_PUBLIC_PUSHER_CLUSTER=ap2
EMAIL_USER=your_email
EMAIL_PASS=your_password
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## 📝 Notes

1. **Never commit `.env.local` to git!**
2. Use different values for development and production
3. Keep secrets secure
4. SMS variables are optional - app works without them
5. Redis is optional - app has fallback
6. Sentry is optional - for error tracking only

---

## 🚀 Quick Setup

1. Copy `.env.example` to `.env.local`
2. Fill in required values
3. Generate secrets for JWT and CRON
4. Test with `npm run dev`
5. Add optional features later as needed
