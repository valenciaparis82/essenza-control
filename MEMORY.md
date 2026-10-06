# Memoria del proyecto Essenza

## Estado actual
- Ingredientes completos: alta, cálculo, edición, archivado, restauración y persistencia local.
- Productos completos: recetas, indicadores, edición, archivado, restauración y persistencia local.
- Comparativa, simulador temporal, ventas diarias y copias de seguridad completos.
- Gastos completos: alta, edición, cancelación, eliminación confirmada, ordenación y resumen diario.
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
- Total y cantidad diarios se derivan sin redondeo intermedio y no se guardan.
- Los gastos fijos se registran manualmente: no hay recurrencias ni plantillas.
- No registrar como gasto ingredientes de recetas: las ventas ya incluyen su coste y se duplicaría.
- localStorage es local al navegador, dispositivo y origen; no es respaldo ni sincronización.
- Copia formato 3: `{ application, formatVersion, exportedAt, data: { ingredients, products, sales, expenses } }`.
- Formato 1 restaura ventas/gastos vacíos; formato 2 restaura gastos vacíos, siempre con advertencia.
- Restaurar reemplaza las cuatro colecciones y revierte todas si falla alguna escritura.

## Arquitectura
- `src/calculations.js` centraliza costes de ingredientes y productos.
- `src/sales.js` valida ventas y calcula sus valores históricos y resúmenes diarios.
- `src/expenses.js` valida, ordena y resume gastos sin DOM ni almacenamiento.
- `src/date-utils.js` comparte validación y fecha local entre ventas y gastos.
- `src/data-validation.js` valida las cuatro colecciones; `src/backup.js` gestiona copias 1/2/3.
- `src/main.js` coordina interfaz, localStorage y navegación sin descartar estados pendientes.
- Hashes: Inicio, Ingredientes, Productos, Ventas, Gastos y Datos.

## Comprobaciones
- `npm test`: 33/33; formatos 1/2/3 y rollback en cada una de las cuatro escrituras.
- Build de Vite, `node --check` y `git diff --check` correctos.
- Navegador aislado: alta, edición, cancelación, eliminación, orden y persistencia comprobados.
- Carga directa `#gastos`, Atrás/Adelante y conservación del formulario pendiente comprobadas.
- Responsive revisado en 1440, 1024, 800, 768, 480 y 375 px, sin desbordamiento.
- Sin errores ni advertencias de consola; queda un aviso informativo de autofill ya existente.

## Fuera de alcance
- Sin resumen mensual, recurrencias, plantillas, beneficio, resultado operativo ni punto de equilibrio.
- Sin dashboard, gráficos, fiscalidad, inventario, proveedores, PWA, backend ni sincronización.
