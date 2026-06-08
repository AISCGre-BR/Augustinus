<template>
  <details class="options-details" open>
    <summary>Opções e Configurações</summary>

    <div class="options-container">
      <!-- Group 1: Model Selection -->
      <div class="parameter-group-card">
        <div class="group-title">Modelo Base</div>
        <div class="option-field">
          <label for="model">Selecione o Modelo:</label>
          <div class="custom-select-wrapper">
            <select id="model" :value="selectedModelIndex" @change="onModelChange">
              <option value="">-- Selecione um modelo --</option>
              <option v-for="(model, index) in models" :key="index" :value="index">
                {{ model.name }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Group 2: Text Treatment & General Formatting -->
      <div class="parameter-group-card">
        <div class="group-title">Tratamento de Texto</div>
        <div class="options-grid">
          <template v-for="param in generalParams" :key="param.key">
            <div v-if="param.type === 'boolean'" class="option-field checkbox-field">
              <label class="switch-toggle">
                <input 
                  type="checkbox" 
                  :id="param.key" 
                  :checked="parameters[param.key]"
                  @change="updateParam(param.key, ($event.target as HTMLInputElement).checked)"
                />
                <span class="slider"></span>
              </label>
              <label :for="param.key" class="checkbox-label" :title="param.label">{{ param.label }}</label>
            </div>
            
            <div v-else-if="param.type === 'string'" class="option-field text-field">
              <label :for="param.key">{{ param.label }}:</label>
              <input 
                type="text" 
                :id="param.key" 
                :value="parameters[param.key]"
                @input="updateParam(param.key, ($event.target as HTMLInputElement).value)"
              />
            </div>
          </template>
        </div>
      </div>

      <!-- Group 3: Dynamic Model Customizations -->
      <div v-if="selectedModel?.type === 'custom'" class="parameter-group-card custom-options">
        <div class="group-title">Ajustes Musicais Customizados</div>
        
        <div v-if="selectedModel?.tom === 'simples'" class="custom-group">
          <div v-for="param in customSimplesParams" :key="param.key" class="option-field">
            <label :for="param.key">{{ param.label }}:</label>
            <div v-if="param.type === 'select'" class="custom-select-wrapper">
              <select 
                :id="param.key" 
                :value="parameters[param.key]"
                @change="updateParam(param.key, ($event.target as HTMLSelectElement).value)"
              >
                <option v-for="opt in param.options" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>
            <input 
              v-else 
              type="text" 
              :id="param.key" 
              :value="parameters[param.key]"
              @input="updateParam(param.key, ($event.target as HTMLInputElement).value)"
            />
          </div>
        </div>

        <div v-if="selectedModel?.tom === 'solene'" class="custom-group">
          <div v-for="param in customSoleneParams" :key="param.key" class="option-field">
            <label :for="param.key">{{ param.label }}:</label>
            <textarea 
              v-if="param.key === 'customPattern'" 
              :id="param.key" 
              rows="3" 
              :value="parameters[param.key]"
              @input="updateParam(param.key, ($event.target as HTMLTextAreaElement).value)"
            ></textarea>
            <input 
              v-else 
              type="text" 
              :id="param.key" 
              :value="parameters[param.key]"
              @input="updateParam(param.key, ($event.target as HTMLInputElement).value)"
            />
          </div>
        </div>
      </div>

      <!-- Group 4: Psalm Controls -->
      <div class="parameter-group-card">
        <div class="group-title">Configurações de Salmodia</div>
        <div class="option-field mb-3">
          <label for="psalm">Salmo:</label>
          <div class="custom-select-wrapper">
            <select id="psalm" :value="selectedPsalmIndex" @change="onPsalmChange">
              <option value="">-- Selecione uma salmodia --</option>
              <option v-for="(psalm, index) in psalmModels" :key="index" :value="index">
                {{ psalm.name }}
              </option>
            </select>
          </div>
        </div>
        
        <div class="options-grid">
          <div v-for="param in psalmParams" :key="param.key" class="option-field checkbox-field">
            <label class="switch-toggle">
              <input 
                type="checkbox" 
                :id="param.key" 
                :checked="parameters[param.key]"
                @change="updateParam(param.key, ($event.target as HTMLInputElement).checked)"
              />
              <span class="slider"></span>
            </label>
            <label :for="param.key" class="checkbox-label" :title="param.label">{{ param.label }}</label>
          </div>
        </div>
      </div>
    </div>
  </details>
</template>

<script setup lang="ts">
const props = defineProps<{
  models: any[];
  psalmModels: any[];
  generalParams: any[];
  psalmParams: any[];
  customSimplesParams: any[];
  customSoleneParams: any[];
  selectedModelIndex: number | string;
  selectedPsalmIndex: number | string;
  selectedModel: any;
  parameters: any;
}>();

const emit = defineEmits<{
  (e: 'update:selectedModelIndex', val: number | string): void;
  (e: 'update:selectedPsalmIndex', val: number | string): void;
  (e: 'update-param', key: string, value: any): void;
}>();

function onModelChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  emit('update:selectedModelIndex', value === '' ? '' : Number(value));
}

function onPsalmChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  emit('update:selectedPsalmIndex', value === '' ? '' : Number(value));
}

function updateParam(key: string, value: any) {
  emit('update-param', key, value);
}
</script>

<style scoped>
.options-details {
  background-color: #221d1a;
  border: 1px solid #3d312a;
  border-radius: 8px;
  padding: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

summary {
  /* font-family: 'Cinzel', serif; */
  font-size: 15px;
  font-weight: 700;
  color: #f4ecd8;
  cursor: pointer;
  outline: none;
  padding: 4px 0;
  user-select: none;
}

.options-container {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.parameter-group-card {
  background-color: #1c1714;
  border: 1px solid #2d231e;
  border-radius: 6px;
  padding: 12px;
}

.group-title {
  /* font-family: 'Cinzel', serif; */
  font-size: 12px;
  font-weight: 700;
  color: #c85a32;
  margin-bottom: 10px;
  border-bottom: 1px solid #2d231e;
  padding-bottom: 4px;
  letter-spacing: 0.5px;
}

.option-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.option-field label {
  /* font-family: 'Inter', sans-serif; */
  font-size: 13px;
  color: #a3958d;
}

/* Custom Checkbox as Switch Toggles */
.checkbox-field {
  flex-direction: row;
  align-items: center;
  gap: 10px;
  margin: 6px 0;
}

.switch-toggle {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
  flex-shrink: 0;
}

.switch-toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #3d312a;
  transition: 0.25s ease;
  border-radius: 20px;
  border: 1px solid #4f3f35;
}

.slider:before {
  position: absolute;
  content: "";
  height: 12px;
  width: 12px;
  left: 3px;
  bottom: 3px;
  background-color: #f4ecd8;
  transition: 0.25s ease;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #c85a32;
  border-color: #c85a32;
}

input:checked + .slider:before {
  transform: translateX(20px);
  background-color: #ffffff;
}

.checkbox-label {
  cursor: pointer;
  user-select: none;
  font-size: 13px !important;
  color: #f4ecd8 !important;
}

/* Custom Select Styling */
.custom-select-wrapper {
  position: relative;
  width: 100%;
}

.custom-select-wrapper select {
  appearance: none;
  -webkit-appearance: none;
  width: 100%;
  padding: 8px 32px 8px 12px;
  background-color: #130f0d;
  border: 1px solid #c85a32;
  border-radius: 6px;
  color: #f4ecd8;
  /* font-family: 'Inter', sans-serif; */
  font-size: 13px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.custom-select-wrapper select:focus {
  outline: none;
  border-color: #de6b40;
}

.custom-select-wrapper::after {
  content: '▼';
  font-size: 9px;
  color: #c85a32;
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

/* Custom dynamic inputs */
input[type="text"], textarea {
  width: 100%;
  background-color: #130f0d;
  border: 1px solid #3d312a;
  border-radius: 6px;
  color: #f4ecd8;
  padding: 8px 12px;
  /* font-family: 'Inter', sans-serif; */
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
}

input[type="text"]:focus, textarea:focus {
  border-color: #c85a32;
}

.options-grid {
  display: flex;
  flex-direction: column;
}

.mb-3 { margin-bottom: 12px; }
.mt-2 { margin-top: 8px; }
</style>