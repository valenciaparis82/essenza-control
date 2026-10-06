\# Instrucciones del proyecto Essenza



\## Objetivo general



Construir una aplicación web responsive para la cafetería Essenza que permita controlar:



\- ingredientes

\- costes

\- recetas

\- precio de venta

\- margen bruto en euros

\- margen bruto en porcentaje

\- food cost

\- simulación de precios

\- ventas diarias por producto

\- gastos operativos diarios

\- resultados operativos diarios y mensuales



Más adelante podrá ampliarse con:



\- beneficio contable o fiscal

\- punto de equilibrio

\- merma

\- histórico de precios

\- informes

\- gráficos

\- PWA

\- sincronización entre dispositivos



\## Tecnologías actuales



Usar en esta primera versión:



\- HTML

\- CSS

\- JavaScript

\- Vite

\- localStorage



No usar todavía salvo aprobación explícita:



\- React

\- TypeScript

\- backend

\- Supabase

\- autenticación

\- Docker

\- microservicios



\## Forma de trabajar



El usuario está aprendiendo programación.



Antes de implementar una fase:



1\. Explicar qué se va a construir.

2\. Indicar qué archivos se van a crear o modificar.

3\. Explicar para qué sirve cada archivo.

4\. Esperar aprobación si el cambio es importante.

5\. Implementar solo esa fase.

6\. Comprobar que funciona antes de continuar.



Evitar generar grandes cantidades de código sin explicación.



Mantener la arquitectura simple.



No crear archivos, módulos o abstracciones antes de que hagan falta.



\## Reglas de diseño



\- Separar la lógica de negocio de la interfaz.

\- Centralizar las fórmulas.

\- No duplicar cálculos.

\- No usar nombres como identificadores.

\- Evitar redondear demasiado pronto.

\- No borrar ingredientes usados en recetas; archivarlos.

\- Editar, archivar y restaurar un ingrediente debe conservar siempre su ID.

\- Archivar no elimina datos; los ingredientes archivados se pueden restaurar y deben restaurarse antes de editarlos.

\- Los ingredientes antiguos sin estado de archivado se consideran activos.

\- Los ingredientes archivados siguen reservando su nombre y se debe pedir confirmación antes de archivarlos.

\- Al editar unidades, permitir cambios dentro de la misma magnitud (kg ↔ g, l ↔ ml y unidad ↔ unidad), pero no entre masa, volumen y conteo.

\- Mantener precisión suficiente en costes pequeños.

\- Las recetas deben guardar referencias a ingredientes, no copiar sus precios.

\- Cada producto debe tener un ID estable, nombre, categoría, precio de venta con IVA incluido mayor que cero y una receta propia para una unidad vendida.

\- Editar, archivar y restaurar un producto debe conservar siempre su ID.

\- Archivar no elimina el producto ni su receta; los productos archivados se pueden restaurar y deben restaurarse antes de editarlos.

\- Los productos antiguos sin estado de archivado se consideran activos.

\- Los productos archivados siguen reservando su nombre y se debe pedir confirmación antes de archivarlos.

\- Las categorías iniciales de producto son Bocadillos, Hamburguesas, Tapas, Tostadas, Bebidas, Bolleria y Otros.

\- Cada línea de receta guarda únicamente el ID del ingrediente y la cantidad utilizada en su unidad base; no guarda precios ni costes derivados.

\- Un ingrediente no puede repetirse dentro de una misma receta y una receta no puede estar vacía.

\- Los ingredientes archivados permanecen en las recetas existentes, pero no pueden añadirse a recetas nuevas.

\- Al editar un producto se pueden conservar sus ingredientes archivados existentes, pero no seleccionarlos de nuevo ni añadirlos a líneas nuevas.

\- Un producto con una referencia a un ingrediente inexistente se muestra como no calculable y debe sustituirla antes de guardar una edición; aun así se puede archivar y restaurar.

\- Los costes actuales se recalculan desde los ingredientes.

\- Las simulaciones de precio son temporales y no se guardan hasta una confirmación explícita.

