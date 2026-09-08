# Informações principais

Referência rápida do projeto.

## Onde as coisas estão

| O quê | Onde |
|---|---|
| Motor de geração de GABC | `packages/core/src/augustinus.ts` |
| Definição dos parâmetros | `packages/core/src/types/index.ts` (`parameterDefinitions`) |
| Modelos musicais (52) | `packages/core/assets/models.json` |
| Lógica de salmodia | `packages/core/src/modules/psalm-logic.ts` |
| Mapeamento letra → notas | `packages/core/src/modules/apply-model.ts` |
| Páginas da interface | `packages/frontend/src/chant-pages.ts` |
| Tema | `packages/frontend/src/style.css` |
| Memória (localStorage) | `packages/frontend/src/store.ts` |
| Renderização e impressão | `packages/frontend/src/render.ts` |
| Macros LaTeX | `packages/latex/augustinus/augustinus.sty` |

## Comandos

```bash
bun install                 # dependências (raiz do monorepo)
bun run start:frontend      # interface web em localhost:5173
bun run start:cli -- -t "texto" -m "Oração tom solene"
bun run test                # testes unitários (48)
bun run test:visual         # PDFs de comparação (precisa de lualatex + gregorio)
```

Build da interface: `cd packages/frontend && bun run build`.

## Rotas da interface

| Rota | Página |
|---|---|
| `#/` | seleção de tipo de canto |
| `#/oracoes` | orações presidenciais (3 tons) |
| `#/prefacios` | prefácios (2 tons) |
| `#/bencaos` | bênçãos (2 tons) |
| `#/salmo` | salmodia (39 tons) |
| `#/leituras` | Primeira Leitura e Evangelho |
| `#/fieis` | oração dos fiéis |
| `#/personalizado` | corda de récita e padrão próprio |

## Paleta

```
--bg          #2F2A20   fundo
--panel       #4A443A   painéis, cartões, cabeçalho
--panel-line  #6a6152   divisórias discretas
--accent      #9B5B4D   terracota (botões, bordas, foco)
--paper       #F5F0E1   pergaminho (texto sobre escuro, fundo dos campos)
--ink         #2F2A20   tinta (texto dentro dos campos)
--muted       #cbc3b0   texto secundário
```

Campos de texto são claros: pergaminho com tinta escura.

## Notas de manutenção

- Para adicionar um parâmetro: defina em `parameterDefinitions`, implemente no
  módulo do core, e — se ele só valer para alguns modelos — registre a regra em
  `optionApplies` (`chant-pages.ts`) e coloque a chave nos `optionKeys` da
  página onde deve aparecer em destaque. Sem isso, ele cai em Opções avançadas.
- Para adicionar um tipo de canto: acrescente uma entrada em `chantPages`. A
  página principal e a rota saem sozinhas.
- Mudar o formato do estado guardado exige subir a chave `augustinus:v1` em
  `store.ts`.
- O deploy é no GitHub Pages (`.github/workflows/gh-pages.yml`), domínio em
  `packages/frontend/CNAME`: augustinus.liturgiacantada.com.br.
