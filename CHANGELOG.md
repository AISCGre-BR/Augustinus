# Changelog

Mudanças relevantes, do mais recente para o mais antigo.

## Interface 5.0 — uma página por tipo de canto

Motivo: a interface 4.0 tinha ficado pouco familiar. O tema era muito escuro,
as customizações estavam espalhadas em cards aninhados, e todas as opções de
todos os modelos apareciam ao mesmo tempo, mesmo as que não faziam nada no
modelo escolhido.

### Navegação

- **Página principal nova**: uma grade de cartões, um por tipo de canto —
  Orações presidenciais, Prefácios, Bênçãos, Salmo, Leituras, Oração dos fiéis
  e, discreto no rodapé, Personalizado.
- **Cada tipo virou uma página** com rota própria por hash (`#/prefacios`,
  `#/salmo`, …). Hash, e não History API, porque o site é estático no GitHub
  Pages: com rotas de caminho, um F5 em `/prefacios` daria 404.
- O seletor de modelo em cascata sumiu. O tom agora é um grupo de rádios dentro
  da própria página; só o Salmo mantém lista, porque são 39 tons. Antes era
  preciso escolher "Salmo" num dropdown para só então aparecer um segundo
  dropdown com os tons.

### Opções

- **Só as opções relevantes aparecem em destaque.** O resto foi para
  `Opções avançadas`, um bloco recolhido abaixo do botão de gerar.
- **Opções inertes somem.** "Adicionar começo" não muda nada em 5 dos 13
  modelos (`optionalStart` igual a `start`) e "adicionar final" em 8 deles
  (`optionalEnd` vazio) — nesses casos a caixa não é mais mostrada. O mesmo vale
  para a quelisma (só afeta prefácios), para a repetição de entonação e a
  separação de estrofes (o core só as usa em salmos) e para o `()` após o ℣.
- **Rótulos concretos**: "Adicionar começo" virou `Incluir "Oremos"` na oração,
  `Incluir a saudação inicial ("O Senhor esteja convosco")` no prefácio e no
  evangelho. Os textos vêm dos novos campos `optionalStartLabel` e
  `optionalEndLabel` em `models.json`.
- **Seletores de fórmulas prontas.** Vários modelos trazem frases inteiras em
  `find`/`replace`, que o core troca por um GABC escrito à mão — mas só se a
  pessoa digitasse a frase exata, com a acentuação certa (o casamento é literal:
  `model.find.indexOf(chunk + separator)`), e nada na interface dizia isso.
  Agora elas aparecem em seletores:
  **Evangelho** → "Proclamação inicial", com os quatro evangelistas. As opções
  são derivadas do `find` do modelo, não de uma lista fixa, e entradas sem
  substituição utilizável ficam de fora. O GABC gerado é idêntico ao de digitar
  a frase à mão, que continua valendo; se a letra já traz a fórmula, o seletor
  não a duplica; e trocar de tom descarta uma escolha que o novo tom não musica.
  O mecanismo é genérico (`formulaPicker`), mas só o Evangelho o usa — as
  orações e as bênçãos ficaram de fora por decisão do Gigio.
- **O aviso sobre empilhamento só aparece quando há empilhamento.** Antes era um
  texto fixo abaixo de toda partitura. Agora é condicionado a `\stacktext` estar
  no GABC gerado.
- O botão **Gerar partitura** subiu para logo abaixo da letra.
- Letra e GABC voltaram a ficar empilhados, como antes das abas da 4.0; o GABC
  fica num bloco recolhível que abre sozinho depois de gerar.

### Tema

- Paleta da linha 3.x de volta: fundo `#2F2A20`, painel `#4A443A`, acento
  `#9B5B4D`, pergaminho `#F5F0E1`.
- **Campos de texto voltaram a ser claros** (pergaminho com tinta escura). Era
  isso que dava a sensação de interface "mais clara".
