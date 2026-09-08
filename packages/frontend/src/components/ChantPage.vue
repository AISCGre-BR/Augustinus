<template>
  <div class="chant-page">
    <section class="controls">
      <nav class="breadcrumb">
        <a href="#/">← Todos os cantos</a>
      </nav>

      <h2>{{ page.title }}</h2>
      <p class="page-subtitle">{{ page.subtitle }}</p>

      <!-- Escolha do tom: rádios quando são poucos, lista quando são os 39 salmódicos -->
      <fieldset v-if="models.length > 1">
        <legend>{{ page.toneLegend }}</legend>

        <select
          v-if="page.kind === 'psalm'"
          :value="ps.tone"
          @change="ps.tone = Number(($event.target as HTMLSelectElement).value)"
        >
          <option v-for="(m, index) in models" :key="m.name" :value="index">
            {{ m.name }}
          </option>
        </select>

        <div v-else class="tone-options">
          <div v-for="(m, index) in models" :key="m.name" class="option">
            <input
              :id="`tone-${page.id}-${index}`"
              type="radio"
              :name="`tone-${page.id}`"
              :value="index"
              :checked="ps.tone === index"
              @change="ps.tone = index"
            />
            <label :for="`tone-${page.id}-${index}`">{{ page.toneLabels[index] ?? m.name }}</label>
          </div>
        </div>
      </fieldset>

      <!-- Opções essenciais deste tipo de canto -->
      <fieldset v-if="essentialOptions.length || customFields.length">
        <legend>Opções</legend>

        <div v-for="param in essentialOptions" :key="param.key" class="option">
          <input
            :id="param.key"
            type="checkbox"
            :checked="state.parameters[param.key as keyof Parameters] as boolean"
            @change="setParam(param.key, ($event.target as HTMLInputElement).checked)"
          />
          <label :for="param.key">{{ optionLabel(param.key, model, param.label) }}</label>
        </div>

        <div v-for="param in customFields" :key="param.key" class="field">
          <label :for="param.key">{{ param.label }}</label>

          <select
            v-if="param.type === 'select'"
            :id="param.key"
            :value="state.parameters[param.key as keyof Parameters]"
            @change="setParam(param.key, ($event.target as HTMLSelectElement).value)"
          >
            <option v-for="opt in param.options" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>

          <textarea
            v-else-if="param.key === 'customPattern'"
            :id="param.key"
            rows="3"
            spellcheck="false"
            :value="state.parameters[param.key as keyof Parameters] as string"
            @input="setParam(param.key, ($event.target as HTMLTextAreaElement).value)"
          ></textarea>

          <input
            v-else
            :id="param.key"
            type="text"
            :value="state.parameters[param.key as keyof Parameters]"
            @input="setParam(param.key, ($event.target as HTMLInputElement).value)"
          />
        </div>
      </fieldset>

      <!-- Fórmulas prontas que o core reconhece por texto exato (find/replace) -->
      <fieldset v-if="picker">
        <legend>{{ picker.label }}</legend>
        <select :value="ps.formula" @change="ps.formula = ($event.target as HTMLSelectElement).value">
          <option value="">{{ picker.noneLabel }}</option>
          <option v-for="opt in options" :key="opt.text" :value="opt.text">
            {{ opt.label }}
          </option>
        </select>
        <p v-if="ps.formula" class="formula-hint">Acrescenta: «{{ ps.formula }}»</p>
        <p v-else-if="alreadyTyped" class="formula-hint">
          A letra já traz uma dessas fórmulas; ela será musicada do mesmo jeito.
        </p>
      </fieldset>

      <div class="field">
        <label for="input">Letra</label>
        <textarea
          id="input"
          rows="12"
          spellcheck="false"
          placeholder="Digite ou cole a letra do canto aqui..."
          :value="ps.lyrics"
          @input="ps.lyrics = ($event.target as HTMLTextAreaElement).value"
        ></textarea>
      </div>

      <div class="actions">
        <button class="generate" :disabled="!ps.lyrics || !model" @click="generate">
          Gerar partitura
        </button>
        <button type="button" class="link-button" @click="ps.lyrics = ''">Limpar letra</button>
      </div>

      <details class="gabc-details" :open="gabcOpen" @toggle="gabcOpen = ($event.target as HTMLDetailsElement).open">
        <summary>Código GABC</summary>
        <div class="gabc-body">
          <textarea
            id="gabc"
            rows="10"
            spellcheck="false"
            placeholder="O código GABC gerado ou editado aparecerá aqui..."
            :value="ps.gabc"
            @input="ps.gabc = ($event.target as HTMLTextAreaElement).value"
          ></textarea>
          <div class="gabc-actions">
            <button type="button" class="link-button" :disabled="!ps.gabc" @click="copyGabc">
              {{ copyLabel }}
            </button>
            <button
              type="button"
              class="link-button"
              :disabled="!ps.gabc"
              title="[Experimental] Converter o GABC de volta para letra"
              @click="reverseToLyrics"
            >
              Reverter para letra
            </button>
          </div>
        </div>
      </details>

      <AdvancedOptions :page="page" :model="model" />
    </section>

    <section class="preview">
      <ChantPreview ref="previewRef" :stacking="hasStacking" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import generateGabc, { reverseGabc, parameterDefinitions } from '@augustinus/core';
