<template>
  <div class="app-container">
    <header>
      <div class="left-content">
        <img src="/Saint_Augustine_by_Philippe_de_Champaigne.webp" alt="Saint Augustine Logo" class="logo" />
        <h1>Augustinus</h1>
      </div>
      <div id="docs">
        <a href="https://github.com/AISCGre-BR/Augustinus/tree/main/docs" target="_blank" rel="noopener">
          Acesse a documentação aqui
        </a>
      </div>
    </header>

    <main class="main-layout">
      <!-- Sidebar Control Column -->
       
      <section class="controls-sidebar">
        <!-- Tabbed Text / GABC Metadata Editor -->
        <TextEditor
          v-model:inputText="inputText"
          v-model:gabcOutput="gabcOutput"
          v-model:header="header"
          :selectedModel="selectedModel"
          @update:gabcOutput="onGabcInput"
        />
        <!-- Structured Options Config Panel -->
        <OptionsPanel
          :models="models"
          :psalmModels="psalmModels"
          :generalParams="generalParams"
          :psalmParams="psalmParams"
          :customSimplesParams="customSimplesParams"
          :customSoleneParams="customSoleneParams"
          v-model:selectedModelIndex="selectedModelIndex"
          v-model:selectedPsalmIndex="selectedPsalmIndex"
          :selectedModel="selectedModel"
          :parameters="parameters"
          @update-param="updateParameter"
        />

        

        <!-- Generate Action Button -->
        <button class="btn-generate" @click="generate" :disabled="!inputText || !selectedModel">
          Gerar Partitura
        </button>
      </section>

      <!-- Sheet Music Score Render Viewport -->
      <section class="preview-pane">
        <ChantPreview
          ref="previewComponentRef"
          :gabc="gabcOutput"


        />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { GregorianChantSVGRenderer, GregorioScore, ChantContext } from '@testneumz/nabc-lib';
import generateGabc, { defaultModels, parameterDefinitions, getDefaultParameters } from '@augustinus/core';
import type { Model, Parameters } from '@augustinus/core';

// Component imports
import TextEditor from './components/TextEditor.vue';
import OptionsPanel from './components/OptionsPanel.vue';
import ChantPreview from './components/ChantPreview.vue';

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

const previewComponentRef = ref<InstanceType<typeof ChantPreview> | null>(null);
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

// Reactively watch model index selection to deselect counterpart psalm selection & configure custom templates
watch(selectedModelIndex, (newVal) => {
  if (newVal !== '') {
    selectedPsalmIndex.value = '';
    updateCustomFields();
  }
});

watch(selectedPsalmIndex, (newVal) => {
  if (newVal !== '') {
    selectedModelIndex.value = '';
    updateCustomFields();
  }
});

function updateParameter(key: string, value: any) {
  (parameters as any)[key] = value;
}

function updateCustomFields() {
  const model = selectedModel.value;
  if (!model) return;

  parameters.customStart = model.start || '(c3) <sp>V/</sp> ';
  parameters.customPattern = model.default || '(g) (gr gr gr) (fe) (ef) (g) (fgr1) (fr) (f) (:)';

  // Prefácios usam "**" como marcador de cadência final (para não confundir com a
  // pontuação); os demais modelos usam o separador padrão ".".
  parameters.separator = model.type === 'prefacio' ? '**' : '.';
}

function gabcToSvg(gabc: string) {
  const chantContainer = previewComponentRef.value?.containerRef;
  if (!chantContainer) return;

  const processedGabc = gabc.replaceAll(/\{([aeiou])~([aeiou]\})/gi, '{$1_$2}');

  if (!renderer) {
    renderer = new GregorianChantSVGRenderer(chantContainer);
  }

  if (!processedGabc) {
    chantContainer.innerHTML = '';
    return;
  }

  try {
    const context = new ChantContext();

    // A lib quebra as linhas em context.lineWidthPx (padrão 800px), mas o SVG é
    // renderizado com width:100% e sem viewBox — então qualquer conteúdo além da
    // largura do contêiner é cortado. Casamos a largura de quebra com a largura
    // real do papel para a partitura caber e não ser cortada à direita.
    const containerWidth = chantContainer.clientWidth;
    if (containerWidth > 0) {
      context.lineWidthPx = containerWidth;
    }

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

function onGabcInput(gabc: string) {
  gabcOutput.value = gabc;
  gabcToSvg(gabc);
}


onMounted(() => {
  // Setup logic can remain here
});
</script>

<style>
/* Global CSS variables, custom typography setup and clean layout structure */
/*@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap');*/

:root {
  --terracotta-color: #c85a32;
}

body {
  margin: 0;
  padding: 0;
  background-color: #1a1512;
  color: #f4ecd8;
  /* font-family: 'Inter', sans-serif; */
}

.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background-color: #15110e;
  border-bottom: 1px solid #2d231e;
}

header h1 {
  /* font-family: 'Cinzel', serif; */
  margin: 0;
  font-size: 26px;
  color: #f4ecd8;
  letter-spacing: 0.5px;
}

.left-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo {
  height: 44px;
  border-radius: 50%;
  border: 1px solid var(--terracotta-color);
  box-shadow: 0 2px 8px rgba(0,0,0,0.4);
}

#docs a {
  /* font-family: 'Inter', sans-serif; */
  color: var(--terracotta-color);
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  transition: color 0.2s;
}

#docs a:hover {
  color: #de6b40;
}

/* Grid & Responsive Structure */
.main-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.controls-sidebar {
  width: 440px;
  flex-shrink: 0;
  background-color: #1c1714;
  border-right: 1px solid #2d231e;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-pane {
  flex: 1;
  padding: 24px;
  background-color: #130f0c;
  overflow-y: auto;
}

/* Primary Form Action Button */
.btn-generate {
  background-color: var(--terracotta-color);
  color: #ffffff;
  border: none;
  border-radius: 6px;
  padding: 12px 20px;
  /* font-family: 'Inter', sans-serif; */
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
  box-shadow: 0 4px 12px rgba(200, 90, 50, 0.2);
}

.btn-generate:hover:not(:disabled) {
  background-color: #de6b40;
}

.btn-generate:active:not(:disabled) {
  transform: translateY(1px);
}

.btn-generate:disabled {
  background-color: #312722;
  color: #5c4e46;
  cursor: not-allowed;
  box-shadow: none;
}

/* Responsive Overrides */
@media (max-width: 1024px) {
  .main-layout {
    flex-direction: column;
    overflow-y: auto;
  }
  .controls-sidebar {
    width: 100%;
    box-sizing: border-box;
    border-right: none;
    border-bottom: 1px solid #2d231e;
    overflow-y: visible;
  }
}
</style>