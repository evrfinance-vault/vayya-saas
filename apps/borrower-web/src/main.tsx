import React from "react";
import { createRoot } from "react-dom/client";
import {
  Auth0ProviderWithConfig,
  AbilityProvider,
  abilityForRole,
  useRole,
  ENV,
} from "@packages/ui-auth";
import AppShell from "./auth/AppShell";
import "@fontsource-variable/urbanist";
import "@packages/ui-auth/styles/base.css";

function Ability({ children }: { children: React.ReactNode }) {
  const role = useRole();
  const ability = React.useMemo(
    () => abilityForRole(role ?? ENV.VITE_AUTH0_DEFAULT_ROLE ?? "borrower"),
    [role],
  );

  return <AbilityProvider ability={ability}>{children}</AbilityProvider>;
}

const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <Auth0ProviderWithConfig>
      <Ability>
        <AppShell />
      </Ability>
    </Auth0ProviderWithConfig>
  </React.StrictMode>,
);

if (import.meta.env.DEV) {
  window.addEventListener("unhandledrejection", (ev) => {
    const r: any = ev.reason;
    if (r?.name === "AbortError" || r?.code === 20) {
      console.debug("[global] AbortError (suppressed):", ev);
      ev.preventDefault();
      return;
    }
    console.error("[global] Unhandled rejection:", r);
  });
}
