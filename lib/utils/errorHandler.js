import { NextResponse } from "next/server";
import { HTTP_STATUS, MESSAGES } from "@/lib/utils/constants";
import { ZodError } from "zod";

// ==================== CUSTOM ERROR CLASSES ====================

/**
 * Base Application Error
 */
export class AppError extends Error {
  constructor(
    message,
    statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error - 400
 */
export class ValidationError extends AppError {
  constructor(message = MESSAGES.EN.ERROR.VALIDATION_FAILED, errors = []) {
    super(message, HTTP_STATUS.BAD_REQUEST);
    this.name = "ValidationError";
    this.errors = errors;
  }
}

/**
 * Unauthorized Error - 401
 */
export class UnauthorizedError extends AppError {
  constructor(message = MESSAGES.EN.ERROR.UNAUTHORIZED) {
    super(message, HTTP_STATUS.UNAUTHORIZED);
    this.name = "UnauthorizedError";
  }
}

/**
 * Forbidden Error - 403
 */
export class ForbiddenError extends AppError {
  constructor(message = MESSAGES.EN.ERROR.FORBIDDEN) {
    super(message, HTTP_STATUS.FORBIDDEN);
    this.name = "ForbiddenError";
  }
}

/**
 * Not Found Error - 404
 */
export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, HTTP_STATUS.NOT_FOUND);
    this.name = "NotFoundError";
  }
}

/**
 * Conflict Error - 409
 */
export class ConflictError extends AppError {
  constructor(message = "Data already exists") {
    super(message, HTTP_STATUS.CONFLICT);
    this.name = "ConflictError";
  }
}

// ==================== ERROR HANDLER ====================

/**
 * Format Zod Validation Errors
 */
function formatZodErrors(error) {
  const errors = (error.errors || []).map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));

  return {
    message: MESSAGES.EN.ERROR.VALIDATION_FAILED,
    errors,
  };
}

/**
 * Format Mongoose Validation Errors
 */
function formatMongooseErrors(error) {
  const errors = Object.values(error.errors).map((err) => ({
    field: err.path,
    message: err.message,
  }));

  return {
    message: MESSAGES.EN.ERROR.VALIDATION_FAILED,
    errors,
  };
}

/**
 * Handle MongoDB Duplicate Key Error
 */
function handleDuplicateKeyError(error) {
  const field = Object.keys(error.keyPattern)[0];
  const value = error.keyValue[field];

  let message = `${field} "${value}" is already used`;

  if (field === "email") {
    message = MESSAGES.EN.ERROR.EMAIL_EXISTS;
  }

  return {
    message,
    field,
    statusCode: HTTP_STATUS.CONFLICT,
  };
}

/**
 * Handle JWT Errors
 */
function handleJWTError(error) {
  if (error.name === "TokenExpiredError") {
    return {
      message: MESSAGES.EN.ERROR.TOKEN_EXPIRED,
      statusCode: HTTP_STATUS.UNAUTHORIZED,
    };
  }

  return {
    message: MESSAGES.EN.ERROR.INVALID_TOKEN,
    statusCode: HTTP_STATUS.UNAUTHORIZED,
  };
}

/**
 * Main Error Handler
 * Handles all types of errors and returns appropriate response
 */
export function handleError(error) {
  console.error("Error:", error);

  // Zod Validation Error
  if (error instanceof ZodError) {
    const formatted = formatZodErrors(error);
    return NextResponse.json(
      {
        success: false,
        message: formatted.message,
        errors: formatted.errors,
        timestamp: new Date().toISOString(),
      },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }

  // Mongoose Validation Error
  if (error.name === "ValidationError") {
    const formatted = formatMongooseErrors(error);
    return NextResponse.json(
      {
        success: false,
        message: formatted.message,
        errors: formatted.errors,
        timestamp: new Date().toISOString(),
      },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }

  // MongoDB Duplicate Key Error
  if (error.code === 11000) {
    const formatted = handleDuplicateKeyError(error);
    return NextResponse.json(
      {
        success: false,
        message: formatted.message,
        field: formatted.field,
        timestamp: new Date().toISOString(),
      },
      { status: formatted.statusCode }
    );
  }

  // JWT Errors
  if (
    error.name === "JsonWebTokenError" ||
    error.name === "TokenExpiredError"
  ) {
    const formatted = handleJWTError(error);
    return NextResponse.json(
      {
        success: false,
        message: formatted.message,
        timestamp: new Date().toISOString(),
      },
      { status: formatted.statusCode }
    );
  }

  // Custom App Errors
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
        errors: error.errors || undefined,
        timestamp: error.timestamp,
      },
      { status: error.statusCode }
    );
  }

  // MongoDB CastError (Invalid ObjectId)
  if (error.name === "CastError") {
    return NextResponse.json(
      {
        success: false,
        message: `Invalid ${error.path}: ${error.value}`,
        timestamp: new Date().toISOString(),
      },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }

  // Default Server Error
  return NextResponse.json(
    {
      success: false,
      message: MESSAGES.EN.ERROR.INTERNAL_SERVER,
      ...(process.env.NODE_ENV === "development" && {
        error: error.message,
        stack: error.stack,
      }),
      timestamp: new Date().toISOString(),
    },
    { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
  );
}

/**
 * Async Error Handler Wrapper
 * Wraps async route handlers to catch errors
 */
export function asyncHandler(fn) {
  return async (req, ...args) => {
    try {
      return await fn(req, ...args);
    } catch (error) {
      return handleError(error);
    }
  };
}

export default {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  handleError,
  asyncHandler,
};
