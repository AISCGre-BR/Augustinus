<template>
  <details class="advanced">
    <summary>Opções avançadas</summary>

    <div class="advanced-body">
      <div class="field">
        <label for="separator">
          Separador de frases
          <button
            v-if="!state.separatorAuto"
            type="button"
            class="link-button"
            @click="restoreSeparator"
          >
            voltar ao padrão do modelo
          </button>
        </label>
        <input
          id="separator"
          type="text"
          :value="state.parameters.separator"
          @input="onSeparatorInput"
        />
        <p class="hint">
          Padrão deste modelo: <code>{{ defaultSeparator(model) }}</code>.
          Prefácios e bênçãos usam <code>**</code> para não confundir a cadência com a pontuação.
        </p>
      </div>

      <div v-if="toggles.length" class="options-grid">
        <div v-for="param in toggles" :key="param.key" class="option">
          <input
            :id="`adv-${param.key}`"
            type="checkbox"
            :checked="state.parameters[param.key as keyof Parameters] as boolean"
            @change="setParam(param.key, ($event.target as HTMLInputElement).checked)"
          />
          <label :for="`adv-${param.key}`">{{ param.label }}</label>
        </div>
      </div>

      <div class="field">
        <label for="metadata">Cabeçalho do GABC (metadados)</label>
        <textarea
          id="metadata"
          rows="4"
          spellcheck="false"
          placeholder="name: ...&#10;office-part: ..."
          :value="state.parameters.header"
          @input="setParam('header', ($event.target as HTMLTextAreaElement).value)"
        ></textarea>
      </div>

      <div class="reset-row">
        <button type="button" class="link-button" @click="onReset">
          Limpar tudo e esquecer o que está guardado
        </button>
      </div>
    </div>
  </details>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { parameterDefinitions } from '@augustinus/core';
import type { Model, Parameters } from '@augustinus/core';
import { state, resetAll } from '../store';
import { optionApplies, defaultSeparator, type ChantPage } from '../chant-pages';

const props = defineProps<{
  page: ChantPage;
  model: Model | null;
}>();

/**
 * Aqui fica tudo o que não é essencial à página atual: os parâmetros que a
 * página já mostra em destaque saem daqui, e os que não mudam nada neste
 * modelo (ver `optionApplies`) somem de vez.
 */
const toggles = computed(() =>
  parameterDefinitions.filter(
    (param) =>
      param.type === 'boolean' &&
      (param.group === 'general' || param.group === 'psalm') &&
      !props.page.optionKeys.includes(param.key) &&
      optionApplies(param.key, props.model)
  )
);

function setParam(key: string, value: unknown) {
  (state.parameters as any)[key] = value;
}

function onSeparatorInput(event: Event) {
  // Editar aqui desliga o acompanhamento automático, senão a próxima troca de
  // tom sobrescreveria em silêncio o que foi digitado.
  state.separatorAuto = false;
  state.parameters.separator = (event.target as HTMLInputElement).value;
}

function restoreSeparator() {
  state.separatorAuto = true;
  state.parameters.separator = defaultSeparator(props.model);
}

function onReset() {
  if (window.confirm('Isso apaga a letra, o GABC e as opções de todas as páginas. Continuar?')) {
    resetAll();
  }
}
</script>

<style scoped>
.advanced {
  margin-top: 1rem;
}

.advanced-body {
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field > label {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
}

.hint {
  margin: 0;
  font-size: 0.78rem;
  color: var(--muted);
  line-height: 1.4;
}

.hint code {
  background: rgba(0, 0, 0, 0.25);
  padding: 0 0.25rem;
  border-radius: 3px;
}

.reset-row {
  border-top: 1px solid var(--panel-line);
  padding-top: 0.6rem;
  margin-top: 0.25rem;
}
</style>
