import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const startTime = searchParams.get("start_time");
    const endTime = searchParams.get("end_time");

    let url = "http://localhost:3001/api/allSpots";
    const params = new URLSearchParams();
    if (startTime) params.set("start_time", startTime);
    if (endTime) params.set("end_time", endTime);
    if (params.toString()) url += `?${params.toString()}`;

    const response = await fetch(url);
    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch from backend" },
      { status: 500 }
    );
  }
}