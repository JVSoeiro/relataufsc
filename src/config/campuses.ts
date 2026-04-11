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
  endereco: string;
  enderecoCurto: string;
  centro: [number, number];
  fitRadiusMeters?: number;
  viewBounds: CampusBounds;
  detectionBounds: CampusBounds;
  accent: string;
};

export const CAMPUSES: CampusConfig[] = [
  {
    id: "florianopolis",
    nome: "Florianópolis",
    cidade: "Florianópolis",
    endereco: "Rua Roberto Sampaio Gonzaga, Trindade, Florianópolis - SC",
    enderecoCurto: "Rua Roberto Sampaio Gonzaga, Trindade",
    centro: [-27.60182720540821, -48.52102325718008],
    fitRadiusMeters: 612,
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
    endereco:
      "Rodovia Governador Jorge Lacerda, 3201, Jardim das Avenidas, Araranguá - SC",
    enderecoCurto: "Rod. Gov. Jorge Lacerda, 3201, Jardim das Avenidas",
    centro: [-28.95078589885533, -49.467327810112465],
    fitRadiusMeters: 202,
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
    endereco: "Rua Marechal Rondon, 880, Salto do Norte, Blumenau - SC",
    enderecoCurto: "Rua Marechal Rondon, 880, Salto do Norte",
    centro: [-26.872362028554786, -49.0946071204453],
    fitRadiusMeters: 115,
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
    endereco: "Rodovia Ulysses Gaboardi, 3000, Curitibanos - SC",
    enderecoCurto: "Rod. Ulysses Gaboardi, 3000",
    centro: [-27.284514489872194, -50.53550131992693],
    fitRadiusMeters: 310,
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
    endereco:
      "Rua Dona Francisca, 8300, Bloco U, Zona Industrial Norte, Joinville - SC",
    enderecoCurto: "Rua Dona Francisca, 8300, Bloco U",
    centro: [-26.238549153175864, -48.883841844596674],
    fitRadiusMeters: 970,
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
