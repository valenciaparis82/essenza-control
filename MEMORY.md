# Memoria del proyecto Essenza

## Estado actual
- Ingredientes completos: alta, cálculo, listado, edición, archivado, restauración y persistencia local.
- Productos completos: alta, receta, indicadores, listado, edición, archivado, restauración y persistencia local; sin eliminación.
- Simulador completo: compara precio actual y temporal, muestra semáforo de food cost y solo guarda tras confirmación.
- Interfaz responsive verde bosque/ocre y favicon propio; revisada a 375 px.
- HTML, CSS y JavaScript con Vite; sin framework, backend, autenticación ni sincronización.
- Inicio: `npm run dev`. Pruebas: `npm test`.

## Datos y comportamiento
- `essenza.ingredients`: `{ id, name, price, quantity, unit, archived? }`.
- `essenza.products`: `{ id, name, category, salePrice, recipe, archived? }`.
- En ambos casos, ausencia de `archived` significa activo; editar, archivar y restaurar conserva el ID.
- Cada línea de `recipe` guarda `{ ingredientId, quantity }` en g, ml o unidad; no guarda costes.
- Categorías: Bocadillos, Hamburguesas, Tapas, Tostadas, Bebidas, Bolleria y Otros.
- Producto y receta representan una unidad vendida; precio final con IVA incluido y mayor que cero.
- Recetas no vacías, sin ingredientes repetidos y con ingredientes activos al crear.
- Al editar se conserva un ingrediente archivado ya presente, pero no se puede volver a seleccionar ni añadir.
- Una referencia inexistente hace el producto no calculable y debe sustituirse antes de guardar; permite archivar/restaurar.
- Los productos archivados se ocultan por defecto, conservan su receta y reservan su nombre.
- Productos e ingredientes bloquean duplicados ignorando mayúsculas y espacios.
- Los costes actuales se recalculan desde ingredientes, sin redondeo intermedio ni costes derivados guardados.
- Se muestran coste, margen operativo €, margen % y food cost con IVA incluido; se permiten valores negativos o >100 %.
- La simulación vive solo en memoria; al confirmar modifica únicamente `salePrice` y conserva el resto del producto.
- Semáforo centralizado: verde ≤30 %, ámbar >30 % y ≤35 %, rojo >35 %; orientativo, no beneficio neto.
- El simulador excluye productos archivados y avisa antes de descartar una simulación al cambiar de producto.
- Ante datos dañados, cambios desde otra pestaña o fallo de almacenamiento no se sobrescribe ni se muestra éxito.
- localStorage es local al navegador, dispositivo y origen; no es copia de seguridad ni sincronización.

## Arquitectura
- `src/calculations.js` centraliza conversiones, fórmulas y límites del semáforo.
- `src/main.js` gestiona interfaz, validación estructural y persistencia.
- `tests/calculations.test.js` usa `node:test`, sin dependencias adicionales.

## Comprobaciones
- `npm test`: 7/7; `node --check` correcto, incluidos los límites exactos 30 % y 35 %.
- Edición completa y cancelación probadas; el producto mantuvo su ID y los cambios persistieron tras recargar.
- Archivado con confirmación, ocultación, nombre reservado, restauración y descarte de la edición probados.
- Ingrediente activo calculó; archivado existente se conservó y desapareció al sustituirlo; no se pudo reseleccionar.
- Referencia inexistente mostró coste no calculable y bloqueó el guardado hasta sustituirla.
- Producto archivado siguió mostrando receta e indicadores calculados desde ingredientes actuales.
- Chrome DevTools a 375 px: sin desbordamiento ni errores o advertencias de consola.
- Navegador probado en contexto aislado de `127.0.0.1`; no se tocaron datos del usuario.
- Simular y cancelar la confirmación no alteraron `localStorage`; aceptar cambió solo `salePrice`.

## Fuera de alcance / siguiente decisión
- Pendientes: copias de seguridad y listado comparativo.
- Sin buscador, filtros por categoría, ventas, dashboard, historial, eliminación definitiva, PWA ni sincronización.
- Cualquier siguiente fase requiere explicación de alcance y aprobación previa.