\- Confirmar una simulación modifica únicamente el precio de venta y conserva el ID, nombre, categoría, receta y estado del producto.

\- Los productos archivados no aparecen en el simulador y deben restaurarse antes de cambiar su precio.

\- El semáforo de food cost usa límites centralizados: verde hasta el 30 %, ámbar por encima del 30 % y hasta el 35 %, y rojo por encima del 35 %; se clasifica sin redondeo previo.

\- El semáforo es una orientación operativa basada solo en food cost con IVA incluido, no un indicador de beneficio neto.

\- La comparativa muestra solo productos activos y recalcula sus indicadores desde los ingredientes y precios actuales; no guarda valores derivados.

\- La comparativa permite filtrar una sola categoría y ordenar por producto, categoría, coste, precio, margen en euros, margen porcentual, food cost o semáforo.

\- La comparativa se ordena inicialmente por food cost de mayor a menor y usa los valores completos sin redondear para ordenar.

\- Los productos no calculables siguen visibles al final de la comparativa y deben identificarse como no calculables, sin inventar indicadores.

\- El semáforo visual debe acompañar siempre el color con texto.

\- Cada venta debe tener un ID estable, fecha, referencia al producto por su ID, unidades vendidas, precio unitario histórico y coste unitario histórico.

\- Las unidades vendidas deben ser números enteros mayores que cero y no se permiten fechas futuras.

\- Varias ventas del mismo producto y día se guardan como registros independientes.

\- Al registrar una venta se capturan el precio y el coste actuales; registrar una fecha anterior no recupera valores históricos que no se hubieran guardado entonces.

\- Los cambios posteriores en productos, recetas, ingredientes o precios no deben recalcular ventas anteriores.

\- Los ingresos, el coste total vendido y el margen generado son valores derivados y no se guardan.

\- Solo se pueden registrar ventas nuevas de productos activos y calculables; archivar un producto no elimina ni invalida sus ventas anteriores.

\- Una venta con referencia a un producto inexistente conserva sus importes históricos y se muestra con advertencia.

\- Editar una venta conserva su ID. Cambiar solo fecha o unidades conserva precio y coste históricos; cambiar el producto captura los importes actuales del nuevo producto.

\- La eliminación definitiva de una venta requiere confirmación y se usa únicamente para corregir registros erróneos.

\- El resumen de ventas de esta fase es diario; no incluye informes semanales, mensuales ni gráficos.

\- Cada gasto debe tener un ID estable, fecha, categoría flexible, concepto o descripción, importe y tipo fijo o variable.

\- La fecha del gasto debe ser válida y no futura; el importe debe ser un número finito mayor que cero.

\- Editar un gasto conserva su ID y eliminarlo definitivamente requiere confirmación.

\- Se permiten varios gastos iguales el mismo día porque pueden representar operaciones reales independientes.

\- El resumen de gastos es diario; el total y el número de registros son derivados y no se guardan.

\- Los gastos fijos se registran manualmente; clasificarlos como fijos no crea recurrencias ni plantillas automáticas.

\- Las compras de ingredientes utilizados en recetas no se registran también como gastos operativos: su coste ya forma parte del coste histórico de las ventas y hacerlo duplicaría el coste.

\- Compras generales solo se consideran gasto operativo cuando no corresponden a ingredientes incluidos en recetas.

\- Resultados combina ventas históricas y gastos registrados para un día natural o un mes natural; sus totales son derivados y nunca se guardan.

\- Los ingresos y el coste de producto vendido se calculan desde el precio y coste unitarios históricos de cada venta, aunque el producto esté archivado o ya no exista.

\- Margen bruto del periodo = ingresos - coste de producto vendido; resultado operativo = margen bruto - gastos operativos.

\- Los gastos se imputan completamente a la fecha registrada, sin prorrateo; un gasto periódico grande puede distorsionar un día y el mes suele ser más representativo.

\- El resultado operativo es una estimación con importes registrados con IVA incluido; no representa beneficio neto ni resultado contable o fiscal.

