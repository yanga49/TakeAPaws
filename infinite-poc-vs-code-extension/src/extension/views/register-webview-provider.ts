import { CancellationToken, commands, ExtensionContext, OutputChannel, ProgressLocation, Uri, Webview, WebviewView, WebviewViewProvider, WebviewViewResolveContext, window, workspace } from "vscode";
import { openBrowser } from "../features/register-callback-request";
import { readSelectedOrAllText } from "../features/register-commands";
import { getNonce } from "../util";
import { CustomEvent } from "./custom-event";
import { CenterPanel } from "./register-center-panel";

export function registerWebViewProvider(context: ExtensionContext, op: OutputChannel) {
    const provider = new SidebarWebViewProvider(context.extensionUri, context);
    context.subscriptions.push(window.registerWebviewViewProvider('infinite-poc-sidebar-panel', provider));

    context.subscriptions.push(commands.registerCommand('ipoc.print.editor.menu', () => {
        const txt = readSelectedOrAllText(op);
        provider.view?.webview.postMessage({ type: 'transferDataFromTsToUi', data: txt });
    }));
}

export class SidebarWebViewProvider implements WebviewViewProvider {
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
    }

    private _getHtmlForWebview(webview: Webview) {
        const styleResetUri = webview.asWebviewUri(Uri.joinPath(this._extensionUri, "media", "css", "reset.css"));
        const scriptUri = webview.asWebviewUri(Uri.joinPath(this._extensionUri, "media", "js", "infinite-poc-panel.js"));
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
            <div>
                <button id="happyButton">Happy</button>
                <button id="sadButton">Sad</button>
                <button id="excitedButton">Excited</button>
                <button id="angryButton">Angry</button>
                <img id="animationGif" width="400" src="${defaultGif}" alt="Animation">
            </div>
    
            <!-- Place script at the bottom to ensure the DOM is fully loaded -->
            <script nonce="${nonce}">
                console.log('Script loaded');
                
                document.getElementById('happyButton').addEventListener('click', () => {
                    showGif('happy');
                });
                document.getElementById('sadButton').addEventListener('click', () => {
                    showGif('sad');
                });
                document.getElementById('excitedButton').addEventListener('click', () => {
                    showGif('excited');
                });
                document.getElementById('angryButton').addEventListener('click', () => {
                    showGif('angry');
                });
    
                function showGif(emotion) {
                    console.log('Button clicked:', emotion);
                    const gif = document.getElementById('animationGif');
                    switch(emotion) {
                        case 'happy':
                            gif.src = '${happyGif}';
                            break;
                        case 'sad':
                            gif.src = '${sadGif}';
                            break;
                        case 'excited':
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
}