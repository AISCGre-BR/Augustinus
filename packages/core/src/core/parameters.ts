import { Model, Parameters } from "../types/index.js";

export function preprocessInput(input: string, parameters: Parameters): string {
    let processedInput = input;
    if (parameters.removeNumbers) {
        processedInput = processedInput.replace(/[0-9]/g, "");
    }
    if (parameters.removeParenthesis) {
        processedInput = processedInput.replace(/\([\s\S]*?\)\s*,?\s*/g, "");
    } else {
        processedInput = processedInput.replaceAll("(", "<v>(</v>");
        processedInput = processedInput.replaceAll(")", "<v>)</v>");
    }
    return processedInput;
}

export function handleCustomModel(model: Model, parameters: Parameters): Model {
    const updatedModel = { ...model };
    if (updatedModel.type === 'custom') {
        if (updatedModel.tom === 'simples') {
            const note = parameters.customNote || 'h';
            const clef = parameters.customClef || 'c4';
            updatedModel.start = "(" + clef + ") ";
            updatedModel.optionalStart = "(" + clef + ") ";
            updatedModel.default = "(" + note + ") (" + note + "r " + note + "r " + note + "r" + ")";
        } else if (updatedModel.tom === 'solene') {
            updatedModel.default = parameters.customPattern || '';
            updatedModel.start = parameters.customStart || '';
            updatedModel.optionalStart = parameters.customStart || '';
        }
    }
    return updatedModel;
}
