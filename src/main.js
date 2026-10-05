import './styles.css';
import {
  calculateIngredientCost,
  calculateProductIndicators,
  classifyFoodCost,
  purchaseUnits,
} from './calculations.js';
import {
  createProductComparisonRows,
  filterAndSortProductComparisonRows,
} from './product-comparison.js';
import {
  normalizeName,
  PRODUCT_CATEGORIES,
  validateIngredients,
  validateProducts,
  validateSales,
} from './data-validation.js';
import {
  createBackupDocument,
  parseBackupText,
  replaceStoredData,
} from './backup.js';
import {
  calculateSaleTotals,
  getLocalDateString,
  getSaleValidationError,
  summarizeSalesByDate,
} from './sales.js';

function formatNumber(value) {
  // Los valores diminutos usan notación científica para no mostrarse como cero.
  return new Intl.NumberFormat('es-ES', {
    maximumFractionDigits: 8,
    ...(value > 0 && value < 0.00000001
      ? { notation: 'scientific', maximumSignificantDigits: 6 }
      : {}),
  }).format(value);
}

const form = document.querySelector('#ingredient-form');
const formTitle = document.querySelector('#form-title');
const submitButton = document.querySelector('#submit-button');
const cancelEditButton = document.querySelector('#cancel-edit-button');
const costOutput = document.querySelector('#unit-cost');
const detailOutput = document.querySelector('#calculation-detail');
const saveMessage = document.querySelector('#save-message');
const listMessage = document.querySelector('#list-message');
const ingredientList = document.querySelector('#ingredient-list');
const showArchivedInput = document.querySelector('#show-archived');
const storageKey = 'essenza.ingredients';
const productForm = document.querySelector('#product-form');
const productFormTitle = document.querySelector('#product-form-title');
const saveProductButton = document.querySelector('#save-product-button');
const cancelProductEditButton = document.querySelector('#cancel-product-edit-button');
const recipeLines = document.querySelector('#recipe-lines');
const addRecipeLineButton = document.querySelector('#add-recipe-line');
const recipeMessage = document.querySelector('#recipe-message');
const productCalculationMessage = document.querySelector('#product-calculation-message');
const productCostOutput = document.querySelector('#product-cost');
const productMarginOutput = document.querySelector('#product-margin');
const productMarginPercentOutput = document.querySelector('#product-margin-percent');
const productFoodCostOutput = document.querySelector('#product-food-cost');
const productSaveMessage = document.querySelector('#product-save-message');
const productListMessage = document.querySelector('#product-list-message');
const productList = document.querySelector('#product-list');
const showArchivedProductsInput = document.querySelector('#show-archived-products');
const comparisonCategoryInput = document.querySelector('#comparison-category');
const comparisonSortInput = document.querySelector('#comparison-sort');
const comparisonDirectionInput = document.querySelector('#comparison-direction');
const comparisonMessage = document.querySelector('#comparison-message');
const comparisonTableWrapper = document.querySelector('.comparison-table-wrapper');
const comparisonBody = document.querySelector('#comparison-body');
const simulatorProductInput = document.querySelector('#simulator-product');
const simulatorPriceInput = document.querySelector('#simulator-price');
const simulatorMessage = document.querySelector('#simulator-message');
const applySimulatedPriceButton = document.querySelector('#apply-simulated-price');
const discardSimulationButton = document.querySelector('#discard-simulation');
const saleForm = document.querySelector('#sale-form');
const saleFormTitle = document.querySelector('#sale-form-title');
const saleDateInput = document.querySelector('#sale-date');
const saleProductInput = document.querySelector('#sale-product');
const saleUnitsInput = document.querySelector('#sale-units');
const saveSaleButton = document.querySelector('#save-sale-button');
const cancelSaleEditButton = document.querySelector('#cancel-sale-edit-button');
const salePreviewMessage = document.querySelector('#sale-preview-message');
const saleUnitPriceOutput = document.querySelector('#sale-unit-price');
const saleUnitCostOutput = document.querySelector('#sale-unit-cost');
const saleRevenueOutput = document.querySelector('#sale-revenue');
const saleMarginOutput = document.querySelector('#sale-margin');
const saleSaveMessage = document.querySelector('#sale-save-message');
const salesDateFilterInput = document.querySelector('#sales-date-filter');
const dailyUnitsOutput = document.querySelector('#daily-units');
const dailyRevenueOutput = document.querySelector('#daily-revenue');
const dailyCostOutput = document.querySelector('#daily-cost');
const dailyMarginOutput = document.querySelector('#daily-margin');
const salesListMessage = document.querySelector('#sales-list-message');
const salesTableWrapper = document.querySelector('#sales-table-wrapper');
const salesBody = document.querySelector('#sales-body');
const exportBackupButton = document.querySelector('#export-backup');
const importBackupInput = document.querySelector('#import-backup-file');
const restoreBackupButton = document.querySelector('#restore-backup');
const backupMessage = document.querySelector('#backup-message');
const backupSummary = document.querySelector('#backup-summary');
const currentSimulatorOutputs = {
  price: document.querySelector('#current-simulator-price'),
  cost: document.querySelector('#current-simulator-cost'),
  margin: document.querySelector('#current-simulator-margin'),
  marginPercent: document.querySelector('#current-simulator-margin-percent'),
  foodCost: document.querySelector('#current-simulator-food-cost'),
  status: document.querySelector('#current-food-cost-status'),
};
const simulatedOutputs = {
  price: document.querySelector('#simulated-price'),
  cost: document.querySelector('#simulated-cost'),
  margin: document.querySelector('#simulated-margin'),
  marginPercent: document.querySelector('#simulated-margin-percent'),
  foodCost: document.querySelector('#simulated-food-cost'),
  status: document.querySelector('#simulated-food-cost-status'),
};
const productStorageKey = 'essenza.products';
const salesStorageKey = 'essenza.sales';
const productCategories = new Set(PRODUCT_CATEGORIES);
const storageKeys = { ingredients: storageKey, products: productStorageKey, sales: salesStorageKey };
let editingIngredientId = null;
let editingOriginalData = null;
let editingProductId = null;
let editingOriginalProductData = null;
let productFormDirty = false;
let simulatorProductData = null;
let simulatorOriginalProductData = null;
let simulatorIngredientSnapshot = null;
let simulatorDirty = false;
let editingSaleId = null;
let editingOriginalSaleData = null;
let saleFormDirty = false;
let salePreviewProductSignature = null;
let pendingBackup = null;

function getStoredData(ingredient) {
  return {
    name: ingredient.name,
    price: ingredient.price,
    quantity: ingredient.quantity,
    unit: ingredient.unit,
    archived: ingredient.archived === true,
  };
}

function sameStoredData(first, second) {
  return JSON.stringify(getStoredData(first)) === JSON.stringify(getStoredData(second));
}

function readIngredients() {
  const stored = localStorage.getItem(storageKey);
  if (stored === null) return [];
  const ingredients = JSON.parse(stored);
  return validateIngredients(ingredients);
}

function writeIngredients(ingredients) {
  localStorage.setItem(storageKey, JSON.stringify(ingredients));
}

function readProducts() {
  const stored = localStorage.getItem(productStorageKey);
  if (stored === null) return [];
  const products = JSON.parse(stored);
  return validateProducts(products);
}

function writeProducts(products) {
  localStorage.setItem(productStorageKey, JSON.stringify(products));
}

function readSales() {
  const stored = localStorage.getItem(salesStorageKey);
  if (stored === null) return [];
  const sales = JSON.parse(stored);
  return validateSales(sales);
}

function writeSales(sales) {
  localStorage.setItem(salesStorageKey, JSON.stringify(sales));
}

function getStoredProductData(product) {
  return {
    name: product.name,
    category: product.category,
    salePrice: product.salePrice,
    recipe: product.recipe,
    archived: product.archived === true,
  };
}

function sameStoredProductData(first, second) {
  return JSON.stringify(getStoredProductData(first)) === JSON.stringify(getStoredProductData(second));
}

function cloneProduct(product) {
  return {
    ...product,
    recipe: product.recipe.map((line) => ({ ...line })),
  };
}

function getSimulatorIngredientSnapshot(product, ingredients) {
  const ingredientMap = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
  return JSON.stringify(product.recipe.map((line) => {
    const ingredient = ingredientMap.get(line.ingredientId);
    return ingredient ? { id: ingredient.id, ...getStoredData(ingredient) } : null;
  }));
}

function resetSimulatorOutputs(outputs, description) {
  outputs.price.textContent = '—';
  outputs.cost.textContent = '—';
  outputs.margin.textContent = '—';
  outputs.marginPercent.textContent = '—';
  outputs.foodCost.textContent = '—';
  outputs.margin.classList.remove('negative-value');
  outputs.marginPercent.classList.remove('negative-value');
  outputs.status.className = 'food-cost-status is-neutral';
  outputs.status.querySelector('.status-name').textContent = 'Sin calcular';
  outputs.status.querySelector('.status-description').textContent = description;
}

function renderFoodCostStatus(element, foodCostPercent) {
  const status = classifyFoodCost(foodCostPercent);
  element.className = `food-cost-status is-${status.key}`;
  element.querySelector('.status-name').textContent = status.label;
  element.querySelector('.status-description').textContent = status.description;
}

function renderSimulatorOutputs(outputs, price, result) {
  outputs.price.textContent = `${formatNumber(price)} €`;
  outputs.cost.textContent = `${formatNumber(result.totalCost)} €`;
  outputs.margin.textContent = `${formatNumber(result.marginAmount)} €`;
  outputs.marginPercent.textContent = `${formatNumber(result.marginPercent)} %`;
  outputs.foodCost.textContent = `${formatNumber(result.foodCostPercent)} %`;
  outputs.margin.classList.toggle('negative-value', result.marginAmount < 0);
  outputs.marginPercent.classList.toggle('negative-value', result.marginPercent < 0);
  renderFoodCostStatus(outputs.status, result.foodCostPercent);
}