import type { Model, Parameters } from '@augustinus/core';
import {
  pageModels,
  optionApplies,
  optionLabel,
  defaultSeparator,
  formulaPicker,
  formulaOptions,
  type ChantPage,
} from '../chant-pages';
import { state, pageState } from '../store';
import { renderGabc } from '../render';
import ChantPreview from './ChantPreview.vue';
import AdvancedOptions from './AdvancedOptions.vue';

const props = defineProps<{ page: ChantPage }>();

const previewRef = ref<InstanceType<typeof ChantPreview> | null>(null);
const gabcOpen = ref(false);
const copyLabel = ref('Copiar GABC');

const models = computed<Model[]>(() => pageModels(props.page));
const ps = computed(() => pageState(props.page.id));
const model = computed<Model | null>(() => models.value[ps.value.tone] ?? models.value[0] ?? null);

/** Só os parâmetros declarados para esta página, e só os que mudam algo aqui. */
const essentialOptions = computed(() =>
  props.page.optionKeys
    .map((key) => parameterDefinitions.find((p) => p.key === key))
    .filter((p): p is (typeof parameterDefinitions)[number] => !!p)
    .filter((p) => optionApplies(p.key, model.value))
);

/**
 * `handleCustomModel` no core monta o modelo a partir destes campos:
 * nota + clave na corda de récita (tom "simples"), padrão + começo no
 * padrão próprio (tom "solene").
 */
const customFields = computed(() => {
  if (props.page.kind !== 'custom' || !model.value) return [];
  const keys =
    model.value.tom === 'simples' ? ['customNote', 'customClef'] : ['customPattern', 'customStart'];
  return parameterDefinitions.filter((p) => keys.includes(p.key));
});

const picker = computed(() => formulaPicker(props.page, model.value));
const options = computed(() => formulaOptions(props.page, model.value));

/** A letra digitada já contém uma das fórmulas — não repetir na geração. */
const alreadyTyped = computed(
  () => !!picker.value && options.value.some((opt) => ps.value.lyrics.includes(opt.text))
);

// As frases mudam de um tom para o outro. Ao trocar de tom, uma escolha que não
// exista no novo modelo é descartada, para o seletor não ficar em branco nem
// gerar uma frase que aquele tom não musica.
watch(options, (current) => {
  if (picker.value && ps.value.formula && !current.some((opt) => opt.text === ps.value.formula)) {
    ps.value.formula = '';
  }
});

