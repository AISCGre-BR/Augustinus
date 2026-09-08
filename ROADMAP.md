# Roadmap

Plano de ação. O que já foi feito está no [CHANGELOG.md](CHANGELOG.md).

## Próximo

### Interface mobile — revisar quão intuitivo é usar

A interface 5.0 já responde a telas estreitas (a coluna de controles vira bloco
acima da partitura abaixo de 900px, e a grade de cartões vira uma coluna abaixo
de 760px), mas isso é só layout — não é uma revisão de uso real no celular.
Pontos a olhar quando for a vez:

- O papel A4 tem 210 mm fixos. Num celular ele nasce maior que a tela e obriga a
  rolagem horizontal; o zoom começa em 100%. Talvez deva começar ajustado à
  largura da tela.
- A barra de zoom e o botão de imprimir estão acima da partitura; no celular a
  partitura já entra fora da primeira dobra.
- O `<textarea>` da letra tem 12 linhas fixas; em tela pequena empurra o botão
  "Gerar partitura" para fora da vista.

### Fórmulas prontas nas bênçãos — decidir o formato

O seletor de fórmulas (`formulaPicker` em `chant-pages.ts`) já está ligado no
Evangelho (proclamação inicial) e nas orações (conclusões). Falta decidir se e
como ligá-lo nas bênçãos — **o Gigio ainda está pensando no melhor jeito.**

As duas bênçãos (solene e simples) têm as mesmas duas entradas em
`find`/`replace`, e elas não se parecem com os outros casos:

- `"Amém."` — não é uma fórmula a escolher, é uma resposta que aparece no meio
  do canto. Além disso, o core já a trata à parte: `augustinus.ts` quebra o
  texto em `"Amém."` e emite a linha do ℟ direto, sem passar pelo `find`.
- `"E a bênção de Deus todo-poderoso, Pai e Filho e Espírito Santo, desça sobre
  vós e permaneça para sempre."` — essa sim é uma fórmula final, e caberia num
  seletor com `position: 'end'`.

Ou seja, das duas entradas só uma faz sentido como opção de seletor, e a outra
já é automática. Vale decidir se o seletor entra com uma opção só, se vira um
checkbox ("incluir a fórmula final da bênção"), ou se fica de fora.

## Depois

- **Documentação**: os links do sumário em `docs/README.md` ainda não funcionam
  (falta "Informações gerais", "Guia básico" e "Guia avançado").
- **Exportação**: hoje só há impressão (via diálogo do navegador) e cópia do
  GABC. Exportar SVG/PNG/PDF direto já existiu como botão na 3.x, mas comentado.
- **Tamanho do pacote**: o bundle passa de 3,5 MB (966 kB comprimido), quase
  todo `@testneumz/nabc-lib`. Vale um `import()` dinâmico do renderizador.
