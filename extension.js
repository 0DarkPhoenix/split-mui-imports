const vscode = require("vscode");

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log(
        'Congratulations, your extension "split-mui-imports" is now active!'
    );
    let config = vscode.workspace.getConfiguration("splitMUIImports");
    let runOnSave = config.get("runOnSave", true);
    let showInfoMessages = config.get("showInfoMessages", false);

    // Helper function to show information messages if enabled
    function showInfoMessage(message) {
        if (showInfoMessages) {
            vscode.window.showInformationMessage(message);
        }
    }

    // Function to split MUI imports
    async function splitMUIImports() {
        const timerLabel = "splitMUIImports";
        if (console._times && console._times[timerLabel]) {
            console.timeEnd(timerLabel); // End any existing timer with the same label
        }
        console.time(timerLabel); // Start timing

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
            console.timeEnd(timerLabel); // End timing
            return;
        }

        const text = document.getText();
        const lines = text.split("\n");

        const edit = new vscode.WorkspaceEdit();
        let modified = false;
        let nonImportCount = 0;
        const maxNonImportLines = 20;

        // Function to process and split MUI imports
        const processImportLine = (
            importLines,
            startLineIndex,
            endLineIndex
        ) => {
            const fullImport = importLines.join(" ");
            if (
                fullImport.includes("{") &&
                fullImport.includes("}") &&
                fullImport.includes("@mui/")
            ) {
                let [modulesPart, importPath] = fullImport.split("from");
                modulesPart = modulesPart
                    .replace("import", "")
                    .replace("{", "")
                    .replace("}", "")
                    .trim();
                importPath = importPath.trim().replace(/['";]/g, "");

                // Skip imports from @mui/material/styles
                skipImports = [
                    "@mui/material/styles",
                    "@mui/material/colors",
                    "@mui/x-date-pickers",
                ];
                for (const skipImport of skipImports) {
                    if (importPath === skipImport) {
                        return;
                    }
                }

                const modules = modulesPart
                    .split(",")
                    .map((module) => module.trim())
                    .filter(Boolean);

                const newImportLines = modules.map((module) => {
                    module_import = module;
                    if (importPath === "@mui/icons-material") {
                        module = `${module}Icon`;
                    }
                    return `import ${module} from '${importPath}/${module_import}';`;
                });

                // Replace the original lines with the new import lines
                const range = new vscode.Range(
                    new vscode.Position(startLineIndex, 0),
                    new vscode.Position(
                        endLineIndex,
                        lines[endLineIndex].length
                    )
                );
                edit.replace(document.uri, range, newImportLines.join("\n"));

                modified = true;
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
                    const startLineIndex = i;
                    while (!line.includes("}") || !line.includes("from")) {
                        i++;
                        line = lines[i].trim();
                        importLines.push(line);
                    }
                    const endLineIndex = i;
                    processImportLine(
                        importLines,
                        startLineIndex,
                        endLineIndex
                    );
                } else {
                    processImportLine([line], i, i);
                }
            } else {
                nonImportCount++;
            }

            // Stop searching for import statements after encountering 20 consecutive non-import lines
            if (nonImportCount >= maxNonImportLines) {
                break;
            }
        }

        if (modified) {
            await vscode.workspace.applyEdit(edit);
            await document.save();
        }

        console.timeEnd(timerLabel); // End timing
    }

    // Function to handle the will save event
    async function handleWillSave(event) {
        await splitMUIImports();
    }

    // Function to update the runOnSave setting
    function updateRunOnSave() {
        if (runOnSave) {
            context.subscriptions.push(
                vscode.workspace.onWillSaveTextDocument(handleWillSave)
            );
        } else {
            // Dispose of the existing listener if runOnSave is disabled
            context.subscriptions.forEach((subscription) => {
                if (subscription.dispose) {
                    subscription.dispose();
                }
            });
        }
    }

    // Initial call to updateRunOnSave
    updateRunOnSave();

    // Watch for changes to the configuration
    vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration("splitMUIImports.runOnSave")) {
            runOnSave = vscode.workspace
                .getConfiguration("splitMUIImports")
                .get("runOnSave", true);
            updateRunOnSave();
        }
    });

    // Register the command
    let disposable = vscode.commands.registerCommand(
        "splitMUIImports.split",
        splitMUIImports
    );

    context.subscriptions.push(disposable);
}

module.exports = {
    activate,
};
