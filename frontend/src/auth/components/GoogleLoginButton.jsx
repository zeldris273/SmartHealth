// src/auth/components/GoogleLoginButton.jsx

import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

/**
 * GoogleLoginButton
 *
 * Renders a Google Sign‑In button using the Google Identity Services library.
 * The library script is already included in `public/index.html`:
 *   <script src="https://accounts.google.com/gsi/client" async defer></script>
 *
 * The component initializes the Google One‑Tap / button with the client ID from
 * the environment variable `VITE_GOOGLE_CLIENT_ID`. When the user selects a
 * Google account, the library returns an ID token which we forward to the backend
 * via `googleLogin` from `AuthContext`.
 */
const GoogleLoginButton = ({ onSuccess }) => {
  const { googleLogin, closeAuthModal } = useAuth();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!window.google?.accounts?.id) {
      console.warn('Google Identity Services library not loaded.');
      return;
    }

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error('VITE_GOOGLE_CLIENT_ID is not defined in environment.');
      return;
    }

    // Prevent re‑initialization on every mount
    if (initializedRef.current) return;
    initializedRef.current = true;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        try {
          const result = await googleLogin(response.credential);
          if (result.success) {
            closeAuthModal();
            if (onSuccess) onSuccess();
          }
        } catch (err) {
          console.error(err);
          toast.error('Google login failed');
        }
      },
    });

    // Render button (omit width – GSI expects a number or omitted)
    window.google.accounts.id.renderButton(
      document.getElementById('google-signin-button'),
      {
        theme: 'outline',
        size: 'large',
        // width: '100%', // removed – invalid value
        locale: 'vi',
      }
    );
  }, [googleLogin, closeAuthModal, onSuccess]);

  return <div id="google-signin-button" className="w-full" />;
};

export default GoogleLoginButton;
