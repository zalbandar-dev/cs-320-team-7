/**
 * Compile-time type assertion tests.
 * Run: npx tsc --noEmit
 * These have no runtime behavior — TypeScript will error at compile time
 * if any assertion fails, verifying the type fixes are in place.
 */

import type { Booking, ParkingSpot } from "../lib/types";
import { parkingSpots } from "../lib/fake-data";

// ── 1. Booking status accepts "expired" ───────────────────────────────────────
// Would error: Type '"expired"' is not assignable to type ... if fix not applied
const expiredBooking: Pick<Booking, "status"> = { status: "expired" };
void expiredBooking;

// All other statuses still valid
const allStatuses: Booking["status"][] = [
  "pending_provider",
  "active",
  "completed",
  "cancelled",
  "expired",
];
void allStatuses;

// ── 2. ParkingSpot interface has correct fields ───────────────────────────────
// Would error on any missing or renamed field
const spot: ParkingSpot = {
  spot_id: 1,
  address: "123 Main St, Springfield, IL 62704",
  available: true,
  created_at: "2024-01-01T00:00:00Z",
  description: "A test spot",
  hourly_rate: 5.0,
  latitude: 40.0,
  longitude: -88.0,
  provider_id: 42,
  spot_type: "standard",
  zip_code: "62704",
  image: "https://example.com/img.jpg",
};
void spot;

// ── 3. fake-data entries conform to ParkingSpot[] ────────────────────────────
// Would error if any entry has wrong/missing fields
const typedSpots: ParkingSpot[] = parkingSpots;
void typedSpots;

// spot_id (not id) is the key field
const firstId: number = parkingSpots[0].spot_id;
void firstId;

// ── 4. SpotCard / SpotGrid use spot_id, not id ───────────────────────────────
// Verify spot_id exists on ParkingSpot and is a number
function useSpotId(s: ParkingSpot): number {
  return s.spot_id;
}
void useSpotId;

// spot_id must be a number (not string)
const _spotIdType: number = parkingSpots[0].spot_id;
void _spotIdType;
