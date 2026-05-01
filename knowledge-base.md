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
**Respuesta del chatbot:**

---

## Reporte de Politica de Inventario

### 1. Tamano del Lote Optimo (Q)
Se calcula con la Cantidad Economica de Pedido (EOQ):

$$
Q^* = \sqrt{\frac{2 \cdot D \cdot K}{c1}}
$$

- **Calculo:**
	$$
	\sqrt{\frac{2 \cdot 6 \cdot 18}{0.14}} = \sqrt{1542.857} \approx 39.28
	$$
- **Decision:** pedir **39 unidades**.

### 2. Nivel de servicio optimo y stock de seguridad
Probabilidad admisible de faltantes:

$$
P(x > R) = \frac{Q \cdot c1}{D \cdot c2}
$$

- **Calculo:**
	$$
	\frac{39 \cdot 0.14}{6 \cdot 3.60} = 0.2527
	$$
- **Riesgo de faltante:** 25.27%
- **Nivel de servicio optimo:** $1 - 0.2527 = 0.7473$ (74.73%)
- **Valor Z aproximado:** 0.67

### 3. Punto de Reorden (R)
Demanda esperada durante el lead time:

$$
\mu_L = D \cdot L = 6 \cdot 4 = 24
$$

Punto de reorden:

$$
R = \mu_L + Z \cdot \sigma_L
$$

- **Calculo:**
	$$
	24 + 0.67 \cdot 5 = 27.35
	$$
- **Decision:** fijar **28 unidades**.

---

### Plan de accion recomendado
Configura el sistema para emitir una orden de compra por **39 microcontroladores** cuando el stock fisico baje a **28 unidades**.
