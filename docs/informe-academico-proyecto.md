# Informe académico del proyecto

## Chatbot agéntico para modelos de inventario probabilísticos

**Asignatura:** Investigación Operativa  
**Proyecto:** Asistente inteligente de modelos de inventario probabilístico  
**Grupo:** Big Brain - Grupo 10  
**Institución:** Universidad Tecnológica Nacional - Facultad Regional Resistencia  
**Ciclo lectivo:** 2026

## 1. Resumen

El proyecto consiste en el desarrollo de un chatbot agéntico orientado a asistir en la resolución, interpretación y explicación de modelos de inventario probabilísticos. La propuesta combina una interfaz web de conversación con un backend basado en NestJS, LangChain y LangGraph, integrando un modelo de lenguaje como motor de razonamiento guiado.

El sistema fue diseñado para acompañar al usuario en la identificación del tipo de problema, la solicitud de datos necesarios, la validación conceptual de parámetros y la generación de respuestas pedagógicas. El dominio principal corresponde a modelos de revisión continua `(Q, R)`, revisión periódica `(T, S)` y modelo de un solo período, incluyendo el enfoque Newsvendor y la política `s-S`.

## 2. Introducción

Los modelos de inventario probabilísticos permiten tomar decisiones bajo incertidumbre cuando la demanda, los tiempos de reposición o los faltantes no pueden describirse de manera determinística. En este contexto, herramientas interactivas basadas en inteligencia artificial pueden facilitar el aprendizaje y la aplicación práctica de conceptos de Investigación Operativa.

El objetivo del proyecto es construir un asistente conversacional capaz de guiar al usuario en problemas de inventario, manteniendo una respuesta clara, ordenada y ajustada al dominio. La solución no se limita a exponer fórmulas, sino que busca orientar el razonamiento: identifica el modelo aplicable, solicita datos faltantes, explica variables, desarrolla cálculos y comunica conclusiones útiles para la toma de decisiones.

## 3. Objetivos

### 3.1. Objetivo general

Desarrollar un chatbot académico capaz de asistir en la resolución de modelos de inventario probabilísticos mediante una experiencia conversacional accesible, guiada y técnicamente fundamentada.

### 3.2. Objetivos específicos

- Implementar una interfaz web para conversar con el asistente y conservar historial local.
- Construir una API backend que reciba mensajes, prepare el contexto del dominio e invoque un modelo de lenguaje.
- Incorporar una base de conocimiento propia con reglas, fórmulas, alcances y flujos conversacionales del dominio.
- Permitir el uso de proveedores de inteligencia artificial configurables mediante variables de entorno.
- Presentar respuestas con formato matemático mediante Markdown y KaTeX.
- Facilitar la exportación de conversaciones para uso académico o documental.

## 4. Alcance funcional

El asistente se enfoca en modelos de inventario probabilísticos. Su alcance incluye:

- Modelo de revisión continua `(Q, R)`.
- Modelo de revisión por períodos `(T, S)`.
- Modelo de un solo período o Newsvendor.
- Política `s-S` cuando existe costo de preparación.
- Cálculo e interpretación de variables como `Q`, `R`, stock de seguridad, nivel de servicio, `s`, `S`, `y*` y cantidad a pedir.
- Detección de datos faltantes y solicitud progresiva de información.
- Explicación conceptual de fórmulas, parámetros y resultados.

El sistema restringe su comportamiento al dominio de inventarios probabilísticos. Esta decisión mejora la coherencia académica del asistente y reduce respuestas fuera de contexto.

## 5. Arquitectura del sistema

El proyecto está organizado como un monorepo con dos componentes principales:

- **Backend:** API REST desarrollada con NestJS. Expone los endpoints `POST /chat` y `GET /health`.
- **Frontend:** aplicación web desarrollada con Next.js y React. Presenta la interfaz conversacional, historial de chats, sugerencias iniciales, render matemático y exportación.

El flujo general del sistema es el siguiente:

1. El usuario ingresa una consulta en la interfaz web.
2. El frontend envía el historial conversacional al endpoint `POST /chat`.
3. El backend valida la solicitud y la deriva al servicio del agente.
4. El agente compone un prompt de sistema con la base de conocimiento contenida en `model-context.md`.
5. LangGraph ejecuta el nodo del agente, que invoca el modelo de lenguaje configurado.
6. La respuesta se devuelve al frontend y se renderiza con soporte para Markdown y expresiones matemáticas.

## 6. Tecnologías utilizadas

El backend utiliza NestJS como framework principal, LangChain para abstraer la interacción con modelos de lenguaje y LangGraph para estructurar el flujo del agente. La configuración se gestiona mediante variables de entorno, lo que permite seleccionar proveedor, modelo, temperatura y claves de API.

El frontend utiliza Next.js con React, `react-markdown`, `remark-math`, `remark-gfm`, `rehype-katex` y KaTeX. Estas herramientas permiten mostrar explicaciones, tablas, listas y fórmulas matemáticas en una experiencia de chat más adecuada para contenido académico.

