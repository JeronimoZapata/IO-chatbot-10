# IO-chatbot-10

Chatbot agéntico que actúa como **tutor de modelos de inventario probabilísticos**. Guía al
usuario paso a paso para plantear, resolver e interpretar ejercicios de los siguientes modelos:

- **Revisión continua (Q, R)** — cuánto pedir (`Q`) y cuándo pedir (`R`), stock de seguridad y
  nivel de servicio.
- **Revisión por períodos (T, S)** — nivel objetivo de inventario y cantidad a pedir en cada
  revisión.
- **Un solo período** — modelo Newsvendor (sin costo de preparación) y política s-S (con costo de
  preparación).

El conocimiento del dominio (fórmulas, flujo conversacional y reglas) vive en
[`model-context.md`](model-context.md), que se inyecta como base de conocimiento en el system prompt
del agente. El razonamiento se delega al LLM.

---

## Arquitectura

Monorepo gestionado con **pnpm workspaces** ([`pnpm-workspace.yaml`](pnpm-workspace.yaml)):

| Paquete | Stack | Descripción |
|---|---|---|
| [`backend/`](backend/) | NestJS 11 + LangChain / LangGraph | API REST. Endpoints `POST /chat` y `GET /health`. |
| [`frontend/`](frontend/) | Next.js 15 + React 19 | UI de chat con render de Markdown + KaTeX e historial en `localStorage`. |

**Flujo del backend:**

1. [`chat.controller.ts`](backend/src/chat/chat.controller.ts) recibe `POST /chat`.
2. [`agent.service.ts`](backend/src/chat/agent/agent.service.ts) arma el system prompt: prompt base
   + contenido de [`model-context.md`](model-context.md) + historial de la conversación.
3. [`agent.graph.ts`](backend/src/chat/agent/agent.graph.ts) ejecuta un grafo de LangGraph de un solo
   nodo que invoca al modelo y devuelve la respuesta.
4. [`model-provider.service.ts`](backend/src/chat/agent/model-provider.service.ts) instancia el modelo
   según las variables de entorno.

> **Nota sobre el proveedor de IA:** el backend soporta **Google Gemini** y **OpenAI** mediante
> `AI_PROVIDER=gemini` o `AI_PROVIDER=openai`. Para Gemini se requiere `GOOGLE_API_KEY`; para OpenAI,
> `OPENAI_API_KEY`.

---

## Requisitos

- [Node.js](https://nodejs.org/) (versión LTS reciente).
- [pnpm](https://pnpm.io/installation).
- Una **API key propia de Google Gemini** o de **OpenAI**, según el proveedor elegido.

---

## Configuración de la API key

Cada persona usa su **propia** API key. Pasos:

1. Obtené una API key en **Google AI Studio**: https://aistudio.google.com/app/apikey
   (iniciá sesión con tu cuenta de Google → *Create API key* → copiá la clave).
2. Copiá la plantilla de entorno:

   ```bash
   cp backend/.env.example backend/.env
   ```

3. Editá `backend/.env` y pegá **tu** clave en `GOOGLE_API_KEY`. El archivo `.env` está ignorado por
   git, así que tu clave no se sube al repositorio.

Ejemplo de `backend/.env`:

```env
AI_PROVIDER=gemini
AI_MODEL=gemini-2.5-flash
AI_TEMPERATURE=0
GOOGLE_API_KEY=tu_api_key_de_google_aqui
OPENAI_API_KEY=
PORT=3001
```

Para usar OpenAI, configurá:

```env
AI_PROVIDER=openai
AI_MODEL=gpt-4o-mini
OPENAI_API_KEY=tu_api_key_de_openai_aqui
GOOGLE_API_KEY=
PORT=3001
```

### Variables de entorno

| Variable | Descripción | Ejemplo |
|---|---|---|
| `AI_PROVIDER` | Proveedor de IA (`gemini` u `openai`). | `gemini` |
| `AI_MODEL` | Modelo a utilizar. | `gemini-2.5-flash` |
| `AI_TEMPERATURE` | Temperatura del modelo. Recomendado `0` (determinista) por tratarse de tareas de cálculo. | `0` |
| `GOOGLE_API_KEY` | API key de Google Gemini. Requerida con `AI_PROVIDER=gemini`. | `AIza...` |
| `OPENAI_API_KEY` | API key de OpenAI. Requerida con `AI_PROVIDER=openai`. | `sk-...` |
| `PORT` | Puerto del backend. | `3001` |

---

## Instalación y ejecución (desarrollo)

```bash
# 1. Instalar dependencias (desde la raíz del repo)
pnpm install

# 2. Configurar backend/.env con tu API key (ver sección anterior)

# 3. Levantar el backend (puerto 3001)
pnpm --filter backend start:dev

# 4. En otra terminal, levantar el frontend (Next dev)
pnpm --filter frontend dev
```

El frontend apunta por defecto a `http://localhost:3001`. Se puede sobreescribir con la variable
`NEXT_PUBLIC_API_URL` (ver [`frontend/app/chat/page.tsx`](frontend/app/chat/page.tsx)).

### Con Docker

```bash
docker compose up
```

Levanta el backend en el puerto `3001` y monta [`model-context.md`](model-context.md) como solo
lectura ([`docker-compose.yml`](docker-compose.yml)). Requiere `backend/.env` configurado.

---

## API

### `POST /chat`

Request:

```json
{
  "messages": [
    { "role": "user", "content": "¿Cuál es mi punto de reorden si μ=24, σ=5 y quiero 95% de servicio?" }
  ]
}
```

Cada mensaje tiene `role` (`system` | `user` | `assistant`) y `content` (string no vacío). La
validación está en [`chat-request.dto.ts`](backend/src/chat/dto/chat-request.dto.ts).

Response:

```json
{ "reply": "El punto de reorden es R = μ + z·σ = 24 + 1,645·5 ≈ 32,2 unidades..." }
```

### `GET /health`

```json
{ "status": "ok" }
```

---

## Despliegue

Configurado para **Vercel** ([`vercel.json`](vercel.json)): el frontend se sirve como app de Next y
el backend se expone vía `backend/src/vercel-handler.ts` bajo la ruta `/_/backend/*`.

---

## Estructura del proyecto

```
.
├── backend/                # API NestJS + agente LangGraph
│   └── src/
│       ├── chat/           # controller, service, DTO y agente
│       └── health/         # health check
├── frontend/               # UI Next.js (App Router)
│   └── app/chat/           # página de chat
├── model-context.md        # base de conocimiento del dominio (inyectada al prompt)
├── docker-compose.yml
├── vercel.json
└── pnpm-workspace.yaml
```

---

## Scripts útiles

| Comando | Acción |
|---|---|
| `pnpm --filter backend start:dev` | Backend en modo watch. |
| `pnpm --filter backend build` | Build del backend. |
| `pnpm --filter backend test` | Tests unitarios (Jest). |
| `pnpm --filter backend test:e2e` | Tests e2e. |
| `pnpm --filter backend lint` | Lint + fix (ESLint). |
| `pnpm --filter frontend dev` | Frontend en modo desarrollo. |
| `pnpm --filter frontend build` | Build del frontend. |
