import { z } from "zod";

import {
  acceptedUploadMimeTypes,
  complaintDescriptionLimit,
  honeypotFieldName,
  isCampusId,
  publicNameLimit,
} from "@/lib/constants";

const emptyStringToNull = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? null : value));

export const publicComplaintsQuerySchema = z.object({
  campusId: z.string().refine(isCampusId, "Campus inválido."),
});

export const reportSubmissionSchema = z.object({
  description: z
    .string()
    .trim()
    .min(
      complaintDescriptionLimit.min,
      `A descrição deve ter pelo menos ${complaintDescriptionLimit.min} caracteres.`,
    )
    .max(
      complaintDescriptionLimit.max,
      `A descrição deve ter no máximo ${complaintDescriptionLimit.max} caracteres.`,
    ),
  campusId: z.string().refine(isCampusId, "Campus inválido."),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  publicName: emptyStringToNull
    .nullable()
    .transform((value) => value?.slice(0, publicNameLimit) ?? null),
  email: z
    .string()
    .trim()
    .transform((value) => (value.length === 0 ? null : value))
    .nullable()
    .refine((value) => value === null || z.email().safeParse(value).success, {
      message: "O e-mail informado é inválido.",
    }),
  [honeypotFieldName]: z.string().max(0).optional().default(""),
});

export function isAcceptedUploadMimeType(value: string) {
  return acceptedUploadMimeTypes.includes(
    value as (typeof acceptedUploadMimeTypes)[number],
  );
}
