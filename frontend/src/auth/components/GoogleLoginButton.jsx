// src/auth/components/GoogleLoginButton.jsx

import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const GSI_INIT_KEY = '__smarthealth_google_signin_initialized';

/**
 * GoogleLoginButton
 *
 * Renders a Google Sign‑In button using the Google Identity Services library.
 * The library script is already included in `index.html`.
 */
const GoogleLoginButton = ({ onSuccess, variant = 'baymax' }) => {
  const { googleLogin, closeAuthModal } = useAuth();
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!window.google?.accounts?.id) {
      console.warn('Google Identity Services library not loaded.');
      return;
    }

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
    if (!clientId) {
      console.error('VITE_GOOGLE_CLIENT_ID is not defined in environment.');
      return;
    }

    if (!window[GSI_INIT_KEY]) {
      window[GSI_INIT_KEY] = true;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          const credential = response?.credential?.trim();
          if (!credential) {
            console.error('Google Sign-In did not return a credential.');
            return;
          }
          try {
            const result = await googleLogin(credential, true);
            if (result.success) {
              closeAuthModal();
              if (onSuccess) onSuccess();
            }
          } catch (err) {
            console.error(err);
          }
        },
      });
    }

    const container = buttonRef.current;
    if (!container) return;

    const renderGoogleButton = () => {
      const width = container.offsetWidth;
      if (width === 0) {
        setTimeout(renderGoogleButton, 50);
        return;
      }
      
      container.innerHTML = '';
      window.google.accounts.id.renderButton(container, {
        theme: 'outline',
        size: 'large',
        locale: 'vi',
        width: width,
        shape: variant === 'baymax' ? 'pill' : 'rectangular',
      });
    };

    renderGoogleButton();
  }, [googleLogin, closeAuthModal, onSuccess, variant]);

  return (
    <div
      ref={buttonRef}
      className={`w-full ${variant === 'glass' ? 'auth-glass-field' : ''}`}
    />
  );
};

export default GoogleLoginButton;
