<template>
  <div class="preview-wrapper">
    <div class="toolbar no-print">
      <div class="zoom-group">
        <button type="button" class="tool-btn" title="Reduzir" @click="zoomOut">−</button>
        <span class="zoom-text">{{ state.zoom }}%</span>
        <button type="button" class="tool-btn" title="Ampliar" @click="zoomIn">+</button>
        <button type="button" class="tool-btn wide" @click="state.zoom = 100">100%</button>
      </div>
      <button type="button" class="tool-btn wide" @click="print">Imprimir</button>
    </div>

    <div class="output">
      <div class="a4-container" :style="{ transform: `scale(${state.zoom / 100})` }">
        <div ref="containerRef" class="chant-container"></div>
      </div>
    </div>

    <p v-if="stacking" class="disclaimer no-print">
      Esta partitura usa empilhamento de texto (<code>[texto/outro]</code>), que pode não sair
      correto nesta pré-visualização. Para o resultado final, use o GABC com o pacote LaTeX
      <code>augustinus</code>.
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { state } from '../store';

defineProps<{
  /** Avisa sobre o empilhamento só quando a partitura de fato o usa. */
  stacking?: boolean;
}>();

const containerRef = ref<HTMLDivElement | null>(null);

defineExpose({ containerRef });

function zoomIn() {
  if (state.zoom < 200) state.zoom += 10;
}

function zoomOut() {
  if (state.zoom > 50) state.zoom -= 10;
}

function print() {
  window.print();
}
</script>

<style scoped>
.preview-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.zoom-group {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.zoom-text {
  min-width: 3rem;
  text-align: center;
  font-size: 0.85rem;
}

.tool-btn {
  padding: 0.3rem 0.6rem;
  font-size: 0.9rem;
  min-width: 2rem;
}

.tool-btn.wide {
  font-size: 0.85rem;
}

.output {
  overflow: auto;
  background-color: var(--bg);
  border: 1px solid var(--accent);
  border-radius: 4px;
  padding: 1.5rem;
  display: flex;
  /* "safe center" centraliza a partitura quando ela cabe, mas alinha à esquerda
     quando ela é mais larga que a área visível. Com "center" simples, a borda
     esquerda (clave e início das linhas) transborda para um scroll negativo,
     ficando cortada e inacessível à rolagem. */
  justify-content: safe center;
  align-items: flex-start;
  min-height: 500px;
}

.a4-container {
  background: #ffffff;
  color: #000000;
  width: 210mm;
  min-height: 297mm;
  flex-shrink: 0;
  padding: 2cm;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  transform-origin: top center;
  transition: transform 0.15s ease;
}

.chant-container {
  width: 100%;
}

.disclaimer {
  margin: 0;
  font-size: 0.8rem;
  color: var(--muted);
  line-height: 1.5;
}

.disclaimer code {
  background: rgba(0, 0, 0, 0.25);
  padding: 0 0.25rem;
  border-radius: 3px;
}

@media print {
  .no-print {
    display: none !important;
  }

  .preview-wrapper,
  .output {
    display: block !important;
    overflow: visible !important;
    border: none !important;
    padding: 0 !important;
    margin: 0 !important;
    min-height: 0 !important;
  }

  .a4-container {
    transform: none !important;
    background: #ffffff !important;
    box-shadow: none !important;
    margin: 0 auto !important;
    padding: 2cm !important;
    width: 210mm !important;
    min-height: 297mm !important;
    /* Sem `page-break-inside: avoid` aqui: o papel quase sempre é mais alto que
       uma página, então a regra nunca teria efeito — e quem precisa ficar
       inteiro é cada linha de canto (`.chant-line`, ver style.css). */
  }

  .chant-container :deep(svg) {
    max-width: 100% !important;
    height: auto !important;
  }
}
</style>
