import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ParkSpot - Find Parking Anywhere",
  description: "Airbnb for parking spots. Find and book parking spaces near you.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}