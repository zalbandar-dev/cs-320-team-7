export interface ParkingSpot {
  spot_id: number;
  address: string;
  available: boolean;
  created_at: string;
  description: string;
  hourly_rate: number;
  latitude: number;
  longitude: number;
  provider_id: number;
  spot_type: string;
  zip_code: string;
}
