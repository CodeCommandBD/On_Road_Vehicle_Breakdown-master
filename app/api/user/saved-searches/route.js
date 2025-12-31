import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import SavedSearch from "@/lib/db/models/SavedSearch";
import { verifyToken } from "@/lib/utils/auth";
import { handleError, NotFoundError } from "@/lib/utils/errorHandler";
import { successResponse, createdResponse } from "@/lib/utils/apiResponse";
import { MESSAGES } from "@/lib/utils/constants";

// GET: List all saved searches for the user
export async function GET(request) {
  try {
    await connectDB();
    const user = await verifyToken(request);

    const savedSearches = await SavedSearch.find({ userId: user.id }).sort({
      createdAt: -1,
    });

    return successResponse(
      savedSearches,
      MESSAGES.SUCCESS.DATA_FETCHED("Saved searches")
    );
  } catch (error) {
    return handleError(error);
  }
}

// POST: Create a new saved search
export async function POST(request) {
  try {
    await connectDB();
    const user = await verifyToken(request);
    const body = await request.json();

    const { name, filters } = body;

    const savedSearch = await SavedSearch.create({
      userId: user.id,
      name,
      filters,
    });

    return createdResponse(savedSearch, "Search saved successfully");
  } catch (error) {
    return handleError(error);
  }
}

// DELETE: Remove a saved search (Expects ?id=... query param)
export async function DELETE(request) {
  try {
    await connectDB();
    const user = await verifyToken(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      throw new Error("Search ID is required");
    }

    const savedSearch = await SavedSearch.findOne({ _id: id, userId: user.id });

    if (!savedSearch) {
      throw new NotFoundError("Saved search not found");
    }

    await SavedSearch.deleteOne({ _id: id });

    return successResponse(null, "Saved search deleted successfully");
  } catch (error) {
    return handleError(error);
  }
}
