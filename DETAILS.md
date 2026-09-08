# Detalhes do projeto

Notas de implementação do Augustinus — o que não dá para deduzir só lendo o
código. Para a organização geral dos pacotes, ver
[CODEBASE_STRUCTURE.md](CODEBASE_STRUCTURE.md).

## Frontend (`packages/frontend`)

### Uma página por tipo de canto

`src/chant-pages.ts` é a fonte única de verdade da navegação. Cada entrada de
`chantPages` descreve uma página: o id (que vira a rota `#/<id>`), o título, os
modelos de `models.json` que ela oferece, os rótulos curtos do seletor de tom e
os `optionKeys` — os parâmetros que aparecem em destaque naquela página. Tudo o
mais (página principal, seletor de tom, bloco de opções avançadas) é gerado a
partir daí.

`kind` diz de onde vêm os modelos:

| `kind`     | Modelos                                        | Extra |
|------------|------------------------------------------------|-------|
| `standard` | os nomes listados em `modelNames`              | —     |
| `psalm`    | os 39 modelos com `type: "salmo"`              | seletor vira lista |
| `custom`   | os nomes listados, todos com `type: "custom"`  | mostra os campos de customização musical |

### `optionApplies` — por que uma opção some

O core ignora vários parâmetros dependendo do modelo. Antes a interface mostrava
todos mesmo assim, e o usuário marcava caixas que não mudavam nada. As regras
estão centralizadas em `optionApplies` e vêm da leitura do core:

- `addOptionalStart` — `augustinus.ts` troca o `start` pelo `optionalStart`.
  Se forem iguais (Oração dos fiéis, Primeira Leitura, Bênção solene, Corda de
  récita, Personalizado) não há diferença. E o core ignora o parâmetro em
  salmos (`&& !psalm`).
- `addOptionalEnd` — exige `model.optionalEnd` não vazio; está vazio em 8 dos
  13 modelos, incluindo os dois prefácios.
- `quelisma` — a regex só toca a cadência final de prefácio.
- `includeBarredVParenthesis` — só há o que remover se o GABC tiver `</sp>`.
  A corda de récita é exceção: `handleCustomModel` troca o `start` dela por
  apenas a clave.
- `repeatIntonation` / `separateStanzas` — vivem dentro do bloco `if (psalm)`.

`doElision` não entra na lista: apesar de estar no grupo `psalm`, `applyModel`
o aplica em qualquer modelo (desde o commit `b81bc92`).

### Fórmulas prontas (`formulaPicker`)

Vários modelos trazem pares `find`/`replace`: se um trecho do texto for
exatamente igual a uma entrada de `find`, o core troca a linha inteira por um
GABC escrito à mão. O casamento é literal —
`model.find.indexOf(chunk + separator)` — então era preciso saber a frase de cor.

`FormulaPicker` põe essas frases num seletor. A página declara em que modelos
ele aparece, a posição (`start` abre o canto, `end` o fecha) e, opcionalmente,
rótulos curtos por frase.

`formulaOptions()` monta as opções a partir do `find` do **modelo escolhido**, e
não de uma lista fixa, por dois motivos concretos:

- As frases mudam de um tom para o outro. A oração no tom solene diz
  "Por Cristo, nosso Senhor."; os tons simples dizem "Por Cristo nosso Senhor.",
  sem a vírgula. O tom simples B ainda difere no "Ele, que é Deus, e convosco…".
- Nem toda entrada tem substituição utilizável. Os dois tons simples da oração
  trazem `"ERRO"` no lugar do GABC da 7ª fórmula — oferecê-la imprimiria a
  palavra "ERRO" na partitura. O filtro exige que o `replace` exista e contenha
  `(`, ou seja, que seja GABC de verdade.

Sem `labels`, a opção aparece com o próprio texto; é o caso das conclusões das
orações, que já se leem bem. O Evangelho usa `labels` para encurtar as quatro
proclamações para "segundo Mateus" etc.

