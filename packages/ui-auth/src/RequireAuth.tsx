import React, { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

type Props = { children: React.ReactNode }

export function RequireAuth({ children }: Props) {
  const { isAuthenticated, isLoading, loginWithRedirect, error } = useAuth0();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !error) {
      const connection = import.meta.env.VITE_AUTH0_CONNECTION as string | undefined;
      const roleHint = import.meta.env.VITE_AUTH0_DEFAULT_ROLE as | 'owner' | 'borrower' | 'admin' | undefined;

      void loginWithRedirect({
        authorizationParams: {
          prompt: 'login',
          ...(connection ? { connection } : {}),
          ...(roleHint ? { role_hint: roleHint } : {}),
          ...(roleHint ? { dashboard: roleHint } : {})
        }
      });
    }
  }, [isAuthenticated, isLoading, loginWithRedirect, error]);

  if (isLoading) return (<div style={{ padding: 24 }}>Loading auth…</div>);
  if (error) return (<div style={{ padding: 24, color: 'crimson' }}>Auth error: {String(error)}</div>);
  if (!isAuthenticated) return (<div style={{ padding: 24 }}>Redirecting…</div>);

  return (<>{children}</>);
}
