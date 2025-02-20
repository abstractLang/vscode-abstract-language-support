const vscode = require('vscode');
const { TokenProvider, legend } = require('./tokensProvider');
const { FoldingProvider } = require("./foldingProvider");
const { DecorationManager } = require("./decorationsProvider");

function activate(context) {
    const selector = { language: 'abstract', scheme: 'file' };

    const tokenProvider = new TokenProvider();
    const foldingProvider = new FoldingProvider();
    const decorationManager = new DecorationManager();

    const updateDecorations = () => {
        var editor = vscode.window.activeTextEditor;

        decorationManager.updateDecorations(editor);
    };

    context.subscriptions.push(
        vscode.languages.registerDocumentSemanticTokensProvider(selector, tokenProvider, legend));

    context.subscriptions.push(
        vscode.languages.registerFoldingRangeProvider(selector, foldingProvider));
    
    context.subscriptions.push(vscode.window.onDidChangeTextEditorVisibleRanges(updateDecorations));
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(updateDecorations));
}

function deactivate() {
}

module.exports = { activate, deactivate };