A escolha não é um parâmetro do core: `ChantPage` monta o texto (fórmula +
letra) e passa para `generateGabc`. O resultado é byte a byte igual ao de
digitar a frase — o que continua funcionando. Se a letra já contiver uma das
fórmulas, `alreadyTyped` impede a duplicação; e ao trocar de tom, uma escolha
ausente no novo modelo é descartada.

Ligado hoje no Evangelho e nas orações. As bênçãos ficaram pendentes de decisão;
ver o ROADMAP.

### Separador

`defaultSeparator()` devolve `**` para prefácios e bênçãos, `.` para o resto.
Prefácios usam `**` para o marcador de cadência final não se confundir com a
pontuação do texto.

O campo é editável em Opções avançadas. `state.separatorAuto` controla se ele
acompanha o modelo: começa `true`, e a primeira edição manual o desliga. Sem
isso, trocar de tom apagava em silêncio o que tinha sido digitado — era o
comportamento até a 4.0.

### Memória (`src/store.ts`)

`localStorage`, chave `augustinus:v1`. Não são cookies: o site é estático
(GitHub Pages), então cookies só seriam trafegados a cada requisição, e o limite
é de 4 KB.

- **Por página**: `tone`, `lyrics`, `gabc`, `formula`. Assim o texto da coleta não aparece
  na página do prefácio.
- **Global**: `parameters` (incluindo `header`), `separatorAuto`, `zoom`.

Na leitura, só chaves que ainda existem em `getDefaultParameters()` são
aproveitadas, e só quando o tipo bate — um estado antigo não ressuscita um
parâmetro que o core removeu. A gravação é adiada em 300 ms e engolir erro de
cota é proposital: seguir sem memória é melhor que derrubar a interface.

### Roteamento (`src/router.ts`)

Hash (`#/prefacios`), ~20 linhas, sem `vue-router`. History API daria 404 num F5
porque o GitHub Pages não tem fallback de SPA. `currentRoute` é `''` na página
principal; um hash desconhecido também cai em `''`.

### Renderização (`src/render.ts`)

**As fontes têm de estar carregadas antes de qualquer renderização.** O caminho
é `renderSvg` → `prepareNotations` → `new Clef` → `GlyphVisualizer.setBounds` →
`GlyphMeasurer.measureChar`: a lib desenha o glifo num `<canvas>` e varre os
pixels (`firstTop`/`firstBottom`) para achar altura e profundidade. É dessa
medição que sai a geometria da clave e das pautas — enquanto as notas vêm das
fontes embutidas em base64 dentro do próprio SVG. Medir antes da fonte chegar
significa medir o glifo de recuo: pautas deslocadas das notas, pelo resto da
sessão, porque o `GlyphMeasurer` cacheia e não é exportado pela lib para ser
limpo de fora.

Por isso `whenFontsReady()` chama `document.fonts.load()` nas quatro famílias e
espera `document.fonts.ready`, e `renderGabc` só mede depois disso. O
`<link rel="preload">` do `index.html` não resolve: ele aquece o cache de rede,
mas nenhum elemento da página escreve com essas fontes, então o navegador não
tem motivo para ativar a face. Há um limite de 3 s para a partitura não ficar em
branco se o carregamento travar, e um token de sequência descarta renderizações
ultrapassadas (troca de página durante a espera).

**`dominant-baseline` diverge entre navegadores.** A lib posiciona os glifos com
`dominant-baseline="text-top"`. O Chromium ignora esse valor e cai em
`alphabetic`; o Firefox o honra, tratando-o como `text-before-edge`. Como a lib
foi calibrada pelo Chromium, no Firefox a notação inteira descia cerca de uma
linha em relação à pauta — que é desenhada em `<line>`, em coordenadas
absolutas, e por isso não acompanhava.

