// Lógica de posicionamento das notas nas sílabas de um salmo
export function psalmLogic(input: string[], notes: string[]) { //Função que aplica a lógica no array de sílabas com as tônicas marcadas com #
    const i = input.length;
    let tonicNote = notes.filter(note => note.includes("r1")).reverse().map(note => note.replace("r1", "")); // Procura pela nota da tônica melódica
    const replaceAt = (index: number, value: string) => { input[index] = input[index].replace("@", value) }; // Função menor, parecida com a replaceFromEnd, mas para array
    // const isTonic = (index: number): boolean => input[index]?.includes("#") ?? false; // Função que será usada mais tarde
    const tonicIndex = i - input.findLastIndex(syllable => syllable.includes("#")); // Procura pelo índice da primeira sílaba tônica de trás pra frente
    notes = notes.map(notes => notes.replace("r1", "").replace("r", "") || ""); // Limpa as marcações de acento das notas
    if (tonicNote.length > 0) {
        switch (tonicIndex) {
            case 1:
                replaceAt(i - 1, tonicNote[0].replace(")", ""));
                input[i - 1] += notes[notes.length - 1].replace("(", "");
                break;

            case 2:
                replaceAt(i - 2, tonicNote[0]);
                replaceAt(i - 1, notes[notes.length - 1]);
                break;

            case 3:
                replaceAt(i - 3, tonicNote[1] ? tonicNote[1] : tonicNote[0]);
                replaceAt(i - 2, notes[notes.length - 2]);
                replaceAt(i - 1, notes[notes.length - 1]);
                break;

            default:
                // Repetir a nota do meio (penúltima nota do sufixo) caso a tônica esteja além de 3
                replaceAt(i - tonicIndex, tonicNote[0]);
                replaceAt(i - 1, notes[notes.length - 1]);
                for (let j = 2; j < tonicIndex; j++) {
                    replaceAt(i - j, notes[notes.length - 2]);
                }
                break;
        }
    } else { // Para o caso de não ter tônica melódica (tom Cc)
        replaceAt(i - 1, notes[notes.length - 1]);
    }
};
