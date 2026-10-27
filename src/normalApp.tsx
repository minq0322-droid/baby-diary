import App from './App';
import { localStore } from './data/localStore';
import { SupabaseStore } from './data/supabaseStore';
import { SupabaseGate } from './features/auth/SupabaseGate';

const env =
  (import.meta as ImportMeta & { env?: Record<string, string | undefined> })
    .env ?? {};
const handwriting = document.createElement('link');
handwriting.rel = 'stylesheet';
handwriting.href = 'https://fonts.googleapis.com/css2?family=Gaegu:wght@400;700&display=swap';
document.head.append(handwriting);
const remoteStore =
  env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY
    ? SupabaseStore.create(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)
    : null;

export default function NormalApp() {
  return remoteStore ? (
    <SupabaseGate store={remoteStore}>
      <App store={remoteStore} />
    </SupabaseGate>
  ) : (
    <App store={localStore} />
  );
}
