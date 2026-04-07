function getButtonInjectionScript(): string {
  return `
  function findConfigureButton(container) {
    let btn = Array.from(container.querySelectorAll('button')).find(b => b.textContent?.trim() === 'Configure');
    if (!btn) btn = Array.from(container.querySelectorAll('button')).find(b => b.textContent?.toLowerCase().trim() === 'configure');
    if (!btn) {
      const buttons = Array.from(container.querySelectorAll('button'));
      if (buttons.length === 0) return null;
      btn = buttons[buttons.length - 1];
    }
    return btn;
  }
  
  function createLoginButton(configureButton, scalarApiReference, showModal) {
    const link = document.createElement('button');
    const currentToken = localStorage.getItem('scalar-token');
    link.textContent = currentToken ? 'Logout' : 'Login';
    link.setAttribute('data-login-link', 'true');
    link.setAttribute('type', 'button');
    const style = window.getComputedStyle(configureButton);
    const props = ['background', 'border', 'color', 'cursor', 'fontSize', 'fontFamily', 'fontWeight', 'fontStyle', 'letterSpacing', 'lineHeight', 'padding', 'margin', 'borderRadius', 'transition', 'display', 'alignItems', 'gap', 'textDecoration', 'textTransform'];
    link.style.cssText = props.map(p => p + ': ' + style[p]).join('; ') + ';';
    if (configureButton.className) link.className = configureButton.className;
    link.onmouseenter = () => {
      const hover = window.getComputedStyle(configureButton, ':hover');
      if (hover.backgroundColor) link.style.backgroundColor = hover.backgroundColor;
    };
    link.onmouseleave = () => link.style.backgroundColor = style.backgroundColor;
    link.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const token = localStorage.getItem('scalar-token');
      if (token) {
        localStorage.removeItem('scalar-token');
        updateScalarAuth(scalarApiReference, '');
        location.reload();
      } else {
        showModal();
      }
    };
    configureButton.insertAdjacentElement('afterend', link);
    return true;
  }
  
  function injectLoginLinkInternal(scalarApiReference, showModal) {
    let injected = false;
    let attempts = 0;
    const maxAttempts = 150;
    const tryInject = () => {
      attempts++;
      if (document.querySelector('[data-login-link]')) return true;
      const devBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === 'Developer Tools');
      if (devBtn) {
        let container = devBtn.parentElement;
        while (container && container !== document.body) {
          const buttons = Array.from(container.querySelectorAll('button'));
          if (buttons.length >= 4 && buttons.includes(devBtn)) {
            const cfgBtn = findConfigureButton(container);
            if (cfgBtn) return createLoginButton(cfgBtn, scalarApiReference, showModal);
          }
          container = container.parentElement;
        }
        if (devBtn.parentElement) {
          const parentBtns = Array.from(devBtn.parentElement.querySelectorAll('button'));
          if (parentBtns.length >= 2 && parentBtns.some(b => b.textContent?.trim() === 'Configure')) {
            const cfgBtn = findConfigureButton(devBtn.parentElement);
            if (cfgBtn) return createLoginButton(cfgBtn, scalarApiReference, showModal);
          }
        }
      }
      return false;
    };
    window.updateLoginButton = () => {
      const link = document.querySelector('[data-login-link]');
      if (link) link.textContent = localStorage.getItem('scalar-token') ? 'Logout' : 'Login';
    };
    if (tryInject()) return;
    const observer = new MutationObserver(() => {
      if (!injected && tryInject()) {
        injected = true;
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    const interval = setInterval(() => {
      if (injected || tryInject() || attempts >= maxAttempts) {
        clearInterval(interval);
        observer.disconnect();
      }
    }, 100);
  }`
}