function clearPriceSimulator(message = 'Selecciona un producto para empezar.') {
  simulatorProductData = null;
  simulatorOriginalProductData = null;
  simulatorIngredientSnapshot = null;
  simulatorDirty = false;
  simulatorProductInput.value = '';
  simulatorPriceInput.value = '';
  simulatorPriceInput.disabled = true;
  applySimulatedPriceButton.disabled = true;
  discardSimulationButton.disabled = true;
  simulatorMessage.textContent = message;
  resetSimulatorOutputs(currentSimulatorOutputs, 'Selecciona un producto.');
  resetSimulatorOutputs(simulatedOutputs, 'Introduce un precio válido.');
}

function updateSimulatorCalculation(ingredients) {
  if (!simulatorProductData) {
    clearPriceSimulator();
    return;
  }

  const currentResult = calculateProductIndicators(simulatorProductData, ingredients);
  if (currentResult.error) {
    resetSimulatorOutputs(currentSimulatorOutputs, 'No se puede calcular este producto.');
    currentSimulatorOutputs.price.textContent = `${formatNumber(simulatorProductData.salePrice)} €`;
    resetSimulatorOutputs(simulatedOutputs, 'Corrige primero la receta del producto.');
    simulatorDirty = false;
    applySimulatedPriceButton.disabled = true;
    discardSimulationButton.disabled = true;
    simulatorMessage.textContent = `No se puede simular este producto: ${currentResult.error}`;
    return;
  }
  renderSimulatorOutputs(currentSimulatorOutputs, simulatorProductData.salePrice, currentResult);

  const rawPrice = simulatorPriceInput.value.trim();
  const simulatedPrice = simulatorPriceInput.valueAsNumber;
  simulatorDirty = rawPrice === '' || !Number.isFinite(simulatedPrice)
    || simulatedPrice !== simulatorProductData.salePrice;
  discardSimulationButton.disabled = !simulatorDirty;

  if (!Number.isFinite(simulatedPrice) || simulatedPrice <= 0) {
    resetSimulatorOutputs(simulatedOutputs, 'Introduce un precio mayor que cero.');
    applySimulatedPriceButton.disabled = true;
    simulatorMessage.textContent = 'Introduce un precio temporal válido, mayor que cero.';
    return;
  }

  const simulatedProduct = { ...simulatorProductData, salePrice: simulatedPrice };
  const simulatedResult = calculateProductIndicators(simulatedProduct, ingredients);
  if (simulatedResult.error) {
    resetSimulatorOutputs(simulatedOutputs, 'No se puede calcular esta simulación.');
    simulatedOutputs.price.textContent = `${formatNumber(simulatedPrice)} €`;
    applySimulatedPriceButton.disabled = true;
    simulatorMessage.textContent = simulatedResult.error;
    return;
  }

  renderSimulatorOutputs(simulatedOutputs, simulatedPrice, simulatedResult);
  const hasPriceChange = simulatedPrice !== simulatorProductData.salePrice;
  applySimulatedPriceButton.disabled = !hasPriceChange;
  simulatorMessage.textContent = hasPriceChange
    ? 'Simulación temporal lista. El precio guardado todavía no ha cambiado.'
    : 'El precio simulado coincide con el precio guardado.';
}

function loadSimulatorProduct(product, ingredients, { preservePrice = null } = {}) {
  simulatorProductData = cloneProduct(product);
  simulatorOriginalProductData = cloneProduct(product);
  simulatorIngredientSnapshot = getSimulatorIngredientSnapshot(product, ingredients);
  simulatorProductInput.value = product.id;
  simulatorPriceInput.disabled = false;
  simulatorPriceInput.value = preservePrice ?? product.salePrice;
  updateSimulatorCalculation(ingredients);
}

function refreshPriceSimulator(ingredients) {
  let products;
  try {
    products = readProducts();
  } catch {
    simulatorProductInput.replaceChildren();
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Productos no disponibles';
    simulatorProductInput.append(option);
    simulatorProductInput.disabled = true;
    clearPriceSimulator('No se pueden recuperar los productos para el simulador.');
    return;
  }

  const activeProducts = products.filter((product) => product.archived !== true);
  const selectedId = simulatorProductData?.id ?? '';
  const preservedPrice = simulatorDirty ? simulatorPriceInput.value : null;
  simulatorProductInput.replaceChildren();
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = activeProducts.length
    ? 'Selecciona un producto'
    : 'No hay productos activos';
  simulatorProductInput.append(placeholder);
  for (const product of activeProducts) {
    const option = document.createElement('option');
    option.value = product.id;
    option.textContent = product.name;
    simulatorProductInput.append(option);
  }
  simulatorProductInput.disabled = activeProducts.length === 0;

  const selectedProduct = activeProducts.find((product) => product.id === selectedId);
  if (selectedProduct) {
    loadSimulatorProduct(selectedProduct, ingredients, { preservePrice: preservedPrice });
  } else {
    clearPriceSimulator(activeProducts.length
      ? 'Selecciona un producto para empezar.'
      : 'Necesitas al menos un producto activo para usar el simulador.');
  }
}

function createActionButton(text, action, ingredientId, secondary = false) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = text;
  button.dataset.action = action;
  button.dataset.ingredientId = ingredientId;
  if (secondary) button.classList.add('secondary-button');
  return button;
}

function renderIngredients(ingredients) {
  ingredientList.replaceChildren();
  const showArchived = showArchivedInput.checked;
  const visibleIngredients = ingredients.filter((ingredient) => showArchived || ingredient.archived !== true);
  const activeCount = ingredients.filter((ingredient) => ingredient.archived !== true).length;

  if (!ingredients.length) {
    listMessage.textContent = 'Todavía no hay ingredientes guardados.';
  } else if (!visibleIngredients.length && activeCount === 0) {
    listMessage.textContent = 'No hay ingredientes activos. Activa “Mostrar archivados” para recuperarlos.';
  } else {
    listMessage.textContent = '';
  }

  for (const ingredient of visibleIngredients) {
    const result = calculateIngredientCost(ingredient);
    const item = document.createElement('li');
    const title = document.createElement('h3');
    const purchase = document.createElement('p');
    const cost = document.createElement('p');
    const actions = document.createElement('div');
    const purchaseUnit = ingredient.unit === 'unit' ? 'unidades' : ingredient.unit;
    const isArchived = ingredient.archived === true;

    title.textContent = ingredient.name;
    purchase.textContent = `Compra: ${formatNumber(ingredient.price)} € (IVA incluido) por ${formatNumber(ingredient.quantity)} ${purchaseUnit}.`;
    cost.textContent = `Coste: ${formatNumber(result.unitCost)} €/${result.baseUnit}.`;
    cost.className = 'ingredient-cost';
    actions.className = 'ingredient-actions';

    if (isArchived) {
      const archivedLabel = document.createElement('span');
      archivedLabel.className = 'archived-label';
      archivedLabel.textContent = 'Archivado';
      item.classList.add('is-archived');
      actions.append(createActionButton('Restaurar', 'restore', ingredient.id));
      item.append(archivedLabel, title, purchase, cost, actions);
    } else {
      actions.append(
        createActionButton('Editar', 'edit', ingredient.id),
        createActionButton('Archivar', 'archive', ingredient.id, true),
      );
      item.append(title, purchase, cost, actions);
    }
    ingredientList.append(item);
  }
}

function renderStoredIngredients() {
  try {
    renderIngredients(readIngredients());
    return true;
  } catch {
    ingredientList.replaceChildren();
    listMessage.textContent = 'No se pueden recuperar los ingredientes. Los datos pueden estar dañados o el almacenamiento estar bloqueado. No se han sobrescrito.';
    return false;
  }
}

function readFormIngredient() {
  return {
    name: form.elements.name.value.trim(),
    price: form.elements.price.valueAsNumber,
    quantity: form.elements.quantity.valueAsNumber,
    unit: form.elements.unit.value,
  };
}

function resetResult() {
  costOutput.textContent = '—';
  detailOutput.textContent = 'Completa los datos para calcular el coste.';
}

function finishEditing({ focus = true } = {}) {
  editingIngredientId = null;
  editingOriginalData = null;
  form.reset();
  formTitle.textContent = 'Datos de compra';
  submitButton.textContent = 'Guardar ingrediente';
  cancelEditButton.hidden = true;
  resetResult();
  if (focus) form.elements.name.focus();
}

function updateResult() {
  const ingredient = readFormIngredient();
  const result = calculateIngredientCost(ingredient);

  if (result.error) {
    costOutput.textContent = '—';
    detailOutput.textContent = result.error;
    return;
  }
  if (editingOriginalData
    && purchaseUnits[editingOriginalData.unit].type !== purchaseUnits[ingredient.unit].type) {
    costOutput.textContent = '—';
    detailOutput.textContent = 'No puedes cambiar entre masa, volumen y unidades. Mantén el mismo tipo de medida.';
    return;
  }

  costOutput.textContent = `${formatNumber(result.unitCost)} €/${result.baseUnit}`;
  detailOutput.textContent = `${ingredient.name}: ${formatNumber(ingredient.price)} € ÷ ${formatNumber(result.baseQuantity)} ${result.baseUnit}.`;
}

