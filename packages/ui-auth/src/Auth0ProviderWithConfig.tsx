import React from "react";
import { Auth0Provider } from "@auth0/auth0-react";
import { ENV } from "./env";

type Props = { children: React.ReactNode };

export function Auth0ProviderWithConfig({ children }: Props) {
  const domain = ENV.VITE_AUTH0_DOMAIN as string;
  const clientId = ENV.VITE_AUTH0_CLIENT_ID as string;
  const audience = ENV.VITE_AUTH0_AUDIENCE as string | undefined;

  if (!domain || !clientId) {
    console.warn("[Auth0] Missing VITE_AUTH0_DOMAIN or VITE_AUTH0_CLIENT_ID");
  }

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        audience,
        redirect_uri: window.location.origin,
        scope: "openid profile email",
      }}
      cacheLocation="localstorage"
      useRefreshTokens={true}
    >
      {children}
    </Auth0Provider>
  );
}
