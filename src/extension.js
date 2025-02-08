const vscode = require('vscode');
const { TokenProvider, legend } = require('./tokensProvider');
const { FoldingProvider } = require("./foldingProvider");
const { DecorationManager } = require("./decorationsProvider");

function activate(context) {
    const selector = { language: 'abstract', scheme: 'file' };

    const tokenProvider = new TokenProvider();
    const foldingProvider = new FoldingProvider();
    const decorationManager = new DecorationManager();

    context.subscriptions.push(
        vscode.languages.registerDocumentSemanticTokensProvider(selector, tokenProvider, legend));

    context.subscriptions.push(
        vscode.languages.registerFoldingRangeProvider(selector, foldingProvider));
    
    context.subscriptions.push(
        vscode.window.onDidChangeTextEditorVisibleRanges(() => {
            decorationManager.applyDecorations();
        })
    );
}

function deactivate() {
}

module.exports = { activate, deactivate };
