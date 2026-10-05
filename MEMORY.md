# Memoria del proyecto Essenza

## Estado actual
- Ingredientes completos: alta, cálculo, listado, edición, archivado, restauración y persistencia local.
- Productos completos: alta, receta, indicadores, listado, edición, archivado, restauración y persistencia local; sin eliminación.
- Comparativa completa: productos activos, filtro de una categoría, ocho criterios de ordenación y semáforo textual/visual.
- Simulador completo: compara precio actual y temporal y solo guarda tras confirmación.
- Copias completas: exportación JSON e importación validada con reemplazo confirmado y reversión ante fallos.
- Interfaz responsive verde bosque/ocre y favicon propio; revisada a 375 px.
- HTML, CSS y JavaScript con Vite; sin framework, backend, autenticación ni sincronización.
- Inicio: `npm run dev`. Pruebas: `npm test`.

## Datos y comportamiento
- `essenza.ingredients`: `{ id, name, price, quantity, unit, archived? }`.
- `essenza.products`: `{ id, name, category, salePrice, recipe, archived? }`.
- Ausencia de `archived` significa activo; editar, archivar y restaurar conserva el ID.
- `recipe` guarda `{ ingredientId, quantity }` en g, ml o unidad; no guarda costes derivados.
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
- Copia formato 1: `{ application, formatVersion, exportedAt, data: { ingredients, products } }`.
- El formato es estricto; una copia inválida/incompatible no escribe. Una copia válida puede reparar datos locales dañados.
- Restaurar reemplaza todo, admite copias vacías con advertencia y conserva referencias inexistentes como no calculables.
- Ediciones y simulaciones pendientes se descartan solo tras completar la restauración.

## Arquitectura
- `src/calculations.js` centraliza conversiones, fórmulas y límites del semáforo.
- `src/product-comparison.js` prepara, filtra y ordena filas sin tocar DOM ni almacenamiento.
- `src/main.js` coordina interfaz y persistencia.
- `src/data-validation.js` centraliza la validación estructural compartida.
- `src/backup.js` crea, valida y restaura copias versionadas sin depender del DOM.
- Pruebas con `node:test`, sin dependencias adicionales.

## Comprobaciones
- `npm test`: 21/21; `node --check` y `git diff --check` correctos.
- Cálculos, semáforo, filtro, ocho órdenes y posición final de no calculables comprobados.
- Navegador probado en contexto aislado de `127.0.0.1`; no se tocaron datos del usuario.
- Exportación, restauración válida, JSON dañado y copia vacía probados en navegador; reversión probada con fallo simulado.
- Chrome DevTools a 375 px: sección de 343 px sin desbordamiento; sin errores ni advertencias de consola.

## Fuera de alcance / siguiente decisión
- Sin búsquedas, filtros múltiples, ventas, dashboard, historial automático, fusión de copias, migraciones futuras, eliminación definitiva, PWA, backend ni sincronización.
- Cualquier siguiente fase requiere explicación de alcance y aprobación previa.
