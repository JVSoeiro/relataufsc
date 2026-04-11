import type { ResultSetHeader } from "mysql2/promise";

import { pool } from "@/db";

const demoComplaints = [
  {
    id: "demo-floripa-sidewalk",
    description:
      "Calçada quebrada próxima a uma rota de circulação intensa. O piso está irregular e dificulta a passagem com segurança, principalmente em dias de chuva.",
    campusId: "florianopolis",
    latitude: -27.6021,
    longitude: -48.5182,
    publicName: "Pessoa da comunidade UFSC",
    createdAt: "2026-03-02T14:30:00.000Z",
    approvedAt: "2026-03-03T10:00:00.000Z",
  },
  {
    id: "demo-floripa-lighting",
    description:
      "A iluminação fica muito fraca neste trajeto à noite, deixando a área insegura e dificultando a circulação.",
    campusId: "florianopolis",
    latitude: -27.6072,
    longitude: -48.5241,
    publicName: null,
    createdAt: "2026-03-09T18:10:00.000Z",
    approvedAt: "2026-03-10T08:15:00.000Z",
  },
  {
    id: "demo-floripa-crosswalk-drainage",
    description:
      "A faixa de travessia acumula água e forma poças grandes após chuva, atrapalhando a passagem de pedestres e bicicletas.",
    campusId: "florianopolis",
    latitude: -27.6049,
    longitude: -48.5219,
    publicName: "Relato demonstrativo",
    createdAt: "2026-03-11T10:15:00.000Z",
    approvedAt: "2026-03-11T13:05:00.000Z",
  },
  {
    id: "demo-floripa-sidewalk-light-pole",
    description:
      "O poste de iluminação ao lado da calçada está apagado, deixando o trecho escuro no começo da noite e reduzindo a sensação de segurança.",
    campusId: "florianopolis",
    latitude: -27.6088,
    longitude: -48.5168,
    publicName: null,
    createdAt: "2026-03-12T19:40:00.000Z",
    approvedAt: "2026-03-12T21:10:00.000Z",
  },
  {
    id: "demo-joinville-accessibility",
    description:
      "A rampa de acessibilidade apresenta desgaste visível e um desnível brusco que precisa de reparo.",
    campusId: "joinville",
    latitude: -26.24065,
    longitude: -48.8821,
    publicName: "Colaborador anônimo",
    createdAt: "2026-02-22T11:45:00.000Z",
    approvedAt: "2026-02-22T17:20:00.000Z",
  },
  {
    id: "demo-blumenau-leak",
    description:
      "Há um vazamento de água próximo ao acesso de salas de aula. O piso fica escorregadio e precisa de manutenção rápida.",
    campusId: "blumenau",
    latitude: -26.8774,
    longitude: -49.1039,
    publicName: null,
    createdAt: "2026-03-15T09:25:00.000Z",
    approvedAt: "2026-03-15T12:40:00.000Z",
  },
  {
    id: "demo-curitibanos-furniture",
    description:
      "O banco de uma área externa de convivência está danificado e parcialmente instável para uso diário.",
    campusId: "curitibanos",
    latitude: -27.2851,
    longitude: -50.5331,
    publicName: "Observador do campus",
    createdAt: "2026-02-28T16:50:00.000Z",
    approvedAt: "2026-03-01T09:05:00.000Z",
  },
  {
    id: "demo-ararangua-wires",
    description:
      "Há fiação exposta ao lado de um ponto de circulação externa. A área precisa de inspeção e isolamento.",
    campusId: "ararangua",
    latitude: -28.9421,
    longitude: -49.4908,
    publicName: null,
    createdAt: "2026-03-19T13:35:00.000Z",
    approvedAt: "2026-03-19T15:10:00.000Z",
  },
] as const;

export async function seedDemoComplaints() {
  for (const demoComplaint of demoComplaints) {
    await pool.execute<ResultSetHeader>(
      `
        INSERT IGNORE INTO complaints (
          id,
          description,
          campus_id,
          latitude,
          longitude,
          public_name,
          status,
          created_at,
          approved_at,
          moderated_at,
          submitter_email
        ) VALUES (?, ?, ?, ?, ?, ?, 'approved', ?, ?, ?, NULL)
      `,
      [
        demoComplaint.id,
        demoComplaint.description,
        demoComplaint.campusId,
        demoComplaint.latitude,
        demoComplaint.longitude,
        demoComplaint.publicName,
        demoComplaint.createdAt,
        demoComplaint.approvedAt,
        demoComplaint.approvedAt,
      ],
    );
  }
}

export async function clearDemoComplaints() {
  await pool.execute<ResultSetHeader>(
    `
      DELETE FROM complaints
      WHERE id LIKE 'demo-%' OR id LIKE 'mock\\_%'
    `,
  );
}
