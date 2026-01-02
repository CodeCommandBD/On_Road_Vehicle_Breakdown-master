# 🔓 Login Rate Limit Reset Guide

## সমস্যা

"Too many tries, try again later" error আসছে কারণ আপনি 5+ বার wrong password দিয়েছেন।

## 🎯 Quick Solution (MongoDB Compass)

### Option 1: MongoDB Compass দিয়ে (Recommended)

1. **MongoDB Compass Open করুন**

2. **Connect করুন** আপনার database এ

3. **Database Select করুন**:

   - Left sidebar থেকে আপনার database name click করুন
   - সাধারণত: `vehicle_breakdown` বা similar name

4. **Users Collection Open করুন**:

   - `users` collection এ click করুন

5. **আপনার User খুঁজুন**:

   - Filter box এ type করুন:

   ```json
   { "email": "your-email@example.com" }
   ```

   - অথবা সব users দেখতে filter empty রাখুন

6. **User Document Edit করুন**:

   - আপনার user এর row এ hover করুন
   - **Edit** (pencil icon) click করুন

7. **এই Fields Reset করুন**:

   ```json
   {
     "failedLoginAttempts": 0,
     "accountLockedUntil": null
   }
   ```

8. **Update** button click করুন

9. ✅ **Done!** এখন আবার login try করুন

---

## Option 2: MongoDB Shell দিয়ে

### Terminal এ run করুন:

```bash
# MongoDB Shell open করুন
mongosh

# Database select করুন
use vehicle_breakdown

# আপনার email দিয়ে reset করুন
db.users.updateOne(
  { email: "your-email@example.com" },
  {
    $set: {
      failedLoginAttempts: 0,
      accountLockedUntil: null
    }
  }
)

# সব users এর জন্য reset করতে চাইলে
db.users.updateMany(
  {},
  {
    $set: {
      failedLoginAttempts: 0,
      accountLockedUntil: null
    }
  }
)
```

---

## Option 3: Code দিয়ে Temporary Disable (Testing)

যদি testing এর জন্য rate limiting পুরো disable করতে চান:

### File: `app/api/auth/login/route.js`

**Line 69 এর কাছে** এই code টা comment out করুন:

```javascript
// TEMPORARILY DISABLED FOR TESTING
/*
if (user.failedLoginAttempts >= 5) {
  user.accountLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();
  return NextResponse.json(
    { success: false, message: "Too many failed attempts. Try again in 15 minutes." },
    { status: 429 }
  );
}
*/
```

**⚠️ Warning**: Production এ deploy করার আগে এটা আবার enable করতে ভুলবেন না!

---

## 🔍 Check Current Status

MongoDB Compass এ user document দেখলে এরকম দেখাবে:

```json
{
  "_id": "...",
  "email": "user@example.com",
  "name": "User Name",
  "failedLoginAttempts": 5,  // ← এটা 0 করতে হবে
  "accountLockedUntil": "2026-01-02T15:30:00.000Z",  // ← এটা null করতে হবে
  ...
}
```

---

## 📊 Rate Limit Settings

Current settings (in `app/api/auth/login/route.js`):

- **Max Attempts**: 5 tries
- **Lock Duration**: 15 minutes
- **Reset on Success**: Automatic

---

## 🎯 Quick Commands

### Reset specific user:

```javascript
db.users.updateOne(
  { email: "test@example.com" },
  { $set: { failedLoginAttempts: 0, accountLockedUntil: null } }
);
```

### Reset all users:

```javascript
db.users.updateMany(
  {},
  { $set: { failedLoginAttempts: 0, accountLockedUntil: null } }
);
```

### Check locked users:

```javascript
db.users.find({
  $or: [
    { failedLoginAttempts: { $gte: 5 } },
    { accountLockedUntil: { $ne: null } },
  ],
});
```

---

**Created**: January 2, 2026  
**Status**: ✅ Ready to Use
