/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PATHFLOW_API_BASE?: string;
  readonly VITE_USE_NODE_WORKSPACE_API?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
