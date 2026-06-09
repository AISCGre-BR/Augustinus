# Funcionalidades do Augustinus

O Augustinus é um motor de notação musical gregoriana que automatiza a criação de partituras em GABC a partir de texto simples. Abaixo estão listadas as principais funcionalidades disponíveis.

## 1. Modelos Musicais Suportados

O motor possui modelos pré-configurados para os principais tons litúrgicos:

- **Orações (Coletas):** Tom Solene e Tons Simples (A e B).
- **Orações dos Fiéis:** Modelo para ritos de leitura.
- **Prefácios:** Tom Solene (com suporte experimental a quelismas) e Tom Simples.
- **Bênçãos:** Tom Solene.
- **Leituras:** Modelos para Primeira Leitura e Evangelho.
- **Salmos:** Suporte a uma vasta gama de tons salmódicos (1, 2, 3, 4, 5, 6, 7, 8 e tons especiais como o Peregrinus e Paschalis).
- **Modelos Customizados:** Permite definir cordas de récita e padrões melódicos personalizados.

## 2. Opções Gerais de Processamento

- **Separadores Customizados:** Escolha o caractere que divide as frases (padrão é o ponto `.`).
- **Fórmulas Opcionais:**
    - Adição automática de introduções (ex: "Oremos", "O Senhor esteja convosco").
    - Adição automática de conclusões (ex: "Amém").
- **Limpeza de Texto:**
    - Remoção automática de números (útil para limpar referências bíblicas).
    - Remoção ou tratamento especial de parênteses.
    - Opção para remover o caractere separador do resultado final.

## 3. Formatação Avançada e Empilhamento

- **Empilhamento de Texto (`stacktext`):** Suporte a textos alternativos ou multi-linha usando a sintaxe `[texto1/texto2]`. 
  > **Nota:** O empilhamento pode não ser renderizado corretamente na pré-visualização do navegador (frontend), mas funciona perfeitamente ao compilar em LaTeX utilizando o pacote `augustinus`.
- **Auto-separação de Sílabas em Empilhamento:** Opção para separar automaticamente as sílabas dentro de colchetes, garantindo o alinhamento musical correto de cada sílaba.
- **Tratamento de Ditongos:** Inclusão automática de chaves `{}` em ditongos para melhor renderização no Gregorio.
- **Versículos e Alternativas:** Suporte a tags especiais como `<sp>V/</sp>`, `<sp>R/</sp>` e `<alt>...</alt>`.

## 4. Lógica de Salmos

- **Repetição de Entonação:** Opção para repetir a fórmula de entonação em todas as estrofes ou apenas na primeira.
- **Separação de Estrofes:** Organiza o salmo em estrofes numeradas automaticamente.
- **Elisão Vocálica:** Suporte experimental a elisão de vogais (ex: "minha alma" vira "minh'alma" musicalmente).

## 5. Metadados e Customização Técnica

- **Cabeçalhos GABC:** Permite a inclusão de metadados (título, autor, fonte) diretamente no arquivo gerado.
-   **Claves e Notas:** Customização de claves (C1-C4, F3-F4) e notas de récita para modelos simplificados.

## 6. Integração com LaTeX

Para usuários que desejam compilar documentos usando os resultados do Augustinus, o projeto fornece um pacote LaTeX dedicado:

- **Pacote `augustinus`**: Define macros como `\stacktext` para garantir que o empilhamento de texto seja renderizado corretamente no PDF final.
- **Dependências**: Utiliza internamente o pacote `stackengine` para o posicionamento vertical dos textos.
- **Localização**: Os arquivos estão disponíveis em `packages/latex/augustinus/`.
