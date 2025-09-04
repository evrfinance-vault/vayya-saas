import React from "react";
import { createRoot } from "react-dom/client";
import { Auth0ProviderWithConfig } from "@packages/ui-auth";
import AppShell from "./auth/AppShell";

const root = createRoot(document.getElementById("root")!);
root.render(
  <Auth0ProviderWithConfig>
    <AppShell />
  </Auth0ProviderWithConfig>
);
