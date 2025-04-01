const vscode = require('vscode');

class DecorationManager {
    constructor() {
        this.decorationType = vscode.window.createTextEditorDecorationType({
            after: {
                contentText: '...}',
                color: '#888',
                margin: '0 10px 0 0'
            },
            textDecoration: 'none; display none;'
        });
    }

    updateDecorations(editor) {
        if (editor.document.languageId === 'abstract')
            this.applyDecorations(editor);
        else
            this.clearDecorations(editor);
    }

    applyDecorations(editor) {
        const decorations = [];
        const visibleRanges = editor.visibleRanges;

        for (let i = 0; i < editor.document.lineCount; i++) {
            const lineText = editor.document.lineAt(i).text.trimEnd();

            if (lineText.endsWith('{') && this.isLineCollapsed(i, visibleRanges)) {
                const range = new vscode.Range(i, lineText.length, i, lineText.length + 4);
                decorations.push(range);
            }
        }

        editor.setDecorations(this.decorationType, decorations);
    }
    clearDecorations(editor) {
        editor.setDecorations(this.decorationType, []);
    }

    isLineCollapsed(lineNumber, visibleRanges) {
        return !visibleRanges.some(range =>
            lineNumber+1 >= range.start.line && lineNumber+1 <= range.end.line);
    }
}

module.exports = { DecorationManager };
