# Augustinus LaTeX Package

This package provides macros for rendering musical notation and stacked text for Gregorian chant, specifically designed for use with Augustinus.

## Features

- `\stacktext`: A command that stacks multiple lines of text, used for complex liturgical annotations. It collects all subsequent braced arguments and stacks them.

## Installation

Run the provided installation script:

```bash
chmod +x install.sh
./install.sh
```

This will install the package to your local TeX tree (usually `~/texmf`).

## Dependencies

- `stackengine`
- `expl3` (part of modern LaTeX kernel)
- `xparse` (part of modern LaTeX kernel)

## Usage

In your LaTeX document:

```latex
\usepackage{augustinus}
```

Then you can use:

```latex
\stacktext{line1}{line2}{line3}
```

This will stack the three lines vertically, centered.
