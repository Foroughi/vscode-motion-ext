
import * as vscode from 'vscode';

export interface IJumpArg {
    include: boolean;
    pattern: string,
    direction: ">" | "<" | "|"
}

export function activate(context: vscode.ExtensionContext) {

    context.subscriptions.push(vscode.commands.registerCommand('vmotion.jumpTo', JumpTo));

}

export function deactivate() { }

function findNext(editor: vscode.TextEditor, pos: vscode.Position, args: IJumpArg) {

    var startingPos = editor.document.offsetAt(pos);

    var sliceContent = editor.document.getText().slice(startingPos);
    var i = startingPos;

    while (!sliceContent?.startsWith(args.pattern) && sliceContent?.length >= args.pattern.length) {
        sliceContent = sliceContent.slice(args.pattern.length);
        i += args.pattern.length;
    }

    return sliceContent.startsWith(args.pattern) ? editor.document.positionAt(args.include ? i + 1 : i) : pos;
}

function findPrevious(editor: vscode.TextEditor, pos: vscode.Position, args: IJumpArg) {

    var startingPos = editor.document.offsetAt(pos);

    var sliceContent = editor.document.getText().slice(0, startingPos);
    var i = startingPos;

    while (!sliceContent?.endsWith(args.pattern) && sliceContent?.length >= args.pattern.length) {
        sliceContent = sliceContent.slice(0, sliceContent.length - args.pattern.length);
        i -= args.pattern.length;
    }

    return sliceContent.endsWith(args.pattern) ? editor.document.positionAt(args.include ? i - 1 : i ) : pos;

}

function find(editor: vscode.TextEditor, pos: vscode.Position, args: IJumpArg) {
    
    var startingPos = editor.document.offsetAt(pos);
    var next = findNext(editor , pos , args);
    var pre = findPrevious(editor , pos , args);

    if(pos === next)
    {
        return pre;
    }

    if(pos === pre)
    {
        return next;
    }
    
    return Math.abs(editor.document.offsetAt(next) - startingPos) < Math.abs(editor.document.offsetAt(pre) - startingPos) ? next : pre;

}

function getSelectionFromPosition(pos: vscode.Position) {
    return new vscode.Selection(pos, pos);
}

function JumpTo(args: IJumpArg) {

    if (!args.include) {
        args.include = false;
    }

    if (!args.direction) {
        args.direction = "|";
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

    if (args.direction === ">") {
        editor.selection = getSelectionFromPosition(findNext(editor, loc, args));
    }
    else if (args.direction === "<") {
        editor.selection = getSelectionFromPosition(findPrevious(editor, loc, args));
    }
    else {
        editor.selection = getSelectionFromPosition(find(editor, loc, args));
    }

    console.log(args);


}