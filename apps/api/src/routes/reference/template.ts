import { getInitScript } from './template-scripts.js'
import { scalarStyles } from './template-styles.js'

export function getReferenceHtml(opts: {
  apiUrl: string
  openApiUrl: string
  webAppUrl: string
}): string {
  const { apiUrl, openApiUrl, webAppUrl } = opts
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Reference - Vencura</title>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference@latest/dist/browser/standalone.js"></script>
  <style>${scalarStyles}
  </style>
</head>
<body>
  <div id="scalar-container"></div>
  <div id="modal-overlay" class="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <h2 class="modal-title">Sign in</h2>
        <button id="close-modal" class="close-button">&times;</button>
      </div>
      <div class="form-group">
        <p class="form-label">Sign in via the web app, then paste your token below or use API key.</p>
        <a href="${webAppUrl}/auth/login" target="_blank" rel="noopener" class="submit-button" style="display:inline-block;text-decoration:none;text-align:center;margin-bottom:12px;">Open web app →</a>
        <label class="form-label" for="token">Bearer token / API key</label>
        <input type="password" id="token" class="form-input" placeholder="Paste token or venc_..." />
        <button type="button" id="apply-token" class="submit-button">Apply</button>
      </div>
    </div>
  </div>
  <script>${getInitScript({ apiUrl, openApiUrl, webAppUrl })}</script>
</body>
</html>`
}
