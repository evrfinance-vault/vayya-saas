export const ENV = (import.meta as any).env as {
  VITE_BACKEND_URL?: string;
  VITE_AUTH0_DOMAIN?: string;
  VITE_AUTH0_CLIENT_ID?: string;
  VITE_AUTH0_AUDIENCE?: string;
  VITE_AUTH0_CONNECTION?: string;
  VITE_AUTH0_ROLE_CLAIM?: string;
  VITE_AUTH0_DEFAULT_ROLE?: string;
};
