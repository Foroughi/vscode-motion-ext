
import * as vscode from 'vscode';

export interface IJump {
    include: boolean;
    pattern: string,
    direction: "left" | "right" | "both"
}

let motionStatusBarItem: vscode.StatusBarItem;
var capture = false;
var capturedKeys = "";
var interval: any;
const starters = "{([<";
const enders = "})]>";

export function activate({ subscriptions }: vscode.ExtensionContext) {

    motionStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
    subscriptions.push(motionStatusBarItem);

    updateStatusBarItem();

    interval = setInterval(() => {

        capture = false;
        capturedKeys = "";
        updateStatusBarItem();

    }, 3000);

    subscriptions.push(vscode.commands.registerCommand('vmotion', () => {
        capture = true;
        updateStatusBarItem();

    }));

    subscriptions.push(vscode.commands.registerCommand('cancel vmotion', () => {
        capture = false;
        updateStatusBarItem();
    }));



    vscode.commands.registerCommand("type", async (e) => {
        if (vscode.window.activeTextEditor) {
            var value = e.text;

            interval.refresh();

            if (capture) {

                capturedKeys += value;
                updateStatusBarItem();
                var motionFound = false;

                if (capturedKeys.startsWith("d]") && capturedKeys.length > 2) {
                    DeleteTo({ include: false, direction: "right", pattern: capturedKeys[2] });
                    motionFound = true;
                }
                else if (capturedKeys.startsWith("d[") && capturedKeys.length > 2) {
                    DeleteTo({ include: false, direction: "left", pattern: capturedKeys[2] });
                    motionFound = true;
                }
                else if (capturedKeys.startsWith("d>") && capturedKeys.length > 2) {
                    DeleteTo({ include: true, direction: "right", pattern: capturedKeys[2] });
                    motionFound = true;
                }
                else if (capturedKeys.startsWith("d<") && capturedKeys.length > 2) {
                    DeleteTo({ include: true, direction: "left", pattern: capturedKeys[2] });
                    motionFound = true;
                }
                else if (capturedKeys.startsWith("d|") && capturedKeys.length > 2) {
                    DeleteTo({ include: false, direction: "both", pattern: capturedKeys[2] });
                    motionFound = true;
                }


                else if (capturedKeys.startsWith("s]") && capturedKeys.length > 2) {
                    SelectTo({ include: false, direction: "right", pattern: capturedKeys[2] });
                    motionFound = true;
                }
                else if (capturedKeys.startsWith("s[") && capturedKeys.length > 2) {
                    SelectTo({ include: false, direction: "left", pattern: capturedKeys[2] });
                    motionFound = true;
                }
                else if (capturedKeys.startsWith("s>") && capturedKeys.length > 2) {
                    SelectTo({ include: true, direction: "right", pattern: capturedKeys[2] });
                    motionFound = true;
                }
                else if (capturedKeys.startsWith("s<") && capturedKeys.length > 2) {
                    SelectTo({ include: true, direction: "left", pattern: capturedKeys[2] });
                    motionFound = true;
                }
                else if (capturedKeys.startsWith("s|") && capturedKeys.length > 2) {
                    SelectTo({ include: false, direction: "both", pattern: capturedKeys[2] });
                    motionFound = true;
                }

                else if (capturedKeys.startsWith("]") && capturedKeys.length > 1) {
                    JumpTo({ include: false, direction: "right", pattern: capturedKeys[1] });
                    motionFound = true;
                }
                else if (capturedKeys.startsWith("[") && capturedKeys.length > 1) {
                    JumpTo({ include: false, direction: "left", pattern: capturedKeys[1] });
                    motionFound = true;
                }
                else if (capturedKeys.startsWith(">") && capturedKeys.length > 1) {
                    JumpTo({ include: true, direction: "right", pattern: capturedKeys[1] });
                    motionFound = true;
                }
                else if (capturedKeys.startsWith("<") && capturedKeys.length > 1) {
                    JumpTo({ include: true, direction: "left", pattern: capturedKeys[1] });
                    motionFound = true;
                }
                else if (capturedKeys.startsWith("|") && capturedKeys.length > 1) {
                    JumpTo({ include: false, direction: "both", pattern: capturedKeys[1] });
                    motionFound = true;
                }

                if (motionFound) {
                    console.log("motion executed : " + capturedKeys);
                    capturedKeys = "";

                    capture = false;
                }

                updateStatusBarItem();

                return;
            }

            const snippet = new vscode.SnippetString(value);
            const selectionsSorted = Array.from(vscode.window.activeTextEditor.selections).sort((a, b) => -a.start.compareTo(b.start));
            for (const selection of selectionsSorted) {
                await vscode.window.activeTextEditor.insertSnippet(snippet, selection);
            }

        }
    });
}

