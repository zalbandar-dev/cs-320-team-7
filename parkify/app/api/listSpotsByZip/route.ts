import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const zip = request.nextUrl.searchParams.get("zip");

    if (!zip) {
      return NextResponse.json(
        { error: "zip is required" },
        { status: 400 }
      );
    }

    const startTime = request.nextUrl.searchParams.get("start_time");
    const endTime = request.nextUrl.searchParams.get("end_time");
    const params = new URLSearchParams({ zip_code: zip });
    if (startTime) params.set("start_time", startTime);
    if (endTime) params.set("end_time", endTime);

    const response = await fetch(
      `http://localhost:3001/api/spotByZip?${params.toString()}`
    );
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch from backend" },
      { status: 500 }
    );
  }
}