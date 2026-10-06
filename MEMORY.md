# Memoria del proyecto Essenza

## Estado actual
- Ingredientes completos: alta, cálculo, edición, archivado, restauración y persistencia local.
- Productos completos: recetas, indicadores, edición, archivado, restauración y persistencia local.
- Comparativa, simulador temporal, ventas diarias y copias de seguridad completos.
- Gastos completos: alta, edición, cancelación, eliminación confirmada, ordenación y resumen diario.
- Resultados completos: cinco totales derivados para un día o mes natural, sin persistencia.
- Interfaz responsive con formularios sobre listados, tablas compactas y tarjetas móviles.
- HTML, CSS y JavaScript con Vite; inicio: `npm run dev`; pruebas: `npm test`.

## Datos y comportamiento
- `essenza.ingredients`: `{ id, name, price, quantity, unit, archived? }`.
- `essenza.products`: `{ id, name, category, salePrice, recipe, archived? }`.
- `essenza.sales`: `{ id, date, productId, units, unitSalePrice, unitCost }`.
- `essenza.expenses`: `{ id, date, category, description, amount, type }`.
- Una colección ausente de ventas o gastos significa lista vacía para mantener compatibilidad.
- Los gastos admiten categorías libres con sugerencias; fecha válida no futura e importe finito > 0.
- Editar conserva el ID; eliminar es definitivo y confirmado; duplicados reales están permitidos.
- Los gastos fijos se registran manualmente: no hay recurrencias ni plantillas.
- No registrar como gasto ingredientes de recetas: las ventas ya incluyen su coste y se duplicaría.
- Resultados deriva ingresos y coste vendido desde ventas históricas; margen bruto = ingresos - coste.
- Resultado operativo = margen bruto - gastos; admite negativos y no guarda ningún total.
- Consulta por día o mes natural; los gastos se imputan completos a su fecha, sin prorrateo.
- Es una estimación con importes registrados con IVA; no es beneficio neto, contable ni fiscal.
- localStorage es local al navegador, dispositivo y origen; no es respaldo ni sincronización.
- Copia formato 3: `{ application, formatVersion, exportedAt, data: { ingredients, products, sales, expenses } }`.
- Formato 1 restaura ventas/gastos vacíos; formato 2 restaura gastos vacíos, siempre con advertencia.
- Restaurar reemplaza las cuatro colecciones y revierte todas si falla alguna escritura.

## Arquitectura
- `src/calculations.js` centraliza costes de ingredientes y productos.
- `src/sales.js` valida ventas y calcula sus valores históricos y resúmenes diarios.
- `src/expenses.js` valida, ordena y resume gastos; `src/date-utils.js` comparte las fechas.
- `src/results.js` combina ventas y gastos por día/mes sin DOM ni almacenamiento.
- `src/data-validation.js` valida las cuatro colecciones; `src/backup.js` gestiona copias 1/2/3.
- `src/main.js` coordina interfaz, localStorage y navegación sin descartar estados pendientes.
- Hashes: Inicio, Ingredientes, Productos, Ventas, Gastos, Resultados y Datos.

## Comprobaciones
- `npm test`: 40/40; incluye Resultados y formatos de copia 1/2/3.
- Build de Vite, `node --check` y `git diff --check` correctos.
- Resultados comprobado con ventas, gastos, ambos, vacío, negativos y límites de mes/año; editar, eliminar y restaurar formato 1 recalculan.
- Carga directa `#resultados`, Atrás/Adelante y responsive comprobados sin desbordamiento.
- Resultados no crea claves ni escribe derivados; solo existen las cuatro colecciones actuales.

## Fuera de alcance
- Sin gráficos, desglose diario mensual, prorrateo ni desglose fijo/variable en Resultados.
- Sin punto de equilibrio, dashboard, impuestos, amortizaciones ni beneficio contable o fiscal.
- Sin inventario, proveedores, PWA, backend ni sincronización.
