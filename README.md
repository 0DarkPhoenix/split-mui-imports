# Split MUI Imports

## Overview

The "Split MUI Imports" extension for Visual Studio Code helps you automatically split grouped Material-UI (MUI) imports into individual import statements. This improves the performance of your code by ensuring each MUI component isn't importing unnecessary files.

## Features

-   **Import Splitting**: Splits grouped MUI imports into individual import statements.
-   **Run on Save**: Run the import splitting automatically whenever you save a file.
-   **Supports Multiple File Types**: Works with JavaScript, TypeScript, JSX, and TSX files.

## Usage

### Manual Command

1. Open the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on Mac).
2. Run the command `Split MUI Imports: split MUI imports`.
3. The extension will process the current file and split any grouped MUI imports.

### Run on Save

By default, the extension will automatically split MUI imports whenever you save a file. You can configure this behavior in the settings.

## Extension Settings

This extension contributes the following settings:

-   `splitMuiImports.runOnSave`: Enable/disable automatic import splitting on file save (Default: `true`).
-   `splitMuiImports.showInformationMessages`: Enable/disable information messages (Default: `false`).

## Known Issues

-   The extension stops searching for import statements after encountering 20 consecutive non-import lines. Ensure your import statements are near the top of your files for best results.

## Allowed MUI Import Paths for splitting
- "@mui/icons-material"
- "@mui/material"
- "@mui/lab"