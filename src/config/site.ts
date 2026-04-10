import { formatCount } from "@/lib/format";

export const siteConfig = {
  name: "UFSC Relata!",
  description:
    "Mapa público para relatar problemas visíveis de infraestrutura nos campi da UFSC.",
  defaultCampusId: "florianopolis",
  reportButtonLabel: "Relatar problema",
  metricLabel: (count: number) => `${formatCount(count)} denúncias públicas!`,
  mobileCampusLabel: "Campus",
  reportPrivacyNote:
    "Nome é opcional. E-mail é opcional e só é usado se você quiser saber se seu relato foi aprovado. Essa revisão é rápida e existe apenas para evitar spam e conteúdo ilegal.",
} as const;
