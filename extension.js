const vscode = require("vscode");

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    const config = vscode.workspace.getConfiguration("splitMUIImports");
    const runOnSave = config.get("runOnSave", true);
    const showInfoMessages = config.get("showInfoMessages", false);

    // Helper function to show information messages if enabled
    function showInfoMessage(message) {
        if (showInfoMessages) {
            vscode.window.showInformationMessage(message);
        }
    }

    // Register the command for splitting MUI imports
    let disposable = vscode.commands.registerCommand(
        "extension.splitMUIImports",
        async function () {
            console.time("splitMUIImports"); // Start timing

            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                showInfoMessage(
                    "No active editor found. Please open a file first."
                );
                return;
            }

            const document = editor.document;
            const fileExtension = document.fileName.split(".").pop();
            const validExtensions = new Set(["js", "ts", "jsx", "tsx"]);

            if (!validExtensions.has(fileExtension)) {
                console.timeEnd("splitMUIImports"); // End timing
                return;
            }

            const text = document.getText();
            const lines = text.split("\n");

            const newLines = [];
            let modified = false;
            let nonImportCount = 0;
            const maxNonImportLines = 20;

            // Function to process and split MUI imports
            const processImportLine = (line) => {
                if (
                    line.includes("{") &&
                    line.includes("}") &&
                    line.includes("@mui/")
                ) {
                    let [modulesPart, importPath] = line.split("from");
                    modulesPart = modulesPart
                        .replace("import", "")
                        .replace("{", "")
                        .replace("}", "")
                        .trim();
                    importPath = importPath.trim().replace(/['";]/g, "");

                    const modules = modulesPart
                        .split(",")
                        .map((module) => module.trim())
                        .filter(Boolean);

                    modules.forEach((module) => {
                        newLines.push(
                            `import ${module} from '${importPath}/${module}';`
                        );
                    });

                    modified = true;
                } else {
                    newLines.push(line);
                }
            };

            // Process each line to split grouped MUI imports
            for (let i = 0; i < lines.length; i++) {
                let line = lines[i].trim();

                if (line.startsWith("import")) {
                    nonImportCount = 0; // Reset the counter if an import line is found

                    if (line.includes("{")) {
                        // Handle multi-line imports
                        const importLines = [line];
                        while (!line.includes("}") && !line.includes("from")) {
                            i++;
                            line = lines[i].trim();
                            importLines.push(line);
                        }

                        const fullImport = importLines.join(" ");
                        processImportLine(fullImport);
                    } else {
                        processImportLine(line);
                    }
                } else {
                    nonImportCount++;
                    newLines.push(line);
                }

                // Stop searching for import statements after encountering 20 consecutive non-import lines
                if (nonImportCount >= maxNonImportLines) {
                    newLines.push(...lines.slice(i + 1));
                    break;
                }
            }

            if (modified) {
                const newText = newLines.join("\n");

                // Replace the entire document with the new text
                const fullRange = new vscode.Range(
                    document.positionAt(0),
                    document.positionAt(text.length)
                );

                editor.edit((editBuilder) => {
                    editBuilder.replace(fullRange, newText);
                });
            } else {
                showInfoMessage("No MUI imports found to split.");
            }

            console.timeEnd("splitMUIImports"); // End timing
        }
    );

    context.subscriptions.push(disposable);

    // Automatically split MUI imports on file save if enabled in settings
    if (runOnSave) {
        vscode.workspace.onWillSaveTextDocument((event) => {
            const document = event.document;
            const fileExtension = document.fileName.split(".").pop();
            const validExtensions = new Set(["js", "ts", "jsx", "tsx"]);

            if (!validExtensions.has(fileExtension)) {
                return;
            }

            event.waitUntil(
                vscode.commands.executeCommand("extension.splitMUIImports")
            );
        });
    }
}

module.exports = {
    activate,
};
