import { CancellationToken, commands, ExtensionContext, OutputChannel, ProgressLocation, Uri, Webview, WebviewView, WebviewViewProvider, WebviewViewResolveContext, window, workspace } from "vscode";
import { openBrowser } from "../features/register-callback-request";
import { readSelectedOrAllText } from "../features/register-commands";
import { getNonce } from "../util";
import { CustomEvent } from "./custom-event";
import { CenterPanel } from "./register-center-panel";

interface EmotionData {
    emotion: string;
    score: number;
}

export function registerWebViewProvider(context: ExtensionContext, op: OutputChannel) {
    const provider = new SidebarWebViewProvider(context.extensionUri, context);
    context.subscriptions.push(window.registerWebviewViewProvider('infinite-poc-sidebar-panel', provider));

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
        });

        // Start fetching emotion data periodically
        this.startFetchingEmotionData(webviewView.webview);
    }

    private _getHtmlForWebview(webview: Webview) {
        const styleResetUri = webview.asWebviewUri(Uri.joinPath(this._extensionUri, "media", "css", "reset.css"));
        const styleVSCodeUri = webview.asWebviewUri(Uri.joinPath(this._extensionUri, "media", "css", "vscode.css"));

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
        </head>
        <body>
            <img id="animationGif" width="400" src="${defaultGif}" alt="Animation">
    
            <!-- Place script at the bottom to ensure the DOM is fully loaded -->
            <script nonce="${nonce}">
                const vscode = acquireVsCodeApi();
                window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.command) {
                        case 'updateEmotion':
                            updateGif(message.emotion);
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