export function deactivate() {

    interval.unref();

}

function updateStatusBarItem(): void {


    if (capture) {

        motionStatusBarItem.show();

        motionStatusBarItem.text = "$(sync~spin) Motion : " + capturedKeys;
    }
    else {
        motionStatusBarItem.hide();
        motionStatusBarItem.text = "";
    }



}



function findNext(editor: vscode.TextEditor, args: IJump) {

    if(args.direction === "both" && enders.indexOf(args.pattern) === -1)
    {
        args.pattern = getPairChar(args.pattern);
    }

    var startingPos = editor.document.offsetAt(editor.selection.start);

    var sliceContent = editor.document.getText().slice(startingPos);
    var i = startingPos;

    while (!sliceContent?.startsWith(args.pattern) && sliceContent?.length >= args.pattern.length) {
        sliceContent = sliceContent.slice(args.pattern.length);
        i += args.pattern.length;
    }

    //return editor.document.positionAt(args.include ? i + 1 : i);
    return args.direction !== "both" || sliceContent.startsWith(args.pattern)  ? editor.document.positionAt(args.include ? i + 1 : i) : editor.selection.start;
}

function findPrevious(editor: vscode.TextEditor, args: IJump) {

    if(args.direction === "both" && starters.indexOf(args.pattern) === -1)
    {
        args.pattern = getPairChar(args.pattern);
    }
    
    
    
    var startingPos = editor.document.offsetAt(editor.selection.start);

    var sliceContent = editor.document.getText().slice(0, startingPos);
    var i = startingPos;

    while (!sliceContent?.endsWith(args.pattern) && sliceContent?.length >= args.pattern.length) {
        sliceContent = sliceContent.slice(0, sliceContent.length - args.pattern.length);
        i -= args.pattern.length;
    }

    //return editor.document.positionAt(0);
    return args.direction !== "both" || sliceContent.endsWith(args.pattern) ? editor.document.positionAt(args.include ? i - 1 : i) : editor.selection.start;

}

function find(editor: vscode.TextEditor, args: IJump) {

    var startingPos = editor.document.offsetAt(editor.selection.start);
    var next = findNext(editor, args);
    var pre = findPrevious(editor, args);

    if (editor.selection.start === next) {
        editor.selection = getSelectionFromPosition(pre);
    }

    if (editor.selection.start === pre) {
        editor.selection = getSelectionFromPosition(next);
    }

    return Math.abs(editor.document.offsetAt(next) - startingPos) < Math.abs(editor.document.offsetAt(pre) - startingPos) ? next : pre;

}

function JumpTo(args: IJump) {

    if (!args.include) {
        args.include = false;
    }

    if (!args.direction) {
        args.direction = "both";
    }

    if (!args.pattern) {
        return;
    }


    let editor = vscode.window.activeTextEditor;

    if (!editor) {
        return;
    }

    let sel = editor.selection;
    var loc = sel.start;

    if (args.direction === "right") {
        editor.selection = getSelectionFromPosition(findNext(editor, args));
    }
    else if (args.direction === "left") {
        editor.selection = getSelectionFromPosition(findPrevious(editor, args));
    }
    else {
        editor.selection = getSelectionFromPosition(find(editor, args));
    }

    console.log(args);


}

function SelectTo(args: IJump) {

    console.log(args);
    if (!args.include) {
        args.include = false;
    }

    if (!args.direction) {
        args.direction = "both";
    }

    if (!args.pattern) {
        return;
    }


    let editor = vscode.window.activeTextEditor;

    if (!editor) {
        return;
    }

    let sel = editor.selection;
    var loc = sel.start;

    if (args.direction === "right") {
       
        editor.selection = new vscode.Selection(loc, findNext(editor, args));
    }
    else if (args.direction === "left") {
        editor.selection = new vscode.Selection(loc, findPrevious(editor, args));
    }
    else {
    
        
        editor.selection = new vscode.Selection(findPrevious(editor, args), findNext(editor, args));
    }

    console.log(args);


}

function DeleteTo(args: IJump) {

    SelectTo(args);

    vscode.commands.executeCommand("deleteRight");

}

function getSelectionFromPosition(pos: vscode.Position) {
    return new vscode.Selection(pos, pos);
}

function getPairChar(char: string) {

    switch (char) {

        case "(": return ")";
        case ")": return "(";
        case "{": return "}";
        case "}": return "{";
        case "[": return "]";
        case "<": return ">";
        case ">": return "<";        
        default: return char;
    }


}