export function getInitScript(opts: {
  apiUrl: string
  openApiUrl: string
  dynamicEnvId: string
  dynamicAppName: string
}): string {
  const { apiUrl, openApiUrl, dynamicEnvId, dynamicAppName } = opts
  const buttonScript = getButtonInjectionScript()

  return `
(function() {
  const apiUrl = ${JSON.stringify(apiUrl)};
  const openApiUrl = ${JSON.stringify(openApiUrl)};
  const dynamicEnvId = ${JSON.stringify(dynamicEnvId)};
  const dynamicAppName = ${JSON.stringify(dynamicAppName)};
  
  function updateScalarAuth(scalarApiReference, token) {
    const prev = scalarApiReference?.getConfiguration?.() ?? {};
    const prevAuth = prev.authentication && typeof prev.authentication === 'object' ? prev.authentication : {};
    const prevSchemes =
      prevAuth.securitySchemes && typeof prevAuth.securitySchemes === 'object' ? prevAuth.securitySchemes : {};
    const mergedAuth = {
      ...prevAuth,
      preferredSecurityScheme: 'bearerAuth',
      securitySchemes: { ...prevSchemes, bearerAuth: { token } },
    };
    const next = { ...prev, authentication: mergedAuth };
    if (scalarApiReference?.updateConfiguration) scalarApiReference.updateConfiguration(next);
    else if (scalarApiReference?.updateAuthentication) scalarApiReference.updateAuthentication(mergedAuth);
  }
  
  const storedToken = localStorage.getItem('scalar-token');
  
  let scalarApiReference = null;
  try {
    scalarApiReference = Scalar.createApiReference('#scalar-container', {
      url: openApiUrl,
      theme: 'moon',
      authentication: {
        preferredSecurityScheme: 'bearerAuth',
        securitySchemes: { bearerAuth: { token: storedToken || '' } },
      },
    });
  } catch (error) {
    console.error('Failed to initialize Scalar:', error);
  }
  
  window.scalarApiReference = scalarApiReference;
  
  const modalOverlay = document.getElementById('modal-overlay');
  const closeModal = document.getElementById('close-modal');
  const tokenInput = document.getElementById('token');
  const applyBtn = document.getElementById('apply-token');

  function setDynamicError(msg) {
    const el = document.getElementById('dynamic-login-error');
    if (!el) return;
    if (msg) {
      el.textContent = msg;
      el.hidden = false;
    } else {
      el.textContent = '';
      el.hidden = true;
    }
  }

  function resetDynamicLoginUi() {
    setDynamicError('');
  }

  function showModal() {
    modalOverlay.classList.add('show');
    resetDynamicLoginUi();
  }

  function hideModal() {
    modalOverlay.classList.remove('show');
    if (tokenInput) tokenInput.value = '';
    resetDynamicLoginUi();
  }

  window.showLogin = showModal;
  if (closeModal) closeModal.addEventListener('click', hideModal);
  modalOverlay?.addEventListener('click', (e) => {
    if (e.target === modalOverlay) hideModal();
  });

  let dynamicModulePromise = null;
  function getDynamicModule() {
    if (!dynamicEnvId) return Promise.resolve(null);
    if (!dynamicModulePromise) {
      dynamicModulePromise = (async () => {
        const mod = await import('/reference/dynamic-auth.js');
        if (
          !mod.initReferenceDynamic ||
          !mod.getAuthJwt ||
          !mod.completeReferenceOAuthIfNeeded ||
          !mod.loginWithGoogle ||
          !mod.loginWithGithub ||
          !mod.loginWithPasskey
        ) {
          throw new Error('Dynamic bundle outdated. Run pnpm build:reference-dynamic in apps/api.');
        }
        await mod.initReferenceDynamic({ environmentId: dynamicEnvId, appName: dynamicAppName });
        try {
          if (await mod.completeReferenceOAuthIfNeeded()) {
            const token = mod.getAuthJwt();
            if (token) {
              localStorage.setItem('scalar-token', token);
              updateScalarAuth(scalarApiReference, token);
              if (window.updateLoginButton) window.updateLoginButton();
            }
          }
        } catch (e) {
          console.error('Dynamic OAuth resume', e);
        }
        return mod;
      })();
    }
    return dynamicModulePromise;
  }

  async function applyDynamicToken(mod) {
    const token = mod.getAuthJwt();
    if (!token) {
      setDynamicError('Signed in but no JWT yet. Check Dynamic dashboard (allowed origins, sign-in methods).');
      return;
    }
    localStorage.setItem('scalar-token', token);
    updateScalarAuth(scalarApiReference, token);
    hideModal();
    if (window.updateLoginButton) window.updateLoginButton();
  }

  async function mountDynamicReferenceLogin() {
    if (!dynamicEnvId) return;
    const googleBtn = document.getElementById('dynamic-login-google');
    const githubBtn = document.getElementById('dynamic-login-github');
    const passkeyBtn = document.getElementById('dynamic-login-passkey');
    try {
      const mod = await getDynamicModule();
      if (!mod) return;
      if (googleBtn) {
        googleBtn.addEventListener('click', async () => {
          setDynamicError('');
          try {
            await mod.loginWithGoogle();
          } catch (e) {
            const msg = e && typeof e === 'object' && 'message' in e ? String(e.message) : String(e);
            setDynamicError(msg || 'Google sign-in failed');
          }
        });
      }
      if (githubBtn) {
        githubBtn.addEventListener('click', async () => {
          setDynamicError('');
          try {
            await mod.loginWithGithub();
          } catch (e) {
            const msg = e && typeof e === 'object' && 'message' in e ? String(e.message) : String(e);
            setDynamicError(msg || 'GitHub sign-in failed');
          }
        });
      }
      if (passkeyBtn) {
        passkeyBtn.addEventListener('click', async () => {
          setDynamicError('');
          try {
            await mod.loginWithPasskey();
            await applyDynamicToken(mod);
          } catch (e) {
            const msg = e && typeof e === 'object' && 'message' in e ? String(e.message) : String(e);
            setDynamicError(msg || 'Passkey sign-in failed');
          }
        });
      }
    } catch (e) {
      const msg = e && typeof e === 'object' && 'message' in e ? String(e.message) : String(e);
      setDynamicError(msg || 'Could not load Dynamic');
    }
  }

  void mountDynamicReferenceLogin();

  function normalizePastedAuthCredential(raw) {
    let t = String(raw).trim();
    // "Authorization: Bearer <token>" (curl / DevTools copy)
    const authBearer = t.match(/^authorization:\\s*bearer\\s+(.+)$/i);
    if (authBearer) return authBearer[1].trim();
    // "Authorization: <token>" without the word Bearer
    const authRest = t.match(/^authorization:\\s*(.+)$/i);
    if (authRest) t = authRest[1].trim();
    // "Bearer <token>" — Scalar adds Bearer; store token only
    if (/^bearer\\s+/i.test(t)) t = t.replace(/^bearer\\s+/i, '').trim();
    return t;
  }
  
  if (applyBtn && tokenInput) {
    applyBtn.addEventListener('click', () => {
      const token = normalizePastedAuthCredential(tokenInput.value);
      if (token) {
        localStorage.setItem('scalar-token', token);
        updateScalarAuth(scalarApiReference, token);
        hideModal();
        if (window.updateLoginButton) window.updateLoginButton();
      }
    });
  }
  
  ${buttonScript}
  
  injectLoginLinkInternal(scalarApiReference, showModal);
})();
`
}
