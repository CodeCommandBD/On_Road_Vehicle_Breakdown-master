# 🔧 Fix Premium Membership Issue

## সমস্যা

- Subscriptions collection empty (কোনো active subscription নেই)
- কিন্তু user profile এ "PREMIUM MEMBER" দেখাচ্ছে
- User database এ `membershipTier: "premium"` stored আছে

## ✅ Solution: MongoDB Compass দিয়ে Fix করুন

### Step 1: MongoDB Compass Open করুন

### Step 2: Users Collection এ যান

1. আপনার database select করুন
2. `users` collection click করুন

### Step 3: আপনার User খুঁজুন

Filter box এ:

```json
{ "email": "shantokumar00@gmail.com" }
```

### Step 4: User Document Edit করুন

1. **Edit** button (pencil icon) click করুন
2. `membershipTier` field খুঁজুন
3. Value change করুন:

**Before:**

```json
{
  "membershipTier": "premium"
}
```

**After:**

```json
{
  "membershipTier": "free"
}
```

4. **Update** button click করুন

### Step 5: Logout এবং Login করুন

1. Browser এ logout করুন
2. আবার login করুন
3. ✅ এখন "FREE" plan দেখাবে

---

## 🚀 MongoDB Shell দিয়ে (Alternative)

MongoDB Compass এর **MONGOSH** tab এ:

```javascript
use vehicle_breakdown

// আপনার email দিয়ে update করুন
db.users.updateOne(
  { email: "shantokumar00@gmail.com" },
  {
    $set: {
      membershipTier: "free"
    }
  }
)

// Verify করুন
db.users.findOne(
  { email: "shantokumar00@gmail.com" },
  { membershipTier: 1, email: 1 }
)
```

Expected output:

```json
{
  "_id": ObjectId("..."),
  "email": "shantokumar00@gmail.com",
  "membershipTier": "free"
}
```

---

## 📊 Check Current Status

আপনার user document এ এরকম দেখাবে:

```json
{
  "_id": "...",
  "email": "shantokumar00@gmail.com",
  "name": "shanto",
  "membershipTier": "premium",  // ← এটা "free" করতে হবে
  "membershipExpiry": "2026-02-01T13:46:15.383+00:00",
  "currentSubscription": "6957cb6637f0c2a7e7b49d87",
  ...
}
```

### Optional: Clear Subscription References

যদি চান তাহলে এগুলোও clear করতে পারেন:

```javascript
db.users.updateOne(
  { email: "shantokumar00@gmail.com" },
  {
    $set: {
      membershipTier: "free",
      membershipExpiry: null,
      currentSubscription: null,
    },
  }
);
```

---

## 🎯 Quick Fix Command

Copy-paste করুন MongoDB Compass shell এ:

```javascript
use vehicle_breakdown

db.users.updateOne(
  { email: "shantokumar00@gmail.com" },
  { $set: { membershipTier: "free" } }
)
```

তারপর:

1. Logout করুন
2. Login করুন
3. ✅ Free plan দেখাবে

---

**Created**: January 2, 2026  
**Status**: Ready to use
