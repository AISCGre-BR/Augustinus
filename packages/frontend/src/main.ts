import { GregorianChantSVGRenderer, GregorioScore, ChantContext } from '@testneumz/nabc-lib';
import generateGabc, { defaultModels } from '@augustinus/core';
import type { Model, Parameters } from '@augustinus/core';

const models: Model[] = defaultModels.filter((model) => model.type !== 'salmo');
let renderer: any | null = null;
const psalmModels: Model[] = defaultModels.filter((model) => model.type === 'salmo');

const modelSelect = document.getElementById('model') as HTMLSelectElement;
const psalmSelect = document.getElementById('psalm') as HTMLSelectElement;
const repeatIntonationCheckbox = document.getElementById('repeatIntonation') as HTMLInputElement;
const separateStanzasCheckbox = document.getElementById('separateStanzas') as HTMLInputElement;
const doElisionCheckbox = document.getElementById('doElision') as HTMLInputElement;
const separatorInput = document.getElementById('separator') as HTMLInputElement;
const addOptionalStartCheckbox = document.getElementById('addOptionalStart') as HTMLInputElement;
const addOptionalEndCheckbox = document.getElementById('addOptionalEnd') as HTMLInputElement;
const removeNumbersCheckbox = document.getElementById('removeNumbers') as HTMLInputElement;
const removeParenthesisCheckbox = document.getElementById('removeParenthesis') as HTMLInputElement;
const removeSeparatorCheckbox = document.getElementById('removeSeparator') as HTMLInputElement;
const inputTextArea = document.getElementById('input') as HTMLTextAreaElement;
const metadataTextArea = document.getElementById('metadata') as HTMLTextAreaElement;
const gabcTextArea = document.getElementById('gabc') as HTMLTextAreaElement;
const generateButton = document.getElementById('generate') as HTMLButtonElement;
const chantContainer = document.getElementById('chant-container') as HTMLDivElement;

const customOptions = document.getElementById('custom-options') as HTMLDivElement;
const customSimplesOptions = document.getElementById('custom-simples-options') as HTMLDivElement;
const customSoleneOptions = document.getElementById('custom-solene-options') as HTMLDivElement;
const customNoteInput = document.getElementById('custom-note') as HTMLInputElement;
const customClefSelect = document.getElementById('custom-clef') as HTMLSelectElement;
const customPatternTextArea = document.getElementById('custom-pattern') as HTMLTextAreaElement;
const customStartInput = document.getElementById('custom-start') as HTMLInputElement;

const modelOption = document.getElementById('model-option') as HTMLDivElement;
const psalmControl = document.getElementById('psalm-controls') as HTMLDivElement;

function handleModelChange(event: Event) {
  const target = event.target as HTMLSelectElement;

  if (target === modelSelect) {
    psalmSelect.value = '';
  } else if (target === psalmSelect) {
    modelSelect.value = '';
  }

  updateCustomFields();
  handlePsalmOptions();
}

function updateCustomFields() {
  let selectedModel: Model | null = null;

  if (modelSelect.value) {
    const index = parseInt(modelSelect.value, 10);
    selectedModel = models[index] || null;
  } else if (psalmSelect.value) {
    const index = parseInt(psalmSelect.value, 10);
    selectedModel = psalmModels[index] || null;
  }

  if (!selectedModel) return;

  customStartInput.value = selectedModel.start || customStartInput.defaultValue;
  customPatternTextArea.value = selectedModel.default || customPatternTextArea.defaultValue;

  if (selectedModel.type === 'custom') {
    customOptions.style.display = 'block';
    if (selectedModel.tom === 'simples') {
      customSimplesOptions.style.display = 'block';
      customSoleneOptions.style.display = 'none';
    } else if (selectedModel.tom === 'solene') {
      customSimplesOptions.style.display = 'none';
      customSoleneOptions.style.display = 'block';
    }
  } else {
    customOptions.style.display = 'none';
  }
}

function handlePsalmOptions() {
  const selectedModelName = modelSelect.options[modelSelect.selectedIndex]?.text;
  const isPsalm = selectedModelName === 'Salmo';

  modelOption.style.display = psalmSelect.value !== '' ? 'none' : 'block';
  psalmControl.style.display = isPsalm || psalmSelect.value !== '' ? 'block' : 'none';
}

function gabcToSvg(gabc: string) {
  
  gabc = gabc.replaceAll(/\{([aeiou])~([aeiou]\})/gi, '{$1_$2}');

  if (renderer === null) {
    renderer = new GregorianChantSVGRenderer(chantContainer);
  }

  if (!gabc) {
    chantContainer.innerHTML = '';
    return;
  }

  try {
    const context = new ChantContext();
    const score = new GregorioScore(context);
    score.interprete(gabc);
    renderer.renderSvg(score);
  } catch (e) {
    console.error(e);
  }
}

function generate() {
  let selectedModel: Model | null = null;

  if (modelSelect.value) {
    const index = parseInt(modelSelect.value, 10);
    selectedModel = models[index] || null;
  } else if (psalmSelect.value) {
    const index = parseInt(psalmSelect.value, 10);
    selectedModel = psalmModels[index] || null;
  }

  const inputText = inputTextArea.value;

  if (!selectedModel || !inputText) {
    return;
  }

  const parameters: Parameters = {
    repeatIntonation: repeatIntonationCheckbox.checked,
    separateStanzas: separateStanzasCheckbox.checked,
    doElision: doElisionCheckbox.checked,
    separator: separatorInput.value.replaceAll('\n', '\n'),
    addOptionalStart: addOptionalStartCheckbox.checked,
    addOptionalEnd: addOptionalEndCheckbox.checked,
    removeNumbers: removeNumbersCheckbox.checked,
    removeParenthesis: removeParenthesisCheckbox.checked,
    removeSeparator: removeSeparatorCheckbox.checked,
    customNote: customNoteInput.value,
    customClef: customClefSelect.value,
    customPattern: customPatternTextArea.value,
    customStart: customStartInput.value,
    header: metadataTextArea.value,
  };

  const gabc = generateGabc(inputText, selectedModel, parameters);
  gabcTextArea.value = gabc;

  gabcToSvg(gabc);
}

modelSelect.addEventListener('change', handleModelChange);
psalmSelect.addEventListener('change', handleModelChange);
generateButton.addEventListener('click', generate);
gabcTextArea.addEventListener('input', () => {
  const gabc = gabcTextArea.value;
  gabcToSvg(gabc);
});

models.forEach((model, index) => {
  const option = document.createElement('option');
  option.value = index.toString();
  option.textContent = model.name;
  modelSelect.appendChild(option);
});

psalmModels.forEach((model, index) => {
  const option = document.createElement('option');
  option.value = index.toString();
  option.textContent = model.name;
  psalmSelect.appendChild(option);
});

handlePsalmOptions();

const exportSvgButton = document.getElementById('export-svg') as HTMLButtonElement;
const exportPngButton = document.getElementById('export-png') as HTMLButtonElement;
const exportPdfButton = document.getElementById('export-pdf') as HTMLButtonElement;


exportSvgButton.addEventListener('click', () => {
  if (renderer) {
    renderer.exportSvg('chant.svg');
  }
});
exportPngButton.addEventListener('click', () => {
  if (renderer) {
    renderer.exportPng('chant.png');
  }
});

exportPdfButton.addEventListener('click', () => {
  if (renderer) {
    renderer.exportPdf('chant.pdf');
  }
});
