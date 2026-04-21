export interface Booking {
  booking_id: number;
  user_id: number;
  spot_id: number;
  start_time: string;
  end_time: string;
  total_price: number;
  status: "pending_provider" | "active" | "completed" | "cancelled";
  vehicle_make: string;
  vehicle_model: string;
  license_plate: string;
  created_at: string;
  updated_at: string;
  parking_spots?: {
    address: string;
    zip_code: string;
    hourly_rate: number;
    spot_type: string;
  };
}

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
  image: string;
}
