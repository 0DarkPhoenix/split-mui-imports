const vscode = require("vscode");

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    const config = vscode.workspace.getConfiguration("splitMUIImports");
    const runOnSave = config.get("runOnSave", true);

    let disposable = vscode.commands.registerCommand(
        "extension.splitMUIImports",
        async function () {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                const document = editor.document;
                const fileExtension = document.fileName.split(".").pop();
                const validExtensions = ["js", "ts", "jsx", "tsx"];

                if (!validExtensions.includes(fileExtension)) {
                    return;
                }

                const text = document.getText();
                const lines = text.split("\n");

                const newLines = [];
                let modified = false;
                let nonImportCount = 0;
                const maxNonImportLines = 20;

                // Process each line to split grouped MUI imports
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();

                    if (line.startsWith("import")) {
                        nonImportCount = 0; // Reset the counter if an import line is found

                        if (
                            line.includes("{") &&
                            line.includes("}") &&
                            line.includes("@mui/")
                        ) {
                            const importParts = line.split("from");
                            const modulesPart = importParts[0]
                                .replace("import", "")
                                .replace("{", "")
                                .replace("}", "")
                                .trim();
                            const importPath = importParts[1]
                                .trim()
                                .replace(/['";]/g, "");

                            const modules = modulesPart
                                .split(",")
                                .map((module) => module.trim());

                            modules.forEach((module) => {
                                newLines.push(
                                    `import ${module} from '${importPath}/${module}';`
                                );
                            });

                            modified = true;
                        } else {
                            newLines.push(line);
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
                }
            }
        }
    );

    context.subscriptions.push(disposable);

    if (runOnSave) {
        vscode.workspace.onWillSaveTextDocument((event) => {
            const document = event.document;
            const fileExtension = document.fileName.split(".").pop();
            const validExtensions = ["js", "ts", "jsx", "tsx"];

            if (!validExtensions.includes(fileExtension)) {
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
