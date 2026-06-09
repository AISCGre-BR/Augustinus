<template>
  <div class="preview-panel-wrapper">
    <!-- Floating Toolbar (Excluded from Printing) -->
    <div class="floating-toolbar no-print">
      <div class="toolbar-section">
        <button class="tool-btn" @click="zoomOut" title="Reduzir Visualização">
          <span>−</span>
        </button>
        <span class="zoom-text">{{ zoomValue }}%</span>
        <button class="tool-btn" @click="zoomIn" title="Ampliar Visualização">
          <span>+</span>
        </button>
        <button class="tool-btn text-btn" @click="zoomReset">100%</button>
      </div>

      <div class="toolbar-section">
        <button class="tool-btn text-btn print-button" @click="triggerPrint" title="Imprimir Partitura">
          🖨️ Imprimir
        </button>
      </div>
    </div>

    <!-- Restored Original DOM structure for layout & print output compatibility -->
    <div class="output">
      <div 
        class="a4-container" 
        :class="{ 'dark-theme-paper': !lightPaper }"
        :style="{ transform: `scale(${zoomValue / 100})` }"
      >
        <div ref="containerRef" class="chant-container"></div>
      </div>
    </div>

    <!-- Disclaimer Section -->
    <div class="rendering-disclaimer no-print">
      <p>
        <strong>Nota:</strong> O empilhamento de texto (ex: <code>[texto/outro]</code>) pode não ser renderizado corretamente nesta pré-visualização. 
        Para um resultado profissional, utilize o código GABC gerado em conjunto com o pacote LaTeX <code>augustinus</code>.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const containerRef = ref<HTMLDivElement | null>(null);
const zoomValue = ref<number>(100);
const lightPaper = ref<boolean>(true);

defineExpose({
  containerRef
});

function zoomIn() {
  if (zoomValue.value < 200) zoomValue.value += 10;
}

function zoomOut() {
  if (zoomValue.value > 50) zoomValue.value -= 10;
}

function zoomReset() {
  zoomValue.value = 100;
}

function togglePaperBackground() {
  lightPaper.value = !lightPaper.value;
}

function triggerPrint() {
  window.print();
}
</script>

<style scoped>
.preview-panel-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Floating Toolbar styles */
.floating-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #221d1a;
  border: 1px solid #3d312a;
  border-radius: 8px;
  padding: 8px 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.zoom-text {
  /* font-family: 'Inter', sans-serif; */
  font-size: 13px;
  color: #f4ecd8;
  min-width: 44px;
  text-align: center;
}

.tool-btn {
  background-color: #312722;
  border: 1px solid #4f3f35;
  color: #f4ecd8;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 16px;
  font-weight: 600;
}

.tool-btn.text-btn {
  width: auto;
  padding: 0 12px;
  font-size: 12px;
}

.tool-btn:hover {
  background-color: #c85a32;
  border-color: #c85a32;
  color: #fff;
}

.tool-btn.dark-mode-active {
  background-color: #55443c;
  border-color: #6d584f;
}

.export-row {
  display: flex;
  gap: 8px;
}

.action-btn {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 6px;
  /* font-family: 'Inter', sans-serif; */
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: opacity 0.2s, background-color 0.2s;
  color: #ffffff;
}

.action-btn:hover {
  opacity: 0.9;
}

.svg-btn { background-color: #3a2f29; }
.png-btn { background-color: #58483e; }
.pdf-btn { background-color: #c85a32; }

.rendering-disclaimer {
  margin-top: 12px;
  padding: 12px 16px;
  background-color: #2d231e;
  border-left: 4px solid #c85a32;
  border-radius: 4px;
}

.rendering-disclaimer p {
  margin: 0;
  font-size: 13px;
  color: #a3958d;
  line-height: 1.5;
}

.rendering-disclaimer strong {
  color: #f4ecd8;
}

.rendering-disclaimer code {
  background-color: #1c1714;
  padding: 2px 4px;
  border-radius: 3px;
  color: #c85a32;
}

/* Visualizer Viewport */
.output {
  overflow: auto;
  border: 1px solid #3d312a;
  background-color: #171412;
  border-radius: 8px;
  padding: 32px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  max-height: 800px;
  min-height: 600px;
}

/* Restored A4 Container with fixed physical dimensions on-screen */
.a4-container {
  background-color: #ffffff;
  width: 210mm;
  min-height: 297mm;
  padding: 20mm;
  box-sizing: border-box;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  transform-origin: top center;
  transition: transform 0.2s ease, background-color 0.3s ease;
}

/* Custom dark mode override styles */
.a4-container.dark-theme-paper {
  background-color: #1e1916 !important;
}

.a4-container.dark-theme-paper :deep(svg) {
  filter: invert(0.9) sepia(0.3) hue-rotate(340deg) brightness(1.2);
}

/* Strict Print Overrides */
@media print {
  /* Hide UI features and interactive layout wrappers */
  .no-print,
  .floating-toolbar,
  .export-row {
    display: none !important;
  }

  /* Reset layout constraints to allow natural document flow on print */
  .preview-panel-wrapper,
  .output {
    display: block !important;
    overflow: visible !important;
    padding: 0 !important;
    margin: 0 !important;
    width: auto !important;
    height: auto !important;
  }

  /* Ensure the sheet is sized exactly to standard physical A4 margins */
  .a4-container {
    transform: none !important; /* Disregard on-screen scaling transforms */
    background-color: #ffffff !important; /* Enforce white background for physical paper */
    box-shadow: none !important;
    margin: 0 auto !important;
    padding: 20mm !important;
    width: 210mm !important;
    min-height: 297mm !important;
    page-break-inside: avoid;
  }

  /* Prevent vector output paths from stretching outside print margin boundaries */
  .chant-container :deep(svg) {
    max-width: 100% !important;
    height: auto !important;
    filter: none !important; /* Neutralize dark/inverted themes during print processes */
  }
}
</style>