# Production Deployment Checklist

## ✅ Pre-Deployment Checklist

### 1. Environment Variables

- [ ] Set `JWT_SECRET` to a strong, random value
- [ ] Configure `MONGODB_URI` for production database
- [ ] Set `NODE_ENV=production`
- [ ] Configure payment gateway credentials (SSLCommerz)
- [ ] Set up email service (SMTP)
- [ ] Configure Google Gemini API key (if using AI features)
- [ ] Set up Cloudinary for image uploads
- [ ] Configure Pusher for real-time notifications

### 2. Security

- [x] JWT authentication implemented
- [x] Password hashing with bcrypt
- [x] Input validation with Zod
- [x] Input sanitization (XSS prevention)
- [x] Rate limiting on auth routes
- [x] Role-based access control (RBAC)
- [ ] Enable HTTPS (SSL certificate)
- [ ] Configure security headers in `next.config.js`
- [ ] Set up CORS for allowed domains
- [ ] Review and update CSP (Content Security Policy)

### 3. Database

- [x] All indexes created
- [x] GeoJSON indexes for location queries
- [ ] Set up MongoDB Atlas (or production database)
- [ ] Configure connection pooling
- [ ] Set up database backups
- [ ] Enable MongoDB authentication
- [ ] Restrict database access by IP

### 4. Performance

- [x] Pagination implemented
- [ ] Enable Next.js compression
- [ ] Set up CDN for static assets
- [ ] Configure image optimization
- [ ] Consider Redis for caching
- [ ] Enable ISR (Incremental Static Regeneration) where applicable

### 5. Monitoring & Logging

- [x] Logging system implemented
- [ ] Set up error tracking (Sentry, Rollbar)
- [ ] Configure uptime monitoring
- [ ] Set up performance monitoring
- [ ] Enable database query logging
- [ ] Set up alerts for critical errors

### 6. Code Quality

- [x] Remove all `console.log` statements (use logger instead)
- [x] Remove debug code
- [ ] Run linter and fix all warnings
- [ ] Run type checking (if using TypeScript)
- [ ] Review and remove unused dependencies

### 7. Testing

- [ ] Test all API endpoints
- [ ] Test authentication flow
- [ ] Test role-based access control
- [ ] Test payment integration
- [ ] Test geospatial queries
- [ ] Load testing (optional)

---

## 🚀 Deployment Steps

### Option 1: Vercel (Recommended for Next.js)

1. **Install Vercel CLI:**

   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**

   ```bash
   vercel login
   ```

3. **Deploy:**

   ```bash
   vercel --prod
   ```

4. **Configure Environment Variables:**

   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add all variables from `.env.example`

5. **Configure Custom Domain:**
   - Go to Vercel Dashboard → Project → Settings → Domains
   - Add your custom domain

### Option 2: VPS (DigitalOcean, AWS, etc.)

1. **Set up server:**

   ```bash
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install PM2
   sudo npm install -g pm2
   ```

2. **Clone repository:**

   ```bash
   git clone <your-repo-url>
   cd On_Road_Vehicle_Breakdown-master
   ```

3. **Install dependencies:**

   ```bash
   npm install
   ```

4. **Build application:**

   ```bash
   npm run build
   ```

5. **Start with PM2:**

   ```bash
   pm2 start npm --name "vehicle-breakdown" -- start
   pm2 save
   pm2 startup
   ```

6. **Set up Nginx reverse proxy:**

   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

7. **Set up SSL with Let's Encrypt:**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

---

## 🔧 Post-Deployment

### 1. Verify Deployment

- [ ] Check homepage loads correctly
- [ ] Test user registration
- [ ] Test user login
- [ ] Test booking creation
- [ ] Test garage search
- [ ] Test admin panel access

### 2. Monitor

- [ ] Check error logs
- [ ] Monitor database performance
- [ ] Check API response times
- [ ] Monitor memory usage
- [ ] Check for security vulnerabilities

### 3. Optimize

- [ ] Enable caching where appropriate
- [ ] Optimize slow database queries
- [ ] Compress images
- [ ] Minify assets

---

## 📝 Environment Variables for Production

```env
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/production_db

# JWT
JWT_SECRET=<generate-strong-random-secret>

# Payment Gateway
SSLCOMMERZ_STORE_ID=<production-store-id>
SSLCOMMERZ_STORE_PASSWORD=<production-password>
SSLCOMMERZ_MODE=live

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=<your-email>
EMAIL_PASSWORD=<app-password>
EMAIL_FROM=noreply@yourdomain.com

# AI Features
GOOGLE_GEMINI_API_KEY=<your-api-key>

# Image Upload
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>

# Real-time
PUSHER_APP_ID=<your-app-id>
PUSHER_KEY=<your-key>
PUSHER_SECRET=<your-secret>
PUSHER_CLUSTER=ap2
```

---

## 🛡️ Security Best Practices

1. **Never commit `.env` files**
2. **Use strong, unique passwords**
3. **Enable 2FA for all services**
4. **Regularly update dependencies**
5. **Monitor for security vulnerabilities**
6. **Set up automated backups**
7. **Use HTTPS everywhere**
8. **Implement rate limiting**
9. **Validate all user inputs**
10. **Keep logs secure**

---

## 📞 Support & Maintenance

- **Regular Updates**: Update dependencies monthly
- **Security Patches**: Apply immediately
- **Database Backups**: Daily automated backups
- **Monitoring**: 24/7 uptime monitoring
- **Incident Response**: Have a plan ready

---

## 🎉 You're Ready for Production!

Once all checklist items are complete, your application is ready to serve users in production. Good luck! 🚀
