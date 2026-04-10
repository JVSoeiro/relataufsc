import { env } from "@/lib/env";

export function renderModerationResultPage({
  title,
  message,
  accent,
}: {
  title: string;
  message: string;
  accent: string;
}) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex,nofollow" />
    <title>${title}</title>
    <style>
      :root { color-scheme: light; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        background:
          radial-gradient(circle at top left, rgba(15, 118, 110, 0.14), transparent 32%),
          linear-gradient(180deg, #edf4f2 0%, #f8fafc 100%);
        font-family: Manrope, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        color: #0f172a;
      }
      .card {
        width: min(28rem, 100%);
        border-radius: 28px;
        border: 1px solid rgba(255, 255, 255, 0.8);
        background: rgba(255, 255, 255, 0.94);
        padding: 28px;
        box-shadow: 0 28px 80px rgba(15, 23, 42, 0.14);
      }
      .eyebrow {
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.22em;
        color: #64748b;
      }
      h1 {
        margin: 14px 0 10px;
        font-size: 2rem;
        letter-spacing: -0.04em;
      }
      p {
        margin: 0;
        color: #475569;
        line-height: 1.7;
      }
      .pill {
        margin-top: 18px;
        display: inline-flex;
        align-items: center;
        gap: 10px;
        border-radius: 999px;
        padding: 10px 14px;
        background: ${accent};
        color: white;
        font-weight: 600;
      }
      .dot {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.9);
      }
    </style>
  </head>
  <body>
    <main class="card">
      <div class="eyebrow">${env.appName}</div>
      <h1>${title}</h1>
      <p>${message}</p>
      <div class="pill"><span class="dot"></span>Fluxo seguro de moderação</div>
    </main>
  </body>
</html>`;
}

export function createModerationHtmlResponse(
  page: Parameters<typeof renderModerationResultPage>[0],
  status = 200,
) {
  return new Response(renderModerationResultPage(page), {
    status,
    headers: {
      "cache-control": "no-store, private",
      "content-type": "text/html; charset=utf-8",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
