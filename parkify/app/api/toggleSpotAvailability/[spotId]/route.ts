import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ spotId: string }> }) {
  try {
    const { spotId } = await params;
    const body = await req.json();
    const response = await fetch(`http://localhost:3001/api/providers/spots/${spotId}/availability`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to toggle availability" }, { status: 500 });
  }
}
