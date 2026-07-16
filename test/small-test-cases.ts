import { type Parameters } from '../packages/core/src/augustinus';

export interface TestCase {
    id: string;
    description: string;
    text: string;
    model: string;
    parameters: Partial<Parameters>;
    expectedInclude?: string[];
    expectedExclude?: string[];
}

export const smallTestCases: TestCase[] = [
    // Model specific / Fixed logic tests
    {
        id: "por-isso-mapping",
        description: "Mapeamento específico de 'Por isso,' em prefácios solenes",
        text: "Por isso,",
        model: "Prefácio tom solene",
        parameters: { separator: "." },
        expectedInclude: ["Por(f) is(ef)so,(f) (,)"]
    },
    {
        id: "quelisma-true",
        description: "Quelisma ATIVADO em prefácios solenes",
        text: "cantando a uma só voz:.",
        model: "Prefácio tom solene",
        parameters: { separator: ".", quelisma: true },
        expectedInclude: ["can(g)tan(fgwh)do(g)", "voz:(fgf)"]
    },
    {
        id: "quelisma-false",
        description: "Quelisma DESATIVADO em prefácios solenes",
        text: "cantando a uma só voz:.",
        model: "Prefácio tom solene",
        parameters: { separator: ".", quelisma: false },
        expectedExclude: ["can(g)tan(fgwh)do(g)"],
        expectedInclude: ["can(g)tan(g)do(g)", "voz:(fgf)"]
    },
    {
        id: "punctuation-fix",
        description: "Correção de pontuação combinada (,.)",
        text: "Ó Deus todo-poderoso,.",
        model: "Oração tom solene",
        parameters: { separator: "." },
        expectedInclude: ["po(g)de(g)ro(h)so,(h)"],
        expectedExclude: [",."]
    },
    {
        id: "trailing-double-colon",
        description: "Garantia de (::) no final",
        text: "Ó Deus todo-poderoso",
        model: "Oração tom solene",
        parameters: { separator: "." },
        expectedInclude: ["(::)"]
    },
    {
        id: "add-optional-start-true",
        description: "Adicionar início opcional: TRUE",
        text: "Ó Deus todo-poderoso",
        model: "Oração tom solene",
        parameters: { separator: ".", addOptionalStart: true },
        expectedInclude: ["<c><sp>V/</sp>.</c>() O(h)re(gh)mos.(h) (::)"]
    },
    {
        id: "add-optional-start-false",
        description: "Adicionar início opcional: FALSE",
        text: "Ó Deus todo-poderoso",
        model: "Oração tom solene",
        parameters: { separator: ".", addOptionalStart: false },
        expectedExclude: ["O(h)re(gh)mos.(h) (::)"],
        expectedInclude: ["(c4) <c><sp>V/</sp>.</c>() Ó(g) Deus(h) to(h)do-(h)po(g)de(g)ro(h)so(h) (::)"]
    },
    {
        id: "add-optional-end-true",
        description: "Adicionar final opcional: TRUE",
        text: "Ó Deus todo-poderoso",
        model: "Oração tom solene",
        parameters: { separator: ".", addOptionalEnd: true },
        expectedInclude: ["<c><sp>R/</sp>.</c> A(g)mém.(gh) (::)"]
    },
    {
        id: "add-optional-end-false",
        description: "Adicionar final opcional: FALSE",
        text: "Ó Deus todo-poderoso",
        model: "Oração tom solene",
        parameters: { separator: ".", addOptionalEnd: false },
        expectedExclude: ["A(g)mém.(gh)"]
    },
    {
        id: "remove-numbers-true",

        description: "Remover números: TRUE",
        text: "Ó Deus todo-poderoso 123",
        model: "Oração tom solene",
        parameters: { separator: ".", removeNumbers: true },
        expectedExclude: ["1", "2", "3"]
    },
    {
        id: "remove-numbers-false",
        description: "Remover números: FALSE",
        text: "Ó Deus todo-poderoso 123",
        model: "Oração tom solene",
        parameters: { separator: ".", removeNumbers: false },
        expectedInclude: ["so(h) 123 (::)"]
    },
    {
        id: "remove-parenthesis-true",
        description: "Remover parênteses: TRUE",
        text: "Ó Deus todo-poderoso (removido)",
        model: "Oração tom solene",
        parameters: { separator: ".", removeParenthesis: true },
        expectedExclude: ["removido"]
    },
    {
        id: "remove-parenthesis-false",
        description: "Remover parênteses: FALSE",
        text: "Ó Deus todo-poderoso (mantido)",
        model: "Oração tom solene",
        parameters: { separator: ".", removeParenthesis: false },
        expectedInclude: ["<v>(</v>man(g)ti(h)do(h)<v>)</v>"]
    },
    {
        id: "remove-separator-true",
        description: "Remover separador: TRUE",
        text: "Ó Deus todo-poderoso.",
        model: "Oração tom solene",
        parameters: { separator: ".", removeSeparator: true },
        expectedExclude: ["so.(h)"]
    },
    {
        id: "remove-separator-false",
        description: "Remover separador: FALSE",
        text: "Ó Deus todo-poderoso.",
        model: "Oração tom solene",
        parameters: { separator: ".", removeSeparator: false },
        expectedInclude: ["so.(h)"]
    },
    {
        id: "include-barred-v-parenthesis-true",
        description: "Incluir parênteses no V/ barrado: TRUE",
        text: "Ó Deus todo-poderoso",
        model: "Oração tom solene",
        parameters: { separator: ".", includeBarredVParenthesis: true },
        expectedInclude: ["<c><sp>V/</sp>.</c>()"]
    },
    {
        id: "include-curly-diphthongs-true",
        description: "Incluir {} nas ocorrências de ditongos: TRUE",
        text: "Ó Deus todo-poderoso",
        model: "Oração tom solene",
        parameters: { separator: ".", curlyDiphthongs: true },
        expectedInclude: ["{eu}"]
    },
    {
        id: "include-curly-diphthongs-false",
        description: "Incluir {} nas ocorrências de ditongos: FALSE",
        text: "Ó Deus todo-poderoso",
        model: "Oração tom solene",
        parameters: { separator: ".", curlyDiphthongs: false },
        expectedExclude: ["{eu}"]
    },
    {
        id: "include-barred-v-parenthesis-false",
        description: "Incluir parênteses no V/ barrado: FALSE",
        text: "Ó Deus todo-poderoso",
        model: "Oração tom solene",
        parameters: { separator: ".", includeBarredVParenthesis: false },
        expectedExclude: ["<c><sp>V/</sp>.</c>()"],
        expectedInclude: ["<c><sp>V/</sp>.</c>"]
    },
    {
        id: "do-elision-true",
        description: "Fazer elisão: TRUE",
        text: "A minha alma",
        model: "Oração tom solene",
        parameters: { separator: ".", doElision: true },
        expectedInclude: ["mi(g)nh{a~a}l(h)ma(h)"]
    },
    {
        id: "do-elision-false",
        description: "Fazer elisão: FALSE",
        text: "A minha alma",
        model: "Oração tom solene",
        parameters: { separator: ".", doElision: false },
        expectedExclude: ["{mi~nha~al(g)ma(h)}"],
        expectedInclude: ["mi(g)nha(g) al(h)ma(h)"]
    },
    {
        id: "tag-preservation-simple",
        description: "Preservação de tags simples (<b>)",
        text: "Ó <b>benção</b> todo-poderoso",
        model: "Oração tom solene",
        parameters: { separator: "." },
        expectedInclude: ["<b>ben(h)ção(h)</b>"]
    },
    {
        id: "tag-inside-word",
        description: "Tag dentro de uma palavra",
        text: "Ó ben<b>ção</b> todo-poderoso",
        model: "Oração tom solene",
        parameters: { separator: "." },
        expectedInclude: ["ben(h)<b>ção(h)</b>"]
    },
    {
        id: "tag-preservation-barred-v",
        description: "Preservação de tag de versículo (<sp>V/</sp>)",
        text: "<sp>V/</sp> O Senhor esteja convosco",
        model: "Oração tom solene",
        parameters: { separator: "." },
        expectedInclude: ["<sp>V/</sp> O(g) Se(h)nhor(h)"]
    },
    {
        id: "tag-preservation-alt",
        description: "Preservação de tag de alternativa (<alt>Alt.</alt>)",
        text: "<alt>Alt.</alt> O Senhor esteja convosco",
        model: "Oração tom solene",
        parameters: { separator: "." },
        expectedInclude: ["<alt>Alt.</alt> O(g) Se(h)nhor(h)"]
    },
    {
        id: "tag-across-words",
        description: "Tag abrangendo múltiplas palavras",
        text: "Ó <b>Deus todo</b> poderoso",
        model: "Oração tom solene",
        parameters: { separator: "." },
        expectedInclude: ["<b>Deus(h) to(h)do(h)</b>"]
    },
    {
        id: "case-insensitive-monosyllables",
        description: "Monossilábico com maiúscula (De) deve ser tratado como átono",
        text: "De Deus.",
        model: "Prefácio tom simples",
        parameters: { separator: ".", removeSeparator: false },
        expectedInclude: ["De(f) Deus.(gf)"]
    },
    {
        id: "monosyllable-punctuation",
        description: "Monossilábico com pontuação (de,) deve ser tratado como átono",
        text: "Senhor de, Deus.",
        model: "Prefácio tom simples",
        parameters: { separator: ".", removeSeparator: false },
        expectedInclude: ["de,(f) Deus.(gf)"]
    },
    {
        id: "stack-2-lines",
        description: "Suporte a texto multi-linha (2 linhas)",
        text: "[cima/baixo] assim",
        model: "Oração tom solene",
        parameters: { separator: "." },
        expectedInclude: ["\\stacktext{cima}{baixo}"]
    },
    {
        id: "stack-3-lines",
        description: "Suporte a texto multi-linha (3 linhas)",
        text: "[cima/meio/baixo] assim",
        model: "Oração tom solene",
        parameters: { separator: "." },
        expectedInclude: ["\\stacktext{cima}{meio}{baixo}"]
    },
    {
        id: "stack-4-lines",
        description: "Suporte a texto multi-linha (4 linhas)",
        text: "[um/dois/três/quatro] assim",
        model: "Oração tom solene",
        parameters: { separator: "." },
        expectedInclude: ["\\stacktext{um}{dois}{três}{quatro}"]
    },
    {
        id: "stack-epenthesis",
        description: "Epêntese em texto empilhado (topo vazio)",
        text: "[/baixo] assim",
        model: "Oração tom solene",
        parameters: { separator: "." },
        expectedInclude: ["\\stacktext{}{baixo}", "(gr)"]
    },
    {
        id: "auto-stack-true",
        description: "Auto-separação de sílabas em empilhamento: TRUE",
        text: "[Benedictus/Benedictus] Dominus",
        model: "Oração tom solene",
        parameters: { separator: ".", autoStack: true },
        expectedInclude: [
            "\\stacktext{Be-}{Be-}",
            "\\stacktext{ne-}{ne-}",
            "\\stacktext{dic-}{dic-}",
            "\\stacktext{tus}{tus}"
        ]
    },
    {
        id: "auto-stack-false",
        description: "Auto-separação de sílabas em empilhamento: FALSE",
        text: "[Benedictus/Benedictus] Dominus",
        model: "Oração tom solene",
        parameters: { separator: ".", autoStack: false },
        expectedInclude: ["\\stacktext{Benedictus}{Benedictus}"]
    },
    {
        id: "auto-stack-hyphen-bug",
        description: "Auto-stack: Sem hífen na última sílaba de palavras curtas no stack",
        text: "[Benedictus/Bene] Dominus",
        model: "Oração tom solene",
        parameters: { separator: ".", autoStack: true },
        expectedInclude: ["\\stacktext{ne-}{ne}"]
    },
    {
        id: "auto-stack-epenthesis-bug",
        description: "Auto-stack: Notas de epêntese quando o primeiro grupo é mais curto",
        text: "[Bene/Benedictus] Dominus",
        model: "Oração tom solene",
        parameters: { separator: ".", autoStack: true },
        expectedInclude: ["\\stacktext{ne}{ne-}", "\\stacktext{}{dic-}</v>}(hr)", "\\stacktext{}{tus}</v>}(hr)"]
    },
    // Custom macros tests
    {
        id: "macro-redv",
        description: "Macro \\redv expande para V/ em tags <c><sp>",
        text: "<v>\\redv</v> Dominus",
        model: "Oração tom solene",
        parameters: { separator: "." },
        expectedInclude: ["<sp>V/</sp>"]
    },
    {
        id: "macro-redcross",
        description: "Macro \\redcross expande para +",
        text: "<v>\\redcross</v> Dominus",
        model: "Oração tom solene",
        parameters: { separator: "." },
        expectedInclude: ["<c>+</c>"]
    },
    {
        id: "macro-ramem-bencao",
        description: "Macro \\ramem expande para R/ Amém em bencao",
        text: "<v>\\ramem</v>",
        model: "Bênção tom solene",
        parameters: { separator: "." },
        expectedInclude: ["<c><sp>R/</sp>.</c> A(g)mém.(gh) (::Z)"]
    },
    {
        id: "macro-ramem-oracao",
        description: "Macro \\ramem em oração: apenas Amém sem R/",
        text: "<v>\\ramem</v>",
        model: "Oração tom solene",
        parameters: { separator: "." },
        expectedInclude: ["A(g)mém"],
        expectedExclude: ["R/"]
    },
    {
        id: "macro-ramem-prefacio",
        description: "Macro \\ramem em prefácio: apenas Amém sem R/",
        text: "<v>\\ramem</v>",
        model: "Prefácio tom solene",
        parameters: { separator: "." },
        expectedInclude: ["A(g)mém"],
        expectedExclude: ["R/"]
    },
    {
        id: "macro-rubric-simple",
        description: "Macro \\rubric{texto} expande para alt tag",
        text: "<v>\\rubric{Alt.}</v> O Senhor",
        model: "Oração tom solene",
        parameters: { separator: "." },
        expectedInclude: ["<alt>Alt.</alt>"]
    },
    {
        id: "macro-rubric-multiword",
        description: "Macro \\rubric com múltiplas palavras",
        text: "<v>\\rubric{Versículo do Senhor}</v>",
        model: "Oração tom solene",
        parameters: { separator: "." },
        expectedInclude: ["<alt>Versículo do Senhor</alt>"]
    },
    {
        id: "macro-nome",
        description: "Macro \\nome expande para N. com nota",
        text: "<v>\\nome</v> Dominus",
        model: "Oração tom solene",
        parameters: { separator: "." },
        expectedInclude: ["<c>N.</c>(hrhrhr)"]
    },
    {
        id: "macro-nome-in-context",
        description: "Macro \\nome dentro de um contexto textual",
        text: "Dominus <v>\\nome</v> meus",
        model: "Oração tom solene",
        parameters: { separator: "." },
        expectedInclude: ["<c>N.</c>(hrhrhr)"]
    },
    {
        id: "macro-multiple-redv",
        description: "Múltiplas instâncias de \\redv",
        text: "<v>\\redv</v> Dominus <v>\\redv</v> Deus",
        model: "Oração tom solene",
        parameters: { separator: "." },
        expectedInclude: ["<sp>V/</sp>"]
    },
    {
        id: "macro-mixed-macros",
        description: "Combinação de diferentes macros",
        text: "<v>\\redv</v> Dominus. <v>\\redcross</v>",
        model: "Oração tom solene",
        parameters: { separator: "." },
        expectedInclude: ["<sp>V/</sp>", "<c>+</c>"]
    },
    {
        id: "macro-nome-default-note",
        description: "Macro \\nome com nota padrão h quando nenhuma nota precede",
        text: "<v>\\nome</v> Dominus",
        model: "Oração tom solene",
        parameters: { separator: "." },
        expectedInclude: ["<c>N.</c>(hrhrhr)"]
    }
];
