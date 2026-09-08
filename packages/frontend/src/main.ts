import { createApp } from 'vue';
import App from './App.vue';
import './style.css';
import { whenFontsReady } from './render';

// Começa a carregar as fontes dos neumas já na abertura: o medidor de glifos da
// lib depende delas, e nada mais na página as usa (ver render.ts).
void whenFontsReady();

createApp(App).mount('#app');
