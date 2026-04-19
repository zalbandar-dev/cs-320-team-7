import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const { bookingId } = await params;
    const authHeader = req.headers.get("authorization") ?? "";
    const response = await fetch(`http://localhost:3001/api/bookings/${bookingId}/confirm`, {
      method: "PATCH",
      headers: { Authorization: authHeader },
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to confirm booking" }, { status: 500 });
  }
}
