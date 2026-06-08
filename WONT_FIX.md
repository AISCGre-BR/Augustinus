# Won't Fix List

This file tracks limitations, design constraints, and bug reports that are classified as "Won't Fix" because they are deeply rooted in the architecture of Augustinus or represent intentional trade-offs.

## 1. The use of `@` and `#` characters in the text treatment
- **Description**: The core lyric-to-music processing engine uses `@` as a syllable boundary/GABC note placeholder and `#` as a marker for tonic (stressed) syllables.
- **Consequence**: If the input lyrics contain literal `@` or `#` characters, they will be treated as control characters. They will be stripped or replaced, potentially breaking the musical mapping logic.
- **Workaround**: Avoid using literal `@` or `#` characters in the source text, or pre-process them/escape them before submitting to Augustinus.
- **Reason**: The app expects liturgical text as input, which shouldn't have these characters anyways.

## 2. Debounced Auto-Generation of GABC (Live Updates)
- **Description**: Automatically generating the score in real-time as the user types.
- **Reason for Won't Fix**: Keeping score generation manual (requiring a click on the "Gerar" button) is preferred to avoid constant recalculations/rendering lag while typing large chants, ensuring a more stable user editing experience.

