import { Model, Parameters, getDefaultParameters } from "./types/index.js";
import { preprocessInput, handleCustomModel } from "./core/parameters.js";
import { applyModel } from "./modules/apply-model.js";
import defaultModels from '../assets/models.json' with { type: 'json' };

function expandMacrosEarly(text: string): string {
    // ponytail: wrap in sp tags; process NOME separately to avoid period separator issue
    return text.replace(/<v>([\s\S]*?)<\/v>/g, (match, content) => {
        let expanded = content
            .replace(/\\redv/g, '<sp>REDV</sp>')
            .replace(/\\ramem/g, 'Amém.')
            .replace(/\\redcross/g, '<sp>REDCROSS</sp>')
            .replace(/\\rubric\{([^}]*)\}/g, '<sp>RUBRIC{$1}</sp>')
            .replace(/\\nome/g, '<sp>NOMEX</sp>');
        return expanded;
    });
}

function convertMacroMarkers(text: string): string {
    return text
        .replace(/<sp>REDV<\/sp>/g, '<c><sp>V\/<\/sp>.<\/c>')
        .replace(/<sp>RAMEM<\/sp>/g, '<c><sp>R\/<\/sp>.<\/c> A(g)mém.(gh) (::Z)')
        .replace(/<sp>REDCROSS<\/sp>/g, '<c>+<\/c>')
        .replace(/<sp>RUBRIC\{([^}]*)\}<\/sp>/g, '<alt>$1<\/alt>');
}

