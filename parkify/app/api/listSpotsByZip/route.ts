import { NextRequest, NextResponse } from "next/server";
import { parkingSpots } from "@/app/lib/fake-data";

export async function GET(request: NextRequest) {
  const zip = request.nextUrl.searchParams.get("zip");
  if (!zip) {
    return NextResponse.json(
      { error: "zip query parameter is required" },
      { status: 400 }
    );
  }
  const results = parkingSpots.filter(
    (s) => s.status === "available" && s.zip_code === zip
  );
  return NextResponse.json(results);
}