import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import Garage from "@/lib/db/models/Garage";
import { createToken, setTokenCookie, hashPassword } from "@/lib/utils/auth";
import { signupSchema } from "@/lib/validations/auth";
import { handleError, ConflictError } from "@/lib/utils/errorHandler";
import { createdResponse } from "@/lib/utils/apiResponse";
import { MESSAGES, BUSINESS } from "@/lib/utils/constants";
import { strictRateLimit } from "@/lib/utils/rateLimit";

export async function POST(request) {
  // Apply strict rate limiting (5 requests per 15 minutes)
  const rateLimitResponse = strictRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await connectDB();

    const body = await request.json();

    // Validate request body using Zod
    const validatedData = signupSchema.parse(body);
    const { name, email, password, phone, role, garageName, address } =
      validatedData;

    // Get language from request body, default to English
    const lang =
      body.lang && (body.lang === "bn" || body.lang === "en")
        ? body.lang.toUpperCase()
        : "EN";
    const messages = MESSAGES[lang];

    // Check if email already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      // STRICT POLICY: One email = One account type
      const existingRole =
        existingUser.role.charAt(0).toUpperCase() + existingUser.role.slice(1);
      const requestedRole = role.charAt(0).toUpperCase() + role.slice(1);

      const errorMessage =
        lang === "BN"
          ? `এই ইমেইলটি ইতিমধ্যে '${existingRole}' হিসেবে নিবন্ধিত আছে। আপনি এটি দিয়ে '${requestedRole}' একাউন্ট তৈরি করতে পারবেন না।`
          : `This email is already registered as a '${existingRole}'. You cannot use it to create a '${requestedRole}' account.`;

      throw new ConflictError(errorMessage);
    }

    // Format address into an object if it's a string
    const formattedAddress =
      typeof address === "string"
        ? {
            street: address,
            city: BUSINESS.DEFAULT_ADDRESS.city,
            district: BUSINESS.DEFAULT_ADDRESS.district,
            postalCode: BUSINESS.DEFAULT_ADDRESS.postalCode,
          }
        : address || BUSINESS.DEFAULT_ADDRESS;

    // Create user
    const userData = {
      name,
      email,
      password, // Will be hashed by User model pre-save hook
      phone: phone || null,
      role: role || "user",
    };

    if (formattedAddress) {
      userData.address = formattedAddress;
    }

    const user = new User(userData);
    await user.save();

    // If registering as garage, create garage profile
    if (role === "garage" && garageName) {
      const garage = new Garage({
        name: garageName,
        owner: user._id,
        email: email,
        phone: phone || "",
        address: formattedAddress || BUSINESS.DEFAULT_ADDRESS,
        location: {
          type: "Point",
          coordinates: [
            BUSINESS.DEFAULT_COORDINATES.longitude,
            BUSINESS.DEFAULT_COORDINATES.latitude,
          ],
        },
      });
      await garage.save();

      // Update user with garageId
      user.garageId = garage._id;
      await user.save();
    }

    // Create JWT token
    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    const token = await createToken(tokenPayload);

    // Set cookie (optional - can skip if redirecting to login)
    // await setTokenCookie(token);

    // Return success response
    return createdResponse(
      {
        user: user.toPublicJSON(),
        token,
      },
      messages.SUCCESS.SIGNUP
    );
  } catch (error) {
    return handleError(error);
  }
}
