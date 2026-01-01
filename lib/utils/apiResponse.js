import { NextResponse } from "next/server";
import { HTTP_STATUS, PAGINATION } from "@/lib/utils/constants";

// ==================== API RESPONSE FORMATTERS ====================

/**
 * Success Response
 * Standard format for successful API responses
 */
export function successResponse(
  data,
  message = "সফল",
  statusCode = HTTP_STATUS.OK
) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
}

/**
 * Error Response
 * Standard format for error API responses
 */
export function errorResponse(
  message,
  statusCode = HTTP_STATUS.BAD_REQUEST,
  errors = null
) {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
  };

  if (errors) {
    response.errors = errors;
  }

  return NextResponse.json(response, { status: statusCode });
}

/**
 * Paginated Response
 * Standard format for paginated data
 */
export function paginatedResponse(
  data,
  page = PAGINATION.DEFAULT_PAGE,
  limit = PAGINATION.DEFAULT_LIMIT,
  total = 0,
  message = "সফল"
) {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return NextResponse.json(
    {
      success: true,
      message,
      data,
      pagination: {
        currentPage: page,
        totalPages,
        pageSize: limit,
        totalItems: total,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null,
      },
      timestamp: new Date().toISOString(),
    },
    { status: HTTP_STATUS.OK }
  );
}

/**
 * Created Response
 * For successful resource creation (201)
 */
export function createdResponse(data, message = "তৈরি হয়েছে") {
  return successResponse(data, message, HTTP_STATUS.CREATED);
}

/**
 * No Content Response
 * For successful deletion or update with no return data (204)
 */
export function noContentResponse() {
  return new NextResponse(null, { status: HTTP_STATUS.NO_CONTENT });
}

/**
 * Unauthorized Response
 * For authentication failures (401)
 */
export function unauthorizedResponse(message = "Unauthorized access") {
  return errorResponse(message, HTTP_STATUS.UNAUTHORIZED);
}

/**
 * Forbidden Response
 * For authorization failures (403)
 */
export function forbiddenResponse(
  message = "You don't have permission to perform this action"
) {
  return errorResponse(message, HTTP_STATUS.FORBIDDEN);
}

/**
 * Not Found Response
 * For missing resources (404)
 */
export function notFoundResponse(message = "রিসোর্স খুঁজে পাওয়া যায়নি") {
  return errorResponse(message, HTTP_STATUS.NOT_FOUND);
}

/**
 * Conflict Response
 * For duplicate resources (409)
 */
export function conflictResponse(message = "ডেটা ইতিমধ্যে বিদ্যমান") {
  return errorResponse(message, HTTP_STATUS.CONFLICT);
}

/**
 * Validation Error Response
 * For validation failures (400)
 */
export function validationErrorResponse(
  errors,
  message = "ডেটা যাচাইকরণ ব্যর্থ হয়েছে"
) {
  return errorResponse(message, HTTP_STATUS.BAD_REQUEST, errors);
}

/**
 * Internal Server Error Response
 * For unexpected errors (500)
 */
export function serverErrorResponse(
  message = "সার্ভার ত্রুটি। পরে আবার চেষ্টা করুন"
) {
  return errorResponse(message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
}

// Export all response helpers
export default {
  successResponse,
  errorResponse,
  paginatedResponse,
  createdResponse,
  noContentResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  conflictResponse,
  validationErrorResponse,
  serverErrorResponse,
};
