
import * as vscode from 'vscode';

export interface IJump {
    include: boolean;
    pattern: string,
    direction: "left" | "right" | "both"
}

export function activate(context: vscode.ExtensionContext) {

    var capture = false;
    var capturedKeys = "";

    var interval = setInterval(() => {

        capture = false;
        capturedKeys = "";

    }, 3000);

    context.subscriptions.push(vscode.commands.registerCommand('vmotion', () => {
        capture = true;
    }));

    context.subscriptions.push(vscode.commands.registerCommand('cancel vmotion', () => {
        capture = false;
    }));

    vscode.commands.registerCommand("type", async (e) => {
        if (vscode.window.activeTextEditor) {
            var value = e.text;

            interval.refresh();

            if (capture) {

                capturedKeys += value;
                var motionFound = false;

                if (capturedKeys.startsWith("]") && capturedKeys.length > 1) {
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

export function deactivate() { }

function findNext(editor: vscode.TextEditor, args: IJump) {

    var startingPos = editor.document.offsetAt(editor.selection.start);

    var sliceContent = editor.document.getText().slice(startingPos);
    var i = startingPos;

    while (!sliceContent?.startsWith(args.pattern) && sliceContent?.length >= args.pattern.length) {
        sliceContent = sliceContent.slice(args.pattern.length);
        i += args.pattern.length;
    }

    return sliceContent.startsWith(args.pattern) ? editor.document.positionAt(args.include ? i + 1 : i) : editor.selection.start;
}

function findPrevious(editor: vscode.TextEditor, args: IJump) {

    var startingPos = editor.document.offsetAt(editor.selection.start);

    var sliceContent = editor.document.getText().slice(0, startingPos);
    var i = startingPos;

    while (!sliceContent?.endsWith(args.pattern) && sliceContent?.length >= args.pattern.length) {
        sliceContent = sliceContent.slice(0, sliceContent.length - args.pattern.length);
        i -= args.pattern.length;
    }

    return sliceContent.endsWith(args.pattern) ? editor.document.positionAt(args.include ? i - 1 : i) : editor.selection.start;

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

function getSelectionFromPosition(pos: vscode.Position) {
    return new vscode.Selection(pos, pos);
}