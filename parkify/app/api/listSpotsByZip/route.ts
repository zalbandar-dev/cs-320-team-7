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

    const response = await fetch(
      `http://localhost:3001/api/spotByZip?zip_code=${zip}`
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