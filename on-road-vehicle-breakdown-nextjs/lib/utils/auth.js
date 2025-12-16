import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production"
);

const JWT_EXPIRY = "7d";

export async function createToken(payload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(JWT_SECRET);

  return token;
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    console.error("Token verification failed:", error.message);
    return null;
  }
}

export async function getTokenFromCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  return token;
}

export async function setTokenCookie(token) {
  const cookieStore = await cookies();
  cookieStore.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export async function removeTokenCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("token");
}

export async function getCurrentUser() {
  const token = await getTokenFromCookies();
  if (!token) return null;

  const payload = await verifyToken(token);
  return payload;
}

export function isAuthenticated(user) {
  return !!user;
}

export function hasRole(user, roles) {
  if (!user) return false;
  if (typeof roles === "string") {
    return user.role === roles;
  }
  return roles.includes(user.role);
}
