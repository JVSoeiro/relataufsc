# UFSC Relata!

O UFSC Relata! é um MVP em produção para relatar problemas visíveis de infraestrutura nos campi da UFSC por meio de um mapa público. A aplicação roda como um único container Next.js, com MySQL/MariaDB, uploads persistidos em disco, moderação por Telegram e e-mail transacional opcional via Brevo.

## Escopo

- Sem login
- Sem painel público de administração
- Sem contas de usuário
- Sem Redis
- Sem divisão entre frontend e backend em deploys separados
- Apenas relatos aprovados aparecem publicamente
- Relatos pendentes e rejeitados nunca chegam às APIs públicas

## Modelo de persistência

O schema MySQL/MariaDB é propositalmente mínimo e orientado à privacidade.

Tabela principal: `complaints`

- `id`
- `campus_id`
- `description`
- `latitude`
- `longitude`
- `media_path`
- `media_kind`
- `media_mime_type`
- `media_size_bytes`
- `public_name`
- `status`
- `created_at`
- `moderated_at`
- `approved_at`
- `submitter_email`

Regra de privacidade:

- `submitter_email` só existe enquanto o relato estiver pendente.
- Na aprovação ou rejeição, o fluxo de moderação zera `submitter_email` imediatamente no banco antes de encerrar o processamento.

Tabela mínima anti-spam: `submission_rate_limits`

- `key_hash`
- `created_at`
- `expires_at`

Essa tabela guarda apenas chaves temporárias com hash. Não há histórico bruto de IP nem fingerprinting invasivo.

Referências de código:

- Schema: `src/db/schema.ts`
- Migração de endurecimento: `drizzle/0001_harden_mvp_persistence.sql`
- Repositório de relatos: `src/db/repositories/complaints-repository.ts`
- Repositório de rate limit: `src/db/repositories/submission-rate-limits-repository.ts`

## Modelo de segurança da moderação

O Telegram é a porta de entrada da moderação. O site público não possui poderes administrativos.

Fluxo:

1. O envio público entra em `POST /api/report`
2. O servidor valida o payload e salva o relato como `pending`
3. O e-mail opcional é mantido apenas enquanto o relato estiver pendente
4. O bot do Telegram envia uma mensagem de moderação com links assinados e expiráveis
5. O link do Telegram abre uma página de confirmação em `/moderate/[action]`
6. A mudança real de estado acontece somente em:
   - `POST /api/moderate/approve`
   - `POST /api/moderate/reject`
7. A aprovação torna o relato público e tenta enviar o e-mail de aprovação via Brevo, se existir e-mail
8. A rejeição mantém o relato fora da pipeline pública
9. Em ambos os casos, `submitter_email` é removido imediatamente durante a moderação

Propriedades de segurança:

- `TELEGRAM_BOT_TOKEN` e `TELEGRAM_CHAT_ID` ficam apenas no servidor
- Tokens de moderação são assinados com HMAC e expiram
- Os tokens são específicos por ação: `approve`, `reject`, `preview`
- Links inválidos, expirados ou reutilizados falham de forma segura
- Ações repetidas são bloqueadas pela regra de transição do estado `pending`
- Mídia pendente só é servida por rota protegida com token de preview válido
- APIs públicas nunca retornam `submitter_email`, tokens de moderação, caminhos internos de storage ou dados do Telegram

Referências de código:

- Tokens: `src/services/tokens.ts`
- Moderação: `src/services/moderation.ts`
- Telegram: `src/services/telegram.ts`
- Preview protegido: `src/app/api/moderate/media/[id]/route.ts`
- Página de confirmação: `src/app/moderate/[action]/page.tsx`

## Contrato da API pública

Rotas públicas:

- `GET /api/public/complaints?campusId=...`
- `GET /api/public/stats`
- `POST /api/report`

Payload público mínimo:

- `id`
- `campusId`
- `description`
- `latitude`
- `longitude`
- `mediaUrl`
- `mediaKind`
- `mediaMimeType`
- `publicName`
- `displayName`
- `publishedAt`
- `approximateLocationLabel`

Nunca retornado publicamente:

- `submitter_email`
- relatos pendentes ou rejeitados
- tokens de moderação
- metadados do Telegram
- caminhos internos de storage

## Comportamento do e-mail

O Brevo é usado apenas para e-mail transacional de aprovação.

Regra pró-privacidade:

- Se houver e-mail, o sistema tenta enviar a mensagem após a decisão de moderação.
- O campo `submitter_email` já foi zerado no banco antes do fim dessa tentativa.
- Se o envio falhar, o e-mail continua não sendo retido.

