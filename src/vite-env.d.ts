/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PATHFLOW_API_BASE?: string;
  readonly VITE_USE_NODE_WORKSPACE_API?: string;
  readonly VITE_SUPABASE_PROJECT_ID?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
