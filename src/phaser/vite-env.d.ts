/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
}

interface ImportMeta {
  readonly hot?: {
    accept: (cb?: () => void) => void;
    dispose: (cb: () => void) => void;
  };
}
