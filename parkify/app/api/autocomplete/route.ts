import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const text = req.nextUrl.searchParams.get("text");
  if (!text) return NextResponse.json({ success: false, error: "text is required" }, { status: 400 });

  try {
    const response = await fetch(`http://localhost:3001/api/autocomplete?text=${encodeURIComponent(text)}`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ success: false, error: "Autocomplete failed" }, { status: 500 });
  }
}
