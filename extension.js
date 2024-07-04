const vscode = require("vscode");

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	console.log(
		'Congratulations, your extension "split-mui-imports" is now active!',
	);
	const config = vscode.workspace.getConfiguration("splitMUIImports");
	let runOnSave = config.get("runOnSave", true);
	const showInfoMessages = config.get("showInfoMessages", false);

	// Helper function to show information messages if enabled
	const showInfoMessage = (message) => {
		if (showInfoMessages) {
			vscode.window.showInformationMessage(message);
		}
	};

	// Function to split MUI imports
	const splitMUIImports = async () => {
		const startTime = performance.now();

		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			showInfoMessage("No active editor found. Please open a file first.");
			return;
		}

		const document = editor.document;
		const fileExtension = document.fileName.split(".").pop();
		if (!["js", "ts", "jsx", "tsx"].includes(fileExtension)) {
			return;
		}

		const text = document.getText();
		const lines = text.split("\n");

		const edit = new vscode.WorkspaceEdit();
		let modified = false;
		const skipImports = new Set([
			"@mui/material/Button",
			"@mui/material/Card",
			"@mui/material/colors",
			"@mui/material/Dialog",
			"@mui/material/Grid",
			"@mui/material/Input",
			"@mui/material/List",
			"@mui/material/Menu",
			"@mui/material/styles",
			"@mui/material/Table",
			"@mui/material/Tooltip",
			"@mui/x-date-pickers",
		]);

		// Function to replace module instances in the document
		const replaceModuleInstances = (edit, document, oldModule, newModule) => {
			const regex = new RegExp(`\\b${oldModule}\\b`, "g");
			const newText = text.replace(regex, newModule);

			const fullRange = new vscode.Range(
				new vscode.Position(0, 0),
				new vscode.Position(document.lineCount, 0),
			);
			edit.replace(document.uri, fullRange, newText);
		};

		// Function to process and split MUI imports
		const processImportLine = (importLines, startLineIndex, endLineIndex) => {
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

				// Skip imports if importPath contains any part of the strings in skipImports
				if (skipImports.has(importPath)) {
					return;
				}

				const modules = modulesPart
					.split(",")
					.map((module) => module.trim())
					.filter(Boolean);

				const newImportLines = modules.map((mod) => {
					const moduleImport = mod;
					let modifiedMod = null;
					if (importPath === "@mui/icons-material") {
						modifiedMod = `${mod}Icon`;
						replaceModuleInstances(edit, document, moduleImport, modifiedMod);
					}
					return `import ${modifiedMod == null ? mod : modifiedMod} from '${importPath}/${moduleImport}';`;
				});

				// Replace the original lines with the new import lines
				const range = new vscode.Range(
					new vscode.Position(startLineIndex, 0),
					new vscode.Position(endLineIndex, lines[endLineIndex].length),
				);
				edit.replace(document.uri, range, newImportLines.join("\n"));

				modified = true;
			}
		};

		const MAX_CONSECUTIVE_NON_IMPORT_LINES = 20;
		const MAX_NON_IMPORT_LINES = 100;

		let linesWithoutImport = 0;
		let consecutiveLinesWithoutImport = 0;
		let encounteredImport = false;

		// Process each line to split grouped MUI imports
		for (let i = 0; i < lines.length; i++) {
			let line = lines[i].trim();

			if (!line.startsWith("import")) {
				linesWithoutImport++;
				if (encounteredImport) {
					consecutiveLinesWithoutImport++;
					if (
						consecutiveLinesWithoutImport >= MAX_CONSECUTIVE_NON_IMPORT_LINES
					) {
						break;
					}
				} else if (linesWithoutImport >= MAX_NON_IMPORT_LINES) {
					break;
				}
				continue;
			}

			encounteredImport = true;
			consecutiveLinesWithoutImport = 0;

			if (!line.includes("{")) {
				processImportLine([line], i, i);
				continue;
			}

			// Handle multi-line imports
			const importLines = [line];
			const startLineIndex = i;
			while (!line.includes("}") || !line.includes("from")) {
				i++;
				line = lines[i].trim();
				importLines.push(line);
			}
			const endLineIndex = i;
			processImportLine(importLines, startLineIndex, endLineIndex);
		}

		if (modified) {
			await vscode.workspace.applyEdit(edit);
			await document.save();
		}

		const endTime = performance.now();
		console.log(`Execution time: ${endTime - startTime} ms`);
	};

	// Function to handle the will save event
	const handleWillSave = async (event) => {
		await splitMUIImports();
	};

	// Function to update the runOnSave setting
	const updateRunOnSave = () => {
		if (runOnSave) {
			context.subscriptions.push(
				vscode.workspace.onWillSaveTextDocument(handleWillSave),
			);
		} else {
			// Dispose of the existing listener if runOnSave is disabled
			for (const subscription of context.subscriptions) {
				if (subscription.dispose) {
					subscription.dispose();
				}
			}
		}
	};

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
	const disposable = vscode.commands.registerCommand(
		"splitMUIImports.split",
		splitMUIImports,
	);

	context.subscriptions.push(disposable);
}

module.exports = {
	activate,
};