/**
 * A fórmula entra como primeira (ou última) frase do texto: o core a reconhece
 * pelo `find` e troca pela linha de GABC pronta. Assim o resultado é idêntico ao
 * de digitar a frase à mão — que continua funcionando.
 */
const composedLyrics = computed(() => {
  const lyrics = ps.value.lyrics;
  if (!picker.value || !ps.value.formula || alreadyTyped.value) return lyrics;
  return picker.value.position === 'start'
    ? `${ps.value.formula}\n${lyrics}`
    : `${lyrics}\n${ps.value.formula}`;
});

/** O core emite `\stacktext{...}` quando o canto usa empilhamento de texto. */
const hasStacking = computed(() => ps.value.gabc.includes('\\stacktext'));

function setParam(key: string, value: unknown) {
  (state.parameters as any)[key] = value;
}

function render() {
  const container = previewRef.value?.containerRef;
  // renderGabc espera as fontes e descarta chamadas ultrapassadas por conta própria.
  if (container) void renderGabc(container, ps.value.gabc);
}

function generate() {
  if (!model.value || !ps.value.lyrics) return;
  ps.value.gabc = generateGabc(composedLyrics.value, model.value, { ...state.parameters });
  gabcOpen.value = true;
}

async function copyGabc() {
  try {
    await navigator.clipboard.writeText(ps.value.gabc);
    copyLabel.value = 'Copiado!';
    setTimeout(() => (copyLabel.value = 'Copiar GABC'), 1500);
  } catch (err) {
    console.error('Erro ao copiar o código GABC:', err);
  }
}

function reverseToLyrics() {
  if (!ps.value.gabc) return;
  try {
    ps.value.lyrics = reverseGabc(ps.value.gabc, model.value ?? undefined, {
      separator: defaultSeparator(model.value),
    });
  } catch (err) {
    console.error('Erro ao reverter GABC:', err);
    window.alert('Erro ao converter o GABC de volta para letra. Verifique o código.');
  }
}

// O separador acompanha o modelo enquanto o usuário não o tiver editado à mão.
watch(
  model,
  (current) => {
    if (state.separatorAuto) state.parameters.separator = defaultSeparator(current);
  },
  { immediate: true }
);

watch(() => ps.value.gabc, render);

onMounted(async () => {
  gabcOpen.value = !!ps.value.gabc;
  await nextTick();
  render();
});
</script>

<style scoped>
.chant-page {
  display: flex;
  flex: 1;
  min-height: 0;
  width: 100%;
}

.controls {
  flex: 0 0 480px;
  padding: 1rem;
  overflow-y: auto;
  border-right: 1px solid var(--accent);
}

.preview {
  flex: 1;
  min-width: 0;
  padding: 1.5rem;
  overflow: auto;
  background-color: var(--panel);
}

.breadcrumb {
  margin-bottom: 0.75rem;
}

.breadcrumb a {
  color: var(--muted);
  text-decoration: none;
  font-size: 0.85rem;
}

.breadcrumb a:hover {
  color: var(--paper);
  text-decoration: underline;
}

.page-subtitle {
  margin: 0.15rem 0 1rem;
  color: var(--muted);
  font-size: 0.85rem;
}

fieldset {
  margin-bottom: 1rem;
}

.tone-options {
  display: flex;
  flex-direction: column;
}

.tone-options input[type='radio'] {
  accent-color: var(--accent);
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0.5rem 0 1rem;
}

.generate {
  flex: 1;
  font-weight: bold;
}

.formula-hint {
  margin: 0.4rem 0 0;
  font-size: 0.78rem;
  color: var(--muted);
  line-height: 1.4;
}

.gabc-details .gabc-body {
  padding: 0.75rem;
}

.gabc-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

@media (max-width: 900px) {
  .chant-page {
    flex-direction: column;
  }
  .controls {
    flex: 0 0 auto;
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--accent);
    overflow-y: visible;
  }
  .preview {
    padding: 1rem 0.5rem;
  }
}
</style>
