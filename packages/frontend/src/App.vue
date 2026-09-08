<template>
  <header>
    <div class="left-content">
      <img
        src="/Saint_Augustine_by_Philippe_de_Champaigne.webp"
        alt="Santo Agostinho"
        class="logo"
      />
      <a href="#/" class="title-link"><h1>Augustinus</h1></a>
    </div>
    <div id="docs">
      <a href="https://github.com/AISCGre-BR/Augustinus/tree/main/docs" target="_blank" rel="noopener">
        Documentação
      </a>
    </div>
  </header>

  <main>
    <ChantPage v-if="page" :key="page.id" :page="page" />
    <HomePage v-else />
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { currentRoute } from './router';
import { findPage } from './chant-pages';
import HomePage from './components/HomePage.vue';
import ChantPage from './components/ChantPage.vue';

const page = computed(() => findPage(currentRoute.value));
</script>