- Saíram os switch-toggles animados (voltaram os checkboxes nativos), os cards
  aninhados com sombra em três níveis, os emojis nos botões e o disclaimer em
  caixa colorida.
- O `style.css` voltou a ser o tema de verdade. Na 4.0 ele continuava no repo
  mas estava morto, sobrescrito por um `<style>` global dentro do `App.vue`.

### Memória

- O estado agora sobrevive ao F5, guardado em `localStorage` sob a chave
  `augustinus:v1`. Não são cookies: o site é estático, então cookies só seriam
  trafegados à toa a cada requisição, com limite de 4 KB.
- Letra, GABC e tom são guardados **por página**, para o texto da coleta não
  aparecer na página do prefácio. Parâmetros, zoom e cabeçalho são globais.
- Há um "Limpar tudo" dentro de Opções avançadas.

### Correções

- **Impressão partia a pauta entre duas páginas.** A lib devolve a partitura
  inteira num único `<svg>`, e não existe quebra de página dentro de um SVG: o
  navegador cortava onde a página acabasse, partindo pauta, neumas e letra no
  meio. Agora `render.ts` fatia a partitura em um `<svg>` por linha de canto
  (`g.ChantLine` + o `g.chantLineInteractive` correspondente), cada um num bloco
  com `break-inside: avoid`. Na tela o resultado é idêntico: as fatias mantêm o
  espaçamento original da lib, e a sobreposição de ~9 px entre linhas (descidas
  de "g", "j", "p") é devolvida como margem inferior negativa. Verificado
  imprimindo em PDF A4: nenhuma linha atravessa a quebra.
  De brinde, cada fatia ganhou `viewBox`, então em tela estreita a partitura
  passa a encolher em vez de ser cortada à direita.
- **Pautas desalinhadas das notas no Firefox.** A lib posiciona os glifos com
  `dominant-baseline="text-top"`. O Chromium ignora esse valor e cai em
  `alphabetic`; o Firefox o honra, tratando-o como `text-before-edge`. Como a
  lib foi calibrada pelo Chromium, no Firefox a notação inteira descia cerca de
  uma linha em relação à pauta — que é desenhada em `<line>`, em coordenadas
  absolutas, e por isso não acompanhava. Não era regressão da 5.0: a 4.0 tinha
  o mesmo defeito no Firefox.
  `render.ts` agora **mede o comportamento** do navegador (pinta o mesmo texto
  com `text-top` e com `alphabetic` e compara onde cada um caiu) e só injeta a
  regra `dominant-baseline: alphabetic` se os dois diferirem. Nada de farejar
  navegador, e no Chromium a regra nem chega a ser aplicada.
- **Espera pelas fontes antes de medir glifos** (endurecimento). O `GlyphMeasurer`
  mede a greciliae num canvas e cacheia pela sessão; renderizar antes de a fonte
  chegar envenenava o cache.
- **Separador não é mais sobrescrito em silêncio.** Ele acompanha o modelo
  (`**` em prefácios e bênçãos, `.` nos demais) até você editá-lo à mão; a
  partir daí o valor digitado é respeitado, com um link para voltar ao padrão.
  Antes, trocar de modelo apagava o que tinha sido digitado.
- **Reverter GABC de bênção** usava o separador errado. O botão assumia `**` só
  para prefácios, enquanto a geração usava `**` para prefácios *e* bênçãos.
- Os campos `customStart` e `customPattern` não são mais sobrescritos a cada
  troca de modelo. Eles só valem para modelos `custom`, onde o core monta o
  modelo a partir deles.

### Estrutura

- `App.vue` virou só a casca (cabeçalho + rota).
- Novos: `chant-pages.ts` (definição das páginas), `router.ts`, `store.ts`,
  `render.ts`, `components/HomePage.vue`, `components/ChantPage.vue`,
  `components/AdvancedOptions.vue`.
- Removidos: `components/OptionsPanel.vue`, `components/TextEditor.vue`.
