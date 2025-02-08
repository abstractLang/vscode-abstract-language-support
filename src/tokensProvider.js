const vscode = require('vscode');
const SemanticTokensBuilder = vscode.SemanticTokensBuilder;
const Range = vscode.Range;

const legend = new vscode.SemanticTokensLegend(
    ['keyword', 'type', 'struct', 'param', 'function'],
    ['readonly']
);

class TokenProvider {

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

    tokenMap = {
        "namespace":  "namespaceKeyword",
        "import":     "importKeyword",
        "from":       "fromKeyword",

        "let":        "letKeyword",
        "const":      "constKeyword",
        "func":       "funcKeyword",
        "struct":     "structKeyword",
        "extends":    "extendsKeyword",
        "enum":       "enumKeyword",
        "switch":     "switchKeyword",
        "match":      "matchKeyword",

        "if":         "ifKeyword",
        "elif":       "elifKeyword",
        "else":       "elseKeyword",
        "while":      "whileKeyword",
        "for":        "forKeyword",
        "do":         "doKeyword",
        "in":         "inKeyword",
        "break":      "breakKeyword",

        "return":     "returnKeyword",

        "as":         "asKeyword",

        "null":       "nullKeyword",
        "true":       "trueKeyword",
        "false":      "falseKeyword",

        "and":        "andKeyword",
        "or":         "orKeyword",
    };

