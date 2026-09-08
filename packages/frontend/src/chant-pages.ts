import { defaultModels } from '@augustinus/core';
import type { Model } from '@augustinus/core';

/**
 * Alguns modelos trazem fórmulas prontas em `find`/`replace`: se o texto digitado
 * contiver exatamente aquela frase, o core troca a linha inteira por um GABC
 * escrito à mão. O casamento é literal (`model.find.indexOf(chunk + separator)`),
 * então até hoje era preciso saber a frase de cor, com a acentuação certa. Este
 * seletor põe as frases à vista.
 */
export interface FormulaPicker {
    /** Modelos desta página em que o seletor aparece. */
    modelNames: string[];
    label: string;
    noneLabel: string;
    /** `start`: a fórmula abre o canto; `end`: fecha. */
    position: 'start' | 'end';
    /**
     * Rótulo curto por frase. As frases não listadas aparecem com o próprio
     * texto — o que serve às conclusões das orações, que já são curtas o
     * bastante e mudam de um tom para o outro.
     */
    labels?: Record<string, string>;
}

/** Uma opção do seletor, já resolvida contra o modelo escolhido. */
export interface FormulaOption {
    label: string;
    text: string;
}

/**
 * Cada tipo de canto tem a sua própria página (rota `#/<id>`), para que só as
 * informações relevantes àquele tipo apareçam. Esta é a fonte única de verdade
 * da navegação: a página principal e as páginas de canto são geradas daqui.
 */
export interface ChantPage {
    id: string;
    title: string;
    subtitle: string;
    /** Nomes dos modelos em `models.json`, na ordem em que devem aparecer. */
    modelNames: string[];
    /** Rótulo curto de cada modelo no seletor de tom. */
    toneLabels: string[];
    /** Rótulo do seletor de tom ('' esconde o seletor quando há um só modelo). */
    toneLegend: string;
    /**
     * `standard`: o tom vem de `modelNames`.
     * `psalm`: o tom vem da lista de salmodias (39 tons de `models.json`).
     * `custom`: além do tom, mostra os campos de customização musical.
     */
    kind: 'standard' | 'psalm' | 'custom';
    /** Parâmetros essenciais desta página (os demais vão para "Opções avançadas"). */
    optionKeys: string[];
    /** Fórmulas prontas oferecidas em um dos modelos desta página. */
    formula?: FormulaPicker;
    /** Cartão discreto na página principal (opção técnica, não litúrgica). */
    secondary?: boolean;
}

export const chantPages: ChantPage[] = [
    {
        id: 'oracoes',
        title: 'Orações presidenciais',
        subtitle: 'Coleta, oferendas e pós-comunhão',
        modelNames: ['Oração tom solene', 'Oração tom simples A', 'Oração tom simples B'],
        toneLabels: ['Tom solene', 'Tom simples A', 'Tom simples B'],
        toneLegend: 'Tom',
        kind: 'standard',
        optionKeys: ['addOptionalStart', 'addOptionalEnd'],
    },
    {
        id: 'prefacios',
        title: 'Prefácios',
        subtitle: 'Do diálogo introdutório ao Sanctus',
        modelNames: ['Prefácio tom solene', 'Prefácio tom simples'],
        toneLabels: ['Tom solene', 'Tom simples'],
        toneLegend: 'Tom',
        kind: 'standard',
        optionKeys: ['addOptionalStart', 'addOptionalEnd', 'quelisma'],
    },
    {
        id: 'bencaos',
        title: 'Bênçãos',
        subtitle: 'Bênção final e bênçãos solenes',
        modelNames: ['Bênção tom solene', 'Bênção tom simples'],
        toneLabels: ['Tom solene', 'Tom simples'],
        toneLegend: 'Tom',
        kind: 'standard',
        optionKeys: ['addOptionalStart', 'addOptionalEnd'],
    },
    {
        id: 'salmo',
        title: 'Salmo',
        subtitle: 'Salmodia responsorial nos oito tons',
        modelNames: ['Salmo'],
        toneLabels: [],
        toneLegend: 'Tom salmódico',
        kind: 'psalm',
        optionKeys: ['repeatIntonation', 'separateStanzas', 'doElision'],
    },
    {
        id: 'leituras',
        title: 'Leituras',
        subtitle: 'Primeira Leitura e Evangelho',
        modelNames: ['Primeira Leitura', 'Evangelho tom A'],
        toneLabels: ['Primeira Leitura', 'Evangelho (tom A)'],
        toneLegend: 'Leitura',
        kind: 'standard',
        optionKeys: ['addOptionalStart', 'addOptionalEnd'],
        formula: {
            modelNames: ['Evangelho tom A'],
            label: 'Proclamação inicial',
            noneLabel: '— não incluir —',
            position: 'start',
            labels: {
                'Proclamação do Evangelho de Jesus Cristo segundo Mateus.': 'segundo Mateus',
                'Proclamação do Evangelho de Jesus Cristo segundo Marcos.': 'segundo Marcos',
                'Proclamação do Evangelho de Jesus Cristo segundo Lucas.': 'segundo Lucas',
                'Proclamação do Evangelho de Jesus Cristo segundo João.': 'segundo João',
            },
        },
    },
    {
        id: 'fieis',
        title: 'Oração dos fiéis',
        subtitle: 'Preces da assembleia',
        modelNames: ['Oração dos fiéis'],
        toneLabels: [],
        toneLegend: '',
        kind: 'standard',
        optionKeys: ['addOptionalStart', 'addOptionalEnd'],
    },
    {
        id: 'personalizado',
        title: 'Personalizado',
        subtitle: 'Corda de récita e padrões melódicos próprios',
        modelNames: ['Corda de récita', 'Personalizado'],
        toneLabels: ['Corda de récita', 'Padrão próprio'],
        toneLegend: 'Modelo',
        kind: 'custom',
        optionKeys: ['addOptionalStart', 'addOptionalEnd'],
        secondary: true,
    },
];

