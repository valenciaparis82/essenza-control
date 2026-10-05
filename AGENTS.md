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



Más adelante podrá ampliarse con:



\- ventas

\- gastos

\- beneficio mensual

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

\- Los datos históricos futuros deberán conservar precios y costes del momento.



\## Fórmulas



Coste total:



suma del coste de los ingredientes utilizados.



Margen bruto en euros:



precio de venta - coste total.



Margen bruto en porcentaje:



(precio de venta - coste total) / precio de venta \* 100



Food cost:



coste total / precio de venta \* 100



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

