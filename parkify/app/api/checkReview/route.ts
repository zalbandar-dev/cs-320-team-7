import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const spotId = req.nextUrl.searchParams.get("spot_id");

    const response = await fetch(
      `http://localhost:3001/api/bookings/reviews/check?spot_id=${spotId}`,
      { headers: { Authorization: authHeader } }
    );
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to check review status" },
      { status: 500 }
    );
  }
}