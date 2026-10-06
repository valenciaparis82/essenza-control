# Memoria del proyecto Essenza

## Estado actual
- Ingredientes completos: alta, cálculo, edición, archivado, restauración y persistencia local.
- Productos completos: recetas, indicadores, edición, archivado, restauración y persistencia local.
- Comparativa, simulador temporal y copias de seguridad completos.
- Ventas diarias completas: alta, resumen por fecha, edición y eliminación confirmada.
- Interfaz optimizada: formularios sobre listados a ancho completo, filas/tablas compactas en escritorio y tarjetas responsive.
- HTML, CSS y JavaScript con Vite; sin framework, backend, autenticación ni sincronización.
- Inicio: `npm run dev`. Pruebas: `npm test`.

## Datos y comportamiento
- `essenza.ingredients`: `{ id, name, price, quantity, unit, archived? }`.
- `essenza.products`: `{ id, name, category, salePrice, recipe, archived? }`.
- `essenza.sales`: `{ id, date, productId, units, unitSalePrice, unitCost }`.
- Ausencia de `essenza.sales` significa lista vacía y mantiene compatibles los datos locales anteriores.
- Cada venta referencia el producto por ID y guarda precio/coste unitarios del momento del registro.
- Ingresos, coste vendido y margen se derivan sin redondeo intermedio; admiten margen negativo.
- Cambiar ingredientes, receta o precio no recalcula ventas históricas.
- Editar fecha/unidades conserva importes; cambiar producto captura los actuales y conserva el ID.
- Las ventas repetidas de producto/fecha son independientes; unidades enteras >0 y sin fecha futura.
- Solo productos activos y calculables admiten ventas nuevas; las históricas sobreviven al archivado.
- Una referencia inexistente muestra “Producto no disponible” y conserva cálculos históricos.
- La eliminación es definitiva, confirmada y solo para corregir errores.
- El resumen muestra una sola fecha; importes operativos con IVA incluido, no beneficio neto.
- localStorage es local al navegador, dispositivo y origen; no es respaldo ni sincronización.
- Copia formato 2: `{ application, formatVersion, exportedAt, data: { ingredients, products, sales } }`.
- Formato 1 es importable y restaura ventas vacías con advertencia; formato 2 conserva ventas.
- Restaurar reemplaza las tres colecciones y revierte todas si falla alguna escritura.

## Arquitectura
- `src/calculations.js` centraliza costes de ingredientes y productos.
- `src/sales.js` valida fechas/ventas y calcula totales y resúmenes diarios sin DOM.
- `src/product-comparison.js` prepara la comparativa sin DOM ni almacenamiento.
- `src/data-validation.js` valida ingredientes, productos y ventas.
- `src/backup.js` gestiona copias 1/2 y restauración transaccional.
- `src/main.js` coordina interfaz, persistencia y navegación por hash sin escribir estado de navegación.
- Secciones por hash: Inicio, Ingredientes, Productos, Ventas y Datos; los paneles solo se ocultan y conservan todos los estados pendientes.

## Comprobaciones
- `npm test`: 27/27; build de Vite, `node --check` y `git diff --check` correctos.
- Navegador aislado: alta repetida, resumen, edición, eliminación e histórico comprobados.
- Tras duplicar el coste del ingrediente, ventas anteriores conservaron precio y coste guardados.
- Importación/restauración de formatos 1 y 2 comprobada en lógica y navegador.
- Chrome DevTools: 1440, 1280, 1024, 800, 768, 480 y 375 px sin desbordamiento; listas largas y acciones comprobadas.
- Accesibilidad Lighthouse 100/100 incluso con archivados visibles; sin errores de consola.

## Fuera de alcance
- Sin informes semanales/mensuales, gráficos, gastos, beneficio neto, devoluciones ni dashboard.
- Sin búsquedas, migraciones adicionales, PWA, backend ni sincronización.