function startEditing(ingredient) {
  editingIngredientId = ingredient.id;
  editingOriginalData = { ...ingredient };
  form.elements.name.value = ingredient.name;
  form.elements.price.value = ingredient.price;
  form.elements.quantity.value = ingredient.quantity;
  form.elements.unit.value = ingredient.unit;
  formTitle.textContent = 'Editar ingrediente';
  submitButton.textContent = 'Guardar cambios';
  cancelEditButton.hidden = false;
  saveMessage.textContent = `Editando ${ingredient.name}.`;
  updateResult();
  form.elements.name.focus();
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function confirmDiscardEdit() {
  return editingIngredientId === null
    || window.confirm('Hay una edición sin guardar. ¿Quieres descartarla?');
}

function hasDuplicateName(ingredients, ingredient, ignoredId = null) {
  return ingredients.some((saved) => saved.id !== ignoredId
    && normalizeName(saved.name) === normalizeName(ingredient.name));
}

form.addEventListener('input', updateResult);
form.addEventListener('change', updateResult);
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const ingredient = readFormIngredient();
  const result = calculateIngredientCost(ingredient);
  if (result.error) {
    saveMessage.textContent = result.error;
    return;
  }

  let ingredients;
  try {
    // Releer evita sustituir silenciosamente datos modificados desde otra pestaña.
    ingredients = readIngredients();
  } catch {
    saveMessage.textContent = 'No se pueden leer los datos guardados. Pueden estar dañados o el almacenamiento estar bloqueado. No se han sobrescrito.';
    return;
  }

  if (hasDuplicateName(ingredients, ingredient, editingIngredientId)) {
    saveMessage.textContent = 'Ya existe un ingrediente activo o archivado con ese nombre.';
    return;
  }

  if (editingIngredientId !== null) {
    const ingredientIndex = ingredients.findIndex((saved) => saved.id === editingIngredientId);
    if (ingredientIndex === -1 || !sameStoredData(ingredients[ingredientIndex], editingOriginalData)) {
      saveMessage.textContent = 'Este ingrediente ha cambiado desde otra pestaña. Cancela la edición y vuelve a abrirlo para cargar sus datos actuales.';
      return;
    }
    if (ingredients[ingredientIndex].archived === true) {
      saveMessage.textContent = 'Este ingrediente está archivado. Restáuralo antes de editarlo.';
      return;
    }
    if (purchaseUnits[ingredients[ingredientIndex].unit].type !== purchaseUnits[ingredient.unit].type) {
      saveMessage.textContent = 'No puedes cambiar entre masa, volumen y unidades. Solo se permiten kg ↔ g, l ↔ ml o unidad ↔ unidad.';
      return;
    }
    ingredients[ingredientIndex] = { ...ingredients[ingredientIndex], ...ingredient };
  } else {
    ingredient.id = crypto.randomUUID();
    ingredients.unshift(ingredient);
  }

  try {
    writeIngredients(ingredients);
  } catch {
    saveMessage.textContent = editingIngredientId === null
      ? 'No se ha podido guardar el ingrediente. El almacenamiento puede estar bloqueado o lleno. Los datos del formulario se conservan.'
      : 'No se han podido guardar los cambios. El almacenamiento puede estar bloqueado o lleno. Los datos del formulario se conservan.';
    return;
  }

  const wasEditing = editingIngredientId !== null;
  renderIngredients(ingredients);
  refreshProductFeatures(ingredients);
  finishEditing();
  saveMessage.textContent = wasEditing
    ? 'Cambios guardados en este navegador.'
    : 'Ingrediente guardado en este navegador.';
});

cancelEditButton.addEventListener('click', () => {
  finishEditing();
  renderStoredIngredients();
  saveMessage.textContent = 'Edición cancelada. No se han realizado cambios.';
});

showArchivedInput.addEventListener('change', renderStoredIngredients);

ingredientList.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const { action, ingredientId } = button.dataset;
  let ingredients;
  try {
    ingredients = readIngredients();
  } catch {
    saveMessage.textContent = 'No se pueden leer los datos guardados. No se han sobrescrito.';
    return;
  }
  const ingredientIndex = ingredients.findIndex((ingredient) => ingredient.id === ingredientId);
  if (ingredientIndex === -1) {
    saveMessage.textContent = 'El ingrediente ya no está disponible. Se ha actualizado el listado.';
    renderIngredients(ingredients);
    return;
  }
  const ingredient = ingredients[ingredientIndex];

  if (action === 'edit') {
    if (ingredient.archived === true) {
      saveMessage.textContent = 'Restaura el ingrediente antes de editarlo.';
      return;
    }
    if (!confirmDiscardEdit()) return;
    startEditing(ingredient);
    return;
  }

  if (action === 'archive') {
    const isBeingEdited = editingIngredientId === ingredient.id;
    const message = isBeingEdited
      ? `Estás editando ${ingredient.name}. ¿Quieres descartar la edición y archivarlo? Podrás restaurarlo después.`
      : `¿Quieres archivar ${ingredient.name}? Podrás restaurarlo después.`;
    if (!window.confirm(message)) return;
    ingredient.archived = true;
  } else if (action === 'restore') {
    ingredient.archived = false;
  } else {
    return;
  }

  try {
    writeIngredients(ingredients);
  } catch {
    saveMessage.textContent = `No se ha podido ${action === 'archive' ? 'archivar' : 'restaurar'} el ingrediente. No se han guardado cambios.`;
    return;
  }

  if (editingIngredientId === ingredient.id) finishEditing({ focus: false });
  renderIngredients(ingredients);
  refreshProductFeatures(ingredients);
  saveMessage.textContent = action === 'archive'
    ? `${ingredient.name} se ha archivado.`
    : `${ingredient.name} se ha restaurado.`;
  if (action === 'archive') {
    showArchivedInput.focus();
  } else {
    ingredientList.querySelector(`[data-action="edit"][data-ingredient-id="${CSS.escape(ingredient.id)}"]`)?.focus();
  }
});

function resetProductIndicators(message = 'Completa el producto y su receta para calcularlos.') {
  productCalculationMessage.textContent = message;
  productCostOutput.textContent = '—';
  productMarginOutput.textContent = '—';
  productMarginPercentOutput.textContent = '—';
  productFoodCostOutput.textContent = '—';
  productMarginOutput.classList.remove('negative-value');
  productMarginPercentOutput.classList.remove('negative-value');
}

function getProductFormData() {
  return {
    name: productForm.elements.productName.value.trim(),
    category: productForm.elements.category.value,
    salePrice: productForm.elements.salePrice.valueAsNumber,
    recipe: [...recipeLines.querySelectorAll('.recipe-line')].map((line) => ({
      ingredientId: line.querySelector('.recipe-ingredient').value,
      quantity: line.querySelector('.recipe-quantity').valueAsNumber,
    })),
  };
}

function hasDuplicateProductName(products, product, ignoredId = null) {
  return products.some((saved) => saved.id !== ignoredId
    && normalizeName(saved.name) === normalizeName(product.name));
}

function getOriginalArchivedIngredientIds(ingredients) {
  if (!editingOriginalProductData) return new Set();
  const ingredientMap = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
  return new Set(editingOriginalProductData.recipe
    .filter((line) => ingredientMap.get(line.ingredientId)?.archived === true)
    .map((line) => line.ingredientId));
}

function hasUnapprovedArchivedIngredient(product, ingredients) {
  const ingredientMap = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
  const preservedIds = getOriginalArchivedIngredientIds(ingredients);
  return product.recipe.some((line) => ingredientMap.get(line.ingredientId)?.archived === true
    && !preservedIds.has(line.ingredientId));
}

function confirmDiscardProductForm() {
  return (!productFormDirty && editingProductId === null)
    || window.confirm('Hay datos del producto sin guardar. ¿Quieres descartarlos?');
}

function getActiveIngredients(ingredients) {
  return ingredients.filter((ingredient) => ingredient.archived !== true);
}

function updateRecipeSelectOptions(ingredients) {
  const selects = [...recipeLines.querySelectorAll('.recipe-ingredient')];
  const selectedIds = selects.map((select) => select.value).filter(Boolean);
  const ingredientMap = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));

  for (const select of selects) {
    const currentValue = select.value;
    select.replaceChildren();
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Selecciona un ingrediente';
    select.append(placeholder);

    for (const ingredient of getActiveIngredients(ingredients)) {
      const option = document.createElement('option');
      option.value = ingredient.id;
      option.textContent = ingredient.name;
      option.disabled = ingredient.id !== currentValue && selectedIds.includes(ingredient.id);
      select.append(option);
    }

    const currentIngredient = ingredientMap.get(currentValue);
    if (currentValue && (!currentIngredient || currentIngredient.archived === true)) {
      const unavailableOption = document.createElement('option');
      unavailableOption.value = currentValue;
      unavailableOption.textContent = currentIngredient
        ? `${currentIngredient.name} (archivado)`
        : 'Ingrediente no disponible';
      unavailableOption.disabled = true;
      select.append(unavailableOption);
    }
    select.value = currentValue;
  }
}

function updateRecipeLineDetails(ingredients) {
  const ingredientMap = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
  const preservedArchivedIds = getOriginalArchivedIngredientIds(ingredients);
  for (const line of recipeLines.querySelectorAll('.recipe-line')) {
    const ingredient = ingredientMap.get(line.querySelector('.recipe-ingredient').value);
    const quantity = line.querySelector('.recipe-quantity').valueAsNumber;
    const unitOutput = line.querySelector('.recipe-unit');
    const costOutput = line.querySelector('.recipe-line-cost');
    if (!ingredient) {
      unitOutput.textContent = '—';
      costOutput.textContent = 'Selecciona un ingrediente.';
      continue;
    }
    const cost = calculateIngredientCost(ingredient);
    unitOutput.textContent = cost.error ? '—' : cost.baseUnit;
    if (ingredient.archived === true && preservedArchivedIds.has(ingredient.id)) {
      costOutput.textContent = Number.isFinite(quantity) && quantity > 0 && !cost.error
        ? `Ingrediente archivado conservado · coste de esta línea: ${formatNumber(cost.unitCost * quantity)} €`
        : 'Ingrediente archivado conservado. Introduce una cantidad mayor que cero.';
    } else if (ingredient.archived === true) {
      costOutput.textContent = 'Este ingrediente está archivado y no se puede añadir.';
    } else if (!Number.isFinite(quantity) || quantity <= 0 || cost.error) {
      costOutput.textContent = 'Introduce una cantidad mayor que cero.';
    } else {
      costOutput.textContent = `Coste de esta línea: ${formatNumber(cost.unitCost * quantity)} €`;
    }
  }
}

