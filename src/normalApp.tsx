import App from './App';
import { localStore } from './data/localStore';
import { SupabaseStore } from './data/supabaseStore';
import { SupabaseGate } from './features/auth/SupabaseGate';
import { setUnsavedEdits, startAppUpdate } from './lib/appUpdate';

const env =
  (import.meta as ImportMeta & { env?: Record<string, string | undefined> })
    .env ?? {};
const baseUrl = env.BASE_URL ?? '/';
const handwriting = document.createElement('style');
handwriting.textContent = `@font-face{font-family:Gaegu;font-style:normal;font-weight:400;font-display:block;src:url(${baseUrl}fonts/Gaegu-Regular.woff2) format('woff2')}`;
document.head.append(handwriting);
const preload = document.createElement('link');
preload.rel = 'preload';
preload.as = 'font';
preload.type = 'font/woff2';
preload.crossOrigin = 'anonymous';
preload.href = `${baseUrl}fonts/Gaegu-Regular.woff2`;
document.head.append(preload);
void document.fonts.load('20px Gaegu', '가');
startAppUpdate();
const remoteStore =
  env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY
    ? SupabaseStore.create(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)
    : null;

export default function NormalApp() {
  return remoteStore ? (
    <SupabaseGate store={remoteStore}>
      <App store={remoteStore} onUnsavedEdits={setUnsavedEdits} />
    </SupabaseGate>
  ) : (
    <App store={localStore} onUnsavedEdits={setUnsavedEdits} />
  );
}
