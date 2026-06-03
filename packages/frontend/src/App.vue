<template>
  <div class="app-container">
    <header>
      <div class="left-content">
        <img src="/Saint_Augustine_by_Philippe_de_Champaigne.webp" alt="Saint Augustine" class="logo" />
        <h1>Augustinus</h1>
      </div>
      <div id="docs">
        <a href="https://github.com/AISCGre-BR/Augustinus/tree/main/docs">Acesse a documentação aqui</a>
      </div>
    </header>

    <main>
      <div class="controls">
        <details open>
          <summary>Opções</summary>
          <div class="options-grid">
            <div class="option">
              <label for="model">Modelo:</label>
              <select id="model" v-model="selectedModelIndex" @change="onModelChange">
                <option value="">-- Selecione um modelo --</option>
                <option v-for="(model, index) in models" :key="index" :value="index">
                  {{ model.name }}
                </option>
              </select>
            </div>

            <!-- Dynamic General Options -->
            <template v-for="param in generalParams" :key="param.key">
              <div class="option">
                <template v-if="param.type === 'boolean'">
                  <input type="checkbox" :id="param.key" v-model="parameters[param.key as keyof Parameters]" />
                  <label :for="param.key">{{ param.label }}</label>
                </template>
                <template v-else-if="param.type === 'string'">
                  <label :for="param.key">{{ param.label }}:</label>
                  <input type="text" :id="param.key" v-model="parameters[param.key as keyof Parameters]" />
                </template>
              </div>
            </template>
          </div>

          <!-- Dynamic Custom Options -->
          <div v-if="selectedModel?.type === 'custom'" class="custom-options">
            <div v-if="selectedModel?.tom === 'simples'" class="custom-group">
              <template v-for="param in customSimplesParams" :key="param.key">
                <label :for="param.key">{{ param.label }}:</label>
                <template v-if="param.type === 'select'">
                  <select :id="param.key" v-model="parameters[param.key as keyof Parameters]">
                    <option v-for="opt in param.options" :key="opt.value" :value="opt.value">
                      {{ opt.label }}
                    </option>
                  </select>
                </template>
                <template v-else>
                  <input type="text" :id="param.key" v-model="parameters[param.key as keyof Parameters]" />
                </template>
              </template>
            </div>
            <div v-if="selectedModel?.tom === 'solene'" class="custom-group">
              <template v-for="param in customSoleneParams" :key="param.key">
                <label :for="param.key">{{ param.label }}:</label>
                <template v-if="param.key === 'customPattern'">
                  <textarea :id="param.key" rows="5" v-model="parameters[param.key as keyof Parameters]"></textarea>
                </template>
                <template v-else>
                  <input type="text" :id="param.key" v-model="parameters[param.key as keyof Parameters]" />
                </template>
              </template>
            </div>
          </div>

          <div class="psalm-controls">
            <h3>Opções dos salmos</h3>
            <div class="option">
              <label for="psalm">Salmodia:</label>
              <select id="psalm" v-model="selectedPsalmIndex" @change="onPsalmChange">
                <option value="">-- Selecione uma salmodia --</option>
                <option v-for="(psalm, index) in psalmModels" :key="index" :value="index">
                  {{ psalm.name }}
                </option>
              </select>
            </div>
            
            <!-- Dynamic Psalm Options -->
            <div v-for="param in psalmParams" :key="param.key" class="option">
              <input type="checkbox" :id="param.key" v-model="parameters[param.key as keyof Parameters]" />
              <label :for="param.key">{{ param.label }}</label>
            </div>
          </div>
        </details>

        <label for="metadata">Metadados</label>
        <textarea id="metadata" rows="5" v-model="header" spellcheck="false"></textarea>

        <label for="input">Texto</label>
        <textarea id="input" rows="10" v-model="inputText" spellcheck="false"></textarea>

        <button id="generate" @click="generate">Gerar</button>

        <div class="export-buttons">
          <button @click="exportSvg">Exportar SVG</button>
          <button @click="exportPng">Exportar PNG</button>
          <button @click="exportPdf">Exportar PDF</button>
        </div>

        <label for="gabc">GABC</label>
        <textarea id="gabc" rows="10" v-model="gabcOutput" @input="onGabcInput" spellcheck="false"></textarea>
      </div>

      <div class="output">
        <div class="a4-container">
          <div ref="chantContainer" class="chant-container"></div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { GregorianChantSVGRenderer, GregorioScore, ChantContext } from '@testneumz/nabc-lib';