function createRecipeLine(ingredients, initialRecipeLine = null) {
  const activeIngredients = getActiveIngredients(ingredients);
  const selectedIds = [...recipeLines.querySelectorAll('.recipe-ingredient')]
    .map((select) => select.value)
    .filter(Boolean);
  const firstAvailable = activeIngredients.find((ingredient) => !selectedIds.includes(ingredient.id));
  if (!initialRecipeLine && !firstAvailable) {
    recipeMessage.textContent = activeIngredients.length
      ? 'Ya has añadido todos los ingredientes activos disponibles.'
      : 'Necesitas al menos un ingrediente activo para crear una receta.';
    return;
  }

  const lineId = crypto.randomUUID();
  const line = document.createElement('div');
  line.className = 'recipe-line';
  line.innerHTML = `
    <div class="field recipe-ingredient-field">
      <label for="recipe-ingredient-${lineId}">Ingrediente</label>
      <select id="recipe-ingredient-${lineId}" class="recipe-ingredient"></select>
    </div>
    <div class="field recipe-quantity-field">
      <label for="recipe-quantity-${lineId}">Cantidad utilizada</label>
      <div class="quantity-with-unit">
        <input id="recipe-quantity-${lineId}" class="recipe-quantity" type="number" min="0" step="any" inputmode="decimal" placeholder="0" />
        <span class="recipe-unit" aria-label="Unidad base">—</span>
      </div>
    </div>
    <button class="remove-recipe-line secondary-button" type="button" aria-label="Quitar ingrediente de la receta">Quitar</button>
    <p class="recipe-line-cost"></p>
  `;
  recipeLines.append(line);
  const select = line.querySelector('.recipe-ingredient');
  const selectedIngredientId = initialRecipeLine?.ingredientId ?? firstAvailable.id;
  // La opción temporal permite que el selector conserve también una referencia archivada o inexistente.
  const initialOption = document.createElement('option');
  initialOption.value = selectedIngredientId;
  initialOption.textContent = selectedIngredientId;
  select.append(initialOption);
  select.value = selectedIngredientId;
  if (initialRecipeLine) line.querySelector('.recipe-quantity').value = initialRecipeLine.quantity;
  updateRecipeSelectOptions(ingredients);
  updateRecipeSelectOptions(ingredients);
  updateRecipeLineDetails(ingredients);
  recipeMessage.textContent = '';
}

function updateAddRecipeLineButton(ingredients) {
  const activeIngredientIds = new Set(getActiveIngredients(ingredients).map((ingredient) => ingredient.id));
  const selectedActiveCount = new Set([...recipeLines.querySelectorAll('.recipe-ingredient')]
    .map((select) => select.value)
    .filter((ingredientId) => activeIngredientIds.has(ingredientId))).size;
  addRecipeLineButton.disabled = activeIngredientIds.size === 0
    || selectedActiveCount >= activeIngredientIds.size;
}

function updateProductCalculation(ingredients) {
  updateRecipeLineDetails(ingredients);
  const product = getProductFormData();
  const result = calculateProductIndicators(product, ingredients);
  if (result.error) {
    resetProductIndicators(result.error);
    return;
  }
  if (hasUnapprovedArchivedIngredient(product, ingredients)) {
    resetProductIndicators('No puedes añadir ingredientes archivados a la receta.');
    return;
  }
  productCalculationMessage.textContent = 'Cálculo actual de una unidad vendida.';
  productCostOutput.textContent = `${formatNumber(result.totalCost)} €`;
  productMarginOutput.textContent = `${formatNumber(result.marginAmount)} €`;
  productMarginPercentOutput.textContent = `${formatNumber(result.marginPercent)} %`;
  productFoodCostOutput.textContent = `${formatNumber(result.foodCostPercent)} %`;
  productMarginOutput.classList.toggle('negative-value', result.marginAmount < 0);
  productMarginPercentOutput.classList.toggle('negative-value', result.marginPercent < 0);
}

function createIndicatorList(result) {
  const indicators = document.createElement('dl');
  indicators.className = 'saved-indicators';
  const values = [
    ['Coste', `${formatNumber(result.totalCost)} €`],
    ['Margen', `${formatNumber(result.marginAmount)} €`],
    ['Margen %', `${formatNumber(result.marginPercent)} %`],
    ['Food cost', `${formatNumber(result.foodCostPercent)} %`],
  ];
  for (const [label, value] of values) {
    const container = document.createElement('div');
    const term = document.createElement('dt');
    const description = document.createElement('dd');
    term.textContent = label;
    description.textContent = value;
    if (label.startsWith('Margen') && value.startsWith('-')) description.className = 'negative-value';
    container.append(term, description);
    indicators.append(container);
  }
  return indicators;
}

function formatProductCategory(category) {
  return category === 'Bolleria' ? 'Bollería' : category;
}

function createComparisonCell(label, content, className = '') {
  const cell = document.createElement('td');
  cell.dataset.label = label;
  cell.textContent = content;
  if (className) cell.className = className;
  return cell;
}

function createNotCalculableCell(label) {
  return createComparisonCell(label, 'No calculable', 'not-calculable-value');
}

function renderProductComparison(products, ingredients) {
  comparisonBody.replaceChildren();
  const rows = createProductComparisonRows(products, ingredients);
  const visibleRows = filterAndSortProductComparisonRows(rows, {
    category: comparisonCategoryInput.value,
    sortBy: comparisonSortInput.value,
    direction: comparisonDirectionInput.value,
  });

  if (!rows.length) {
    comparisonMessage.textContent = 'Necesitas al menos un producto activo para crear la comparativa.';
    comparisonTableWrapper.hidden = true;
    return;
  }
  if (!visibleRows.length) {
    comparisonMessage.textContent = 'No hay productos activos en la categoría seleccionada.';
    comparisonTableWrapper.hidden = true;
    return;
  }

  comparisonTableWrapper.hidden = false;
  comparisonMessage.textContent = visibleRows.length === 1
    ? 'Mostrando 1 producto activo.'
    : `Mostrando ${visibleRows.length} productos activos.`;

  for (const row of visibleRows) {
    const tableRow = document.createElement('tr');
    const name = document.createElement('th');
    name.scope = 'row';
    name.dataset.label = 'Producto';
    name.textContent = row.product.name;
    const category = createComparisonCell('Categoría', formatProductCategory(row.product.category));
    const price = createComparisonCell('Precio', `${formatNumber(row.product.salePrice)} €`, 'numeric-value');

    if (!row.calculable) {
      tableRow.className = 'is-not-calculable';
      tableRow.append(
        name,
        category,
        createNotCalculableCell('Coste'),
        price,
        createNotCalculableCell('Margen €'),
        createNotCalculableCell('Margen %'),
        createNotCalculableCell('Food cost'),
      );
      const statusCell = createComparisonCell('Semáforo', 'No calculable', 'not-calculable-value');
      statusCell.title = row.error;
      tableRow.append(statusCell);
    } else {
      const { indicators, status } = row;
      const marginAmountClass = indicators.marginAmount < 0 ? 'numeric-value negative-value' : 'numeric-value';
      const marginPercentClass = indicators.marginPercent < 0 ? 'numeric-value negative-value' : 'numeric-value';
      const statusCell = document.createElement('td');
      const statusLabel = document.createElement('span');
      statusCell.dataset.label = 'Semáforo';
      statusLabel.className = `comparison-status is-${status.key}`;
      statusLabel.textContent = status.label;
      statusLabel.title = status.description;
      statusCell.append(statusLabel);
      tableRow.append(
        name,
        category,
        createComparisonCell('Coste', `${formatNumber(indicators.totalCost)} €`, 'numeric-value'),
        price,
        createComparisonCell('Margen €', `${formatNumber(indicators.marginAmount)} €`, marginAmountClass),
        createComparisonCell('Margen %', `${formatNumber(indicators.marginPercent)} %`, marginPercentClass),
        createComparisonCell('Food cost', `${formatNumber(indicators.foodCostPercent)} %`, 'numeric-value'),
        statusCell,
      );
    }
    comparisonBody.append(tableRow);
  }
}

function refreshProductComparison(knownIngredients = null, knownProducts = null) {
  try {
    const ingredients = knownIngredients ?? readIngredients();
    const products = knownProducts ?? readProducts();
    renderProductComparison(products, ingredients);
  } catch {
    comparisonBody.replaceChildren();
    comparisonTableWrapper.hidden = true;
    comparisonMessage.textContent = 'No se puede preparar la comparativa. Los datos pueden estar dañados o el almacenamiento estar bloqueado.';
  }
}

function createProductActionButton(text, action, productId, secondary = false) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = text;
  button.dataset.action = action;
  button.dataset.productId = productId;
  if (secondary) button.classList.add('secondary-button');
  return button;
}

