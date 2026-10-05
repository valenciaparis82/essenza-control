---
name: ingredient-costs
description: Reglas estándar para calcular costes de ingredientes, convertir unidades y mantener precisión en la aplicación Essenza. Usar siempre que se trabaje con ingredientes, cantidades, unidades, costes por gramo, mililitro o unidad, recetas o food cost.
compatibility: opencode
metadata:
  project: essenza-control
  domain: ingredient-costs
---

# Ingredient Costs

## Objetivo

Aplicar siempre las mismas reglas para:

- convertir unidades de compra,
- calcular costes por unidad base,
- calcular el coste de cantidades utilizadas,
- mantener precisión suficiente,
- evitar conversiones incorrectas,
- mantener consistencia en toda la aplicación Essenza.

Usar esta skill siempre que se trabaje con ingredientes, recetas, cantidades, unidades o costes.

---

## Unidades base

La aplicación usa estas unidades internas:

### Masa

- kg → gramos
- g → gramos

Unidad base:

`g`

Conversión:

`1 kg = 1000 g`

---

### Volumen

- l → mililitros
- ml → mililitros

Unidad base:

`ml`

Conversión:

`1 l = 1000 ml`

---

### Conteo

- unidad → unidad

Unidad base:

`unidad`

No realizar ninguna conversión adicional salvo que exista una equivalencia explícita.

---

## Regla principal de normalización

Antes de calcular un coste, convertir siempre la cantidad comprada a su unidad base.

Ejemplos:

`1 kg → 1000 g`

`0.5 kg → 500 g`

`2 l → 2000 ml`

`750 ml → 750 ml`

`12 unidades → 12 unidades`

---

## Coste por unidad base

Fórmula:

`costeUnidadBase = precioCompra / cantidadCompraNormalizada`

Ejemplo:

Bacon:

- precio de compra: 8 €
- cantidad comprada: 1 kg
- cantidad normalizada: 1000 g

Cálculo:

`8 / 1000 = 0.008`

Resultado:

`0.008 €/g`

---

## Coste de una cantidad utilizada

Fórmula:

`costeUtilizado = costeUnidadBase × cantidadUtilizada`

Ejemplo:

Bacon:

- coste base: 0.008 €/g
- cantidad utilizada: 30 g

Cálculo:

`0.008 × 30 = 0.24`

Resultado:

`0.24 €`

---

## Coste total de un producto

El coste total de un producto es la suma del coste de todos sus ingredientes.

Fórmula:

`costeProducto = suma(costeIngredienteUtilizado)`

No guardar manualmente el coste total si puede recalcularse desde los ingredientes.

---

## Reglas de precisión

No redondear durante los cálculos intermedios.

Mantener toda la precisión disponible durante:

- conversiones,
- coste por unidad base,
- coste utilizado,
- suma de ingredientes.

Redondear únicamente para mostrar datos al usuario.

Ejemplo:

Internamente:

`0.008333333333`

Puede mostrarse como:

`0.0083 €/g`

pero no debe modificarse el valor interno antes de realizar otros cálculos.

---

## Reglas de conversión

Nunca convertir automáticamente entre tipos de medida diferentes.

No convertir:

- gramos ↔ mililitros
- gramos ↔ unidades
- mililitros ↔ unidades

salvo que exista una equivalencia específica para ese ingrediente.

Ejemplo:

No asumir:

`100 ml = 100 g`

aunque pueda ser aproximadamente cierto para algunos líquidos.

---

## Ingredientes comprados por peso pero usados por unidades

Si un ingrediente se compra por kg pero se utiliza por unidad, loncha o pieza, se necesita una equivalencia explícita.

Ejemplo:

Queso:

- precio de compra: 12 €/kg
- uso en receta: 1 loncha

No calcular automáticamente el coste de una loncha.

Se necesita conocer, por ejemplo:

`1 loncha = 20 g`

Entonces:

`costeLoncha = costePorGramo × 20`

---

## Validación

No realizar cálculos si:

- el precio de compra es negativo,
- la cantidad comprada es cero,
- la cantidad comprada es negativa,
- falta la unidad,
- la unidad no es compatible con el tipo de medida.

El precio de compra puede ser cero.

Una cantidad comprada debe ser siempre mayor que cero.

---

## Datos almacenados

Guardar los datos originales del ingrediente:

- id,
- nombre,
- precio de compra,
- cantidad comprada,
- unidad de compra.

No guardar valores derivados que puedan recalcularse fácilmente, como:

- coste por gramo,
- coste por mililitro,
- coste por unidad.

Estos valores deben calcularse cuando sean necesarios.

---

## Identificadores

Cada ingrediente debe tener un ID único independiente del nombre.

No usar el nombre del ingrediente como identificador.

Ejemplo:

Correcto:

`id: "ingredient-123"`

Incorrecto:

`id: "bacon"`

---

## Nombres

Al comprobar ingredientes duplicados:

- ignorar espacios al principio y al final,
- ignorar diferencias entre mayúsculas y minúsculas.

Ejemplo:

Estos nombres deben considerarse iguales:

`Bacon`

`bacon`

` BACON `

---

## Ejemplos de referencia

### Ejemplo 1

Bacon:

- precio: 8 €
- cantidad: 1 kg

Resultado:

`0.008 €/g`

---

### Ejemplo 2

Queso:

- precio: 8 €
- cantidad: 500 g

Resultado:

`0.016 €/g`

---

### Ejemplo 3

Aceite:

- precio: 6 €
- cantidad: 1.5 l

Conversión:

`1.5 l = 1500 ml`

Resultado:

`6 / 1500 = 0.004 €/ml`

---

### Ejemplo 4

Huevos:

- precio: 3 €
- cantidad: 6 unidades

Resultado:

`0.50 €/unidad`

---

## Principio general

Cuando exista duda sobre una conversión, no inventar una equivalencia.

Es preferible pedir el dato necesario antes que producir un coste incorrecto.

La prioridad es que los cálculos de Essenza sean consistentes, trazables y reproducibles.
