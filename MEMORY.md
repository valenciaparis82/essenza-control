# Memoria del proyecto Essenza

## Estado actual
- Ingredientes completos: alta, cálculo, listado, edición, archivado, restauración y persistencia local.
- Productos completos: alta, receta, indicadores, listado, edición, archivado, restauración y persistencia local; sin eliminación.
- Comparativa completa: productos activos, filtro de una categoría, ocho criterios de ordenación y semáforo textual/visual.
- Simulador completo: compara precio actual y temporal y solo guarda tras confirmación.
- Interfaz responsive verde bosque/ocre y favicon propio; revisada a 375 px.
- HTML, CSS y JavaScript con Vite; sin framework, backend, autenticación ni sincronización.
- Inicio: `npm run dev`. Pruebas: `npm test`.

## Datos y comportamiento
- `essenza.ingredients`: `{ id, name, price, quantity, unit, archived? }`.
- `essenza.products`: `{ id, name, category, salePrice, recipe, archived? }`.
- Ausencia de `archived` significa activo; editar, archivar y restaurar conserva el ID.
- `recipe` guarda `{ ingredientId, quantity }` en g, ml o unidad; no guarda costes derivados.
- Categorías: Bocadillos, Hamburguesas, Tapas, Tostadas, Bebidas, Bolleria y Otros.
- Recetas no vacías y sin ingredientes repetidos; un ingrediente archivado existente se conserva, pero no se añade de nuevo.
- Una referencia inexistente hace el producto no calculable y debe sustituirse antes de guardar una edición.
- Productos e ingredientes reservan nombres activos y archivados, ignorando mayúsculas y espacios.
- Costes e indicadores se recalculan desde ingredientes sin redondeo intermedio; admiten márgenes negativos y food cost >100 %.
- Semáforo: verde ≤30 %, ámbar >30 % y ≤35 %, rojo >35 %; orientativo, con IVA, no beneficio neto.
- La comparativa excluye archivados y ordena inicialmente por food cost descendente usando valores sin redondear.
- Los no calculables permanecen al final de la comparativa; filtro y orden viven solo en memoria.
- La simulación vive en memoria; confirmar cambia solo `salePrice` y excluye productos archivados.
- Ante datos dañados, cambios externos o fallo de almacenamiento no se sobrescriben datos.
- localStorage es local al navegador, dispositivo y origen; no es copia de seguridad ni sincronización.

## Arquitectura
- `src/calculations.js` centraliza conversiones, fórmulas y límites del semáforo.
- `src/product-comparison.js` prepara, filtra y ordena filas sin tocar DOM ni almacenamiento.
- `src/main.js` gestiona interfaz, validación estructural y persistencia.
- Pruebas con `node:test`, sin dependencias adicionales.

## Comprobaciones
- `npm test`: 13/13; `node --check` y `git diff --check` correctos.
- Límites exactos 30 % y 35 %, valores apenas superiores y semáforo por gravedad comprobados.
- Filtro de categoría, ocho criterios y ambas direcciones comprobados; no calculables siempre al final.
- Comparativa actualiza desde datos actuales y excluye el producto archivado.
- Chrome DevTools a 375 px: fichas de 301 px, sin desbordamiento ni errores o advertencias de consola.
- Navegador probado en contexto aislado de `127.0.0.1`; no se tocaron datos del usuario.

## Fuera de alcance / siguiente decisión
- Pendiente: copias de seguridad.
- Sin búsquedas, filtros múltiples, ventas, dashboard, historial, eliminación definitiva, PWA ni sincronización.
- Cualquier siguiente fase requiere explicación de alcance y aprobación previa.