function renderProducts(products, ingredients) {
  productList.replaceChildren();
  const showArchived = showArchivedProductsInput.checked;
  const visibleProducts = products.filter((product) => showArchived || product.archived !== true);
  const activeCount = products.filter((product) => product.archived !== true).length;
  if (!products.length) {
    productListMessage.textContent = 'Todavía no hay productos guardados.';
  } else if (!visibleProducts.length && activeCount === 0) {
    productListMessage.textContent = 'No hay productos activos. Activa “Mostrar archivados” para recuperarlos.';
  } else {
    productListMessage.textContent = '';
  }
  const ingredientMap = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));

  for (const product of visibleProducts) {
    const item = document.createElement('li');
    const category = document.createElement('span');
    const title = document.createElement('h4');
    const salePrice = document.createElement('p');
    const recipeTitle = document.createElement('p');
    const recipe = document.createElement('ul');
    const actions = document.createElement('div');
    const result = calculateProductIndicators(product, ingredients);
    const isArchived = product.archived === true;
    category.className = 'product-category';
    category.textContent = formatProductCategory(product.category);
    title.textContent = product.name;
    salePrice.className = 'product-sale-price';
    salePrice.textContent = `Precio de venta: ${formatNumber(product.salePrice)} € (IVA incluido)`;
    recipeTitle.className = 'recipe-title';
    recipeTitle.textContent = 'Receta para una unidad';
    recipe.className = 'saved-recipe';
    actions.className = 'product-actions';

    if (isArchived) {
      const archivedLabel = document.createElement('span');
      archivedLabel.className = 'archived-label';
      archivedLabel.textContent = 'Archivado';
      item.classList.add('is-archived');
      item.append(archivedLabel);
      actions.append(createProductActionButton('Restaurar', 'restore', product.id));
    } else {
      actions.append(
        createProductActionButton('Editar', 'edit', product.id),
        createProductActionButton('Archivar', 'archive', product.id, true),
      );
    }

    for (const recipeLine of product.recipe) {
      const ingredient = ingredientMap.get(recipeLine.ingredientId);
      const line = document.createElement('li');
      if (!ingredient) {
        line.textContent = `Ingrediente no disponible · ${formatNumber(recipeLine.quantity)}`;
        line.className = 'recipe-warning';
      } else {
        const ingredientCost = calculateIngredientCost(ingredient);
        line.textContent = `${ingredient.name}: ${formatNumber(recipeLine.quantity)} ${ingredientCost.error ? '—' : ingredientCost.baseUnit}`;
        if (ingredient.archived === true) {
          line.textContent += ' · archivado';
          line.className = 'recipe-warning';
        }
      }
      recipe.append(line);
    }

    item.append(category, title, salePrice, recipeTitle, recipe);
    if (result.error) {
      const error = document.createElement('p');
      error.className = 'product-error';
      error.textContent = `Coste no calculable: ${result.error}`;
      item.append(error);
    } else {
      item.append(createIndicatorList(result));
    }
    item.append(actions);
    productList.append(item);
  }
}

function renderStoredProducts(ingredients) {
  try {
    renderProducts(readProducts(), ingredients);
    return true;
  } catch {
    productList.replaceChildren();
    productListMessage.textContent = 'No se pueden recuperar los productos. Los datos pueden estar dañados o el almacenamiento estar bloqueado. No se han sobrescrito.';
    return false;
  }
}

function finishProductEditing(ingredients, { focus = true } = {}) {
  editingProductId = null;
  editingOriginalProductData = null;
  productForm.reset();
  recipeLines.replaceChildren();
  productFormTitle.textContent = 'Nuevo producto';
  saveProductButton.textContent = 'Guardar producto';
  cancelProductEditButton.hidden = true;
  productFormDirty = false;
  refreshProductFeatures(ingredients);
  productFormDirty = false;
  if (focus) productForm.elements.productName.focus();
}

function startEditingProduct(product, ingredients) {
  editingProductId = product.id;
  editingOriginalProductData = {
    ...product,
    recipe: product.recipe.map((line) => ({ ...line })),
  };
  productForm.elements.productName.value = product.name;
  productForm.elements.category.value = product.category;
  productForm.elements.salePrice.value = product.salePrice;
  recipeLines.replaceChildren();
  for (const recipeLine of product.recipe) createRecipeLine(ingredients, recipeLine);
  productFormTitle.textContent = 'Editar producto';
  saveProductButton.textContent = 'Guardar cambios';
  cancelProductEditButton.hidden = false;
  productSaveMessage.textContent = `Editando ${product.name}.`;
  productFormDirty = false;
  updateAddRecipeLineButton(ingredients);
  updateProductCalculation(ingredients);
  productForm.elements.productName.focus();
  productForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function refreshProductFeatures(knownIngredients = null) {
  let ingredients = knownIngredients;
  if (!ingredients) {
    try {
      ingredients = readIngredients();
    } catch {
      recipeMessage.textContent = 'No se pueden leer los ingredientes guardados.';
      resetProductIndicators('No se pueden calcular productos sin ingredientes válidos.');
      return;
    }
  }
  updateRecipeSelectOptions(ingredients);
  if (!recipeLines.children.length) createRecipeLine(ingredients);
  updateRecipeSelectOptions(ingredients);
  updateAddRecipeLineButton(ingredients);
  updateProductCalculation(ingredients);
  renderStoredProducts(ingredients);
  refreshProductComparison(ingredients);
  refreshPriceSimulator(ingredients);
  refreshSales(null, ingredients);
}

addRecipeLineButton.addEventListener('click', () => {
  let ingredients;
  try {
    ingredients = readIngredients();
  } catch {
    recipeMessage.textContent = 'No se pueden leer los ingredientes guardados.';
    return;
  }
  createRecipeLine(ingredients);
  productFormDirty = true;
  updateAddRecipeLineButton(ingredients);
  updateProductCalculation(ingredients);
});

recipeLines.addEventListener('input', () => {
  try {
    const ingredients = readIngredients();
    updateRecipeSelectOptions(ingredients);
    updateAddRecipeLineButton(ingredients);
    updateProductCalculation(ingredients);
  } catch {
    resetProductIndicators('No se pueden leer los ingredientes guardados.');
  }
});

recipeLines.addEventListener('change', () => {
  try {
    const ingredients = readIngredients();
    updateRecipeSelectOptions(ingredients);
    updateAddRecipeLineButton(ingredients);
    updateProductCalculation(ingredients);
  } catch {
    resetProductIndicators('No se pueden leer los ingredientes guardados.');
  }
});

recipeLines.addEventListener('click', (event) => {
  const removeButton = event.target.closest('.remove-recipe-line');
  if (!removeButton) return;
  removeButton.closest('.recipe-line').remove();
  productFormDirty = true;
  try {
    const ingredients = readIngredients();
    updateRecipeSelectOptions(ingredients);
    updateAddRecipeLineButton(ingredients);
    updateProductCalculation(ingredients);
  } catch {
    resetProductIndicators('No se pueden leer los ingredientes guardados.');
  }
});

productForm.addEventListener('input', () => {
  productFormDirty = true;
  try {
    updateProductCalculation(readIngredients());
  } catch {
    resetProductIndicators('No se pueden leer los ingredientes guardados.');
  }
});

productForm.addEventListener('change', () => {
  productFormDirty = true;
});

cancelProductEditButton.addEventListener('click', () => {
  try {
    finishProductEditing(readIngredients());
    productSaveMessage.textContent = 'Edición cancelada. No se han realizado cambios.';
  } catch {
    productSaveMessage.textContent = 'No se pueden leer los ingredientes guardados. No se ha modificado el producto.';
  }
});

showArchivedProductsInput.addEventListener('change', () => {
  try {
    renderProducts(readProducts(), readIngredients());
  } catch {
    productList.replaceChildren();
    productListMessage.textContent = 'No se pueden recuperar los productos. Los datos pueden estar dañados o el almacenamiento estar bloqueado. No se han sobrescrito.';
  }
});

for (const control of [comparisonCategoryInput, comparisonSortInput, comparisonDirectionInput]) {
  control.addEventListener('change', () => refreshProductComparison());
}

simulatorProductInput.addEventListener('change', () => {
  const requestedProductId = simulatorProductInput.value;
  if (simulatorProductData && requestedProductId !== simulatorProductData.id && simulatorDirty
    && !window.confirm('Hay una simulación sin aplicar. ¿Quieres descartarla y cambiar de producto?')) {
    simulatorProductInput.value = simulatorProductData.id;
    return;
  }
  if (!requestedProductId) {
    clearPriceSimulator();
    return;
  }

  try {
    const ingredients = readIngredients();
    const product = readProducts().find((saved) => saved.id === requestedProductId
      && saved.archived !== true);
    if (!product) {
      refreshPriceSimulator(ingredients);
      simulatorMessage.textContent = 'El producto ya no está activo o disponible.';
      return;
    }
    loadSimulatorProduct(product, ingredients);
  } catch {
    clearPriceSimulator('No se pueden leer los datos guardados. No se ha modificado ningún precio.');
  }
});

simulatorPriceInput.addEventListener('input', () => {
  try {
    updateSimulatorCalculation(readIngredients());
  } catch {
    applySimulatedPriceButton.disabled = true;
    simulatorMessage.textContent = 'No se pueden leer los ingredientes. El precio guardado no se ha modificado.';
  }
});

discardSimulationButton.addEventListener('click', () => {
  if (!simulatorProductData) return;
  simulatorPriceInput.value = simulatorProductData.salePrice;
  try {
    updateSimulatorCalculation(readIngredients());
    simulatorMessage.textContent = 'Simulación descartada. Se muestra de nuevo el precio guardado.';
    simulatorPriceInput.focus();
  } catch {
    clearPriceSimulator('No se pueden leer los datos guardados. No se ha modificado ningún precio.');
  }
});

applySimulatedPriceButton.addEventListener('click', () => {
  if (!simulatorProductData || applySimulatedPriceButton.disabled) return;
  if (editingProductId === simulatorProductData.id) {
    simulatorMessage.textContent = 'Este producto se está editando. Guarda o cancela esa edición antes de aplicar el precio simulado.';
    return;
  }

  const simulatedPrice = simulatorPriceInput.valueAsNumber;
  let ingredients;
  let products;
  try {
    ingredients = readIngredients();
    products = readProducts();
  } catch {
    simulatorMessage.textContent = 'No se pueden leer los datos guardados. El precio no se ha modificado.';
    return;
  }

  const productIndex = products.findIndex((product) => product.id === simulatorProductData.id);
  const currentProduct = products[productIndex];
  if (!currentProduct || currentProduct.archived === true) {
    refreshPriceSimulator(ingredients);
    simulatorMessage.textContent = 'El producto ya no está activo o disponible. El precio no se ha modificado.';
    return;
  }
  if (!sameStoredProductData(currentProduct, simulatorOriginalProductData)) {
    loadSimulatorProduct(currentProduct, ingredients, { preservePrice: simulatorPriceInput.value });
    simulatorMessage.textContent = 'El producto ha cambiado desde que abriste la simulación. Revisa los datos actualizados antes de aplicar el precio.';
    return;
  }
  if (getSimulatorIngredientSnapshot(currentProduct, ingredients) !== simulatorIngredientSnapshot) {
    loadSimulatorProduct(currentProduct, ingredients, { preservePrice: simulatorPriceInput.value });
    simulatorMessage.textContent = 'Los costes de esta receta han cambiado. Revisa el resultado actualizado antes de aplicar el precio.';
    return;
  }

  const simulatedResult = calculateProductIndicators(
    { ...currentProduct, salePrice: simulatedPrice },
    ingredients,
  );
  if (simulatedResult.error || !Number.isFinite(simulatedPrice) || simulatedPrice <= 0
    || simulatedPrice === currentProduct.salePrice) {
    updateSimulatorCalculation(ingredients);
    return;
  }

  const confirmation = `Cambiar el precio de “${currentProduct.name}” de ${formatNumber(currentProduct.salePrice)} € a ${formatNumber(simulatedPrice)} €. ¿Quieres continuar?`;
  if (!window.confirm(confirmation)) {
    simulatorMessage.textContent = 'No se ha aplicado el precio. La simulación sigue disponible.';
    return;
  }

  let latestIngredients;
  let latestProducts;
  try {
    latestIngredients = readIngredients();
    latestProducts = readProducts();
  } catch {
    simulatorMessage.textContent = 'No se pueden volver a comprobar los datos. El precio no se ha modificado.';
    return;
  }
  const latestIndex = latestProducts.findIndex((product) => product.id === currentProduct.id);
  const latestProduct = latestProducts[latestIndex];
  if (!latestProduct || latestProduct.archived === true
    || !sameStoredProductData(latestProduct, currentProduct)
    || getSimulatorIngredientSnapshot(latestProduct, latestIngredients)
      !== getSimulatorIngredientSnapshot(currentProduct, ingredients)) {
    refreshPriceSimulator(latestIngredients);
    simulatorMessage.textContent = 'Los datos cambiaron durante la confirmación. Revisa la simulación; el precio no se ha modificado.';
    return;
  }

  latestProducts[latestIndex] = { ...latestProduct, salePrice: simulatedPrice };
  try {
    writeProducts(latestProducts);
  } catch {
    simulatorMessage.textContent = 'No se ha podido guardar el precio. La simulación se conserva y no se han realizado cambios.';
    return;
  }

  const updatedProduct = latestProducts[latestIndex];
  renderProducts(latestProducts, latestIngredients);
  renderProductComparison(latestProducts, latestIngredients);
  loadSimulatorProduct(updatedProduct, latestIngredients);
  refreshSales(latestProducts, latestIngredients);
  simulatorMessage.textContent = `Precio de ${updatedProduct.name} actualizado en este navegador.`;
});

productList.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const { action, productId } = button.dataset;
  let ingredients;
  let products;
  try {
    ingredients = readIngredients();
    products = readProducts();
  } catch {
    productSaveMessage.textContent = 'No se pueden leer los datos guardados. No se han sobrescrito.';
    return;
  }
  const productIndex = products.findIndex((product) => product.id === productId);
  if (productIndex === -1) {
    productSaveMessage.textContent = 'El producto ya no está disponible. Se ha actualizado el listado.';
    renderProducts(products, ingredients);
    return;
  }
  const product = products[productIndex];

  if (action === 'edit') {
    if (product.archived === true) {
      productSaveMessage.textContent = 'Restaura el producto antes de editarlo.';
      return;
    }
    if (!confirmDiscardProductForm()) return;
    if (simulatorProductData?.id === product.id && simulatorDirty
      && !window.confirm('Hay una simulación pendiente para este producto. ¿Quieres descartarla y editar el producto?')) return;
    if (simulatorProductData?.id === product.id) loadSimulatorProduct(product, ingredients);
    startEditingProduct(product, ingredients);
    return;
  }

  if (action === 'archive') {
    const isBeingEdited = editingProductId === product.id;
    const hasPendingSimulation = simulatorProductData?.id === product.id && simulatorDirty;
    const message = isBeingEdited
      ? `Estás editando ${product.name}. ¿Quieres descartar la edición y archivarlo? Podrás restaurarlo después.`
      : hasPendingSimulation
        ? `Hay una simulación pendiente para ${product.name}. ¿Quieres descartarla y archivar el producto? Podrás restaurarlo después.`
        : `¿Quieres archivar ${product.name}? Podrás restaurarlo después.`;
    if (!window.confirm(message)) return;
    product.archived = true;
  } else if (action === 'restore') {
    product.archived = false;
  } else {
    return;
  }

  try {
    writeProducts(products);
  } catch {
    productSaveMessage.textContent = `No se ha podido ${action === 'archive' ? 'archivar' : 'restaurar'} el producto. No se han guardado cambios.`;
    return;
  }

  if (editingProductId === product.id) {
    finishProductEditing(ingredients, { focus: false });
  } else {
    renderProducts(products, ingredients);
    renderProductComparison(products, ingredients);
    refreshPriceSimulator(ingredients);
    refreshSales(products, ingredients);
  }
  productSaveMessage.textContent = action === 'archive'
    ? `${product.name} se ha archivado.`
    : `${product.name} se ha restaurado.`;
  if (action === 'archive') {
    showArchivedProductsInput.focus();
  } else {
    productList.querySelector(`[data-action="edit"][data-product-id="${CSS.escape(product.id)}"]`)?.focus();
  }
});

productForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const product = getProductFormData();
  if (!product.name) {
    productSaveMessage.textContent = 'Introduce el nombre del producto.';
    return;
  }
  if (!productCategories.has(product.category)) {
    productSaveMessage.textContent = 'Selecciona una categoría válida.';
    return;
  }

  let ingredients;
  let products;
  try {
    ingredients = readIngredients();
    products = readProducts();
  } catch {
    productSaveMessage.textContent = 'No se pueden leer los datos guardados. Pueden estar dañados o el almacenamiento estar bloqueado. No se han sobrescrito.';
    return;
  }
  if (hasDuplicateProductName(products, product, editingProductId)) {
    productSaveMessage.textContent = 'Ya existe un producto activo o archivado con ese nombre.';
    return;
  }
  if (hasUnapprovedArchivedIngredient(product, ingredients)) {
    productSaveMessage.textContent = 'No puedes añadir un ingrediente archivado. Solo puedes conservar los que ya estaban en esta receta.';
    refreshProductFeatures(ingredients);
    return;
  }
  const result = calculateProductIndicators(product, ingredients);
  if (result.error) {
    productSaveMessage.textContent = result.error;
    return;
  }

  if (editingProductId !== null) {
    const productIndex = products.findIndex((saved) => saved.id === editingProductId);
    if (productIndex === -1
      || !sameStoredProductData(products[productIndex], editingOriginalProductData)) {
      productSaveMessage.textContent = 'Este producto ha cambiado desde otra pestaña. Cancela la edición y vuelve a abrirlo para cargar sus datos actuales.';
      return;
    }
    if (products[productIndex].archived === true) {
      productSaveMessage.textContent = 'Este producto está archivado. Restáuralo antes de editarlo.';
      return;
    }
    products[productIndex] = { ...products[productIndex], ...product };
  } else {
    product.id = crypto.randomUUID();
    products.unshift(product);
  }
  try {
    writeProducts(products);
  } catch {
    productSaveMessage.textContent = editingProductId === null
      ? 'No se ha podido guardar el producto. El almacenamiento puede estar bloqueado o lleno. Los datos del formulario se conservan.'
      : 'No se han podido guardar los cambios. El almacenamiento puede estar bloqueado o lleno. Los datos del formulario se conservan.';
    return;
  }

  const wasEditing = editingProductId !== null;
  finishProductEditing(ingredients);
  renderProducts(products, ingredients);
  productSaveMessage.textContent = wasEditing
    ? 'Cambios guardados en este navegador.'
    : 'Producto guardado en este navegador.';
});

function formatCalendarDate(date) {
  const [year, month, day] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(year, month - 1, day));
}

function getSaleProductSignature(product, ingredients) {
  return JSON.stringify({
    product: getStoredProductData(product),
    ingredients: getSimulatorIngredientSnapshot(product, ingredients),
  });
}

function resetSalePreview(message = 'Completa la venta para calcular el resultado.') {
  salePreviewProductSignature = null;
  salePreviewMessage.textContent = message;
  saleUnitPriceOutput.textContent = '—';
  saleUnitCostOutput.textContent = '—';
  saleRevenueOutput.textContent = '—';
  saleMarginOutput.textContent = '—';
  saleMarginOutput.classList.remove('negative-value');
}

function renderSalePreview(sale, message) {
  const totals = calculateSaleTotals(sale);
  if (totals.error) {
    resetSalePreview(totals.error);
    return;
  }
  salePreviewMessage.textContent = message;
  saleUnitPriceOutput.textContent = `${formatNumber(sale.unitSalePrice)} €`;
  saleUnitCostOutput.textContent = `${formatNumber(sale.unitCost)} €`;
  saleRevenueOutput.textContent = `${formatNumber(totals.revenue)} €`;
  saleMarginOutput.textContent = `${formatNumber(totals.grossMargin)} €`;
  saleMarginOutput.classList.toggle('negative-value', totals.grossMargin < 0);
}

function populateSaleProducts(products) {
  const currentValue = saleProductInput.value || editingOriginalSaleData?.productId || '';
  saleProductInput.replaceChildren();
  const placeholder = document.createElement('option');
  placeholder.value = '';
  const activeProducts = products.filter((product) => product.archived !== true);
  placeholder.textContent = activeProducts.length ? 'Selecciona un producto' : 'No hay productos activos';
  saleProductInput.append(placeholder);

  for (const product of activeProducts) {
    const option = document.createElement('option');
    option.value = product.id;
    option.textContent = product.name;
    saleProductInput.append(option);
  }

  if (editingOriginalSaleData && !activeProducts.some((product) => product.id === editingOriginalSaleData.productId)) {
    const storedProduct = products.find((product) => product.id === editingOriginalSaleData.productId);
    const unavailable = document.createElement('option');
    unavailable.value = editingOriginalSaleData.productId;
    unavailable.textContent = storedProduct ? `${storedProduct.name} (archivado)` : 'Producto no disponible';
    unavailable.disabled = true;
    saleProductInput.append(unavailable);
  }
  saleProductInput.value = currentValue;
  saleProductInput.disabled = activeProducts.length === 0 && editingOriginalSaleData === null;
}

