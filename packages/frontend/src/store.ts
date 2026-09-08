import { reactive, watch } from 'vue';
import { getDefaultParameters } from '@augustinus/core';
import type { Parameters } from '@augustinus/core';
import { chantPages } from './chant-pages';

/**
 * Memória do programa. Usamos `localStorage` (e não cookies): o site é estático,
 * então cookies só seriam trafegados à toa a cada requisição, com limite de 4 KB.
 * A chave carrega a versão do formato — se o formato mudar, o estado antigo é
 * descartado em vez de quebrar a interface.
 */
const STORAGE_KEY = 'augustinus:v1';

export interface PageState {
    /** Índice do tom escolhido dentro dos modelos da página. */
    tone: number;
    lyrics: string;
    gabc: string;
    /** Fórmula pronta escolhida (a frase exata de `model.find`), '' se nenhuma. */
    formula: string;
}

interface AppState {
    /** Parâmetros globais (incluindo `header`, os metadados do GABC). */
    parameters: Parameters;
    /**
     * Enquanto verdadeiro, o separador acompanha o modelo escolhido
     * ("**" em prefácios e bênçãos, "." nos demais). Editar o campo em
     * "Opções avançadas" desliga isto, para o valor digitado não ser
     * sobrescrito na próxima troca de modelo.
     */
    separatorAuto: boolean;
    zoom: number;
    /** Letra, GABC e tom são guardados por página, para um canto não invadir o outro. */
    pages: Record<string, PageState>;
}

function emptyPages(): Record<string, PageState> {
    const pages: Record<string, PageState> = {};
    for (const page of chantPages) {
        pages[page.id] = { tone: 0, lyrics: '', gabc: '', formula: '' };
    }
    return pages;
}

function initialState(): AppState {
    return {
        parameters: getDefaultParameters(),
        separatorAuto: true,
        zoom: 100,
        pages: emptyPages(),
    };
}

function load(): AppState {
    const state = initialState();
    let saved: any;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return state;
        saved = JSON.parse(raw);
    } catch {
        return state;
    }
    if (!saved || typeof saved !== 'object') return state;

    // Só reaproveitamos chaves que ainda existem, para que um parâmetro removido
    // do core não reapareça vindo de um estado antigo.
    if (saved.parameters && typeof saved.parameters === 'object') {
        for (const key of Object.keys(state.parameters) as (keyof Parameters)[]) {
            const value = saved.parameters[key];
            if (typeof value === typeof state.parameters[key]) {
                (state.parameters as any)[key] = value;
            }
        }
    }
    if (typeof saved.separatorAuto === 'boolean') state.separatorAuto = saved.separatorAuto;
    if (typeof saved.zoom === 'number' && saved.zoom >= 50 && saved.zoom <= 200) {
        state.zoom = saved.zoom;
    }
    if (saved.pages && typeof saved.pages === 'object') {
        for (const id of Object.keys(state.pages)) {
            const page = saved.pages[id];
            if (!page || typeof page !== 'object') continue;
            if (typeof page.tone === 'number' && page.tone >= 0) state.pages[id].tone = page.tone;
            if (typeof page.lyrics === 'string') state.pages[id].lyrics = page.lyrics;
            if (typeof page.gabc === 'string') state.pages[id].gabc = page.gabc;
            if (typeof page.formula === 'string') state.pages[id].formula = page.formula;
        }
    }
    return state;
}

export const state = reactive<AppState>(load());

let saveTimer: ReturnType<typeof setTimeout> | undefined;

watch(
    state,
    () => {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            try {
                window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            } catch {
                // Cota cheia ou armazenamento bloqueado: seguir sem memória é
                // melhor do que derrubar a interface.
            }
        }, 300);
    },
    { deep: true }
);

export function pageState(id: string): PageState {
    if (!state.pages[id]) state.pages[id] = { tone: 0, lyrics: '', gabc: '', formula: '' };
    return state.pages[id];
}

/** Apaga a memória e volta tudo ao padrão. */
export function resetAll(): void {
    Object.assign(state, initialState());
    try {
        window.localStorage.removeItem(STORAGE_KEY);
    } catch {
        /* nada a fazer */
    }
}
