# ⚠️ PRODUCTION DEPLOYMENT CHECKLIST

## 🔒 Security Features Currently Disabled for Testing

### ❌ Rate Limiting - DISABLED

**File**: `app/api/auth/login/route.js`

**Lines**: 45-53, 67-88

**What's disabled**:

- Account lock after 5 failed login attempts
- 15-minute lockout period
- Failed attempt tracking

**Status**: 🔴 **DISABLED FOR TESTING**

---

## ✅ Before Production Deployment

### Step 1: Re-enable Rate Limiting

Open `app/api/auth/login/route.js` and:

1. **Remove comment blocks** around lines 45-53:

```javascript
// REMOVE THIS LINE: // TEMPORARILY DISABLED FOR TESTING - TODO: Re-enable before production
// REMOVE THIS LINE: /*

// Check if account is locked
if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
  const lockTimeRemaining = Math.ceil(
    (user.accountLockedUntil - new Date()) / 1000 / 60
  );
  throw new ForbiddenError(
    `Account temporarily locked due to multiple failed login attempts. Please try again in ${lockTimeRemaining} minutes.`
  );
}

// REMOVE THIS LINE: */
```

2. **Remove comment blocks** around lines 67-88:

```javascript
// REMOVE THIS LINE: // TEMPORARILY DISABLED FOR TESTING - TODO: Re-enable before production
// REMOVE THIS LINE: /*

// Increment failed login attempts
user.failedLoginAttempts += 1;

// Lock account if 5 failed attempts
if (user.failedLoginAttempts >= 5) {
  user.accountLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();
  throw new ForbiddenError(
    "Account locked due to multiple failed login attempts. Please try again in 15 minutes."
  );
}

await user.save();
const attemptsRemaining = 5 - user.failedLoginAttempts;

throw new UnauthorizedError(
  `${MESSAGES.ERROR.INVALID_CREDENTIALS} (${attemptsRemaining} attempts remaining)`
);

// REMOVE THIS LINE: */
```

3. **Delete the testing-only line**:

```javascript
// DELETE THIS LINE:
// Simple error without rate limiting (TESTING ONLY)
throw new UnauthorizedError(MESSAGES.ERROR.INVALID_CREDENTIALS);
```

### Step 2: Verify Changes

Run this command to check if rate limiting is enabled:

```bash
grep -n "TEMPORARILY DISABLED" app/api/auth/login/route.js
```

If output is empty, rate limiting is enabled ✅

### Step 3: Test in Staging

Before production:

1. Test login with wrong password 5 times
2. Verify account gets locked
3. Verify error message shows lockout time
4. Wait 15 minutes or reset in DB
5. Verify can login again

---

## 🚨 Quick Re-enable Script

Create a file `scripts/enable-rate-limiting.js`:

```javascript
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../app/api/auth/login/route.js");
let content = fs.readFileSync(filePath, "utf8");

// Remove all TESTING comments
content = content.replace(/\/\/ TEMPORARILY DISABLED FOR TESTING.*\n/g, "");
content = content.replace(/\/\*\n/g, "");
content = content.replace(/\*\/\n/g, "");
content = content.replace(
  /\/\/ Simple error without rate limiting \(TESTING ONLY\)\n.*\n/g,
  ""
);

fs.writeFileSync(filePath, content);
console.log("✅ Rate limiting re-enabled!");
```

Run: `node scripts/enable-rate-limiting.js`

---

## 📋 Final Checklist

Before deploying to production:

- [ ] Rate limiting re-enabled in `app/api/auth/login/route.js`
- [ ] Tested login with wrong password 5+ times
- [ ] Verified account lock works
- [ ] Verified lockout message displays correctly
- [ ] Tested successful login after lockout period
- [ ] Removed all `TESTING ONLY` comments
- [ ] Code reviewed by team
- [ ] Security audit passed

---

**Last Updated**: January 2, 2026  
**Status**: 🔴 TESTING MODE - NOT PRODUCTION READY  
**Action Required**: Re-enable before deployment