function updateSalePreview(knownProducts = null, knownIngredients = null) {
  const units = saleUnitsInput.valueAsNumber;
  const productId = saleProductInput.value;
  if (!productId || !Number.isSafeInteger(units) || units <= 0) {
    resetSalePreview(!productId
      ? 'Selecciona un producto e introduce unidades enteras mayores que cero.'
      : 'Las unidades vendidas deben ser un número entero mayor que cero.');
    return;
  }

  if (editingOriginalSaleData && productId === editingOriginalSaleData.productId) {
    renderSalePreview({ ...editingOriginalSaleData, units }, 'Se conservan el precio y el coste históricos de esta venta.');
    return;
  }

  try {
    const products = knownProducts ?? readProducts();
    const ingredients = knownIngredients ?? readIngredients();
    const product = products.find((item) => item.id === productId && item.archived !== true);
    if (!product) {
      resetSalePreview('El producto ya no está activo o disponible.');
      return;
    }
    const indicators = calculateProductIndicators(product, ingredients);
    if (indicators.error) {
      resetSalePreview(`No se puede registrar este producto: ${indicators.error}`);
      return;
    }
    salePreviewProductSignature = getSaleProductSignature(product, ingredients);
    renderSalePreview({
      id: editingSaleId ?? 'vista-previa',
      date: saleDateInput.value || getLocalDateString(),
      productId,
      units,
      unitSalePrice: product.salePrice,
      unitCost: indicators.totalCost,
    }, 'Vista previa con el precio y el coste actuales. Se guardarán como datos históricos.');
  } catch {
    resetSalePreview('No se pueden leer los productos o ingredientes guardados.');
  }
}

function createSaleTableCell(label, content, className = '') {
  const cell = document.createElement('td');
  cell.dataset.label = label;
  cell.textContent = content;
  if (className) cell.className = className;
  return cell;
}

function renderDailySales(sales, products) {
  salesBody.replaceChildren();
  const selectedDate = salesDateFilterInput.value || getLocalDateString();
  salesDateFilterInput.value = selectedDate;
  const summary = summarizeSalesByDate(sales, selectedDate);
  if (summary.error) {
    dailyUnitsOutput.textContent = '—';
    dailyRevenueOutput.textContent = '—';
    dailyCostOutput.textContent = '—';
    dailyMarginOutput.textContent = '—';
    dailyMarginOutput.classList.remove('negative-value');
    salesTableWrapper.hidden = true;
    salesListMessage.hidden = false;
    salesListMessage.textContent = `No se puede calcular el resumen: ${summary.error}`;
    return;
  }

  dailyUnitsOutput.textContent = formatNumber(summary.units);
  dailyRevenueOutput.textContent = `${formatNumber(summary.revenue)} €`;
  dailyCostOutput.textContent = `${formatNumber(summary.totalCost)} €`;
  dailyMarginOutput.textContent = `${formatNumber(summary.grossMargin)} €`;
  dailyMarginOutput.classList.toggle('negative-value', summary.grossMargin < 0);
  salesListMessage.hidden = summary.records.length > 0;
  salesTableWrapper.hidden = summary.records.length === 0;
  salesListMessage.textContent = `Todavía no hay ventas registradas para el ${formatCalendarDate(selectedDate)}.`;
  const productMap = new Map(products.map((product) => [product.id, product]));

  for (const sale of summary.records) {
    const totals = calculateSaleTotals(sale);
    const product = productMap.get(sale.productId);
    const row = document.createElement('tr');
    const name = document.createElement('th');
    name.scope = 'row';
    name.dataset.label = 'Producto';
    name.textContent = product?.name ?? 'Producto no disponible';
    if (!product) name.className = 'sale-product-missing';
    const actionsCell = document.createElement('td');
    actionsCell.dataset.label = 'Acciones';
    const actions = document.createElement('div');
    actions.className = 'sale-actions';
    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.textContent = 'Editar';
    editButton.dataset.saleAction = 'edit';
    editButton.dataset.saleId = sale.id;
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.textContent = 'Eliminar';
    deleteButton.className = 'secondary-button';
    deleteButton.dataset.saleAction = 'delete';
    deleteButton.dataset.saleId = sale.id;
    actions.append(editButton, deleteButton);
    actionsCell.append(actions);
    const marginClass = totals.grossMargin < 0 ? 'numeric-value negative-value' : 'numeric-value';
    row.append(
      name,
      createSaleTableCell('Unidades', formatNumber(sale.units), 'numeric-value'),
      createSaleTableCell('Precio unidad', `${formatNumber(sale.unitSalePrice)} €`, 'numeric-value'),
      createSaleTableCell('Coste unidad', `${formatNumber(sale.unitCost)} €`, 'numeric-value'),
      createSaleTableCell('Ingresos', `${formatNumber(totals.revenue)} €`, 'numeric-value'),
      createSaleTableCell('Margen', `${formatNumber(totals.grossMargin)} €`, marginClass),
      actionsCell,
    );
    salesBody.append(row);
  }
}

function refreshSales(knownProducts = null, knownIngredients = null) {
  try {
    const products = knownProducts ?? readProducts();
    const ingredients = knownIngredients ?? readIngredients();
    const sales = readSales();
    populateSaleProducts(products);
    updateSalePreview(products, ingredients);
    renderDailySales(sales, products);
    return true;
  } catch {
    resetSalePreview('No se pueden recuperar los datos necesarios para registrar ventas.');
    salesBody.replaceChildren();
    salesTableWrapper.hidden = true;
    salesListMessage.hidden = false;
    salesListMessage.textContent = 'No se pueden recuperar las ventas. Los datos pueden estar dañados o el almacenamiento estar bloqueado. No se han sobrescrito.';
    return false;
  }
}

function finishSaleEditing({ focus = true } = {}) {
  editingSaleId = null;
  editingOriginalSaleData = null;
  saleFormDirty = false;
  saleForm.reset();
  saleDateInput.value = getLocalDateString();
  saleFormTitle.textContent = 'Registrar venta';
  saveSaleButton.textContent = 'Registrar venta';
  cancelSaleEditButton.hidden = true;
  refreshSales();
  saleFormDirty = false;
  if (focus) saleDateInput.focus();
}

function startEditingSale(sale) {
  editingSaleId = sale.id;
  editingOriginalSaleData = { ...sale };
  saleDateInput.value = sale.date;
  saleProductInput.value = sale.productId;
  saleUnitsInput.value = sale.units;
  saleFormTitle.textContent = 'Editar venta';
  saveSaleButton.textContent = 'Guardar cambios';
  cancelSaleEditButton.hidden = false;
  saleFormDirty = false;
  refreshSales();
  saleFormDirty = false;
  saleSaveMessage.textContent = 'Edita la fecha o las unidades para conservar los importes históricos. Si cambias el producto, se capturarán sus importes actuales.';
  saleForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
  saleDateInput.focus();
}

saleForm.addEventListener('input', () => {
  saleFormDirty = true;
  updateSalePreview();
});

saleForm.addEventListener('change', () => {
  saleFormDirty = true;
  updateSalePreview();
});

saleForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const date = saleDateInput.value;
  const productId = saleProductInput.value;
  const units = saleUnitsInput.valueAsNumber;
  let products;
  let ingredients;
  let sales;
  try {
    products = readProducts();
    ingredients = readIngredients();
    sales = readSales();
  } catch {
    saleSaveMessage.textContent = 'No se pueden leer los datos guardados. No se ha sobrescrito ninguna venta.';
    return;
  }

  let unitSalePrice;
  let unitCost;
  const keepsHistoricalValues = editingOriginalSaleData?.productId === productId;
  if (keepsHistoricalValues) {
    ({ unitSalePrice, unitCost } = editingOriginalSaleData);
  } else {
    const product = products.find((item) => item.id === productId && item.archived !== true);
    if (!product) {
      saleSaveMessage.textContent = 'Selecciona un producto activo y disponible.';
      refreshSales(products, ingredients);
      return;
    }
    const indicators = calculateProductIndicators(product, ingredients);
    if (indicators.error) {
      saleSaveMessage.textContent = `No se puede registrar este producto: ${indicators.error}`;
      refreshSales(products, ingredients);
      return;
    }
    const latestSignature = getSaleProductSignature(product, ingredients);
    if (latestSignature !== salePreviewProductSignature) {
      updateSalePreview(products, ingredients);
      saleSaveMessage.textContent = 'El precio, la receta o sus ingredientes han cambiado. Revisa la vista previa actualizada y vuelve a guardar.';
      return;
    }
    unitSalePrice = product.salePrice;
    unitCost = indicators.totalCost;
  }

  const sale = {
    id: editingSaleId ?? crypto.randomUUID(),
    date,
    productId,
    units,
    unitSalePrice,
    unitCost,
  };
  const validationError = getSaleValidationError(sale, { today: getLocalDateString() });
  if (validationError) {
    saleSaveMessage.textContent = validationError;
    return;
  }
  if (calculateSaleTotals(sale).error) {
    saleSaveMessage.textContent = calculateSaleTotals(sale).error;
    return;
  }

  if (editingSaleId !== null) {
    const index = sales.findIndex((saved) => saved.id === editingSaleId);
    if (index === -1 || JSON.stringify(sales[index]) !== JSON.stringify(editingOriginalSaleData)) {
      saleSaveMessage.textContent = 'Esta venta ha cambiado desde otra pestaña. Cancela la edición y vuelve a abrirla.';
      refreshSales(products, ingredients);
      return;
    }
    sales[index] = sale;
  } else {
    sales.unshift(sale);
  }

  try {
    writeSales(sales);
  } catch {
    saleSaveMessage.textContent = 'No se ha podido guardar la venta. El formulario se conserva y no se han realizado cambios.';
    return;
  }
  const wasEditing = editingSaleId !== null;
  salesDateFilterInput.value = date;
  finishSaleEditing({ focus: false });
  saleSaveMessage.textContent = wasEditing
    ? 'Cambios guardados. Los importes históricos se han conservado según el producto seleccionado.'
    : 'Venta registrada con su precio y coste históricos.';
  saveSaleButton.focus();
});

