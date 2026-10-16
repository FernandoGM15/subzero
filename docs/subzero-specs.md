# 📄 Product Specification Document (PRD)

| **Proyecto**         | SubZero – Minimalist Subscription & Recurring Expense Tracker |
| :------------------- | :------------------------------------------------------------ |
| **Versión**          | 1.0 (MVP)                                                     |
| **Rol**              | Product Owner (TI)                                            |
| **Público Objetivo** | Freelancers, profesionales digitales y PyMEs                  |

---

## 1. Visión y Propósito del Producto

### 1.1 El Problema

Los usuarios pierden visibilidad de sus gastos fijos recurrentes (software, streaming, dominios, licencias). La dispersión de cobros en distintas fechas y métodos de pago provoca:

1. Pagos por servicios olvidados o no utilizados.
2. Dificultad para calcular el flujo de caja mensual/anual real.
3. Sorpresas por cobros automáticos imprevistos.

### 1.2 La Solución (MVP)

Una aplicación web rápida, visual y sin fricción que centralice todos los gastos recurrentes, proyecte el gasto mensual/anual en tiempo real y alerte sobre renovaciones inminentes.

---

## 2. Alcance del Proyecto (Scope)

- **Dentro del Alcance (In Scope - MVP):**
  - Gestión completa (CRUD) de suscripciones y gastos fijos.
  - Tablero principal (Dashboard) con métricas financieras consolidadas (KPIs).
  - Gráfico de distribución de gastos por categoría.
  - Vista dual: Tabla ordenable y Tarjetas tipo Kanban (por ciclo de cobro o estado).
  - Persistencia de datos (State Management local o API REST básica).
  - Soporte multidispositivo (Mobile First) y Modo Oscuro / Claro.

- **Fuera del Alcance (Out of Scope - Fase 2):**
  - Conexión bancaria automática (Open Banking / Plaid).
  - Envío de correos o SMS masivos (las alertas se manejarán dentro de la app o mediante descarga de calendario `.ics`).
  - Pasarelas de pago (no procesamos dinero, solo lo registramos).

---

## 3. Requerimientos Funcionales (Módulos y Épicas)

### Módulo A: Dashboard & Analítica Financiera

- **RF-A1 (KPI: Gasto Mensual Proyectado):** La app debe normalizar todos los costos a una tarifa mensual fija equivalente.
  $$\text{Costo Mensual} = \text{Precio Anual} / 12 + \text{Precio Trimestral} / 3 + \text{Precio Mensual}$$
- **RF-A2 (KPI: Gasto Anual Proyectado):** Proyección a 12 meses basada en las suscripciones activas.
- **RF-A3 (KPI: Próxima Renovación):** Tarjeta destacada que muestre el servicio más próximo a vencer, cuántos días faltan y el monto a debitar.
- **RF-A4 (Gráfico de Distribución):** Gráfico tipo dona/pastel (Donut Chart) interactivo que agrupe los gastos por categoría con sus respectivos colores institucionales.

### Módulo B: Gestión de Suscripciones (CRUD Core)

- **RF-B1 (Alta de Suscripción):** Formulario modal/pantalla con las siguientes validaciones:
  - _Nombre:_ Requerido (máx. 50 caracteres).
  - _Monto:_ Requerido, mayor a 0, con máximo 2 decimales.
  - _Moneda:_ Selector (USD, EUR, MXN, etc.).
  - _Ciclo:_ Mensual, Anual, Trimestral o Semanal.
  - _Fecha de primer cobro:_ Selector de fecha (`DatePicker`).
  - _Categoría:_ Selección obligatoria de una lista existente.
  - _Método de pago:_ Selección opcional.
- **RF-B2 (Cálculo Automático de Renovación):** El sistema debe computar automáticamente el campo `next_billing_date` en función de la `start_date` y el `billing_cycle`.
- **RF-B3 (Edición y Eliminación):** Posibilidad de actualizar montos/fechas o dar de baja el registro (con confirmación destructiva).

### Módulo C: Visualización y Filtros

- **RF-C1 (Vista Tabla):**
  - Ordenamiento dinámico de columnas: por precio (asc/desc), por fecha de vencimiento y por nombre alfabético.
  - Paginación en cliente (ej. 10 registros por página).
- **RF-C2 (Búsqueda y Filtro Rápido):** Barra de búsqueda reactiva por texto (nombre de servicio) y selector de filtro por Categoría y por Estado (`ACTIVE`, `PAUSED`, `CANCELLED`).
- **RF-C3 (Vista Alternativa):** Switch para alternar entre vista compacta (Tabla) y vista visual (Grid de Cards).

---

## 4. Requerimientos No Funcionales (Calidad Técnica)

1. **Precisión Numérica:** La lógica de cálculo monetario no debe presentar errores de redondeo de punto flotante en JavaScript (usar librerías como `currency.js` o formateadores nativos `Intl.NumberFormat`).
2. **Performance Web:**
   - Carga inicial (LCP) inferior a 1.5 segundos.
   - Evitar re-renders innecesarios en el Dashboard al filtrar elementos.
3. **Manejo de Estados de UI:**
   - **Loading:** Skeletons placeholders mientras se calculan métricas o carga la data.
   - **Empty State:** Pantalla amigable cuando el usuario no tiene ninguna suscripción registrada (con Call to Action claro: _"Añade tu primera suscripción"_).
4. **Diseño Responsive:** Experiencia fluida desde pantallas móviles (375px) hasta monitores de escritorio (1440px+).

---
