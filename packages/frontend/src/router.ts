import { ref } from 'vue';
import { findPage } from './chant-pages';

/**
 * Roteamento por hash (`#/prefacios`). Hash, e não History API, porque o site é
 * estático (GitHub Pages): com rotas de caminho, um F5 em /prefacios daria 404.
 */

function parseHash(): string {
    const id = window.location.hash.replace(/^#\/?/, '');
    return id && findPage(id) ? id : '';
}

/** '' é a página principal; caso contrário, o id de uma página de canto. */
export const currentRoute = ref(parseHash());

window.addEventListener('hashchange', () => {
    currentRoute.value = parseHash();
    window.scrollTo(0, 0);
});

export function navigate(id: string): void {
    window.location.hash = id ? `#/${id}` : '#/';
}