cancelSaleEditButton.addEventListener('click', () => {
  finishSaleEditing();
  saleSaveMessage.textContent = 'Edición cancelada. No se ha modificado la venta.';
});

salesDateFilterInput.addEventListener('change', () => {
  try {
    renderDailySales(readSales(), readProducts());
  } catch {
    salesListMessage.hidden = false;
    salesListMessage.textContent = 'No se pueden recuperar las ventas guardadas.';
  }
});

salesBody.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-sale-action]');
  if (!button) return;
  const { saleAction, saleId } = button.dataset;
  let sales;
  try {
    sales = readSales();
  } catch {
    saleSaveMessage.textContent = 'No se pueden leer las ventas guardadas. No se ha modificado ningún dato.';
    return;
  }
  const sale = sales.find((item) => item.id === saleId);
  if (!sale) {
    saleSaveMessage.textContent = 'La venta ya no está disponible. Se ha actualizado el resumen.';
    refreshSales();
    return;
  }

  if (saleAction === 'edit') {
    if (saleFormDirty && !window.confirm('Hay datos de otra venta sin guardar. ¿Quieres descartarlos?')) return;
    startEditingSale(sale);
    return;
  }
  if (saleAction !== 'delete') return;
  const product = (() => {
    try { return readProducts().find((item) => item.id === sale.productId); } catch { return null; }
  })();
  const message = `Eliminar definitivamente la venta de ${sale.units} ${sale.units === 1 ? 'unidad' : 'unidades'} de “${product?.name ?? 'Producto no disponible'}” del ${formatCalendarDate(sale.date)}. Usa esta acción solo para corregir un registro erróneo. ¿Quieres continuar?`;
  if (!window.confirm(message)) return;

  let latestSales;
  try {
    latestSales = readSales();
    const latestIndex = latestSales.findIndex((item) => item.id === sale.id);
    if (latestIndex === -1 || JSON.stringify(latestSales[latestIndex]) !== JSON.stringify(sale)) {
      saleSaveMessage.textContent = 'La venta cambió durante la confirmación. No se ha eliminado.';
      refreshSales();
      return;
    }
    latestSales.splice(latestIndex, 1);
    writeSales(latestSales);
  } catch {
    saleSaveMessage.textContent = 'No se ha podido eliminar la venta. No se han guardado cambios.';
    return;
  }
  if (editingSaleId === sale.id) finishSaleEditing({ focus: false });
  else refreshSales();
  saleSaveMessage.textContent = 'Venta eliminada definitivamente como corrección del registro.';
  salesDateFilterInput.focus();
});

function clearPendingBackup(message = '') {
  pendingBackup = null;
  restoreBackupButton.disabled = true;
  backupSummary.replaceChildren();
  backupMessage.textContent = message;
}

function addBackupSummaryItem(label, value) {
  const item = document.createElement('li');
  const strong = document.createElement('strong');
  strong.textContent = String(value);
  item.append(strong, ` ${label}`);
  backupSummary.append(item);
}

function formatCount(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function renderBackupSummary(summary, fileName) {
  backupSummary.replaceChildren();
  addBackupSummaryItem(summary.ingredients === 1 ? 'ingrediente' : 'ingredientes', summary.ingredients);
  addBackupSummaryItem(summary.products === 1 ? 'producto' : 'productos', summary.products);
  addBackupSummaryItem(summary.sales === 1 ? 'venta' : 'ventas', summary.sales);
  addBackupSummaryItem('ingredientes archivados', summary.archivedIngredients);
  addBackupSummaryItem('productos archivados', summary.archivedProducts);
  if (summary.productsWithMissingIngredients > 0) {
    addBackupSummaryItem(
      summary.productsWithMissingIngredients === 1
        ? 'producto no calculable por referencias inexistentes'
        : 'productos no calculables por referencias inexistentes',
      summary.productsWithMissingIngredients,
    );
  }
  if (summary.salesWithMissingProducts > 0) {
    addBackupSummaryItem(
      summary.salesWithMissingProducts === 1
        ? 'venta con producto inexistente'
        : 'ventas con productos inexistentes',
      summary.salesWithMissingProducts,
    );
  }
  backupMessage.textContent = summary.clearsSales
    ? `“${fileName}” es una copia válida de formato 1. No contiene ventas: restaurarla dejará la lista de ventas vacía.`
    : `“${fileName}” es una copia válida de formato 2. Revisa el resumen antes de restaurarla.`;
}

function hasPendingInterfaceChanges() {
  const ingredientHasData = editingIngredientId !== null
    || [...form.elements].some((control) => control instanceof HTMLInputElement
      && control.type !== 'checkbox' && control.value.trim() !== '');
  return ingredientHasData || productFormDirty || editingProductId !== null || simulatorDirty
    || saleFormDirty || editingSaleId !== null;
}

exportBackupButton.addEventListener('click', () => {
  let ingredients;
  let products;
  let sales;
  try {
    ingredients = readIngredients();
    products = readProducts();
    sales = readSales();
  } catch {
    clearPendingBackup('No se puede exportar: los datos guardados están dañados o no se pueden leer. No se ha generado ningún archivo.');
    return;
  }

  try {
    const backupDocument = createBackupDocument(ingredients, products, sales);
    const blob = new Blob([`${JSON.stringify(backupDocument, null, 2)}\n`], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `essenza-control-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    backupMessage.textContent = `Copia exportada con ${formatCount(ingredients.length, 'ingrediente')}, ${formatCount(products.length, 'producto')} y ${formatCount(sales.length, 'venta')}.`;
  } catch {
    backupMessage.textContent = 'No se ha podido generar o descargar la copia. Los datos guardados no se han modificado.';
  }
});

importBackupInput.addEventListener('change', async () => {
  const [file] = importBackupInput.files;
  clearPendingBackup();
  if (!file) return;

  let expectedRawValues;
  try {
    expectedRawValues = {
      ingredients: localStorage.getItem(storageKey),
      products: localStorage.getItem(productStorageKey),
      sales: localStorage.getItem(salesStorageKey),
    };
  } catch {
    clearPendingBackup('El navegador no permite acceder al almacenamiento. No se ha modificado ningún dato.');
    return;
  }

  backupMessage.textContent = 'Validando la copia seleccionada…';
  try {
    const parsed = parseBackupText(await file.text());
    pendingBackup = { ...parsed, expectedRawValues, fileName: file.name };
    renderBackupSummary(parsed.summary, file.name);
    restoreBackupButton.disabled = false;
    restoreBackupButton.focus();
  } catch (error) {
    importBackupInput.value = '';
    clearPendingBackup(`${error.message} No se ha modificado ningún dato.`);
  }
});

restoreBackupButton.addEventListener('click', () => {
  if (!pendingBackup) return;
  const { data, summary, expectedRawValues } = pendingBackup;
  const isEmpty = summary.ingredients === 0 && summary.products === 0 && summary.sales === 0;
  const missingReferenceWarning = summary.productsWithMissingIngredients > 0
    ? `\n\n${formatCount(summary.productsWithMissingIngredients, 'producto')} quedarán como no calculables porque contienen referencias a ingredientes inexistentes.`
    : '';
  const pendingChangesWarning = hasPendingInterfaceChanges()
    ? '\n\nLas ediciones, ventas pendientes o simulaciones sin guardar se descartarán solo si la restauración termina correctamente.'
    : '';
  const legacyWarning = summary.clearsSales
    ? '\n\nATENCIÓN: esta copia es de formato 1 y no contiene ventas. Al restaurarla se eliminarán todas las ventas locales actuales.'
    : '';
  const emptyWarning = isEmpty
    ? '\n\nATENCIÓN: esta copia está completamente vacía y eliminará todos los ingredientes, productos y ventas actuales.'
    : '';
  const missingSaleReferenceWarning = summary.salesWithMissingProducts > 0
    ? `\n\n${formatCount(summary.salesWithMissingProducts, 'venta')} tienen referencias a productos inexistentes. Mantendrán sus importes históricos.`
    : '';
  const confirmation = `Restaurar esta copia reemplazará todos los datos actuales por ${formatCount(summary.ingredients, 'ingrediente')}, ${formatCount(summary.products, 'producto')} y ${formatCount(summary.sales, 'venta')}.${emptyWarning}${legacyWarning}${missingReferenceWarning}${missingSaleReferenceWarning}${pendingChangesWarning}\n\n¿Quieres continuar?`;
  if (!window.confirm(confirmation)) {
    backupMessage.textContent = 'Restauración cancelada. La copia validada sigue preparada y no se ha modificado ningún dato.';
    return;
  }

  try {
    replaceStoredData(localStorage, storageKeys, data, expectedRawValues);
    const restoredIngredients = readIngredients();
    readProducts();
    readSales();
    finishEditing({ focus: false });
    finishProductEditing(restoredIngredients, { focus: false });
    finishSaleEditing({ focus: false });
    saveMessage.textContent = '';
    productSaveMessage.textContent = '';
    importBackupInput.value = '';
    clearPendingBackup(`Copia restaurada correctamente: ${formatCount(summary.ingredients, 'ingrediente')}, ${formatCount(summary.products, 'producto')} y ${formatCount(summary.sales, 'venta')}.`);
    exportBackupButton.focus();
  } catch (error) {
    backupMessage.textContent = error.message;
  }
});

const today = getLocalDateString();
saleDateInput.max = today;
salesDateFilterInput.max = today;
saleDateInput.value = today;
salesDateFilterInput.value = today;
renderStoredIngredients();
refreshProductFeatures();
