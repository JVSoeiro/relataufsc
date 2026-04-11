import { randomUUID } from "node:crypto";

import { campusById, type CampusId } from "@/config/campuses";
import type { MediaKind } from "@/lib/constants";
import type { PublicComplaint } from "@/lib/types";
import {
  createPublicMediaUrl,
  getPublicDestinationPath,
  moveUploadToPublic,
  savePendingUpload,
} from "@/services/storage";

type MockPendingComplaintInput = {
  description: string;
  campusId: CampusId;
  latitude: number;
  longitude: number;
  publicName: string | null;
  submitterEmail: string | null;
  media: File | null;
};

const initialMockComplaints: PublicComplaint[] = [
  {
    id: "mock-floripa-sidewalk",
    campusId: "florianopolis",
    description:
      "Calçada quebrada perto de uma área de circulação intensa, com desnível visível e risco de tropeço.",
    latitude: -27.6021,
    longitude: -48.5182,
    mediaKind: null,
    mediaMimeType: null,
    mediaUrl: null,
    publicName: "Comunidade UFSC",
    displayName: "Comunidade UFSC",
    publishedAt: "2026-03-03T10:00:00.000Z",
    approximateLocationLabel: "Entorno do campus de Florianópolis",
  },
  {
    id: "mock-floripa-lighting",
    campusId: "florianopolis",
    description:
      "Trecho com iluminação insuficiente no início da noite, reduzindo a sensação de segurança.",
    latitude: -27.6072,
    longitude: -48.5241,
    mediaKind: null,
    mediaMimeType: null,
    mediaUrl: null,
    publicName: null,
    displayName: "Anônimo",
    publishedAt: "2026-03-10T08:15:00.000Z",
    approximateLocationLabel: "Entorno do campus de Florianópolis",
  },
  {
    id: "mock-joinville-accessibility",
    campusId: "joinville",
    description:
      "Rampa com desgaste visível e desnível brusco, dificultando acessibilidade no acesso principal.",
    latitude: -26.24065,
    longitude: -48.8821,
    mediaKind: null,
    mediaMimeType: null,
    mediaUrl: null,
    publicName: "Colaborador anônimo",
    displayName: "Colaborador anônimo",
    publishedAt: "2026-02-22T17:20:00.000Z",
    approximateLocationLabel: "Entorno do campus de Joinville",
  },
  {
    id: "mock-blumenau-leak",
    campusId: "blumenau",
    description:
      "Vazamento próximo ao acesso de salas de aula, deixando o piso escorregadio.",
    latitude: -26.8774,
    longitude: -49.1039,
    mediaKind: null,
    mediaMimeType: null,
    mediaUrl: null,
    publicName: null,
    displayName: "Anônimo",
    publishedAt: "2026-03-15T12:40:00.000Z",
    approximateLocationLabel: "Entorno do campus de Blumenau",
  },
  {
    id: "mock-curitibanos-furniture",
    campusId: "curitibanos",
    description:
      "Banco externo danificado e instável em área de convivência.",
    latitude: -27.2851,
    longitude: -50.5331,
    mediaKind: null,
    mediaMimeType: null,
    mediaUrl: null,
    publicName: "Observador do campus",
    displayName: "Observador do campus",
    publishedAt: "2026-03-01T09:05:00.000Z",
    approximateLocationLabel: "Entorno do campus de Curitibanos",
  },
  {
    id: "mock-ararangua-wires",
    campusId: "ararangua",
    description:
      "Fiação exposta ao lado de circulação externa, exigindo inspeção e isolamento.",
    latitude: -28.9421,
    longitude: -49.4908,
    mediaKind: null,
    mediaMimeType: null,
    mediaUrl: null,
    publicName: null,
    displayName: "Anônimo",
    publishedAt: "2026-03-19T15:10:00.000Z",
    approximateLocationLabel: "Entorno do campus de Araranguá",
  },
];

const mockComplaints = [...initialMockComplaints];

export function listMockPublicComplaintsByCampus(campusId: CampusId) {
  return mockComplaints.filter((complaint) => complaint.campusId === campusId);
}

export function getMockApprovedComplaintCount() {
  return mockComplaints.length;
}

export async function createMockComplaint(input: MockPendingComplaintInput) {
  let mediaUrl: string | null = null;
  let mediaKind: MediaKind | null = null;
  let mediaMimeType: string | null = null;

  if (input.media) {
    const storedUpload = await savePendingUpload(input.media);
    const publicRelativePath = getPublicDestinationPath(storedUpload.relativePath);

    await moveUploadToPublic(storedUpload.relativePath, publicRelativePath);

    mediaUrl = createPublicMediaUrl(publicRelativePath);
    mediaKind = storedUpload.mediaKind;
    mediaMimeType = storedUpload.mimeType;
  }

  const publishedAt = new Date().toISOString();
  const complaint: PublicComplaint = {
    id: `mock_${randomUUID()}`,
    campusId: input.campusId,
    description: input.description,
    latitude: input.latitude,
    longitude: input.longitude,
    mediaKind,
    mediaMimeType,
    mediaUrl,
    publicName: input.publicName,
    displayName: input.publicName ?? "Anônimo",
    publishedAt,
    approximateLocationLabel: `Entorno do campus de ${campusById[input.campusId].nome}`,
  };

  mockComplaints.unshift(complaint);

  return complaint;
}
