# Base de Conocimiento: Asistente de Inventario 6C

## Flujo de Conversacion

**Pregunta del usuario:** Tenemos una startup de automatizacion y necesito optimizar el inventario de microcontroladores. Monitoreamos el stock en tiempo real con nuestro sistema interno.
**Respuesta del chatbot:** Por el monitoreo permanente que mencionas, el escenario corresponde a un Modelo probabilistico de Revision Continua. El objetivo sera definir cuanto pedir Q y en que momento hacerlo R. Para comenzar, ingresa la demanda esperada D y el plazo de reposicion de tu proveedor L.

**Pregunta del usuario:** La demanda es de 6 unidades por dia y el proveedor siempre tarda 4 dias.
**Respuesta del chatbot:** Registrado: Demanda diaria de 6 unidades y Lead Time de 4 dias. Dado que la demanda es probabilistica, conoces la desviacion estandar de la demanda durante el tiempo de espera sigma_L?

**Pregunta del usuario:** Si, la desviacion es de 5 unidades.
**Respuesta del chatbot:** Registrado: sigma_L = 5 unidades. Finalmente, ingresa la estructura de costos: Costo fijo por emitir pedido K, costo de almacenamiento diario por unidad c1, costo de escasez por unidad faltante c2.

**Pregunta del usuario:** Emitir pedido cuesta 18. Almacenar cuesta 0.14. El costo de escasez lo calculamos en 3.60.
**Respuesta del chatbot:** Datos completos. Espero aceptacion para ejecutar el modelo matematico.

**Pregunta del usuario:** Empezar
**Respuesta del chatbot:** Reporte de Politica de Inventario
1. Tamano del Lote Optimo Q
Calculado mediante la formula de Cantidad Economica de Pedido para minimizar los costos de preparacion y retencion:
Q* = raiz 2 * D * K / c1
Calculo: raiz 2 * 6 * 18 / 0.14 = 39.28
Decision: Pedir 39 unidades.

2. Nivel de Servicio Optimo y Stock de Seguridad
La probabilidad admisible de tener faltantes, optimizada segun tus costos c1 y c2, se define por:
P x > R = Q * c1 / D * c2
Calculo: 39 * 0.14 / 6 * 3.60 = 0.2527
Esto implica aceptar un riesgo de faltante del 25.27% durante el tiempo de espera Nivel de servicio optimo de 74.73%. Buscando en la tabla normal, esto corresponde a un valor Z ≈ 0.67.

3. Punto de Reorden R
Considerando la demanda esperada durante el lead time mu_L = 24 unidades y el factor Z:
R = mu_L + Z * sigma_L
Calculo: 24 + 0.67 * 5 = 27.35
Decision: Fijar el punto de reorden en 28 unidades.

Plan de Accion Recomendado:
Configurar el sistema interno para emitir una orden de compra por 39 microcontroladores cada vez que el stock fisico caiga a 28 unidades.
