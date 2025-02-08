const vscode = require('vscode');

class FoldingProvider {

    provideFoldingRanges(document, context, token) {

        let ranges = [];
        let openingBrackets = [];

        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i).text.trim();

            if (line.endsWith('{')) {
                if (line.trim() != '{') openingBrackets.push(i);
                else openingBrackets.push(i-1);
            
            } else if (line === '}') {
                if (openingBrackets.length > 0) {
                    const startLine = openingBrackets.pop();
                    ranges.push(new vscode.FoldingRange(
                        startLine, i, vscode.FoldingRangeKind.Region));
                }
            }
        }

        return ranges;
    }

}

module.exports = { FoldingProvider };
