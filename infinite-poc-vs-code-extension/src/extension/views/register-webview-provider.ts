import { CancellationToken, commands, ExtensionContext, OutputChannel, Uri, Webview, WebviewView, WebviewViewProvider, WebviewViewResolveContext, window } from "vscode";
import { readSelectedOrAllText } from "../features/register-commands";
import { getNonce } from "../util";
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';

// Load environment variables from .env or .zshrc using dotenv
dotenv.config(); // Ensure this is at the top of your entry file

interface EmotionData {
    emotion: string;
    score: number;
}

// Define the expected structure of the OpenAI response
interface OpenAiResponse {
    choices?: {
        message: {
            content: string;
        };
    }[];
    error?: {
        message: string;
        type?: string;
        param?: string;
        code?: string;
    };
}

// Function to get text based on a message from OpenAI API
async function getText(message: string): Promise<string> {
    console.log("api key", process.env.OPENAI_API_KEY);
    console.log('Fetching text for emotion:', message);

    try {
        // Fetch response from OpenAI API
        const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, // Use the API key from environment variables
            },
            body: JSON.stringify({
                model: "gpt-4o-mini", // Replace with the correct model ID
                messages: [{ role: "user", content: `Provide a fun fact or message about feeling ${message}. In 1 sentence and make it with cat puns` }]
            })
        });

        // Cast the result of openAiResponse.json() to the OpenAiResponse type
        const openAiData = await openAiResponse.json() as OpenAiResponse;

        console.log('API Response:', openAiData); // Log the full API response

        // Handle API errors
        if (openAiData.error) {
            throw new Error(`OpenAI API Error: ${openAiData.error.message} (Code: ${openAiData.error.code})`);
        }

        // Handle case where no choices are returned
        if (!openAiData.choices || openAiData.choices.length === 0) {
            throw new Error('No choices returned from OpenAI API');
        }

        // Extract and return the message content
        const openAiMessage = openAiData.choices[0].message.content;
        return openAiMessage;

    } catch (error) {
        console.error('Error fetching text from OpenAI:', error);
        return 'Sorry, something went wrong. Please try again later.';
    }
}

export function registerWebViewProvider(context: ExtensionContext, op: OutputChannel) {
    const provider = new SidebarWebViewProvider(context.extensionUri, context);
    context.subscriptions.push(window.registerWebviewViewProvider('takeapaws-sidebar-panel', provider));

    context.subscriptions.push(commands.registerCommand('ipoc.print.editor.menu', () => {
        const txt = readSelectedOrAllText(op);
        provider.view?.webview.postMessage({ type: 'transferDataFromTsToUi', data: txt });
    }));
}

export class SidebarWebViewProvider implements WebviewViewProvider {
    private emotionFetchInterval: NodeJS.Timeout | null = null;

    constructor(private readonly _extensionUri: Uri, public extensionContext: ExtensionContext) { }
    view?: WebviewView;

    resolveWebviewView(webviewView: WebviewView,
        webViewContext: WebviewViewResolveContext,
        token: CancellationToken) {
        this.view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };

        // Set the HTML content for the webview
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Listen for messages from the webview
        webviewView.webview.onDidReceiveMessage(async (data) => {
            console.log('Received message from webview:', data);
            // Handle messages here
            if (data.command === 'getOpenAiText') {
                const openAiText = await getText(data.emotion);
                webviewView.webview.postMessage({ command: 'displayText', text: openAiText });
            }
        });