\- Resultados muestra solo los cinco totales del periodo, sin desglose diario mensual ni desglose de gastos fijos y variables.

\- Los cálculos de Resultados usan los valores completos sin redondeo intermedio y no muestran totales parciales si algún dato impide calcularlos.

\- Las copias de seguridad usan un formato JSON estricto con identificador de aplicación y versión explícita.

\- Una copia incluye ingredientes, productos, ventas y gastos completos, conservando IDs, recetas, estado de archivado y valores históricos de ventas; no incluye indicadores derivados.

\- El formato de copia 2 incluye ventas. El formato 1 sigue siendo importable, pero restaura las ventas como una lista vacía con una advertencia explícita.

\- El formato de copia 3 incluye gastos. Los formatos 1 y 2 siguen siendo importables y restauran los gastos como una lista vacía con una advertencia explícita.

\- La importación se valida por completo antes de modificar localStorage; un archivo dañado, incompleto o incompatible no puede sobrescribir los datos existentes.

\- Restaurar una copia reemplaza todos los datos solo tras confirmación explícita; no fusiona registros, regenera IDs ni corrige recetas automáticamente.

\- Las referencias a ingredientes inexistentes se conservan con advertencia y mantienen el producto como no calculable.

\- Se permite restaurar una copia vacía con una advertencia reforzada y una copia válida puede reemplazar datos locales dañados.

\- Si falla una escritura durante la restauración, se deben recuperar los valores anteriores y no comunicar éxito.

\- Las ediciones y simulaciones pendientes solo se descartan después de una restauración confirmada y completada correctamente.

\- Las copias son manuales y no se deben presentar como sincronización, historial automático ni respaldo remoto.

\- La interfaz se organiza en las secciones internas Inicio, Ingredientes, Productos, Ventas, Gastos, Resultados y Datos dentro de una sola aplicación.

\- La navegación usa los hashes `#inicio`, `#ingredientes`, `#productos`, `#ventas`, `#gastos`, `#resultados` y `#datos`; un hash vacío o desconocido abre Inicio.

\- Navegar solo muestra u oculta paneles existentes: no recarga la página, no reconstruye formularios, no descarta cambios pendientes y no escribe en `localStorage`.

\- En ordenador la navegación se muestra en una barra lateral y en móvil mediante un menú desplegable accesible, siempre con sección activa y foco visibles.

\- En escritorio, los formularios cortos se colocan encima de los listados largos y estos aprovechan todo el ancho disponible.

\- Los listados de ingredientes y productos usan filas compactas en escritorio y tarjetas en pantallas estrechas.

\- Las tablas complejas deben convertirse en tarjetas antes de provocar un desplazamiento horizontal prolongado.



\## Fórmulas



Coste total:



suma del coste de los ingredientes utilizados.



Margen bruto en euros:



precio de venta - coste total.



Margen bruto en porcentaje:



(precio de venta - coste total) / precio de venta \* 100



Food cost:



coste total / precio de venta \* 100



Ingresos de una venta:



precio unitario histórico \* unidades vendidas



Margen generado por una venta:



(precio unitario histórico - coste unitario histórico) \* unidades vendidas



Total de gastos del día:



suma de los importes de los gastos registrados para esa fecha



Coste de producto vendido del periodo:



suma del coste unitario histórico \* unidades vendidas



Margen bruto del periodo:



ingresos del periodo - coste de producto vendido del periodo



Gastos operativos del periodo:



suma de los importes de los gastos registrados en el periodo



Resultado operativo:



margen bruto del periodo - gastos operativos del periodo



\## Unidades internas



\- masa: gramos

\- volumen: mililitros

\- conteo: unidades



No convertir gramos a mililitros salvo que exista una equivalencia específica.



\## Memoria del proyecto



Antes de trabajar, leer:



MEMORY.md



Ese archivo contiene el estado actual, decisiones tomadas y próximas fases.



\## Agente principal



El agente de desarrollo recomendado para este proyecto es:



essenzaDev



Su función es ayudar a desarrollar la aplicación paso a paso, explicando decisiones y evitando sobrecomplicar la arquitectura.

