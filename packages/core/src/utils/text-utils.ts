import { syllable, tonic } from "separador-silabas";

export function replaceFromEnd(input: string, find: string, replaceWith: string, limit?: number): string {
    let result: string = input;
    let replacementsMade: number = 0;
    if (find.length === 0) {
        return input;
    }
    let currentSearchIndex: number = result.length;
    let lastFoundIndex: number = result.lastIndexOf(find, currentSearchIndex - 1);

    while (lastFoundIndex !== -1 && (limit === undefined || replacementsMade < limit)) {
        result = result.substring(0, lastFoundIndex) + replaceWith + result.substring(lastFoundIndex + find.length);
        replacementsMade++;
        currentSearchIndex = lastFoundIndex;
        lastFoundIndex = result.lastIndexOf(find, currentSearchIndex - 1);
    }

    return result;
}

export function getTonicIndex(token: string): number {
    const syllableArray = syllable(token).split(/(?<=@)/);
    return syllableArray.length - tonic(syllableArray);
}

export function getSyllables(token: string): string[] {
    return syllable(token).split(/(?<=@)/);
}