`applyBaselineWorkaround()` **mede o comportamento** em vez de farejar o
navegador: pinta o mesmo texto com `text-top` e com `alphabetic` num SVG fora da
tela e compara `getBoundingClientRect().top`. Se diferirem, injeta

```css
.chant-container svg text[dominant-baseline="text-top"]{dominant-baseline:alphabetic;}
```

Onde `text-top` já era ignorado (Chromium), a regra não é sequer aplicada.
Atenção: `getBBox()` **não** serve para essa detecção — no Firefox ele devolve o
mesmo valor para as duas linhas de base, ignorando o deslocamento que de fato
acontece na pintura.

`GregorianChantSVGRenderer` é criado uma vez e recriado quando o contêiner muda
(troca de página). Dois detalhes herdados:

- `context.lineWidthPx` é ajustado à largura real do papel. O padrão da lib é
  800px, mas o SVG sai com `width:100%` e sem `viewBox`, então o que passar
  disso é cortado à direita.
- `{a~a}` é reescrito para `{a_a}` antes de renderizar.

### Aviso de empilhamento

O aviso de que o empilhamento pode não sair certo na pré-visualização só aparece
quando a partitura de fato o usa: `ChantPage` procura `\stacktext` no GABC
gerado (é o que `applyModel` emite para `[texto/outro]`) e passa o resultado ao
`ChantPreview`.

### Fatiamento por linha de canto

A lib devolve a partitura inteira num único `<svg>`. Como não existe quebra de
página dentro de um SVG, ao imprimir o navegador cortava onde a página acabasse.

`splitIntoLines()` desmonta o SVG num `<svg>` por linha: cada `g.ChantLine` vai
com o `g.chantLineInteractive` de mesmo índice para uma fatia própria, dentro de
um `div.chant-line` que leva `break-inside: avoid`.

Detalhes que importam:

- Cada fatia recebe `viewBox="0 <topo> <largura> <altura>"` em coordenadas de
  pixel — a lib emite o SVG sem `viewBox`, então 1 unidade = 1 px.
- O `<defs>` (que carrega as fontes em base64) fica **só na primeira fatia**:
  `@font-face` dentro de um SVG embutido vale para o documento inteiro, e
  replicá-lo multiplicaria megabytes por linha.
- A tinta de uma linha invade ~9 px a faixa da seguinte (descidas de "g", "j",
  "p"). Cada fatia tem a altura da própria tinta, para nada ser cortado, e uma
  margem inferior negativa do tamanho da sobreposição — o que reproduz o
  espaçamento original da lib exatamente.
- `.chant-line > svg { display: block }` é obrigatório: como `inline`, o SVG
  ganha o vão da linha-base e afasta as pautas ~4 px por linha.
- O renderizador é recriado a cada chamada, já que `splitIntoLines` desmonta o
  SVG que ele produziu.

### Impressão

Regras em dois lugares: `style.css` esconde cabeçalho e coluna de controles;
`ChantPreview.vue` neutraliza o zoom, a sombra e a rolagem do papel A4.

## Core (`packages/core`)

### `models.json`

52 modelos: 13 comuns + 39 salmódicos. Campos usados pela interface além dos já
documentados:

- `optionalStartLabel` / `optionalEndLabel` (opcionais): o texto do checkbox na
  interface, ex.: `Incluir "Oremos"`. Sem eles, cai no rótulo genérico de
  `parameterDefinitions`. Estão preenchidos nos 3 modelos de oração, nos 2
  prefácios, na bênção simples e no evangelho.

### Modelos `custom`

`handleCustomModel` (`src/core/parameters.ts`) reescreve o modelo antes de gerar:

- `tom: "simples"` (Corda de récita) — monta `start` e `default` a partir de
  `customClef` e `customNote`; ignora `customStart` e `customPattern`.
- `tom: "solene"` (Personalizado) — usa `customPattern` como `default` e
  `customStart` como `start` e `optionalStart`.

Ou seja, o `start`/`default` que estão em `models.json` para esses dois modelos
nunca são usados.
