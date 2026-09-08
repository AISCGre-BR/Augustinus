import { GregorianChantSVGRenderer, GregorioScore, ChantContext } from '@testneumz/nabc-lib';

/**
 * Famílias que o medidor de glifos da lib usa. Elas são declaradas em
 * `style.css`, mas nenhum elemento da página escreve com elas — então o
 * navegador não tem motivo para ativá-las por conta própria, mesmo com o
 * `<link rel="preload">` do `index.html`, que só aquece o cache de rede.
 * `document.fonts.load()` força a ativação.
 */
const NEUME_FONTS = ['greciliae', 'greextra', 'gregall', 'grelaon'];

/** Não deixa a partitura em branco caso o carregamento das fontes trave. */
const FONT_TIMEOUT_MS = 3000;

let fontsPromise: Promise<void> | null = null;

/**
 * Espera as fontes antes de qualquer medição.
 *
 * O `GlyphMeasurer` da lib desenha cada glifo num `<canvas>` e varre os pixels
 * para achar altura e profundidade (`firstTop`/`firstBottom`), guardando o
 * resultado num cache que só morre junto com a página. As notas, por outro lado,
 * saem das fontes embutidas em base64 dentro do próprio SVG. Se a medição rodar
 * antes de a fonte do app chegar, ela mede o glifo de recuo: as pautas saem
 * deslocadas das notas — e ficam assim pelo resto da sessão, porque o cache já
 * está envenenado e a classe não é exportada para ser limpa de fora.
 */
export function whenFontsReady(): Promise<void> {
    if (fontsPromise) return fontsPromise;

    const fonts = document.fonts;
    if (!fonts) {
        fontsPromise = Promise.resolve();
        return fontsPromise;
    }

    const loaded = Promise.all(NEUME_FONTS.map((family) => fonts.load(`16px "${family}"`)))
        .then(() => fonts.ready)
        .then(() => undefined);

    const timeout = new Promise<void>((resolve) => setTimeout(resolve, FONT_TIMEOUT_MS));

    fontsPromise = Promise.race([loaded, timeout]).catch(() => undefined);
    return fontsPromise;
}

let baselineChecked = false;

/**
 * Contorna a divergência de `dominant-baseline` entre navegadores.
 *
 * A lib posiciona os glifos com `dominant-baseline="text-top"`. O Chromium
 * ignora esse valor e cai em `alphabetic`; o Firefox o honra, tratando-o como
 * `text-before-edge`. Como a lib foi calibrada pelo comportamento do Chromium,
 * no Firefox a notação inteira desce cerca de uma linha em relação à pauta —
 * que é desenhada em `<line>`, em coordenadas absolutas, e portanto não se move.
 *
 * Em vez de farejar o navegador, medimos o comportamento: desenhamos o mesmo
 * texto com `text-top` e com `alphabetic` e comparamos onde cada um foi pintado.
 * Só se diferirem é que forçamos `alphabetic` — onde já era esse o caso, a
 * regra não muda nada.
 */
