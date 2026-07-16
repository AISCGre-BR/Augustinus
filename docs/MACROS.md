# Custom Macros

Augustinus supports custom macros within `<v>` tags to insert liturgical elements and special notations.

## Macro Syntax

All macros must be wrapped in `<v>` tags:

```
<v>\macroname</v>
<v>\macroname{parameter}</v>
```

## Available Macros

### `\redv` - Red Versicle

Inserts a versicle marker (V/) in red.

**Output:** `<sp>V/</sp>` (wrapped in `<c><sp>` tags for protection)

**Usage:**
```
<v>\redv</v> Dominus
```

---

### `\redcross` - Red Cross

Inserts a cross symbol (+) in red, typically used between elements (e.g., between "Pai e Filho").

**Output:** `<c>+</c>`

**Usage:**
```
Pai e Filho <v>\redcross</v> e Espírito Santo
```

---

### `\rubric{text}` - Rubric

Inserts rubric text (alternative instructions) within angle brackets.

**Output:** `<alt>text</alt>`

**Usage:**
```
<v>\rubric{Alt.}</v> O Senhor
<v>\rubric{Versículo do Senhor}</v>
```

---

### `\ramem` - Response: Amém

Inserts a formal response line with musical notation.

**Behavior:**
- **In Bênção (Blessing) model with solemn tone:** Expands to the full response with R/ marker and specific musical notes
  - Output: `<c><sp>R/</sp>.</c> A(g)mém.(gh) (::Z)`
  
- **In other models (Oração, Prefácio):** Expands to plain text `Amém.` which is processed according to that model's rules
  - Output: `A(g)mém.` (with notes appropriate to the model)

**Usage:**
```
<v>\ramem</v>
```

---

### `\nome` - Name/Invocation

Inserts a name or invocation marker with musical notation based on the preceding note.

**Output:** `<c>N.</c>(${note}r${note}r${note}r)` 

The macro automatically detects the note letter of the preceding syllable (a-n) and uses it to construct the musical sequence. If no valid note is found, it defaults to `h`.

**Examples:**
- After `Do(g)minus`: inserts `(gr)(gr)(gr)` 
- After `Se(h)nhor`: inserts `(hr)(hr)(hr)`
- No preceding note: inserts `(hr)(hr)(hr)` (default)

**Usage:**
```
Dominus <v>\nome</v> meus
```

---

## Implementation Details

- All macros are processed during the early expansion phase (`expandMacrosEarly`)
- Macros are wrapped in placeholder tags during processing to prevent note insertion within macro content
- Special handling ensures macros respect model-specific rules (e.g., `\ramem` behavior differs by model)
- Empty chunks resulting from macro processing are filtered out to prevent orphan markers

## Model-Specific Behavior

Some macros behave differently depending on the liturgical model:

| Macro | Model | Behavior |
|-------|-------|----------|
| `\ramem` | Bênção tom solene | Full R/ response with `(::Z)` closing |
| `\ramem` | Oração, Prefácio | Plain text `Amém.` |
| `\redv` | All models | Standard V/ marker |
| `\redcross` | All models | Cross symbol |
| `\rubric` | All models | Rubric text in angle brackets |
| `\nome` | All models | Note-dependent musical sequence |
