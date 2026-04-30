# Backend - ChatBot de Modelos de Simulacion

Backend NestJS con un agente minimo basado en LangGraph.js/LangChain y seleccion de proveedor por variables de entorno.

## Requisitos

- Node.js 18+
- npm

## Instalacion

```bash
npm install
```

## Configuracion de entorno

1. Copia el archivo de ejemplo:

```bash
cp .env.example .env
```

2. Ajusta las variables:

- `AI_PROVIDER`: proveedor de IA (`openai` o `gemini`, requerido).
- `AI_MODEL`: modelo a usar (por defecto `gpt-4o-mini`).
- `AI_TEMPERATURE`: temperatura del modelo (por defecto `0.2`).
- `OPENAI_API_KEY`: clave de OpenAI (requerida si `AI_PROVIDER=openai`).
- `GOOGLE_API_KEY`: clave de Google (requerida si `AI_PROVIDER=gemini`).
- `PORT`: puerto del backend (por defecto `3001`).

## Ejecutar en desarrollo

```bash
npm run start:dev
```

## Probar el health check

```bash
curl http://localhost:3001/health
```

Respuesta esperada:

```json
{
  "status": "ok"
}
```

## Probar el endpoint de chat

```bash
curl -X POST http://localhost:3001/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Explicame que es una simulacion de Monte Carlo con un ejemplo simple."
      }
    ]
  }'
```

Respuesta esperada:

```json
{
  "reply": "Respuesta generada por la IA"
}
```

## Scripts utiles

- `npm run start:dev`
- `npm run build`
- `npm run lint`
- `npm run test`
