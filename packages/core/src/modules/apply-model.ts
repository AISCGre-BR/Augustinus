import { syllable, tonic } from "separador-silabas";
import { replaceFromEnd } from "../utils/text-utils.js";
import { psalmLogic } from "./psalm-logic.js";

export function applyModel(lyrics: string, gabcModel: string, psalm: boolean, doElision?: boolean, curlyDiphthongs?: boolean): string {
    lyrics = lyrics.normalize("NFC");
    const vowels = "aeiouáéíóúâêîôûãõàèìòùäëïöü";
    const diphthongRegex = new RegExp(`([${vowels}])([${vowels}])`, "gi");
    const unstressedMonosyllables: string[] = ["a", "e", "o", "as", "os", "um", "uns", "de", "do", "da", "dos", "das", "em", "no", "na", "nos", "nas", "que", "me", "te", "se", "lhe", "lhes", "com", "por", "sem", "seu", "seus", "meu", "meus", "teu", "teus", "eu", "tu", "mas", "ou", "sou", "foi", "ao", "aos", "pois", "diz"];
    const specialTaggedParts: string[] = [];
    const specialPlaceholder = "||SPECIALTAGGEDPART||";

    // Extract tags that should not be syllable separated or musicised: <v>, <sp>, <alt>
    let deTaggedLyrics = lyrics.replace(/(<(sp|v|alt)\b[^>]*>[\s\S]*?<\/\2>)/gi, (match) => {
        specialTaggedParts.push(match);
        return specialPlaceholder;
    });

    const taggedParts: string[] = [];
    const placeholder = "||TAGGEDPART||";

    deTaggedLyrics = deTaggedLyrics.replace(/(<[^>]+>)/g, (match) => {
        taggedParts.push(match);
        return placeholder;
    });

    let wordsWithNotePlaceholders: string[] = deTaggedLyrics.split(/\s+/).filter(w => w).map(word => {
        const processToken = (token: string) => {
            if (token === placeholder) {
                return taggedParts.shift() || "";
            }
            if (token === specialPlaceholder) {
                return specialTaggedParts.shift() || "";
            }
            if (!/[a-zA-Z\u00C0-\u00FF]/i.test(token)) {
                return token;
            }
            const syllableArray = syllable(token).split(/(?<=@)/);
            const tonicIndex = syllableArray.length - tonic(syllableArray);
            const result = syllableArray.map((s, i) => {
                const isUnstressed = unstressedMonosyllables.includes(s);
                let processedSyllable = (i === tonicIndex && !isUnstressed) ? "#" + s : s;
                if (curlyDiphthongs) {
                    processedSyllable = processedSyllable.replace(diphthongRegex, "{$1$2}");
                }
                return processedSyllable;
            }).join("") + "@";
            return result;
        }

        if (word.includes(placeholder) || word.includes(specialPlaceholder)) {
            return word.split(/(\|\|TAGGEDPART\|\||\|\|SPECIALTAGGEDPART\|\|)/).filter(t => t).map(processToken).join("");
        }
        return processToken(word);
    });

    let gabcOutput: string = "";
    let modelSegments: string[] = gabcModel.split(/(\([a-n]r [a-n]r [a-n]r\))/gm);
    const validModelSegments: string[] = modelSegments.filter(segment => segment && segment.trim() !== '');
    const prefixNotesRaw: string = (validModelSegments[0] || "").trim();
    const prefixNotesArray: string[] = prefixNotesRaw.split(" ");
    const extractedTripletRootNote: string = "(" + (validModelSegments[1] || "").trim().charAt(1) + ")";
    const suffixString: string = (validModelSegments[2] || "").trim();
    let isDynamic: boolean = false;
    if (suffixString.includes("r1") || psalm) {
        isDynamic = true
    }
    const wordCount: number = wordsWithNotePlaceholders.length;

    let lastWordForTonic = "";
    for (let i = wordCount - 1; i >= 0; i--) {
        const currentWord = wordsWithNotePlaceholders[i] || "";
        if (currentWord.includes('@')) {
            lastWordForTonic = currentWord;
            break;
        }
    }

    let notes: string[] = suffixString.split(" ") || [];

    gabcOutput += wordsWithNotePlaceholders.join(" ");
    let gabcOutputArray: string[] = gabcOutput.split(/(?<=@)/);

    // ELISIONS
    if (!doElision) {
        for (let i = 0; i < gabcOutputArray.length; i++) {
            const currentSyllable = gabcOutputArray[i] || "";
            const nextSyllable = gabcOutputArray[i + 1] || "";

            if (currentSyllable.includes('_')) {
                gabcOutputArray[i] = currentSyllable.replace(/[@_]/g, "") + "~" + nextSyllable;
                gabcOutputArray.splice(i + 1, 1);
                i--;
            }
        }
    }
    
    if (doElision) {
        for (let i = 0; i < gabcOutputArray.length; i++) {
            const currentSyllable = gabcOutputArray[i] || "";
            const nextSyllable = gabcOutputArray[i + 1] || "";

            const isSyllableElidable = /^(?!\s*#).*?[aeio]_?@?$/i.test(currentSyllable);
            const isNextSyllableElidable = /^\s+(#?[aeiou])/i.test(nextSyllable);

            if (isSyllableElidable && isNextSyllableElidable) {
                gabcOutputArray[i] = currentSyllable.replace(/[@_]/g, "") + "~" + nextSyllable;
                gabcOutputArray.splice(i + 1, 1);
                i--;
            }

        }
    }

    gabcOutputArray = gabcOutputArray.map((syllable) => 
        syllable.replaceAll(/([aeiou](?:\s*~\s*#?\s*[aeiou])+)(?!_)/gi, (match) => {
            return `{${match.replace(/\s+/g, "")}}`;
        }
    ));
    gabcOutput = gabcOutputArray.join("");

    if (isDynamic && lastWordForTonic) {
        if (psalm) {
            let pause: string = notes.pop() || "";
            let firstAccentIndex = notes.findIndex(note => note.includes("r1"));
            let secondAccentIndex = notes.findIndex((note, i) => i > firstAccentIndex + 1 && note.includes("r1"));
            let preNotesIndex = (firstAccentIndex - 1) >= 0 ? (firstAccentIndex - 1) : false;

            let firstAccentNotes = secondAccentIndex === -1 ? notes.slice(firstAccentIndex) : notes.slice(firstAccentIndex, secondAccentIndex);
            let secondAccentNotes = secondAccentIndex === -1 ? [] : notes.slice(secondAccentIndex);
            let preNotes = preNotesIndex !== false ? notes.slice(0, preNotesIndex + 1) : false;

            if (secondAccentIndex !== -1) {
                psalmLogic(gabcOutputArray, secondAccentNotes);
                const firstAccentGabcIndex = gabcOutputArray.findIndex(syllable => syllable.includes("("));

                const firstAccentGabc = gabcOutputArray.slice(firstAccentGabcIndex);
                const secondAccentGabc = gabcOutputArray.slice(0, firstAccentGabcIndex);

                psalmLogic(secondAccentGabc, firstAccentNotes);

                gabcOutputArray = secondAccentGabc.concat(firstAccentGabc);
            }
            else {
                psalmLogic(gabcOutputArray, firstAccentNotes);
            }
            if (preNotes) {
                for (let i = preNotes.length - 1, j = gabcOutputArray.length - 1; i >= 0 && j >= 0; j--) {
                    if (!gabcOutputArray[j].includes("(")) {
                        gabcOutputArray[j] = gabcOutputArray[j].replace("@", preNotes[i]);
                        i--;
                    }
                }
            }
            gabcOutputArray = gabcOutputArray.map(syllable => syllable.replace(/#|(?<=\()'/g, ""));
            gabcOutputArray.push(" " + pause);
            gabcOutput = gabcOutputArray.join("");
        }
        gabcOutput = gabcOutput.replaceAll("#", "");

        const cleanWord = lastWordForTonic.replace(/<[^>]+>/g, "");
        const tonicNumber: number = tonic(cleanWord.split("@"));
        let offset: number = 0;
        for (let i = 0; i < notes.length; i++) {
            if (notes[i]?.match("r1")) {
                break;
            }
            offset++;
        }
        for (let i = 0; i < notes.length; i++) {
            notes[i] = notes[i]?.replace("r1", "").replace("r", "") || "";
        }

        if (!psalm) {
            switch (tonicNumber) {
                case 1:
                    const joinedNote: string = ((notes[0 + offset] || "").slice(0, -1) + (notes[2 + offset] || "").substring(1)).replaceAll(/([a-m])\1/g, "$1");
                    gabcOutput = replaceFromEnd(gabcOutput, "@", joinedNote, 1);
                    break;
                case 2:
                    gabcOutput = replaceFromEnd(gabcOutput, "@", notes[2 + offset] || "", 1);
                    gabcOutput = replaceFromEnd(gabcOutput, "@", notes[0 + offset] || "", 1);
                    break;
                default:
                    gabcOutput = replaceFromEnd(gabcOutput, "@", notes[2 + offset] || "", 1);
                    gabcOutput = replaceFromEnd(gabcOutput, "@", notes[1 + offset] || "", 1);
                    gabcOutput = replaceFromEnd(gabcOutput, "@", notes[0 + offset] || "", 1);
                    break;
            }

            for (let i = offset - 1; i >= 0; i--) {
                gabcOutput = replaceFromEnd(gabcOutput, "@", notes[i] || "", 1);
            }
            for (let i = offset + 3; i < notes.length; i++) {
                gabcOutput += " " + notes[i];
            }
        }

    }
    else {
        for (let i = notes.length - 2; i >= 0; i--) {
            gabcOutput = replaceFromEnd(gabcOutput, "@", notes[i] || "", 1);
        }
        gabcOutput += " " + notes[notes.length - 1];
    }

    for (let i = 0; i < prefixNotesArray.length; i++) {
        gabcOutput = gabcOutput.replace('@', prefixNotesArray[i]!);
    }

    gabcOutput = gabcOutput.replaceAll("@", extractedTripletRootNote);
    gabcOutput = gabcOutput.replaceAll("#", "");
    return gabcOutput;
}
