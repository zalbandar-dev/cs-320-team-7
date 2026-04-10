import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ SpotID: string }> }
) {
  const { SpotID } = await params;
  const id = parseInt(SpotID, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid spot ID" }, { status: 400 });
  }

  try {
    const response = await fetch(`http://localhost:3001/api/spot/${id}`);
    const result = await response.json();
    if (!response.ok || !result.success) {
      return NextResponse.json({ error: "Spot not found" }, { status: 404 });
    }
    return NextResponse.json(result.data);
  } catch {
    return NextResponse.json({ error: "Failed to fetch spot" }, { status: 500 });
  }
}
