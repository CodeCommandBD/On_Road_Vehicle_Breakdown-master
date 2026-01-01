import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcrypt";
import { connectDB } from "@/lib/db/connect";
import ApiKey from "@/lib/db/models/ApiKey";
import User from "@/lib/db/models/User";
import { AUTH, PERMISSIONS } from "@/lib/utils/constants";
import { UnauthorizedError } from "@/lib/utils/errorHandler";

// ==================== JWT SECRET ====================
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production"
);

// ==================== PASSWORD HASHING ====================

/**
 * Hash password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
export async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Compare password with hashed password
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password from database
 * @returns {Promise<boolean>} True if passwords match
 */
export async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

// ==================== JWT TOKEN MANAGEMENT ====================

/**
 * Create JWT token
 * @param {object} payload - Token payload (userId, email, role)
 * @returns {Promise<string>} JWT token
 */
export async function createToken(payload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(AUTH.JWT_EXPIRY)
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Promise<object|null>} Decoded payload or null if invalid
 */
export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    console.error("Token verification failed:", error.message);
    return null;
  }
}

// ==================== API KEY VERIFICATION ====================

/**
 * Verify API Key
 * @param {string} key - API key
 * @returns {Promise<object|null>} User data or null if invalid
 */
export async function verifyApiKey(key) {
  try {
    if (!key) return null;
    await connectDB();

    const apiKeyDoc = await ApiKey.findOne({ key, isActive: true }).populate(
      "user"
    );
    if (!apiKeyDoc || !apiKeyDoc.user) return null;

    // Update last used
    apiKeyDoc.lastUsedAt = new Date();
    await apiKeyDoc.save();

    return {
      userId: apiKeyDoc.user._id,
      email: apiKeyDoc.user.email,
      role: apiKeyDoc.user.role,
      membershipTier: apiKeyDoc.user.membershipTier,
      isApiKey: true,
    };
  } catch (error) {
    console.error("API Key verification failed:", error);
    return null;
  }
}

// ==================== COOKIE MANAGEMENT ====================

/**
 * Get token from cookies
 * @returns {Promise<string|undefined>} Token or undefined
 */
export async function getTokenFromCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH.COOKIE_NAME)?.value;
  return token;
}

/**
 * Set token cookie
 * @param {string} token - JWT token
 * @param {number} maxAge - Optional max age in milliseconds (defaults to AUTH.COOKIE_MAX_AGE)
 */
export async function setTokenCookie(token, maxAge = null) {
  const cookieStore = await cookies();
  const cookieMaxAge = maxAge || AUTH.COOKIE_MAX_AGE;
  cookieStore.set(AUTH.COOKIE_NAME, token, {
    ...AUTH.COOKIE_OPTIONS,
    maxAge: cookieMaxAge / 1000, // Convert to seconds
  });
}

/**
 * Remove token cookie
 */
export async function removeTokenCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH.COOKIE_NAME);
}

// ==================== TOKEN EXTRACTION ====================

/**
 * Extract token from request (cookies or Authorization header)
 * @param {Request} request - Next.js request object
 * @returns {Promise<string|null>} Token or null
 */
export async function extractToken(request) {
  // Try to get from cookies first
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(AUTH.COOKIE_NAME)?.value;
  if (cookieToken) return cookieToken;

  // Try to get from Authorization header
  const authHeader = request.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  return null;
}

// ==================== USER AUTHENTICATION ====================

/**
 * Get current user from token
 * @param {Request} request - Optional request object to extract token from headers
 * @returns {Promise<object|null>} User payload or null
 */
export async function getCurrentUser(request = null) {
  let token;

  if (request) {
    token = await extractToken(request);
  } else {
    token = await getTokenFromCookies();
  }

  if (!token) return null;

  const payload = await verifyToken(token);
  return payload;
}

/**
 * Get full user details from database
 * @param {string} userId - User ID
 * @returns {Promise<object|null>} User object or null
 */
export async function getUserById(userId) {
  try {
    await connectDB();
    const user = await User.findById(userId).select("-password");
    return user;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

/**
 * Require authentication - throws error if not authenticated
 * @param {Request} request - Next.js request object
 * @returns {Promise<object>} User payload
 * @throws {UnauthorizedError} If not authenticated
 */
export async function requireAuth(request) {
  const user = await getCurrentUser(request);
  if (!user) {
    throw new UnauthorizedError();
  }
  return user;
}

// ==================== AUTHORIZATION ====================

/**
 * Check if user is authenticated
 * @param {object} user - User payload
 * @returns {boolean} True if authenticated
 */
export function isAuthenticated(user) {
  return !!user;
}

/**
 * Check if user has specific role(s)
 * @param {object} user - User payload
 * @param {string|string[]} roles - Role or array of roles
 * @returns {boolean} True if user has role
 */
export function hasRole(user, roles) {
  if (!user) return false;
  if (typeof roles === "string") {
    return user.role === roles;
  }
  return roles.includes(user.role);
}

/**
 * Check if user has specific permission
 * @param {object} user - User payload
 * @param {string} permission - Permission string (e.g., 'bookings:create')
 * @returns {boolean} True if user has permission
 */
export function hasPermission(user, permission) {
  if (!user || !user.role) return false;

  const userPermissions = PERMISSIONS[user.role] || [];

  // Admin has all permissions
  if (userPermissions.includes("*")) return true;

  return userPermissions.includes(permission);
}

/**
 * Require specific role - throws error if user doesn't have role
 * @param {object} user - User payload
 * @param {string|string[]} roles - Required role(s)
 * @throws {ForbiddenError} If user doesn't have role
 */
export function requireRole(user, roles) {
  if (!hasRole(user, roles)) {
    const { ForbiddenError } = require("@/lib/utils/errorHandler");
    throw new ForbiddenError();
  }
}

/**
 * Require specific permission - throws error if user doesn't have permission
 * @param {object} user - User payload
 * @param {string} permission - Required permission
 * @throws {ForbiddenError} If user doesn't have permission
 */
export function requirePermission(user, permission) {
  if (!hasPermission(user, permission)) {
    const { ForbiddenError } = require("@/lib/utils/errorHandler");
    throw new ForbiddenError();
  }
}

// Export all functions
export default {
  hashPassword,
  comparePassword,
  createToken,
  verifyToken,
  verifyApiKey,
  getTokenFromCookies,
  setTokenCookie,
  removeTokenCookie,
  extractToken,
  getCurrentUser,
  getUserById,
  requireAuth,
  isAuthenticated,
  hasRole,
  hasPermission,
  requireRole,
  requirePermission,
};