export default function generateGabc(input: string, modelObject: Model, partialParameters: Partial<Parameters> = {}): string {
    const parametersObject = { ...getDefaultParameters(), ...partialParameters };
    let model = handleCustomModel(modelObject, parametersObject);
    let psalm = model.type === "salmo" ? true : false;

    input = expandMacrosEarly(input);
    input = preprocessInput(input, parametersObject);

    // Track NOMEX positions and their preceding notes before extraction
    const nomeNoteMap: Map<string, string> = new Map();
    let nomeIndex = 0;
    input = input.replace(/<sp>NOMEX<\/sp>/g, (match, offset) => {
        const before = input.substring(0, offset);
        const lastNoteMatch = before.match(/\(([a-n])/);
        const note = lastNoteMatch ? lastNoteMatch[1] : 'h';
        const marker = `<sp>NOMEX${nomeIndex}</sp>`;
        nomeNoteMap.set(marker, note);
        nomeIndex++;
        return marker;
    });

    const specialTags: string[] = [];
    input = input.replaceAll(/(<(sp|v|alt)\b[^>]*>[\s\S]*?<\/\2>)/gi, (match) => {
        specialTags.push(match);
        return `__SPECIAL_TAG_PLACEHOLDER_${specialTags.length - 1}__`;
    });

    // Use an internal delimiter to mark chunk boundaries. This decouples the
    // user-facing separator string (e.g. "**") from the chunk-splitting logic,
    // so a separator that shares characters with a pattern symbol (e.g. "*")
    // does not collide during splitting.
    const DELIM = "\u0000";
    input = input.replaceAll(parametersObject.separator, DELIM);

    for (let i = 0; i < model.patterns.length; i++) {
        const symbol: string = model.patterns[i].symbol;
        input = input.replaceAll(symbol, symbol + DELIM);
    }

    if (model.type === "prefacio" && model.tom === "solene") {
        input = input.replaceAll("Por isso,", "Por isso," + DELIM);
    }
    if (model.type === "bencao") {
        input = input.replaceAll("Amém.", "Amém." + DELIM);
    }

    const chunks: string[] = input.split(DELIM).map(s => s.trim()).filter(chunk => {
        if (!chunk || chunk === parametersObject.separator) return false;
        const lastChar = chunk.slice(-1);
        const pattern = model.patterns.find(p => p.symbol === lastChar);
        if (pattern) return true;
        return /\p{L}|\p{N}/u.test(chunk);
    });

    let gabcLines: string[] = [];

    for (let chunk of chunks) {
        chunk = chunk.replace(/__SPECIAL_TAG_PLACEHOLDER_(\d+)__/g, (match, indexStr) => {
            const idx = parseInt(indexStr, 10);
            let tag = specialTags[idx] || "";
            // Convert macro markers - wrap in <sp> tags to protect from note insertion
            if (tag.includes('REDV')) tag = '<sp><c><sp>V\/<\/sp>.<\/c><\/sp>';
            else if (tag.includes('REDCROSS')) tag = '<sp><c>+<\/c><\/sp>';
            else if (tag.match(/<sp>RUBRIC\{([^}]*)\}<\/sp>/)) tag = tag.replace(/<sp>RUBRIC\{([^}]*)\}<\/sp>/g, '<sp><alt>$1<\/alt><\/sp>');
            else if (tag.includes('NOMEX')) {
                for (const [marker, note] of nomeNoteMap.entries()) {
                    if (tag === marker) {
                        tag = `<sp><c>N.<\/c>(${note}r${note}r${note}r)<\/sp>`;
                        break;
                    }
                }
            }
            return tag;
        });

        if (model.type === "prefacio" && model.tom === "solene" && chunk == "Por isso,") {
            gabcLines.push("Por(f) is(ef)so,(f) (,) ");
            continue
        }
        if (model.type === "bencao" && model.tom === "solene" && chunk == "Amém.") {
            gabcLines.push("<c><sp>R/</sp>.</c> A(g)mém.(gh) (::Z)");
            continue
        }
        if (model.type === "bencao" && model.tom === "simples" && chunk == "Amém.") {
            gabcLines.push("<c><sp>R/</sp>.</c> A(h)mém.(h) (::Z)");
            continue
        }
        let findIndex = model.find.indexOf(chunk + parametersObject.separator)
        if (findIndex !== -1) {
            const replacement = model.replace[findIndex];
            if (replacement !== undefined) {
                gabcLines.push(replacement);
            } else {
                gabcLines.push(applyModel(chunk, model.default, psalm, parametersObject.doElision, parametersObject.curlyDiphthongs, parametersObject.autoStack));
            }
            continue;
        }

        const lastChar = chunk.slice(-1);
        const pattern = model.patterns.find(p => p.symbol === lastChar);
        if (pattern) {
            const text = model.type === 'leitura' ? chunk.trim() : chunk.slice(0, -1).trim();
            if (text) {
                gabcLines.push(applyModel(text, pattern.gabc, psalm, parametersObject.doElision, parametersObject.curlyDiphthongs, parametersObject.autoStack))
            }
        } else {
            const trimmedChunk = chunk.trim();
            const needsSeparator = parametersObject.removeSeparator === false && !/[.,;:!?]/.test(trimmedChunk.slice(-1));
            gabcLines.push(applyModel(trimmedChunk + (needsSeparator ? parametersObject.separator : ''), model.default, psalm, parametersObject.doElision, parametersObject.curlyDiphthongs, parametersObject.autoStack));
        }
    }

    if (psalm) {
        const intonnationNotes = model.optionalStart.trim().split(" ").filter(n => n);
        let versicles = [];
        let hemistich = [];
        let stanzaIndex = 1;
        let versicleIndex = 1;
        for (const chunk of gabcLines) {
            hemistich.push(chunk);
            if (chunk.endsWith("(::)")) {
                versicles.push(hemistich);
                hemistich = [];
            }
        }
        if (parametersObject.separateStanzas && parametersObject.repeatIntonation) {
            for (const versicle of versicles) {
                if (versicleIndex % 2 !== 0) {
                    let count = 0;
                    versicle[0] = versicle[0].replace(/\([a-zA-Z]\)/g, match => count < 2 ? intonnationNotes[count++] : match);
                    if (versicleIndex > 1) versicle[0] = "<c>" + stanzaIndex + ".</c> " + versicle[0];
                    versicleIndex++;
                    stanzaIndex++;
                } else {
                    versicle[versicle.length - 1] += " (Z)"
                    versicleIndex++;
                }
            }
        } else {
            if (parametersObject.repeatIntonation) {
                for (const versicle of versicles) {
                    let count = 0;
                    versicle[0] = versicle[0].replace(/\([a-zA-Z]\)/g, match => count < 2 ? intonnationNotes[count++] : match);
                }
            } else {
                let count = 0;
                if (versicles.length > 0) {
                    versicles[0][0] = versicles[0][0].replace(/\([a-zA-Z]\)/g, match => count < 2 ? intonnationNotes[count++] : match);
                }
            }
            if (parametersObject.separateStanzas) {
                for (const versicle of versicles) {
                    if (versicleIndex % 2 !== 0) {
                        if (versicleIndex > 1) versicle[0] = "<c>" + stanzaIndex + ".</c> " + versicle[0];
                        versicleIndex++;
                        stanzaIndex++;
                    } else {
                        versicle[versicle.length - 1] += " (Z)";
                        versicleIndex++;
                    }
                }
            }
        }
        gabcLines = versicles.flat();
    }

    let resultGabc = "";
    if (parametersObject.addOptionalStart && !psalm) {
        resultGabc = [model.optionalStart, ...gabcLines].join("\n");
    } else {
        if (gabcLines.length > 0) {
            gabcLines[0] = model.start + gabcLines[0];
        }
        resultGabc = gabcLines.join("\n");
    }

    if (parametersObject.addOptionalEnd && !psalm && model.optionalEnd) {
        resultGabc += "\n" + model.optionalEnd;
    }

    if (!resultGabc.endsWith("(::)") && !resultGabc.endsWith("(::Z)")) {
        resultGabc += "(::)";
    }
    resultGabc = resultGabc.replaceAll("(:)(::)", "(::)");
    resultGabc = resultGabc.replaceAll("(:) (::)", " (::)");
    resultGabc = resultGabc.replaceAll(/'(\([^)]+\))?/gm, "(,)");
    if (parametersObject.header) {
        resultGabc = parametersObject.header + "\n%%\n" + resultGabc;
    }
    // Quilismatic scandicus: ornament the tonic syllable of the final
    // acclamation verb with a quilismatic scandicus (f–g[quilisma]–h, GABC
    // "fgwh"), replacing its single reciting note (g). Covers the common
    // cadence formulas: "cantando ..." (tonic "tan") and "cantamos ..."
    // (tonic "ta"), regardless of what follows ("a uma só voz", "sem cessar",
    // "em alegre celebração a uma só voz", etc.). Scoped with `[^\n]*\(::\)$`
    // to the closing cadence line, so the same words appearing in the preface
    // body (which end in "(:)") are never touched.
    if (parametersObject.quelisma) {
        resultGabc = resultGabc.replace(/(can\(g\)tan)\(g\)(do\([^)]*\)[^\n]*\(::\))\s*$/, "$1(fgwh)$2");
        resultGabc = resultGabc.replace(/(can\(g\)ta)\(g\)(mos\([^)]*\)[^\n]*\(::\))\s*$/, "$1(fgwh)$2");
    }

    if (parametersObject.includeBarredVParenthesis === false) {
        resultGabc = resultGabc.replaceAll("</sp>.</c>()", "</sp>.</c>");
        resultGabc = resultGabc.replaceAll("</sp>.()", "</sp>.");
        resultGabc = resultGabc.replaceAll("</sp>()", "</sp>");
    }

    // Strip outer <sp> protection tags added for macros
    resultGabc = resultGabc.replace(/<sp>(<c>[\s\S]*?<\/c>[\s\S]*?(?:(?=<\/sp>)|(?=\s*$)))<\/sp>/g, '$1');
    resultGabc = resultGabc.replace(/<sp>(<alt>.*?<\/alt>)<\/sp>/g, '$1');

    return resultGabc;
}