import generateGabc, { defaultModels, parameterDefinitions, getDefaultParameters } from '@augustinus/core';
import type { Model, Parameters } from '@augustinus/core';

const models = defaultModels.filter((model) => model.type !== 'salmo');
const psalmModels = defaultModels.filter((model) => model.type === 'salmo');

const generalParams = parameterDefinitions.filter(p => p.group === 'general');
const psalmParams = parameterDefinitions.filter(p => p.group === 'psalm');
const customSimplesParams = parameterDefinitions.filter(p => p.group === 'custom' && ['customNote', 'customClef'].includes(p.key));
const customSoleneParams = parameterDefinitions.filter(p => p.group === 'custom' && ['customPattern', 'customStart'].includes(p.key));

const selectedModelIndex = ref<number | string>('');
const selectedPsalmIndex = ref<number | string>('');
const inputText = ref('');
const header = ref('');
const gabcOutput = ref('');
const chantContainer = ref<HTMLDivElement | null>(null);
let renderer: any = null;

const parameters = reactive<Parameters>(getDefaultParameters());

const selectedModel = computed(() => {
  if (selectedModelIndex.value !== '') {
    return models[Number(selectedModelIndex.value)];
  }
  if (selectedPsalmIndex.value !== '') {
    return psalmModels[Number(selectedPsalmIndex.value)];
  }
  return null;
});

function onModelChange() {
  if (selectedModelIndex.value !== '') {
    selectedPsalmIndex.value = '';
    updateCustomFields();
  }
}

function onPsalmChange() {
  if (selectedPsalmIndex.value !== '') {
    selectedModelIndex.value = '';
    updateCustomFields();
  }
}

function updateCustomFields() {
  const model = selectedModel.value;
  if (!model) return;

  parameters.customStart = model.start || '(c3) <sp>V/</sp> ';
  parameters.customPattern = model.default || '(g) (gr gr gr) (fe) (ef) (g) (fgr1) (fr) (f) (:)';
}

function gabcToSvg(gabc: string) {
  if (!chantContainer.value) return;

  const processedGabc = gabc.replaceAll(/\{([aeiou])~([aeiou]\})/gi, '{$1_$2}');

  if (!renderer) {
    renderer = new GregorianChantSVGRenderer(chantContainer.value);
  }

  if (!processedGabc) {
    chantContainer.value.innerHTML = '';
    return;
  }

  try {
    const context = new ChantContext();
    const score = new GregorioScore(context);
    score.interprete(processedGabc);
    renderer.renderSvg(score);
  } catch (e) {
    console.error('Rendering error:', e);
  }
}

function generate() {
  const model = selectedModel.value;
  if (!model || !inputText.value) return;

  const paramsWithHeader = { ...parameters, header: header.value };
  const gabc = generateGabc(inputText.value, model, paramsWithHeader);
  gabcOutput.value = gabc;
  gabcToSvg(gabc);
}

function onGabcInput() {
  gabcToSvg(gabcOutput.value);
}

function exportSvg() { renderer?.exportSvg('chant.svg'); }
function exportPng() { renderer?.exportPng('chant.png'); }
function exportPdf() { renderer?.exportPdf('chant.pdf'); }

onMounted(() => {
  // Initial state
});
</script>

<style>
/* Base styles from style.css are already loaded globally in main.ts */
.custom-options {
  margin-top: 10px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.custom-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.psalm-controls {
  margin-top: 20px;
  padding-top: 10px;
  border-top: 1px solid #eee;
}
</style>
