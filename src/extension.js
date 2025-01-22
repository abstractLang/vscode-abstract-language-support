const vscode = require('vscode');
const { AbstractTokenProvider, legend } = require('./tokensProvider');

function activate(context) {
    const selector = { language: 'abstract', scheme: 'file' };
    const provider = new AbstractTokenProvider();

    context.subscriptions.push(
        vscode.languages.registerDocumentSemanticTokensProvider(selector, provider, legend));
}

function deactivate() {
}

module.exports = { activate, deactivate };
