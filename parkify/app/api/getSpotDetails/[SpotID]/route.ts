import { NextRequest, NextResponse } from "next/server";
import { parkingSpots } from "@/app/lib/fake-data";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ spotID: string }> }
) {
  const { spotID } = await params;
  const id = parseInt(spotID, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid spot ID" }, { status: 400 });
  }
  const spot = parkingSpots.find((s) => s.id === id);
  if (!spot) {
    return NextResponse.json({ error: "Spot not found" }, { status: 404 });
  }
  return NextResponse.json(spot);
}