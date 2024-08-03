"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
function activate(context) {
    let disposable = vscode.commands.registerCommand('takeapaws.startEmotionDetection', async () => {
        vscode.window.showInformationMessage('Starting Emotion Detection...');
        // Create a new webview panel
        const panel = vscode.window.createWebviewPanel('emotionDetection', 'Emotion Detection', vscode.ViewColumn.Beside, {
            enableScripts: true
        });
        panel.webview.html = getWebviewContent();
        // Set up message handler
        panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'updateMessage':
                    vscode.window.showInformationMessage(message.text);
                    break;
            }
        }, undefined, context.subscriptions);
        // Fetch emotion from Flask server
        const fetchEmotion = async () => {
            try {
                const fetch = (await import('node-fetch')).default;
                const response = await fetch('http://127.0.0.1:5000/emotion');
                const data = await response.json();
                // Ensure data is the correct type
                if (data && typeof data.emotion === 'string') {
                    panel.webview.postMessage({ command: 'updateMessage', text: getEmotionMessage(data.emotion) });
                }
                else {
                    panel.webview.postMessage({ command: 'updateMessage', text: 'Error: Invalid data received' });
                }
            }
            catch (error) {
                console.error('Error fetching emotion:', error);
                panel.webview.postMessage({ command: 'updateMessage', text: 'Error fetching emotion' });
            }
        };
        setInterval(fetchEmotion, 5000); // Check every 5 seconds
    });
    context.subscriptions.push(disposable);
}
function deactivate() { }
function getWebviewContent() {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 10px;
                width: 300px; /* Set the width of the webview */
                height: 100%; /* Ensure it takes full height of the panel */
                overflow: hidden; /* Hide overflow to prevent scrolling */
            }
            #message {
                font-size: 16px;
                text-align: center;
            }
        </style>
    </head>
    <body>
        <h1>Emotion Detection</h1>
        <div id="message">Waiting for emotion data...</div>
        <script>
            const vscode = acquireVsCodeApi();
            window.addEventListener('message', event => {
                const message = event.data;
                switch (message.command) {
                    case 'updateMessage':
                        document.getElementById('message').textContent = message.text;
                        break;
                }
            });
        </script>
    </body>
    </html>
    `;
}
function getEmotionMessage(emotion) {
    switch (emotion) {
        case 'happy':
            return '😊 You’re doing great! Keep it up!';
        case 'neutral':
            return '😐 Everything’s calm and steady. Maybe now’s a good time to set some new goals or take a quick break.';
        case 'angry':
            return '😠 Feeling angry? Maybe a walk would help you calm down.';
        case 'sad':
            return '😢 It’s okay to feel sad. Take a break and do something you enjoy.';
        case 'surprised':
            return '😲 Surprise! It’s a great time to embrace the unexpected.';
        default:
            return ''; // Clear message if no specific emotion
    }
}
//# sourceMappingURL=extension.js.map