export function reverseGabc(gabc: string, model?: Model, options?: {separator?: string}): string {
    const lines = gabc.split("\n");
    const result: string[] = [];

    // Extract pattern ending codes: the last (...) in each pattern's gabc
    const patternEndings = new Map<string, string>();
    if (model && model.patterns) {
        for (const pattern of model.patterns) {
            const match = pattern.gabc.match(/\([^)]*\)(?=\s*$)/);
            if (match) {
                patternEndings.set(match[0], pattern.symbol);
            }
        }
    }

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        const isFinalMarkedLine = line.includes("(::)");

        // Extract content from LaTeX stacktext commands
        line = line.replaceAll(/\\stacktext(\{[^}]*\})+/g, (match) => {
            const contents = match.match(/\{([^}]*)\}/g) || [];
            return contents.map(b => b.slice(1, -1)).filter(s => s).join("/");
        });

        // Try to match and identify which pattern was used by its ending
        let patternSymbol = "";
        if (patternEndings.size > 0) {
            for (const [ending, symbol] of patternEndings) {
                if (line.endsWith(ending)) {
                    patternSymbol = symbol;
                    break;
                }
            }
        }

        // Remove GABC notation in parentheses
        line = line.replaceAll(/\([^)]*\)/g, "");

        // Remove HTML/XML tags but preserve tag content
        line = line.replaceAll(/<[^>]*>/g, "");

        // Clean up spaces first
        line = line.replaceAll(/\s+/g, " ").trim();

        // Remove verse markers (V/, R/, etc.) at start
        line = line.replace(/^(V|R|Alt)\/\.\s*/, "");

        // Remove trailing separator only if it was auto-added (original text didn't end with punctuation)
        // Only for final lines with no pattern symbol, and NOT for ** separator (used in prefacio/bencao solene)
        if (!patternSymbol && isFinalMarkedLine && options?.separator && options.separator !== '**' && line.endsWith(options.separator)) {
            const withoutSep = line.slice(0, -options.separator.length);
            // Only remove if there's no punctuation before the separator
            if (!withoutSep.match(/[.,;:!?]$/)) {
                line = withoutSep.trim();
            }
        }

        if (line) {
            result.push(line + patternSymbol);
        }
    }

    return result.join("").replaceAll(/\s+/g, " ").trim();
}

export { defaultModels };
export * from "./types/index.js";
