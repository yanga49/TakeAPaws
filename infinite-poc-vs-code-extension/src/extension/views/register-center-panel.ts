import { commands, ExtensionContext, Uri, ViewColumn, Webview, WebviewPanel, window } from "vscode";
import { openBrowser } from "../features/register-callback-request";
import { getNonce } from "../util";

export function registerCenterPanel(context: ExtensionContext) {
    context.subscriptions.push(
        commands.registerCommand('ipoc.show.center.panel', () => {
            CenterPanel.getInstance(context.extensionUri, context);
        })
    );

    context.subscriptions.push(
        commands.registerCommand('ipoc.send.data', (data) => {
            window.showInformationMessage('ipoc.send.data: ' + data.data);
        })
    );
}

export class CenterPanel {
    public static centerPanel: CenterPanel | undefined;
    private static readonly viewType = "CenterPanel";
    private constructor(public readonly webviewPanel: WebviewPanel, private readonly _extensionUri: Uri, public extensionContext: ExtensionContext) {
        this.updateView();
    }

    public static getInstance(extensionUri: Uri, extensionContext: ExtensionContext) {
        const column = window.activeTextEditor
            ? window.activeTextEditor.viewColumn
            : undefined;

        if (CenterPanel.centerPanel) {
            CenterPanel.centerPanel.webviewPanel.reveal(column);
            CenterPanel.centerPanel.updateView();
            return;
        }

        const panel = window.createWebviewPanel(
            CenterPanel.viewType,
            "Extension HTML Feature",
            column || ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    Uri.joinPath(extensionUri, "media")
                ],
            }
        );

        CenterPanel.centerPanel = new CenterPanel(panel, extensionUri, extensionContext);
    }

    private async updateView() {
        const webview = this.webviewPanel.webview;
        this.webviewPanel.webview.html = this._getHtmlForWebview(webview);

        this.webviewPanel.webview.onDidReceiveMessage((data) => {
            switch (data.type) {
                case "btn-first": {
                    openBrowser();
                    break;
                }
                case 'btn-second': {
                    this.extensionContext.globalState.update('ipocCacheKey', data.value);
                    window.showInformationMessage('Value saved in cache: ' + data.value);
                    break;
                }
                case 'btn-third': {
                    this.extensionContext.secrets.store('ipocCacheKey', data.value);
                    window.showInformationMessage('Value saved in SecretStorage: ' + data.value);
                    break;
                }
            }
        });
    }

    private _getHtmlForWebview(webview: Webview) {
        const styleResetUri = webview.asWebviewUri(Uri.joinPath(this._extensionUri, "media", "css", "reset.css"));
        const scriptUri = webview.asWebviewUri(Uri.joinPath(this._extensionUri, "media", "js", "infinite-poc-panel.js"));
        const styleVSCodeUri = webview.asWebviewUri(Uri.joinPath(this._extensionUri, "media", "css", "vscode.css"));

        const nonce = getNonce();
        // Corrected URIs for GIFs using Uri.joinPath
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
                    <button onclick="showGif('happy')">Happy</button>
                    <button onclick="showGif('sad')">Sad</button>
                    <button onclick="showGif('excited')">Excited</button>
                    <button onclick="showGif('angry')">Angry</button>
                    <img id="animationGif" width="400" src="${defaultGif}" alt="Animation">
                </div>

                <script>
                    function showGif(emotion) {
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