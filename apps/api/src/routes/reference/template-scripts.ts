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
  webAppUrl: string
}): string {
  const { apiUrl, openApiUrl, webAppUrl } = opts
  const buttonScript = getButtonInjectionScript()

  return `
(function() {
  const apiUrl = ${JSON.stringify(apiUrl)};
  const openApiUrl = ${JSON.stringify(openApiUrl)};
  const webAppUrl = ${JSON.stringify(webAppUrl)};
  
  function updateScalarAuth(scalarApiReference, token) {
    const authConfig = {
      preferredSecurityScheme: 'bearerAuth',
      securitySchemes: { bearerAuth: { token } },
    };
    if (scalarApiReference?.updateConfiguration) {
      scalarApiReference.updateConfiguration({ authentication: authConfig });
    } else if (scalarApiReference?.updateAuthentication) {
      scalarApiReference.updateAuthentication(authConfig);
    }
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
  
  function showModal() {
    modalOverlay.classList.add('show');
  }
  
  function hideModal() {
    modalOverlay.classList.remove('show');
    if (tokenInput) tokenInput.value = '';
  }
  
  window.showLogin = showModal;
  if (closeModal) closeModal.addEventListener('click', hideModal);
  modalOverlay?.addEventListener('click', (e) => {
    if (e.target === modalOverlay) hideModal();
  });

  window.addEventListener('message', (event) => {
    if (event.data?.type !== 'DYNAMIC_AUTH_TOKEN') return;
    let allowedOrigin = webAppUrl;
    try { allowedOrigin = new URL(webAppUrl).origin; } catch (_) {}
    if (event.origin !== allowedOrigin) return;
    const token = event.data.token;
    if (!token || typeof token !== 'string') return;
    localStorage.setItem('scalar-token', token);
    updateScalarAuth(scalarApiReference, token);
    hideModal();
    if (window.updateLoginButton) window.updateLoginButton();
  });
  
  if (applyBtn && tokenInput) {
    applyBtn.addEventListener('click', () => {
      const token = tokenInput.value.trim();
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