El proyecto también contempla despliegue en Vercel, con ruteo hacia el backend mediante la ruta `/_/backend/*`, y una alternativa de ejecución local con Docker Compose.

## 7. Base de conocimiento del agente

El archivo `model-context.md` concentra el conocimiento específico del dominio. Allí se definen:

- Rol del agente.
- Objetivo pedagógico.
- Alcance permitido.
- Flujo conversacional inicial.
- Variables y parámetros de los modelos.
- Datos mínimos requeridos para cada cálculo.
- Reglas para manejo de datos faltantes.
- Criterios para interpretar resultados.

Esta separación entre código y conocimiento permite mantener el comportamiento del agente de forma más controlada. Además, facilita futuras ampliaciones sin modificar directamente la lógica del backend.

## 8. Mejoras implementadas

Durante la revisión técnica se detectó que el proyecto declaraba dependencia con OpenAI, pero el proveedor `openai` no estaba operativo en el servicio de modelos. El bloque correspondiente estaba comentado y el flujo podía continuar hacia Gemini, generando una inconsistencia entre configuración, documentación y comportamiento real.

Se implementaron las siguientes mejoras:

- Incorporación de una visualización automática de la campana de Gauss para respuestas que incluyan `μ`, `σ` y `R`, mostrando el punto de reorden sobre la distribución de demanda durante el lead time.
- Ajuste de la base de conocimiento para que el agente explicite los valores necesarios para graficar el punto de reorden sin inventar datos faltantes.
- Activación real del proveedor OpenAI mediante `ChatOpenAI`.
- Validación explícita de `OPENAI_API_KEY` cuando `AI_PROVIDER=openai`.
- Conservación del soporte Gemini mediante `ChatGoogleGenerativeAI`.
- Inclusión de `GOOGLE_API_KEY` dentro del manejo de errores de configuración.
- Agregado de pruebas unitarias para proveedor Gemini, proveedor OpenAI, claves faltantes y proveedor no soportado.
- Actualización de `README.md` y `backend/.env.example` para reflejar los proveedores actualmente soportados.

Estas mejoras corrigen una debilidad funcional relevante: el sistema ahora permite seleccionar el proveedor de IA de manera efectiva y verificable.

## 9. Validación y pruebas

Se agregaron pruebas unitarias enfocadas en `ModelProviderService`, componente responsable de construir el modelo de chat según la configuración. Los casos contemplan:

- Creación de modelo Gemini con configuración válida.
- Creación de modelo OpenAI con configuración válida.
- Error cuando falta `GOOGLE_API_KEY`.
- Error cuando falta `OPENAI_API_KEY`.
- Error cuando se configura un proveedor no soportado.

Este conjunto de pruebas reduce el riesgo de regresiones en una zona crítica del sistema, ya que la selección del proveedor afecta directamente la disponibilidad del chatbot.

## 10. Despliegue y ejecución

Para ejecutar el proyecto en desarrollo se requiere instalar dependencias, configurar el archivo `backend/.env` y levantar backend y frontend en procesos separados. El backend utiliza por defecto el puerto `3001`, mientras que el frontend se comunica con esa API en entorno local.

La configuración principal se realiza mediante:

- `AI_PROVIDER`
- `AI_MODEL`
- `AI_TEMPERATURE`
- `GOOGLE_API_KEY`
- `OPENAI_API_KEY`
- `PORT`

Esta estrategia favorece la portabilidad y permite alternar entre proveedores sin modificar el código fuente.

## 11. Limitaciones actuales

Aunque el proyecto presenta una base funcional sólida, todavía existen oportunidades de mejora:

- Incorporar herramientas matemáticas determinísticas para reducir dependencia exclusiva del razonamiento del modelo.
- Agregar validaciones automáticas de unidades, rangos y coherencia numérica.
- Implementar nodos especializados dentro de LangGraph para clasificar modelo, calcular, validar e interpretar.
- Añadir memoria conversacional persistente del lado del servidor si se requiere continuidad entre dispositivos.
- Ampliar la cobertura de pruebas hacia endpoints, frontend y flujos conversacionales completos.
- Incorporar streaming de respuestas para mejorar la percepción de velocidad.

## 12. Conclusión

El proyecto integra conceptos de Investigación Operativa con tecnologías actuales de inteligencia artificial aplicada. Su aporte principal es transformar la resolución de modelos de inventario probabilísticos en una experiencia conversacional, guiada y pedagógica.

La arquitectura separa adecuadamente frontend, backend y conocimiento del dominio, lo que facilita mantenimiento y evolución. Además, la mejora incorporada al soporte de proveedores de IA fortalece la configuración del sistema y elimina una inconsistencia funcional importante.

Como trabajo futuro, se recomienda avanzar hacia una arquitectura agéntica más especializada, incorporando herramientas matemáticas verificables y validadores de parámetros. Esto permitiría combinar la claridad explicativa del modelo de lenguaje con la precisión de cálculos determinísticos, elevando la confiabilidad académica y práctica del asistente.
