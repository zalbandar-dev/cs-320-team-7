import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const response = await fetch("http://localhost:3001/api/providers/spots", {
      headers: { Authorization: authHeader },
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch spots" }, { status: 500 });
  }
}
