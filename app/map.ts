// Map bounds (equirectangular projection). public/world.svg is drawn with
// exactly these bounds: 10 units per degree, viewBox 0 0 3600 1420.
export const LNG_MIN = -180;
export const LNG_MAX = 180;
export const LAT_MAX = 84; // top edge
export const LAT_MIN = -58; // bottom edge

export const MAP_WIDTH = 3600;
export const MAP_HEIGHT = 1420;
export const MAP_ASPECT = (LNG_MAX - LNG_MIN) / (LAT_MAX - LAT_MIN); // width / height

export function project(lat: number, lng: number): { xPct: number; yPct: number } {
  return {
    xPct: ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * 100,
    yPct: ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * 100,
  };
}
