# Memoria del proyecto Essenza

## Estado actual
- Ingredientes y productos completos: alta, cálculo, edición, archivado, restauración y persistencia local.
- Comparativa, simulador temporal, ventas diarias y copias de seguridad completos.
- Gastos completos: alta, edición, cancelación, eliminación confirmada, ordenación y resumen diario.
- Resultados completos: cinco totales derivados para un día o mes natural, sin persistencia.
- Punto de equilibrio y dashboard Inicio derivados: resumen hoy/mes, contribución, gastos fijos/variables, estado y productos actuales/históricos.
- Interfaz responsive con formularios sobre listados, tablas compactas y tarjetas móviles.
- HTML, CSS y JavaScript con Vite; inicio: `npm run dev`; pruebas: `npm test`.

## Datos y comportamiento
- `essenza.ingredients`: `{ id, name, price, quantity, unit, archived? }`.
- `essenza.products`: `{ id, name, category, salePrice, recipe, archived? }`.
- `essenza.sales`: `{ id, date, productId, units, unitSalePrice, unitCost }`.
- `essenza.expenses`: `{ id, date, category, description, amount, type }`.
- Gastos: categorías libres, fecha no futura, importe finito > 0; editar conserva ID, eliminar es confirmado y no hay recurrencias.
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
- `src/results.js` combina ventas y gastos por día/mes sin DOM ni almacenamiento; amplía su salida para devolver gastos fijos y variables por separado.
- `src/break-even.js` lógica pura del punto de equilibrio mensual, reutiliza resultados.js y devuelve margen de contribución, gastos fijos, equilibrio estimado.
- `src/dashboard.js` compone sin DOM ni almacenamiento Resultados, Equilibrio, Comparativa y producto más vendido; no duplica fórmulas.
- `src/data-validation.js` valida las cuatro colecciones; `src/backup.js` gestiona copias 1/2/3.
- `src/main.js` coordina interfaz, localStorage y navegación sin descartar estados pendientes.
- Hashes: Inicio, Ingredientes, Productos, Ventas, Gastos, Resultados, Punto de equilibrio y Datos.

## Comprobaciones
- `npm test`: 56/56; incluye dashboard, Resultados, Punto de equilibrio y formatos de copia 1/2/3.
- Build de Vite, `node --check` y `git diff --check` correctos.
- Resultados comprobado con ventas, gastos, ambos, vacío, negativos y límites de mes/año; editar, eliminar y restaurar formato 1 recalculan.
- Punto de equilibrio comprobado con margen positivo, cero y negativo; equilibrio no alcanzado, exacto y superado; cambio de mes y año; Atrás/Adelante y responsive.
- Dashboard comprobado vacío, positivo/cero/negativo, equilibrio pendiente/alcanzado/superado/no calculable, productos archivados/inexistentes, empates, responsive y sin nuevas claves.

## Fuera de alcance
- Sin gráficos, tendencias, previsiones, desglose diario mensual, prorrateo ni beneficio contable o fiscal.
- No generar gastos futuros ni recurrencias automáticas.
- Sin inventario, proveedores, PWA, backend ni sincronización.
- El punto de equilibrio es una consulta y cálculo derivado; no guarda resultados en localStorage ni inventa datos.
