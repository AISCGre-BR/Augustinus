<template>
  <div class="text-editor-container">
    <!-- Tab Navigation -->
    <div class="tabs-header">
      <button 
        type="button" 
        :class="{ active: activeTab === 'lyrics' }" 
        @click="activeTab = 'lyrics'"
      >
        Letra
      </button>
      <button 
        type="button" 
        :class="{ active: activeTab === 'gabc' }" 
        @click="activeTab = 'gabc'"
      >
        Código GABC
      </button>
      <button 
        type="button" 
        :class="{ active: activeTab === 'header' }" 
        @click="activeTab = 'header'"
      >
        Cabeçalho (Metadata)
      </button>
    </div>

    <!-- Tab Contents -->
    <div class="tab-content">
      <!-- Tab 1: Lyrics Input -->
      <div v-show="activeTab === 'lyrics'" class="editor-pane">
        <div class="editor-actions">
          <label for="input">Letras do Canto</label>
          <button class="action-link-btn" @click="clearLyrics" title="Limpar editor">
            Limpar Letra
          </button>
        </div>
        <textarea
          id="input"
          rows="10"
          :value="inputText"
          @input="emit('update:inputText', ($event.target as HTMLTextAreaElement).value)"
          spellcheck="false"
          placeholder="Digite ou cole a letra do canto aqui..."
        ></textarea>
      </div>

      <!-- Tab 2: GABC Output / Input -->
      <div v-show="activeTab === 'gabc'" class="editor-pane">
        <div class="editor-actions">
          <label for="gabc">GABC</label>
          <button class="action-link-btn copy-btn" @click="copyGabc" title="Copiar código GABC">
            {{ copyLabel }}
          </button>
        </div>
        <textarea
          id="gabc"
          rows="10"
          :value="gabcOutput"
          @input="emit('update:gabcOutput', ($event.target as HTMLTextAreaElement).value)"
          spellcheck="false"
          placeholder="O código GABC gerado ou editado aparecerá aqui..."
        ></textarea>
      </div>

      <!-- Tab 3: Header Metadata -->
      <div v-show="activeTab === 'header'" class="editor-pane">
        <div class="editor-actions">
          <label for="metadata">Metadados do GABC</label>
        </div>
        <textarea
          id="metadata"
          rows="10"
          :value="header"
          @input="emit('update:header', ($event.target as HTMLTextAreaElement).value)"
          spellcheck="false"
          placeholder="name: ...&#10;office-part: ...&#10;..."
        ></textarea>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  header: string;
  inputText: string;
  gabcOutput: string;
}>();

const emit = defineEmits<{
  (e: 'update:header', val: string): void;
  (e: 'update:inputText', val: string): void;
  (e: 'update:gabcOutput', val: string): void;
}>();

const activeTab = ref<'lyrics' | 'gabc' | 'header'>('lyrics');
const copyLabel = ref('Copiar GABC');

function clearLyrics() {
  emit('update:inputText', '');
}

async function copyGabc() {
  try {
    await navigator.clipboard.writeText(props.gabcOutput);
    copyLabel.value = 'Copiado!';
    setTimeout(() => {
      copyLabel.value = 'Copiar GABC';
    }, 1500);
  } catch (err) {
    console.error('Erro ao copiar o código GABC:', err);
  }
}
</script>

<style scoped>
.text-editor-container {
  display: flex;
  flex-direction: column;
  background-color: #221d1a;
  border: 1px solid #3d312a;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.tabs-header {
  display: flex;
  border-bottom: 1px solid #3d312a;
  margin-bottom: 16px;
  gap: 4px;
}

.tabs-header button {
  background: none;
  border: none;
  padding: 8px 16px;
  color: #a3958d;
  /* font-family: 'Inter', sans-serif; */
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s, border-bottom 0.2s;
  border-bottom: 2px solid transparent;
}

.tabs-header button:hover {
  color: #f4ecd8;
}

.tabs-header button.active {
  color: #c85a32;
  border-bottom-color: #c85a32;
  font-weight: 600;
}

.editor-pane {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.editor-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.editor-actions label {
  /* font-family: 'Cinzel', serif; */
  font-size: 14px;
  font-weight: 700;
  color: #f4ecd8;
}

.action-link-btn {
  background: none;
  border: none;
  color: #c85a32;
  /* font-family: 'Inter', sans-serif; */
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  padding: 2px 8px;
  border-radius: 4px;
  transition: background-color 0.2s, color 0.2s;
}

.action-link-btn:hover {
  background-color: rgba(200, 90, 50, 0.1);
  color: #e27c52;
}

textarea {
  width: 100%;
  background-color: #1a1512;
  border: 1px solid #3d312a;
  color: #f4ecd8;
  /* font-family: 'Inter', sans-serif; */
  font-size: 14px;
  padding: 12px;
  border-radius: 6px;
  resize: vertical;
  line-height: 1.5;
  outline: none;
  transition: border-color 0.2s;
}

textarea:focus {
  border-color: #c85a32;
}
</style>