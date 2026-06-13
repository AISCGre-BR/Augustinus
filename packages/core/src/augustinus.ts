import { Model, Parameters, getDefaultParameters } from "./types/index.js";
import { preprocessInput, handleCustomModel } from "./core/parameters.js";
import { applyModel } from "./modules/apply-model.js";
import defaultModels from '../assets/models.json' with { type: 'json' };

export default function generateGabc(input: string, modelObject: Model, partialParameters: Partial<Parameters> = {}): string {
    const parametersObject = { ...getDefaultParameters(), ...partialParameters };
    let model = handleCustomModel(modelObject, parametersObject);
    let psalm = model.type === "salmo" ? true : false;

    input = preprocessInput(input, parametersObject);

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
            return specialTags[idx] || "";
        });

        if (model.type === "prefacio" && model.tom === "solene" && chunk == "Por isso,") {
            gabcLines.push("Por(f) is(ef)so,(f) (,) ");
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
            gabcLines.push(applyModel(text, pattern.gabc, psalm, parametersObject.doElision, parametersObject.curlyDiphthongs, parametersObject.autoStack))
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
    // TODO: Evaluate if this experimental feature should be kept or refactored into a more robust system
    if (parametersObject.quelisma) {
        resultGabc = resultGabc.replaceAll(/can\(g\)tan\(g\)do\(g\) a\(g\) u\(fe\)ma\(ef\) só\(g\) voz:?\.?\(fgf\)\s*\(::\)/g, "can(g)tan(fgwh)do(g) a(g) u(fe)ma(ef) só(g) voz:(fgf) (::)")
    }

    if (parametersObject.includeBarredVParenthesis === false) {
        resultGabc = resultGabc.replaceAll("</sp>.</c>()", "</sp>.</c>");
        resultGabc = resultGabc.replaceAll("</sp>.()", "</sp>.");
        resultGabc = resultGabc.replaceAll("</sp>()", "</sp>");
    }
    
    return resultGabc;
}

export { defaultModels };
export * from "./types/index.js";
