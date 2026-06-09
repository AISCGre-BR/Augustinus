export interface Pattern {
    symbol: string;
    gabc: string;
}

export interface Model {
    name: string;
    type: string;
    tom: string;
    optionalEnd: string;
    optionalStart: string;
    start: string;
    default: string;
    patterns: Pattern[];
    find: string[];
    replace: string[];
}

export type ParameterGroup = 'general' | 'psalm' | 'custom' | 'hidden';
export type ParameterType = 'boolean' | 'string' | 'select';

// Define the schema as a const to allow type extraction
export const parameterDefinitions = [
    // GENERAL - OBLIGATORY/COMMON FIRST
    { key: 'separator', label: 'Separador', type: 'string', group: 'general', defaultValue: '.' },
    { key: 'addOptionalStart', label: 'Adicionar começo', type: 'boolean', group: 'general', defaultValue: false },
    { key: 'addOptionalEnd', label: 'Adicionar final', type: 'boolean', group: 'general', defaultValue: false },
    { key: 'removeNumbers', label: 'Remover números', type: 'boolean', group: 'general', defaultValue: true },
    { key: 'removeParenthesis', label: 'Remover parênteses', type: 'boolean', group: 'general', defaultValue: true },
    { key: 'removeSeparator', label: 'Remover separador', type: 'boolean', group: 'general', defaultValue: false },
    { key: 'quelisma', label: 'Quelisma no prefácio (experimental)', type: 'boolean', group: 'general', defaultValue: false },
    { key: 'includeBarredVParenthesis', label: 'Incluir () após o ℣ barrado', type: 'boolean', group: 'general', defaultValue: false },
    { key: 'curlyDiphthongs', label: 'Incluir {} em ditongos', type: 'boolean', group: 'general', defaultValue: false },
    { key: 'autoStack', label: 'Auto-separação de sílabas em empilhamento', type: 'boolean', group: 'general', defaultValue: false },

    // PSALMS
    { key: 'repeatIntonation', label: 'Repetir entonação', type: 'boolean', group: 'psalm', defaultValue: true },
    { key: 'separateStanzas', label: 'Separar estrofes', type: 'boolean', group: 'psalm', defaultValue: true },
    { key: 'doElision', label: 'Fazer elisão (experimental)', type: 'boolean', group: 'psalm', defaultValue: false },

    // CUSTOM OPTIONS
    { key: 'customNote', label: 'Nota', type: 'string', group: 'custom', defaultValue: 'g' },
    { key: 'customClef', label: 'Clave', type: 'select', group: 'custom', defaultValue: 'c4', options: [
        { label: 'c1', value: 'c1' },
        { label: 'c2', value: 'c2' },
        { label: 'c3', value: 'c3' },
        { label: 'c4', value: 'c4' },
        { label: 'f3', value: 'f3' },
        { label: 'f4', value: 'f4' },
        { label: 'cb3', value: 'cb3' },
    ]},
    { key: 'customPattern', label: 'Padrão', type: 'string', group: 'custom', defaultValue: '(g) (gr gr gr) (fe) (ef) (g) (fgr1) (fr) (f) (:)' },
    { key: 'customStart', label: 'Começo', type: 'string', group: 'custom', defaultValue: '(c3) <sp>V/</sp> ' },

    // HIDDEN/METADATA
    { key: 'header', label: 'Metadados', type: 'string', group: 'hidden', defaultValue: '' },
] as const;

// Helper to extract the key types from the definitions
type Definition = typeof parameterDefinitions[number];

// Dynamically generate the Parameters type based on the keys and default values in the definitions
export type Parameters = {
    [K in Definition as K['key']]: K['defaultValue'] extends boolean ? boolean : string;
};

export interface ParameterMetadata {
    key: string;
    label: string;
    type: ParameterType;
    group: ParameterGroup;
    defaultValue: string | boolean;
    options?: { label: string; value: string }[];
}

export const getDefaultParameters = (): Parameters => {
    const defaults: any = {};
    parameterDefinitions.forEach(param => {
        // @ts-ignore - Dynamic key assignment
        defaults[param.key] = param.defaultValue;
    });
    return defaults as Parameters;
};
