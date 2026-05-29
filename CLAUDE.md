# CLAUDE.md

Guía para agentes que trabajen en este repositorio.

## Qué es

Monorepo **pnpm** con un chatbot tutor de **modelos de inventario probabilísticos**:

- `backend/` — API NestJS 11 con un agente de LangChain/LangGraph.
- `frontend/` — UI de chat en Next.js 16 / React 19 (App Router).

## Regla clave: el comportamiento del bot es prompt-driven

La "lógica" del dominio (fórmulas, flujo conversacional, qué datos pedir, cómo responder) **no está
en código**: vive en [`model-context.md`](model-context.md), que se inyecta como base de conocimiento
en el system prompt.

- Para cambiar **cómo responde el agente**, editá `model-context.md`, **no** `agent.graph.ts`.
- [`agent.graph.ts`](backend/src/chat/agent/agent.graph.ts) es un grafo de un solo nodo que solo
  invoca al modelo; no contiene lógica de cálculo ni validaciones del dominio.
- [`agent.service.ts`](backend/src/chat/agent/agent.service.ts) compone el system prompt (prompt base
  + `model-context.md` + historial). El archivo se resuelve por `process.cwd()` o por la variable
  `KNOWLEDGE_BASE_PATH`.

## Comandos

```bash
pnpm install                          # instalar dependencias (desde la raíz)

pnpm --filter backend start:dev       # backend en watch (puerto 3001)
pnpm --filter backend build           # build
pnpm --filter backend test            # tests unitarios (Jest)
pnpm --filter backend test:e2e        # tests e2e
pnpm --filter backend lint            # ESLint + fix
pnpm --filter backend format          # Prettier

pnpm --filter frontend dev            # frontend en desarrollo
pnpm --filter frontend build          # build
pnpm --filter frontend lint           # ESLint
```

## Convenciones

- **TypeScript** en todo el repo.
- **Backend**: NestJS modular (módulos `chat` y `health`). Los DTOs se validan con `class-validator`
  vía `ValidationPipe` global (`whitelist` + `forbidNonWhitelisted`), ver
  [`main.ts`](backend/src/main.ts) y [`chat-request.dto.ts`](backend/src/chat/dto/chat-request.dto.ts).
  Configuración por entorno con `@nestjs/config` (`ConfigModule` global).
- **Frontend**: App Router de Next.js; la página de chat es un componente client
  ([`frontend/app/chat/page.tsx`](frontend/app/chat/page.tsx)) que renderiza Markdown + KaTeX y guarda
  el historial en `localStorage`.

## Variables de entorno

Definidas en [`backend/.env.example`](backend/.env.example): `AI_PROVIDER`, `AI_MODEL`,
`AI_TEMPERATURE`, `GOOGLE_API_KEY`, `OPENAI_API_KEY`, `PORT`.

- El provider operativo es **Gemini** (requiere `GOOGLE_API_KEY`). En
  [`model-provider.service.ts`](backend/src/chat/agent/model-provider.service.ts) el caso `openai`
  está comentado y hace *fall-through* al caso `gemini`; OpenAI y otros proveedores están como `TODO`.
- El frontend usa `NEXT_PUBLIC_API_URL` (por defecto `http://localhost:3001` en dev).

## Gotchas

- `model-context.md` se monta como **solo lectura** en Docker ([`docker-compose.yml`](docker-compose.yml)).
- `knowledge-base.md` **fue eliminado**: no se cargaba en el runtime. No volver a usarlo; la única
  base de conocimiento activa es `model-context.md`.
- No introducir lógica de cálculo del dominio en código sin acordarlo: el diseño actual es
  deliberadamente prompt-driven.
