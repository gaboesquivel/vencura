import { getInitScript } from './template-scripts.js'
import { scalarStyles } from './template-styles.js'

export function getReferenceHtml(opts: {
  apiUrl: string
  openApiUrl: string
  webAppUrl: string
  dynamicEnvId?: string
}): string {
  const { apiUrl, openApiUrl, webAppUrl, dynamicEnvId } = opts
  const useDynamicLogin = !!dynamicEnvId && !!webAppUrl
  const loginIframeSrc = useDynamicLogin
    ? `${webAppUrl}/auth/login?embedded=1&parentOrigin=${encodeURIComponent(apiUrl)}`
    : ''

  const modalBody = useDynamicLogin
    ? `
      <div id="login-iframe-wrapper" class="iframe-wrapper">
        <iframe
          id="login-iframe"
          src="${loginIframeSrc}"
          title="Sign in with Dynamic Labs"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          allow="storage-access"
        ></iframe>
      </div>
      <details class="api-key-fallback">
        <summary class="form-label">Use API key instead</summary>
        <div class="form-group">
          <label class="form-label" for="token">Bearer token / API key</label>
          <input type="password" id="token" class="form-input" placeholder="Paste token or venc_..." />
          <button type="button" id="apply-token" class="submit-button">Apply</button>
        </div>
      </details>
    `
    : `
      <div class="form-group">
        <p class="form-label">Dynamic Labs is not configured. Paste your Bearer token or API key below.</p>
        <label class="form-label" for="token">Bearer token / API key</label>
        <input type="password" id="token" class="form-input" placeholder="Paste token or venc_..." />
        <button type="button" id="apply-token" class="submit-button">Apply</button>
      </div>
    `

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Reference - Vencura</title>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference@latest/dist/browser/standalone.js"></script>
  <style>${scalarStyles}
  .iframe-wrapper { height: 280px; margin-bottom: 16px; border-radius: 8px; overflow: hidden; border: 1px solid #333; }
  .iframe-wrapper iframe { width: 100%; height: 100%; border: none; }
  .api-key-fallback { margin-top: 12px; }
  .api-key-fallback summary { cursor: pointer; color: #999; font-size: 13px; }
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
      ${modalBody}
    </div>
  </div>
  <script>${getInitScript({ apiUrl, openApiUrl, webAppUrl })}</script>
</body>
</html>`
}