export const psalmModels: Model[] = defaultModels.filter((m) => m.type === 'salmo');

function findModel(name: string): Model {
    const model = defaultModels.find((m) => m.name === name);
    if (!model) throw new Error(`Modelo ausente em models.json: ${name}`);
    return model;
}

/** Modelos de uma página, na ordem declarada. Para o Salmo, a lista de salmodias. */
export function pageModels(page: ChantPage): Model[] {
    return page.kind === 'psalm' ? psalmModels : page.modelNames.map(findModel);
}

export function findPage(id: string): ChantPage | undefined {
    return chantPages.find((p) => p.id === id);
}

/**
 * As opções do seletor, montadas a partir do `find` do modelo escolhido — e não
 * de uma lista fixa, porque as frases mudam de um tom para o outro (o tom solene
 * da oração diz "Por Cristo, nosso Senhor.", os simples dizem "Por Cristo nosso
 * Senhor.", sem a vírgula).
 *
 * Entradas sem substituição utilizável ficam de fora: os dois tons simples da
 * oração trazem `"ERRO"` no lugar do GABC da última fórmula, e oferecê-la
 * imprimiria a palavra "ERRO" na partitura.
 */
export function formulaOptions(page: ChantPage, model: Model | null): FormulaOption[] {
    const picker = page.formula;
    if (!picker || !model || !picker.modelNames.includes(model.name)) return [];

    return model.find
        .map((text, index) => ({ text, gabc: model.replace[index] }))
        .filter((entry) => !!entry.gabc && entry.gabc.includes('('))
        .map(({ text }) => ({ label: picker.labels?.[text] ?? text, text }));
}

/** O seletor da página, se houver alguma fórmula utilizável no modelo escolhido. */
export function formulaPicker(page: ChantPage, model: Model | null): FormulaPicker | null {
    return page.formula && formulaOptions(page, model).length ? page.formula : null;
}

/**
 * Diz se um parâmetro muda alguma coisa no modelo escolhido. Sem isto a
 * interface mostra caixas inertes: "adicionar começo" é inócuo em 5 dos 13
 * modelos (`optionalStart` igual a `start`) e "adicionar final" em 8 deles
 * (`optionalEnd` vazio).
 */
export function optionApplies(key: string, model: Model | null): boolean {
    if (!model) return false;
    const isPsalm = model.type === 'salmo';

    switch (key) {
        // augustinus.ts ignora ambos quando o modelo é salmódico.
        case 'addOptionalStart':
            return !isPsalm && !!model.optionalStart && model.optionalStart !== model.start;
        case 'addOptionalEnd':
            return !isPsalm && !!model.optionalEnd;

        // A quelisma retoca a cadência final do prefácio; nada mais.
        case 'quelisma':
            return model.type === 'prefacio';

        // Só há o que remover se o modelo produzir "<sp>℣/℟</sp>" seguido de "()".
        // A corda de récita é exceção: `handleCustomModel` troca o `start` dela
        // por apenas a clave, então nenhum ℣ chega ao resultado.
        case 'includeBarredVParenthesis':
            if (model.type === 'custom' && model.tom === 'simples') return false;
            return [model.start, model.optionalStart, model.optionalEnd, ...model.replace]
                .some((gabc) => gabc.includes('</sp>'));

        // Entonação e estrofes vivem dentro do bloco `if (psalm)` do core.
        case 'repeatIntonation':
        case 'separateStanzas':
            return isPsalm;

        default:
            return true;
    }
}

/** Rótulo concreto do modelo ("Incluir 'Oremos'"), com recuo para o genérico. */
export function optionLabel(key: string, model: Model | null, fallback: string): string {
    if (key === 'addOptionalStart' && model?.optionalStartLabel) return model.optionalStartLabel;
    if (key === 'addOptionalEnd' && model?.optionalEndLabel) return model.optionalEndLabel;
    return fallback;
}

/**
 * Prefácios e bênçãos usam "**" como marcador de cadência final (para não
 * confundir com a pontuação); os demais modelos usam o separador padrão ".".
 */
export function defaultSeparator(model: Model | null): string {
    return model && (model.type === 'prefacio' || model.type === 'bencao') ? '**' : '.';
}
