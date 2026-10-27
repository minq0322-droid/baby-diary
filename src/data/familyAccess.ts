import type { SupabaseClient } from '@supabase/supabase-js';

export type FamilyMembership = {
  user_id: string;
  family_id: string;
  member_id: 'dad' | 'mom' | 'reader';
  role: 'owner' | 'writer' | 'reader';
};
export const inviteFailure = '이 초대 링크는 더 이상 쓸 수 없어요. 가족에게 새 링크를 받아 주세요';
export const inviteRequired = '가족 초대 링크로 들어와 주세요';
export const familyAppUrl = 'https://minq0322-droid.github.io/baby-diary/';

export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(token),
  );
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
export function generateToken(): string {
  return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
export async function loadMembership(client: SupabaseClient, userId: string) {
  const { data, error } = await client.from('family_members').select('*')
    .eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data as FamilyMembership | null;
}
/** Session -> anonymous identity -> optional invite -> verified membership. */
export async function enterFamily(
  client: SupabaseClient,
  location: Pick<Location, 'hash' | 'pathname' | 'search'>,
  removeHash: (url: string) => void,
): Promise<{ userId: string; membership: FamilyMembership | null }> {
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  let session = data.session;
  if (!session) {
    const result = await client.auth.signInAnonymously();
    if (result.error) throw result.error;
    session = result.data.session;
  }
  if (!session) throw new Error('연결을 확인하고 다시 시도해 주세요.');
  const params = new URLSearchParams(location.hash.replace(/^#/, ''));
  if (params.has('join')) {
    const result = await client.rpc('join_family', { p_token: params.get('join') ?? '' });
    // Keep every failed invite behind the same calm access screen.
    if (result.error) throw new Error(inviteFailure);
    removeHash(location.pathname + location.search);
    if (!result.data) throw new Error(inviteFailure);
  }
  return { userId: session.user.id, membership: await loadMembership(client, session.user.id) };
}
export async function makeInvite(client: SupabaseClient, memberId: string, replace = false) {
  if (replace) {
    const { error } = await client.rpc('revoke_invites', { p_member_id: memberId });
    if (error) throw error;
  }
  const token = generateToken();
  const { error } = await client.rpc('create_invite', {
    p_member_id: memberId,
    p_token_hash: await hashToken(token),
  });
  if (error) throw error;
  return familyAppUrl + '#join=' + token;
}