    parse(src, builder) {
        let tokens = [];
        let parsed = [];

        /*
            token {
                type
                value
                startLine, startCol
                endLine, endCol
            }
        */

        this.output.append("lexing...   ");

        let line = 0;
        let linebeggin = 0;

        for (let i = 0; i < src.length; i++) {
            
            if (src[i] == "#") { // comments are highlighted with textmate
                if (src.length > i+2 && src.substring(i, i+3) == '###') {

                    i += 3;                    
                    for (; i+3 < src.length && src.substring(i, i+3) != '###'; i++) {
                        if (src[i] == '\n') {
                            line++;
                            linebeggin = i+1;
                        }
                    }
                }
                else {
                    for (; i < src.length && src[i] != '\n'; i++);
                    --i;
                }
                continue;
            }

            else if (src[i] == '\n') { // count line breaks
                line++;
                linebeggin = i+1;
            }

            // lots of random tokens here
            else if (src[i] == '(') tokens.push({
                type: 'leftParenthesis', value: '(', startLine: line, startCol: i, endLine: line, endCol: i+1,
            });
            else if (src[i] == ')') tokens.push({
                type: 'rightParenthesis', value: '(', startLine: line, startCol: i, endLine: line, endCol: i+1,
            });
            
            else if (src[i] == '{') tokens.push({
                type: 'leftBrackets', value: '{', startLine: line, startCol: i, endLine: line, endCol: i+1,
            });
            else if (src[i] == '}') tokens.push({
                type: 'rightBrakets', value: '}', startLine: line, startCol: i, endLine: line, endCol: i+1,
            });

            else if (src[i] == '[') tokens.push({
                type: 'leftSquareBrakets', value: '[', startLine: line, startCol: i, endLine: line, endCol: i+1,
            });
            else if (src[i] == ']') tokens.push({
                type: 'rightSquareBrakets', value: ']', startLine: line, startCol: i, endLine: line, endCol: i+1,
            });

            else if (src[i] == '.') tokens.push({
                type: 'dot', value: '.', startLine: line, startCol: i, endLine: line, endCol: i+1,
            });
            else if (src[i] == ',') tokens.push({
                type: 'comma', value: ',', startLine: line, startCol: i, endLine: line, endCol: i+1,
            });

            else if (src[i] == '\n') continue;

            else if (IsValidIdentifierInitialiser(src[i])) { // parse identifiers

                let lstart = line;
                let start = i - linebeggin;
                
                let identifier = "";
                for (; i < src.length && IsValidIdentifier(src[i]); i++) {
                    identifier += src[i];
                }
                --i;


                let type = 'identifier';
                if (identifier in this.tokenMap) // is keyword
                {
                    type = this.tokenMap[identifier];
                    parsed.push({
                        type: 'keyword',
                        lineStart: lstart,
                        lineEnd: line,
                        colStart: start,
                        colEnd: i - linebeggin + 1
                    });
                }

                tokens.push({
                    type: type,
                    value: identifier,
                    startLine: lstart, startCol: start,
                    endLine: line, endCol: i - linebeggin +1,
                });
            }

        }

        this.output.appendLine(tokens.length + " tokens lexed");
        this.output.appendLine("parsing... ");

        while (tokens.length > 0) {
            try {

                let curr = tokens.shift();

                if (curr.type == 'constKeyword' || curr.type == 'letKeyword') {
                    let type = this.parseExpression(tokens);

                    let starttkn = type[0];
                    let endtkn = type[type.length -1];

                    parsed.push({
                        type: 'type',
                        lineStart: starttkn.startLine,
                        lineEnd: endtkn.endLine,
                        colStart: starttkn.startCol,
                        colEnd: endtkn.endCol
                    });

                }

                else if (curr.type == 'funcKeyword') {
                    let type = this.parseExpression(tokens);
                    
                    let starttkn = type[0];
                    let endtkn = type[type.length -1];
                    console.log(starttkn);

                    parsed.push({
                        type: 'type',
                        lineStart: starttkn.startLine,
                        lineEnd: endtkn.endLine,
                        colStart: starttkn.startCol,
                        colEnd: endtkn.endCol
                    });

                    console.log(1, tokens[0].type, tokens[0].value);
                    if (tokens[0].type != 'identifier') continue;

                    let name = tokens.shift();

                    parsed.push({
                        type: 'function',
                        lineStart: name.startLine,
                        lineEnd: name.endLine,
                        colStart: name.startCol,
                        colEnd: name.endCol
                    });

                    console.log(2, tokens[0].type, tokens[0].value);
                    if (tokens[0].type != 'leftParenthesis') continue;
                    tokens.shift();
                    
                    console.log("Parsing parameters...");
                    while (true) {
                        let ptype = this.parseExpression(tokens);
                        let pname = tokens.shift();

                        for (let i of ptype) this.output.appendLine(`${i.type} ${i.value}`);

                        let pstarttkn = ptype[0];
                        let pendtkn = ptype[type.length -1];
                        
                        parsed.push({
                            type: 'type',
                            lineStart: pstarttkn.startLine,
                            lineEnd: pendtkn.endLine,
                            colStart: pstarttkn.startCol,
                            colEnd: pendtkn.endCol
                        });

                        parsed.push({
                            type: 'param',
                            lineStart: pname.startLine,
                            lineEnd: pname.endLine,
                            colStart: pname.startCol,
                            colEnd: pname.endCol
                        });

                        if (tokens[0].type == 'comma') tokens.shift();
                        else break;
                    }

                }

                else if (curr.type == 'structKeyword') {
                    
                    if (tokens[0].type != 'identifier') continue;
                    let name = tokens.shift();

                    parsed.push({
                        type: 'struct',
                        lineStart: name.startLine,
                        lineEnd: name.endLine,
                        colStart: name.startCol,
                        colEnd: name.endCol
                    });

                }

            } catch(err) { console.error(err); }
        }

        this.output.appendLine("parse finished");
        this.output.appendLine("commiting...");

        for (let i of parsed) {
            this.output.appendLine(`{${i.type}: (${i.lineStart}, ${i.colStart}), (${i.lineEnd}, ${i.colEnd})}`);

            try {
                builder.push(
                    new Range(i.lineStart, i.colStart, i.lineEnd, i.colEnd),
                    i.type,
                    ['readonly']
                );
            }
            catch (err)
            {
                this.output.appendLine(err);
            }
        }
    }

    parseExpression(tokens) {
        let exptks = [];

        while(true) {
            if (tokens[0].type == 'identifier')
                exptks.push(tokens.shift());

            else if (tokens[0].type == 'leftParenthesis') {
                exptks.push(tokens.shift());
                
                while (true) {
                    exptks.concat(parseExpression());
                    
                    if (tokens[0].type == 'comma') exptks.push(tokens.shift());
                    else break;
                }

                if (tokens[0].type == 'rightParenthesis') exptks.push(tokens.shift());
            }
            else break;


            if (tokens[0].type == 'dot')
                exptks.push(tokens.shift());

            else if ((tokens[0].type == 'leftParenthesis'))
                continue;

            else break;
        }

        return exptks;
    }
}

function IsValidIdentifierInitialiser(char)
{
    return /[A-Za-z_]/.test(char);
}
function IsValidIdentifier(char)
{
    return /[A-Za-z0-9_]/.test(char);
}

module.exports = { TokenProvider, legend };
