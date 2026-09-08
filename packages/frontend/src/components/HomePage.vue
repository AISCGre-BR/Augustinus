<template>
  <div class="home">
    <p class="intro">Escolha o tipo de canto.</p>

    <div class="card-grid">
      <button
        v-for="page in mainPages"
        :key="page.id"
        class="chant-card"
        @click="navigate(page.id)"
      >
        <span class="card-title">{{ page.title }}</span>
        <span class="card-subtitle">{{ page.subtitle }}</span>
      </button>
    </div>

    <div class="secondary-row">
      <button
        v-for="page in secondaryPages"
        :key="page.id"
        class="chant-card secondary"
        @click="navigate(page.id)"
      >
        <span class="card-title">{{ page.title }}</span>
        <span class="card-subtitle">{{ page.subtitle }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { chantPages } from '../chant-pages';
import { navigate } from '../router';

const mainPages = computed(() => chantPages.filter((p) => !p.secondary));
const secondaryPages = computed(() => chantPages.filter((p) => p.secondary));
</script>

<style scoped>
.home {
  flex: 1;
  overflow-y: auto;
  padding: 2rem 1.5rem 3rem;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
}

.intro {
  color: var(--muted);
  margin: 0 0 1.5rem;
  font-size: 0.95rem;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.chant-card {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  align-items: flex-start;
  text-align: left;
  background: var(--panel);
  border: 1px solid var(--accent);
  border-radius: 4px;
  padding: 1.1rem 1rem;
  min-height: 6rem;
  color: var(--paper);
}

.chant-card:hover:not(:disabled) {
  background: var(--accent);
}

.card-title {
  font-size: 1.1rem;
  font-weight: bold;
}

.card-subtitle {
  font-size: 0.82rem;
  color: var(--muted);
}

.chant-card:hover .card-subtitle {
  color: var(--paper);
}

.secondary-row {
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--panel-line);
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.chant-card.secondary {
  background: none;
  border-color: var(--panel-line);
  min-height: 0;
}

@media (max-width: 760px) {
  .home {
    padding: 1.25rem 1rem 2rem;
  }
  .card-grid,
  .secondary-row {
    grid-template-columns: 1fr;
  }
  .chant-card {
    min-height: 0;
  }
}
</style>
