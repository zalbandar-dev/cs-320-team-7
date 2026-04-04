export interface ParkingSpot {
  address: string;
  available: true;
  created_at: string;
  description: string;
  hourly_rate: number;
  latitude: number;
  longitude: number;
  provider_id: number;
  spot_id: number;
  spot_type: string;
  zip_code: string;
}