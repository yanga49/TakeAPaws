import  * as vscode from 'vscode';
let lastKeystrokeTime: number = Date.now();
let typingIntervals: number[] = [];
const SOME_THRESHOLD = 10;
const TYPING_SPEED_THRESHOLD = Math.round(2000 / 60);

function handleKeystroke() {
    const currentTime = Date.now();
    const interval = currentTime - lastKeystrokeTime;
    typingIntervals.push(interval);
    lastKeystrokeTime = currentTime;
}

function calculateAverageTypingSpeed() {
    const averageSpeed = typingIntervals.reduce((a, b) => a + b, 0) / typingIntervals.length;
    return averageSpeed;
}

let errorCount: number = 0;

function handleDiagnostics(event: vscode.DiagnosticChangeEvent) {
    const diagnostics = vscode.languages.getDiagnostics();
    errorCount = diagnostics.reduce((acc, diagnostic) => acc + diagnostic[1].length, 0);
}

function isLowErrorRate() {
    return errorCount < SOME_THRESHOLD;
}

let navigationCount: number = 0;

function handleNavigationCommand(command: string) {
    if (["editor.action.goToDeclaration", "editor.action.findReferences"].includes(command)) {
        navigationCount++;
    }
}

function isEfficientNavigation() {
    return navigationCount > SOME_THRESHOLD;
}

let codeChanges: { added: number, deleted: number, modified: number } = { added: 0, deleted: 0, modified: 0 };

function handleTextDocumentChange(event: vscode.TextDocumentChangeEvent) {
    event.contentChanges.forEach(change => {
        if (change.rangeLength > 0) {
            codeChanges.deleted += change.rangeLength;
        }
        if (change.text.length > 0) {
            codeChanges.added += change.text.length;
        }
    });
}

function isProgressiveDevelopment() {
    return codeChanges.added > codeChanges.deleted;
}


let undoRedoCount: number = 0;

function handleUndoRedo(command: string) {
    if (["undo", "redo"].includes(command)) {
        undoRedoCount++;
    }
}

function isConfidentCoding() {
    return undoRedoCount < SOME_THRESHOLD;
}

function evaluateSuccessfulCoding() {
    const averageTypingSpeed = calculateAverageTypingSpeed();
    const lowErrorRate = isLowErrorRate();
    const efficientNavigation = isEfficientNavigation();
    const progressiveDevelopment = isProgressiveDevelopment();
    const confidentCoding = isConfidentCoding();

    if (averageTypingSpeed > TYPING_SPEED_THRESHOLD &&
        lowErrorRate &&
        efficientNavigation &&
        progressiveDevelopment &&
        confidentCoding) {
        vscode.window.showInformationMessage('You are coding efficiently and successfully!');
    }
}