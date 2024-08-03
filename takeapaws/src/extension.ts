import * as vscode from 'vscode';

interface EmotionData {
    emotion: string;
    score: number;
}

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('takeapaws.startEmotionDetection', async () => {
        vscode.window.showInformationMessage('Starting Emotion Detection...');

        // Create a new webview panel
        const panel = vscode.window.createWebviewPanel(
            'emotionDetection',
            'Emotion Detection',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true
            }
        );

        panel.webview.html = getWebviewContent();

        // Set up message handler
        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'updateMessage':
                        vscode.window.showInformationMessage(message.text);
                        break;
                }
            },
            undefined,
            context.subscriptions
        );

        // Fetch emotion from Flask server
        const fetchEmotion = async () => {
            try {
                const fetch = (await import('node-fetch')).default;
                const response = await fetch('http://127.0.0.1:5000/emotion');
                const data = await response.json() as EmotionData;

                // Ensure data is the correct type
                if (data && typeof data.emotion === 'string') {
                    panel.webview.postMessage({ command: 'updateMessage', text: getEmotionMessage(data.emotion) });
                } else {
                    panel.webview.postMessage({ command: 'updateMessage', text: 'Error: Invalid data received' });
                }
            } catch (error) {
                console.error('Error fetching emotion:', error);
                panel.webview.postMessage({ command: 'updateMessage', text: 'Error fetching emotion' });
            }
        };

        setInterval(fetchEmotion, 5000); // Check every 5 seconds
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}

function getWebviewContent() {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <body>
        <h1>Emotion Detection</h1>
        <div id="message"></div>
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

function getEmotionMessage(emotion: string): string {
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
