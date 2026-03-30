import { NextResponse } from "next/server";
import { parkingSpots } from "@/app/lib/fake-data";

export async function GET() {
  const available = parkingSpots.filter((s) => s.status === "available");
  return NextResponse.json(available);
}