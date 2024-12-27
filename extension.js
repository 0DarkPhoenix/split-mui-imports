const vscode = require("vscode");

function activate(context) {
	let configState = {
		runOnSave: true,
		showInfoMessages: false,
		allowedImports: new Set(),
		excludedModules: new Set(),
	};

	function initializeConfig() {
		const config = vscode.workspace.getConfiguration("splitMuiImports");

		configState = {
			runOnSave: config.get("runOnSave", true),
			showInfoMessages: config.get("showInfoMessages", false),
			allowedImports: new Set(
				config.get("allowedImports", ["@mui/icons-material", "@mui/material", "@mui/lab"]),
			),
			excludedModules: new Set(
				config.get("excludedModules", [
					"adaptV4Theme",
					"createColorScheme",
					"createStyles",
					"createTheme",
					"Experimental_CssVarsProvider",
					"experimental_sx",
					"experimentalStyled",
					"getOverlayAlpha",
					"makeStyles",
					"responsiveFontSizes",
					"shouldSkipGeneratingVar",
					"styled",
					"THEME_ID",
					"Theme",
					"ThemeProvider",
					"unstable_createMuiStrictModeTheme",
					"useTheme",
					"useThemeProps",
					"withStyles",
					"withTheme",
				]),
			),
		};

		return configState;
	}

	// Initialize the settings for this extension as a config
	initializeConfig();

	// Update config when any of the settings for this extension is changed
	vscode.workspace.onDidChangeConfiguration((event) => {
		if (event.affectsConfiguration("splitMuiImports")) {
			initializeConfig();
			updateRunOnSave();
		}
	});

	function showInfoMessage(message) {
		if (configState.showInfoMessages) {
			vscode.window.showInformationMessage(message);
		}
	}

	const importRegex = /import\s+{([^}]+)}\s+from\s+['"](@mui\/[^'"]+)['"];?\s*/g;

	async function splitMuiImports(saveDocument = false) {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			showInfoMessage("No active editor found. Please open a file first.");
			return;
		}

		const document = editor.document;
		const fileExtension = document.fileName.split(".").pop();
		if (!["js", "ts", "jsx", "tsx"].includes(fileExtension)) {
			showInfoMessage("This file type is not supported for MUI import splitting.");
			return;
		}

		let text = document.getText();
		const edit = new vscode.WorkspaceEdit();
		let modified = false;

		// Helper function to check if a line is commented out
		const isCommentedOut = (line) => {
			return /^\s*\/\//.test(line) || /^\s*\/\*/.test(line) || /^\s*\*/.test(line);
		};

		let match;
		let lastIndex = 0;
		let newText = "";

		while (true) {
			match = importRegex.exec(text);
			if (match === null) break;
			const [fullImport, modulesString, importPath] = match;
			if (!configState.allowedImports.has(importPath)) {
				newText += text.slice(lastIndex, match.index + fullImport.length);
				lastIndex = match.index + fullImport.length;
				continue;
			}

			// Check if the import line is commented out
			const importLine = text.slice(
				text.lastIndexOf("\n", match.index) + 1,
				text.indexOf("\n", match.index),
			);
			if (isCommentedOut(importLine)) {
				newText += text.slice(lastIndex, match.index + fullImport.length);
				lastIndex = match.index + fullImport.length;
				continue;
			}

			newText += text.slice(lastIndex, match.index);

			// Split modules and filter out excluded ones
			const modules = modulesString
				.split(",")
				.map((m) => m.trim())
				.filter(Boolean);
			const excludedImports = modules.filter((m) => configState.excludedModules.has(m));
			const includedImports = modules.filter((m) => !configState.excludedModules.has(m));

			// Handle excluded imports
			if (excludedImports.length > 0) {
				newText += `import { ${excludedImports.join(", ")} } from '${importPath}';\n`;
			}

			// Process remaining imports as before
			const newImports = includedImports
				.map((module) => {
					if (!module) return null;

					let newModule = module;
					if (importPath === "@mui/icons-material") {
						newModule = `${module}Icon`;
						const jsxRegex = new RegExp(`<(${module})(\\s|\\/|>)`, "g");
						text = text
							.split("\n")
							.map((line) => {
								if (!isCommentedOut(line)) {
									return line.replace(jsxRegex, `<${newModule}$2`);
								}
								return line;
							})
							.join("\n");
					}
					return `import ${newModule} from '${importPath}/${module}';`;
				})
				.filter(Boolean)
				.join("\n");

			if (newImports) {
				newText += `${newImports}\n`;
				modified = true;
			}
			lastIndex = match.index + fullImport.length;
		}
		newText += text.slice(lastIndex);

		if (modified) {
			const fullRange = new vscode.Range(
				document.positionAt(0),
				document.positionAt(text.length),
			);
			edit.replace(document.uri, fullRange, newText);
			await vscode.workspace.applyEdit(edit);
			if (saveDocument) {
				await document.save();
			}
			showInfoMessage("MUI imports have been split and icon usages updated successfully.");
		}
	}

	function handleWillSave(event) {
		const allowedLanguages = ["javascript", "typescript", "javascriptreact", "typescriptreact"];
		if (allowedLanguages.includes(event.document.languageId)) {
			event.waitUntil(splitMuiImports(true));
		}
	}

	function updateRunOnSave() {
		for (const sub of context.subscriptions) {
			sub.dispose();
		}
		if (configState.runOnSave) {
			context.subscriptions.push(vscode.workspace.onWillSaveTextDocument(handleWillSave));
		}
	}
	// Initialize the listener for runOnSave
	updateRunOnSave();

	const disposable = vscode.commands.registerCommand("splitMuiImports.split", splitMuiImports);
	context.subscriptions.push(disposable);
}

module.exports = {
	activate,
};
