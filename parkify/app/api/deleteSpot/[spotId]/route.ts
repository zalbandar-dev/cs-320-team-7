import { NextRequest, NextResponse } from "next/server";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ spotId: string }> }) {
  try {
    const { spotId } = await params;
    const authHeader = _req.headers.get("authorization") ?? "";
    const response = await fetch(`http://localhost:3001/api/providers/spots/${spotId}`, {
      method: "DELETE",
      headers: { Authorization: authHeader },
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete spot" }, { status: 500 });
  }
}
