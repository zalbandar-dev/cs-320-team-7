import { NextResponse } from "next/server";
import { parkingSpots } from "@/app/lib/fake-data";

export async function GET() {
  try {
    const response = await fetch("http://localhost:3001/api/allSpots");
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch from backend" },
      { status: 500 }
    );
  }
}