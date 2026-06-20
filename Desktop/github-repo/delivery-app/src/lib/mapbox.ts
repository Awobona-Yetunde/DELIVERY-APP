export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export async function getRoute(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
): Promise<[number, number][]> {
  try {
    const res = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/` +
        `${originLng},${originLat};${destLng},${destLat}` +
        `?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`,
    );
    const data = await res.json();
    if (data.routes && data.routes.length > 0) {
      return data.routes[0].geometry.coordinates.map(
        (coord: [number, number]) => [coord[1], coord[0]],
      );
    }
    return [];
  } catch {
    return [];
  }
}
