export interface ParkingSpot {
  id: number;
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  price_per_hour: number;
  price_per_day: number;
  image_url: string;
  spot_type: "driveway" | "garage" | "lot" | "street" | "underground";
  status: "available" | "occupied" | "reserved";
  amenities: string[];
  host_name: string;
  rating: number;
  review_count: number;
}