const vscode = require('vscode');
const SemanticTokensBuilder = vscode.SemanticTokensBuilder;
const Range = vscode.Range;
const Position = vscode.Position;

const legend = new vscode.SemanticTokensLegend(
    ['keyword', 'variable', 'function', 'comment-line', 'comment-block'],
    ['declaration', 'readonly']
);

class AbstractTokenProvider {

    output = undefined;

    constructor() {
        this.output = vscode.window.createOutputChannel("Abstract tokenizer");
    }

    provideDocumentSemanticTokens(document) {
        this.output.appendLine("semantic called");

        const tokensBuilder = new SemanticTokensBuilder(legend);
        const text = document.getText();

        const tokens = this.parse(text, tokensBuilder);

        // for (const token of tokens) {
        //     tokensBuilder.push(
        //         new Range(token.line, token.start, token.line, token.end),
        //         'keyword',
        //         ['readonly']
        //     );
        // }

        return tokensBuilder.build();
    }

    parse(src, builder) {
        let tokens = [];
        let parsed = [];

        this.output.append("lexing...   ");

        let line = 0;
        let linebeggin = 0;

        for (let i = 0; i < src.length; i++) {
            
            switch (src[i]) {

                case "#":
                    if (src.length > i+2 && src.substring(i, i+3) == '###')
                    {
                        let lstart = i;
                        let start = i - linebeggin;
                        
                        i += 3;
                        
                        for (; i+3 < src.length && src.substring(i, i+3) != '###'; i++) {
                            if (src[i] == '\n') {
                                line++;
                                linebeggin = i+1;
                            }
                        }
                        parsed.push({
                            t: "comment-block",
                            ls: lstart,
                            le: line,
                            b: start,
                            e: i - linebeggin + 3
                        });
                    }
                    else {
                        let start = i - linebeggin;

                        for (; i < src.length && src[i] != '\n'; i++);
                        parsed.push({
                            t: "comment-line",
                            ls: line,
                            le: line,
                            b: start,
                            e: i - linebeggin - 1
                        });
                        line++;
                    }
                    continue;

                case '\n':
                    line++;
                    linebeggin = i+1;
                    continue;

            }
            
        }

        this.output.appendLine(tokens.length + " tokens lexed");

        for (let i of parsed) {
            this.output.appendLine("{" + i.t + ";" + i.ls + ":" + i.b + ";" + i.le + ':' + i.e + "}");
            try {
                builder.push(
                    new Range(new Position(i.ls, i.b), new Position(i.le, i.e)),
                    i.t,
                    ['readonly']
                );
            }
            catch (err)
            {
                this.output.appendLine(err);
            }
        }

        this.output.appendLine("parse finished");
    }

}

module.exports = { AbstractTokenProvider, legend };