        // Start fetching emotion data periodically
        this.startFetchingEmotionData(webviewView.webview);
    }

    private _getHtmlForWebview(webview: Webview) {
        const nonce = getNonce();
        
        const happyGif = webview.asWebviewUri(Uri.joinPath(this._extensionUri, "media", "happycat.gif"));
        const sadGif = webview.asWebviewUri(Uri.joinPath(this._extensionUri, "media", "sadcat.gif"));
        const excitedGif = webview.asWebviewUri(Uri.joinPath(this._extensionUri, "media", "excitedcat.gif"));
        const angryGif = webview.asWebviewUri(Uri.joinPath(this._extensionUri, "media", "angrycat.gif"));
        const defaultGif = webview.asWebviewUri(Uri.joinPath(this._extensionUri, "media", "defaultcat.gif"));
    
        return `<!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy"
                content="
                    img-src ${webview.cspSource};
                    style-src ${webview.cspSource};
                    script-src 'nonce-${nonce}';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Cat GIFs</title>
                <style nonce="${nonce}">
                    body {
                        font-family: Arial, sans-serif;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        margin: 0;
                        padding: 20px;
                        background-color: #282c34;
                        color: white;
                        height: 100vh;
                    }
                    .gif-container {
                        flex-grow: 1;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        margin-bottom: 20px;
                    }
                    .txt-box {
                        width: 100%;
                        max-width: 1000px;
                        padding: 10px;
                        font-size: 16px;
                        border-radius: 15px;
                        border: 1px solid #ccc;
                        background-color: white;
                        color: black;
                        resize: none;
                        overflow: hidden;
                        box-sizing: border-box;
                    }
                    #animationGif {
                        max-width: 400px;
                        border-radius: 10px;
                    }
                </style>
            </head>
            <body>
                <div class="gif-container">
                    <img id="animationGif" src="${defaultGif}" alt="Animation">
                </div>
                <textarea class="txt-box" id="messageContainer" readonly>Fetching message...</textarea>
        
                <!-- Place script at the bottom to ensure the DOM is fully loaded -->
                <script nonce="${nonce}">
                    const vscode = acquireVsCodeApi();
                    window.addEventListener('message', event => {
                        const message = event.data;
                        switch (message.command) {
                            case 'updateEmotion':
                                updateGif(message.emotion);
                                break;
                            case 'displayText':
                                displayText(message.text);
                                break;
                        }
                    });
    
                    function updateGif(emotion) {
                        const gif = document.getElementById('animationGif');
                        switch (emotion) {
                            case 'happy':
                                gif.src = '${happyGif}';
                                break;
                            case 'sad':
                                gif.src = '${sadGif}';
                                break;
                            case 'fear':
                                gif.src = '${sadGif}';
                                break;
                            case 'neutral':
                                gif.src = '${defaultGif}';
                                break;
                            case 'surprise':
                                gif.src = '${excitedGif}';
                                break;
                            case 'angry':
                                gif.src = '${angryGif}';
                                break;
                            default:
                                gif.src = '${defaultGif}';
                        }
                        vscode.postMessage({ command: 'getOpenAiText', emotion: emotion });
                    }
    
                    function displayText(text) {
                        const messageContainer = document.getElementById('messageContainer');
                        messageContainer.value = text;
                        adjustTextAreaHeight(messageContainer);
                    }
    
                    function adjustTextAreaHeight(textArea) {
                        textArea.style.height = 'auto';
                        textArea.style.height = (textArea.scrollHeight) + 'px';
                    }
                </script>
            </body>
        </html>`;
    }
    
    
    
    
    

    private async fetchEmotion() {
        try {
            const fetch = (await import('node-fetch')).default;
            const response = await fetch('http://127.0.0.1:5000/emotion');
            const data = await response.json() as EmotionData;
            const emotion = data.emotion || 'default';
            if (this.view?.webview) {
                this.view.webview.postMessage({ command: 'updateEmotion', emotion });
            }
        } catch (error) {
            console.error('Error fetching emotion:', error);
            if (this.view?.webview) {
                this.view.webview.postMessage({ command: 'updateEmotion', emotion: 'default' });
            }
        }
    }

    private startFetchingEmotionData(webview: Webview) {
        this.fetchEmotion(); // Initial fetch
        this.emotionFetchInterval = setInterval(() => this.fetchEmotion(), 5000); // Fetch every 5 seconds
    }

    public dispose() {
        if (this.emotionFetchInterval) {
            clearInterval(this.emotionFetchInterval);
        }
    }
}
