const vscode = require("vscode");

function activate(context) {
	const config = vscode.workspace.getConfiguration("splitMuiImports");
	let runOnSave = config.get("runOnSave", true);
	const showInfoMessages = config.get("showInfoMessages", true);

	const allowedImports = new Set(["@mui/icons-material", "@mui/material", "@mui/lab"]);

	function showInfoMessage(message) {
		if (showInfoMessages) {
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
			if (!allowedImports.has(importPath)) {
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
			const newImports = modulesString
				.split(",")
				.map((moduleRaw) => {
					const module = moduleRaw.trim();
					if (!module) return null;

					let newModule = module;
					if (importPath === "@mui/icons-material") {
						newModule = `${module}Icon`;
						// Replace module usage in JSX, but not in comments
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
		if (
			event.document.languageId === "javascript" ||
			event.document.languageId === "typescript" ||
			event.document.languageId === "javascriptreact" ||
			event.document.languageId === "typescriptreact"
		) {
			event.waitUntil(splitMuiImports(true));
		}
	}

	function updateRunOnSave() {
		for (const sub of context.subscriptions) {
			sub.dispose();
		}
		if (runOnSave) {
			context.subscriptions.push(vscode.workspace.onWillSaveTextDocument(handleWillSave));
		}
	}

	vscode.workspace.onDidChangeConfiguration((event) => {
		if (event.affectsConfiguration("splitMuiImports.runOnSave")) {
			runOnSave = vscode.workspace.getConfiguration("splitMuiImports").get("runOnSave", true);
			updateRunOnSave();
		}
	});

	updateRunOnSave();

	const disposable = vscode.commands.registerCommand("splitMuiImports.split", splitMuiImports);
	context.subscriptions.push(disposable);
}

module.exports = {
	activate,
};
