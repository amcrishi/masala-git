'use client';

import { useEffect, useCallback, useRef } from 'react';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (element: HTMLElement, config: Record<string, unknown>) => void;
          prompt: () => void;
        };
      };
    };
  }
}

interface GoogleSignInButtonProps {
  onCredential: (credential: string) => void;
  disabled?: boolean;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
}

export default function GoogleSignInButton({
  onCredential,
  disabled = false,
  text = 'signin_with',
}: GoogleSignInButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);

  const handleCredentialResponse = useCallback(
    (response: { credential: string }) => {
      if (response.credential) {
        onCredential(response.credential);
      }
    },
    [onCredential]
  );

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || scriptLoaded.current) return;

    const initializeGoogle = () => {
      if (window.google && buttonRef.current) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        window.google.accounts.id.renderButton(buttonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          width: buttonRef.current.offsetWidth,
          text,
          shape: 'rectangular',
          logo_alignment: 'left',
        });
      }
    };

    if (!document.getElementById('google-gsi-script')) {
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        scriptLoaded.current = true;
        initializeGoogle();
      };
      document.head.appendChild(script);
    } else {
      initializeGoogle();
    }
  }, [handleCredentialResponse, text]);

  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
    return null;
  }

  return (
    <div className={disabled ? 'opacity-50 pointer-events-none' : ''}>
      <div ref={buttonRef} className="w-full flex justify-center" />
    </div>
  );
}
