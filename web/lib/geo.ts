import type { Shop } from "@/lib/types";

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export function toCoordinate(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function shopCoordinates(shop: Pick<Shop, "latitude" | "longitude">) {
  const latitude = toCoordinate(shop.latitude);
  const longitude = toCoordinate(shop.longitude);
  if (latitude === null || longitude === null) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return { latitude, longitude };
}

export function distanceKm(a: Coordinates, b: Coordinates) {
  const earthRadiusKm = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const deltaLat = toRadians(b.latitude - a.latitude);
  const deltaLng = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(haversine));
}

export function formatDistance(km: number | null | undefined) {
  if (km === null || km === undefined || !Number.isFinite(km)) return null;
  if (km < 1) return `${Math.max(Math.round(km * 1000), 10)} m away`;
  if (km < 10) return `${km.toFixed(1)} km away`;
  return `${Math.round(km)} km away`;
}

export function mapCenter(coordinates: Coordinates[], fallback: Coordinates = {
  latitude: 14.5995,
  longitude: 120.9842,
}) {
  if (!coordinates.length) return fallback;
  return {
    latitude: coordinates.reduce((total, item) => total + item.latitude, 0) / coordinates.length,
    longitude: coordinates.reduce((total, item) => total + item.longitude, 0) / coordinates.length,
  };
}

export function parseCoordinates(latitude?: string, longitude?: string): Coordinates | null {
  const lat = toCoordinate(latitude);
  const lng = toCoordinate(longitude);
  if (lat === null || lng === null) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { latitude: lat, longitude: lng };
}
