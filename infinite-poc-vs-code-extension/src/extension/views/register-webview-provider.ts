import { CancellationToken, commands, ExtensionContext, OutputChannel, Uri, Webview, WebviewView, WebviewViewProvider, WebviewViewResolveContext, window } from "vscode";
import { readSelectedOrAllText } from "../features/register-commands";
import { getNonce } from "../util";
import { getText } from "../open-ai-api";

export function registerWebViewProvider(context: ExtensionContext, op: OutputChannel) {
    const provider = new SidebarWebViewProvider(context.extensionUri, context);
    context.subscriptions.push(window.registerWebviewViewProvider('infinite-poc-sidebar-panel', provider));

    context.subscriptions.push(commands.registerCommand('ipoc.print.editor.menu', () => {
        const txt = readSelectedOrAllText(op);
        provider.view?.webview.postMessage({ type: 'transferDataFromTsToUi', data: txt });
    }));
}

class SidebarWebViewProvider implements WebviewViewProvider {
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
            if (data.command === 'getText') {
                const text = await getText(data.emotion);
                webviewView.webview.postMessage({ command: 'displayText', text });
            }
        });
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
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            height: 100vh;
            margin: 0;
            padding: 10px;
            box-sizing: border-box;
        }
        .controls {
            display: flex;
            justify-content: space-around;
            margin-bottom: 10px;
        }
        .gif-container {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-top: auto;
        }
        #animationGif {
            display: block;
            margin: 0 auto;
        }
        #messageContainer {
            text-align: center;
            font-size: 16px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div>
        <div class="controls">
            <button id="happyButton">Happy</button>
            <button id="sadButton">Sad</button>
            <button id="excitedButton">Excited</button>
            <button id="angryButton">Angry</button>
        </div>
        <div id="messageContainer">Click a button to get a message</div>
        <div class="gif-container">
            <img id="animationGif" width="400" src="${defaultGif}" alt="Animation">
        </div>
    </div>

    <!-- Place script at the bottom to ensure the DOM is fully loaded -->
    <script nonce="${nonce}">
        console.log('Script loaded');

        const vscode = acquireVsCodeApi();
        
        document.getElementById('happyButton').addEventListener('click', () => {
            handleButtonClick('happy');
        });
        document.getElementById('sadButton').addEventListener('click', () => {
            handleButtonClick('sad');
        });
        document.getElementById('excitedButton').addEventListener('click', () => {
            handleButtonClick('excited');
        });
        document.getElementById('angryButton').addEventListener('click', () => {
            handleButtonClick('angry');
        });

        function handleButtonClick(emotion) {
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

            // Send a message to the extension to get the text
            vscode.postMessage({ command: 'getText', emotion: emotion });
        }

        // Listen for messages from the extension
        window.addEventListener('message', event => {
            const message = event.data; // The JSON data from the extension
            if (message.command === 'displayText') {
                document.getElementById('messageContainer').textContent = message.text;
            }
        });
    </script>
</body>
</html>`;
    }
}