function applyBaselineWorkaround(): void {
    if (baselineChecked) return;
    baselineChecked = true;

    const probe = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    probe.setAttribute('style', 'position:absolute;left:-9999px;top:0;width:200px;height:200px');
    document.body.appendChild(probe);

    const paintedTop = (baseline: string): number => {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', '0');
        text.setAttribute('y', '100');
        text.setAttribute('font-size', '100px');
        text.setAttribute('dominant-baseline', baseline);
        text.textContent = 'H';
        probe.appendChild(text);
        const top = text.getBoundingClientRect().top;
        text.remove();
        return top;
    };

    let honoursTextTop = false;
    try {
        honoursTextTop = Math.abs(paintedTop('text-top') - paintedTop('alphabetic')) > 1;
    } catch {
        honoursTextTop = false;
    }
    probe.remove();

    if (!honoursTextTop) return;

    const style = document.createElement('style');
    style.dataset.augustinus = 'baseline-workaround';
    style.textContent =
        '.chant-container svg text[dominant-baseline="text-top"]{dominant-baseline:alphabetic;}';
    document.head.appendChild(style);
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Fatia a partitura em um `<svg>` por linha de canto.
 *
 * A lib devolve a partitura inteira num único `<svg>`. Não existe quebra de
 * página dentro de um SVG: ao imprimir, o navegador corta onde a página acabar,
 * partindo pauta, neumas e letra no meio. Separando cada `g.ChantLine` (com o
 * `g.chantLineInteractive` correspondente) num SVG próprio, cada bloco vira um
 * elemento que o `break-inside: avoid` consegue manter inteiro.
 *
 * A tinta de uma linha invade cerca de 9 px a faixa da seguinte (descidas de
 * "g", "j", "p"). Por isso cada fatia tem a altura da própria tinta — para que
 * nada seja cortado — e uma margem inferior negativa do tamanho da sobreposição,
 * o que reproduz na tela exatamente o espaçamento original.
 */
function splitIntoLines(container: HTMLElement): void {
    const svg = container.querySelector('svg');
    if (!svg) return;

    const root = svg.querySelector('g.root-group');
    const lines = Array.from(svg.querySelectorAll('g.ChantLine'));
    const overlays = Array.from(svg.querySelectorAll('g.chantLineInteractive'));
    if (!root || lines.length < 2) return;

    const svgTop = svg.getBoundingClientRect().top;
    const width = svg.getBoundingClientRect().width;
    if (!width) return;

    // Extensão vertical de cada linha, em coordenadas do SVG (1 unidade = 1 px,
    // porque a lib emite o SVG sem viewBox).
    const spans = lines.map((line, index) => {
        const rects = [line, overlays[index]]
            .filter(Boolean)
            .map((el) => (el as SVGGraphicsElement).getBoundingClientRect());
        return {
            top: Math.min(...rects.map((r) => r.top)) - svgTop,
            bottom: Math.max(...rects.map((r) => r.bottom)) - svgTop,
        };
    });
    if (spans.some((s) => !isFinite(s.top) || !isFinite(s.bottom))) return;

    const defs = svg.querySelector('defs');
    const fragment = document.createDocumentFragment();

    lines.forEach((line, index) => {
        const { top, bottom } = spans[index];
        const height = bottom - top;
        if (height <= 0) return;

        const slice = document.createElementNS(SVG_NS, 'svg');
        slice.setAttribute('width', '100%');
        slice.setAttribute('height', String(height));
        slice.setAttribute('viewBox', `0 ${top} ${width} ${height}`);
        slice.setAttribute('preserveAspectRatio', 'xMinYMin meet');

        // As @font-face que a lib embute em base64 valem para o documento todo,
        // então basta uma cópia — replicá-las multiplicaria megabytes por linha.
        if (defs && index === 0) slice.appendChild(defs);

        const group = document.createElementNS(SVG_NS, 'g');
        const rootTransform = root.getAttribute('transform');
        if (rootTransform) group.setAttribute('transform', rootTransform);
        group.appendChild(line);
        if (overlays[index]) group.appendChild(overlays[index]);
        slice.appendChild(group);

        const wrapper = document.createElement('div');
        wrapper.className = 'chant-line';
        // Sobreposição com a linha seguinte, devolvida como margem negativa.
        const next = spans[index + 1];
        if (next) {
            const overlap = bottom - next.top;
            if (overlap > 0) wrapper.style.marginBottom = `${-overlap}px`;
        }
        wrapper.appendChild(slice);
        fragment.appendChild(wrapper);
    });

    container.innerHTML = '';
    container.appendChild(fragment);
}

let renderToken = 0;

/** Desenha o GABC dentro do contêiner, criando o renderizador na primeira vez. */
export async function renderGabc(container: HTMLElement, gabc: string): Promise<void> {
    const token = ++renderToken;

    if (!gabc) {
        container.innerHTML = '';
        return;
    }

    await whenFontsReady();
    // Uma chamada mais nova assumiu enquanto esperávamos.
    if (token !== renderToken) return;

    applyBaselineWorkaround();

    const processedGabc = gabc.replaceAll(/\{([aeiou])~([aeiou]\})/gi, '{$1_$2}');

    try {
        const context = new ChantContext();

        // A lib quebra as linhas em context.lineWidthPx (padrão 800px), mas o SVG é
        // renderizado com width:100% e sem viewBox — então qualquer conteúdo além da
        // largura do contêiner é cortado. Casamos a largura de quebra com a largura
        // real do papel para a partitura caber e não ser cortada à direita.
        const containerWidth = container.clientWidth;
        if (containerWidth > 0) {
            context.lineWidthPx = containerWidth;
        }

        // Um renderizador novo a cada chamada: `splitIntoLines` desmonta o SVG
        // que ele produziu, então reaproveitar a instância não é seguro.
        container.innerHTML = '';
        const renderer = new GregorianChantSVGRenderer(container);
        const score = new GregorioScore(context);
        score.interprete(processedGabc);
        renderer.renderSvg(score);
        splitIntoLines(container);
    } catch (e) {
        console.error('Erro ao renderizar a partitura:', e);
    }
}