Referência:

- `src/services/email.ts`

## Modelo de arquivos

A raiz persistente foi desenhada para `/app/data`.

Estrutura recomendada:

- `/app/data/uploads/pending/...`
- `/app/data/uploads/public/...`

Política:

- Uploads novos entram em `pending/`
- Na aprovação, os arquivos vão para `public/`
- Na rejeição, os arquivos pendentes são apagados
- A mídia pública é servida somente por `/media/[...path]`
- A mídia pendente nunca é enumerável publicamente

Referência:

- `src/services/storage.ts`

## Variáveis de ambiente

Copie `.env.example`:

```bash
cp .env.example .env
```

Principais variáveis:

- `APP_URL`
- `APP_NAME`
- `DATABASE_URL`
- `DATA_DIR`
- `UPLOAD_PENDING_DIR`
- `UPLOAD_PUBLIC_DIR`
- `MAX_UPLOAD_SIZE_MB`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `MODERATION_SECRET`
- `MODERATION_TOKEN_TTL_MINUTES`
- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL`
- `BREVO_SENDER_NAME`
- `SUBMISSION_RATE_LIMIT_WINDOW_SECONDS`
- `SUBMISSION_RATE_LIMIT_MAX_ATTEMPTS`

Notas:

- `DATABASE_URL` é obrigatória em runtime e deve apontar para o banco MySQL/MariaDB do Dokploy.
- Se o nome do banco tiver espaços, use URL encoding, por exemplo `%20`.

## Desenvolvimento local

Instale as dependências:

```bash
npm install
```

Inicialize diretórios locais, migrações e seed demo:

```bash
npm run db:bootstrap
```

Suba a aplicação:

```bash
npm run dev
```

Comandos úteis:

```bash
npm run db:migrate
npm run db:seed
npm run test
npm run typecheck
npm run lint
npm run build
```

## Docker

Build:

```bash
docker build -t ufsc-relata .
```

Execução:

```bash
docker run --rm -p 5000:5000 \
  --env-file .env \
  -v "$(pwd)/data:/app/data" \
  ufsc-relata
```

Os defaults do container estão alinhados com:

- `DATA_DIR=/app/data`
- `UPLOAD_PENDING_DIR=/app/data/uploads/pending`
- `UPLOAD_PUBLIC_DIR=/app/data/uploads/public`
- `PORT=5000`

O container roda com o usuário não-root `node`. O volume montado precisa ser gravável por esse usuário, ou por uma configuração de permissões compatível no host.

## Dokploy / VPS

Configuração recomendada no Dokploy:

1. Faça o deploy a partir do `Dockerfile` incluído no projeto
2. Configure as variáveis de ambiente com base em `.env.example`
3. Monte um volume persistente em `/app/data` para uploads
4. Exponha a porta `5000`
5. Defina `APP_URL` com a URL HTTPS final do site
6. Configure `DATABASE_URL` com a URL interna do banco do Dokploy
7. Garanta que o volume persistente seja gravável pelo usuário do container

Comportamento operacional:

- No primeiro boot, a app cria `/app/data/uploads/pending` e `/app/data/uploads/public` caso não existam
- As migrações rodam automaticamente no bootstrap de inicialização
- O seed demo pode ser desativado com `SEED_DEMO_DATA=false`

## Como a moderação funciona

- O visitante envia um relato pelo mapa
- O backend salva o relato como pendente
- O Telegram recebe uma mensagem com descrição, campus, localização, nome público opcional, e-mail opcional e preview protegido de mídia, quando existir
- Os botões de aprovação e rejeição usam links assinados e expiráveis
- Ao aprovar:
  - o relato fica público
  - o e-mail de aprovação é tentado se existir
  - o e-mail é removido da persistência em seguida
- Ao rejeitar:
  - o relato segue fora da área pública
  - o e-mail é removido imediatamente

## Checklist de segurança

- Relatos pendentes não aparecem em `GET /api/public/complaints`
- APIs públicas nunca retornam `submitter_email`
- Links de moderação expiram e são assinados
- Tokens inválidos falham com segurança
- Ações repetidas de aprovação ou rejeição falham com segurança
- Segredos do Telegram permanecem apenas no servidor
- Mídia pendente é protegida por rota assinada de preview
- Mídia aprovada só fica pública após a moderação movê-la para `public/`
- O e-mail de aprovação só é tentado em aprovações
- `submitter_email` é removido da persistência após a moderação

## Testes

Os testes leves cobrem os pontos mais importantes das primitivas de segurança:

- `src/services/tokens.test.ts`
- `src/services/storage.test.ts`
