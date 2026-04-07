import { getInitScript } from './template-scripts.js'
import { scalarStyles } from './template-styles.js'

export function getReferenceHtml(opts: {
  apiUrl: string
  openApiUrl: string
  dynamicEnvId?: string
  dynamicAppName?: string
}): string {
  const { apiUrl, openApiUrl, dynamicEnvId, dynamicAppName } = opts
  const useDynamicLogin = !!dynamicEnvId
  const modalBody = useDynamicLogin
    ? `
      <div id="dynamic-login-root" class="dynamic-login-root">
        <p class="form-label">Sign in with Dynamic</p>
        <p class="form-hint">Use a method enabled in your Dynamic dashboard (social, passkey). Email/SMS OTP flows can use Scalar &quot;Configure&quot; or paste a token below.</p>
        <div class="dynamic-oauth-row">
          <button type="button" id="dynamic-login-google" class="submit-button">Google</button>
          <button type="button" id="dynamic-login-github" class="submit-button">GitHub</button>
        </div>
        <button type="button" id="dynamic-login-passkey" class="submit-button dynamic-passkey-btn">Passkey</button>
        <p id="dynamic-login-error" class="dynamic-login-error" hidden></p>
      </div>
      <details class="api-key-fallback">
        <summary class="form-label">Paste API key or Bearer JWT</summary>
        <div class="form-group">
          <label class="form-label" for="token">Credential</label>
          <p class="form-hint api-key-fallback-hint">API keys start with <code>venc_</code>; otherwise paste a JWT. Raw token is fine—if you paste <code>Bearer …</code> or a full <code>Authorization: Bearer …</code> line, the prefix is removed.</p>
          <input type="password" id="token" class="form-input" placeholder="venc_… or eyJ…" />
          <button type="button" id="apply-token" class="submit-button">Apply</button>
        </div>
      </details>
    `
    : `
      <div class="form-group">
        <p class="form-label">Dynamic Labs is not configured. Paste an API key or Bearer JWT below.</p>
        <label class="form-label" for="token">Credential</label>
        <p class="form-hint api-key-fallback-hint">API keys start with <code>venc_</code>; otherwise paste a JWT. Raw token is fine—if you paste <code>Bearer …</code> or <code>Authorization: Bearer …</code>, the prefix is removed.</p>
        <input type="password" id="token" class="form-input" placeholder="venc_… or eyJ…" />
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
  .dynamic-login-root { margin-bottom: 12px; }
  .form-hint { color: #888; font-size: 12px; margin-bottom: 12px; line-height: 1.4; }
  .dynamic-oauth-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
  .dynamic-passkey-btn { margin-bottom: 10px; }
  .dynamic-hidden { display: none !important; }
  .dynamic-login-error { color: #f87171; font-size: 13px; margin-top: 8px; }
  .iframe-wrapper { height: 280px; margin-bottom: 16px; border-radius: 8px; overflow: hidden; border: 1px solid #333; }
  .iframe-wrapper iframe { width: 100%; height: 100%; border: none; }
  .api-key-fallback { margin-top: 12px; }
  .api-key-fallback summary { cursor: pointer; color: #999; font-size: 13px; }
  .api-key-fallback-hint { margin-bottom: 8px; }
  .api-key-fallback-hint code { font-size: 11px; }
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
  <script>${getInitScript({ apiUrl, openApiUrl, dynamicEnvId: dynamicEnvId ?? '', dynamicAppName: dynamicAppName ?? 'API Reference' })}</script>
</body>
</html>`
}
