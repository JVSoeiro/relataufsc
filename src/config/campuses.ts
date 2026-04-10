export const campusIds = [
  "florianopolis",
  "ararangua",
  "blumenau",
  "curitibanos",
  "joinville",
] as const;

export type CampusId = (typeof campusIds)[number];

export type CampusBounds = [[number, number], [number, number]];

export type CampusConfig = {
  id: CampusId;
  nome: string;
  cidade: string;
  centro: [number, number];
  viewBounds: CampusBounds;
  detectionBounds: CampusBounds;
  accent: string;
};

export const CAMPUSES: CampusConfig[] = [
  {
    id: "florianopolis",
    nome: "Florianópolis",
    cidade: "Florianópolis",
    centro: [-27.60123, -48.51983],
    viewBounds: [
      [-27.6157, -48.5376],
      [-27.5864, -48.5],
    ],
    detectionBounds: [
      [-27.6205, -48.5425],
      [-27.582, -48.495],
    ],
    accent: "#0f766e",
  },
  {
    id: "ararangua",
    nome: "Araranguá",
    cidade: "Araranguá",
    centro: [-28.9425, -49.4915],
    viewBounds: [
      [-28.9585, -49.5125],
      [-28.928, -49.47],
    ],
    detectionBounds: [
      [-28.972, -49.5225],
      [-28.922, -49.458],
    ],
    accent: "#4f46e5",
  },
  {
    id: "blumenau",
    nome: "Blumenau",
    cidade: "Blumenau",
    centro: [-26.8769, -49.1046],
    viewBounds: [
      [-26.8855, -49.1135],
      [-26.8695, -49.0955],
    ],
    detectionBounds: [
      [-26.8915, -49.1195],
      [-26.865, -49.09],
    ],
    accent: "#c2410c",
  },
  {
    id: "curitibanos",
    nome: "Curitibanos",
    cidade: "Curitibanos",
    centro: [-27.28539, -50.53342],
    viewBounds: [
      [-27.2926, -50.5428],
      [-27.278, -50.5235],
    ],
    detectionBounds: [
      [-27.2985, -50.5485],
      [-27.2725, -50.5185],
    ],
    accent: "#9333ea",
  },
  {
    id: "joinville",
    nome: "Joinville",
    cidade: "Joinville",
    centro: [-26.24082, -48.88277],
    viewBounds: [
      [-26.2465, -48.8898],
      [-26.2352, -48.8755],
    ],
    detectionBounds: [
      [-26.2515, -48.8955],
      [-26.231, -48.87],
    ],
    accent: "#e11d48",
  },
];

export const campuses = CAMPUSES;

export const campusById = Object.fromEntries(
  CAMPUSES.map((campus) => [campus.id, campus]),
) as Record<CampusId, CampusConfig>;

export function isPointWithinBounds(
  latitude: number,
  longitude: number,
  bounds: CampusBounds,
) {
  const [[south, west], [north, east]] = bounds;

  return (
    latitude >= Math.min(south, north) &&
    latitude <= Math.max(south, north) &&
    longitude >= Math.min(west, east) &&
    longitude <= Math.max(west, east)
  );
}

export function detectarCampusPorCoordenada(
  latitude: number,
  longitude: number,
) {
  return (
    CAMPUSES.find((campus) =>
      isPointWithinBounds(latitude, longitude, campus.detectionBounds),
    ) ?? null
  );
}
