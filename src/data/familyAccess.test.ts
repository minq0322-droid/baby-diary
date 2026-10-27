import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { enterFamily, generateToken, hashToken, inviteFailure, makeInvite } from './familyAccess';
import { pwaPaths } from '../lib/pwaPaths';
const membership = { user_id: 'device', family_id: 'family', member_id: 'mom', role: 'writer' };
function fake(initialSession: boolean, joined = true) {
  const order: string[] = [];
  const session = { user: { id: 'device' } };
  const client = {
    auth: {
      getSession: vi.fn(async () => { order.push('session'); return { data: { session: initialSession ? session : null }, error: null }; }),
      signInAnonymously: vi.fn(async () => { order.push('anonymous'); return { data: { session }, error: null }; }),
    },
    rpc: vi.fn(async () => { order.push('join'); return { data: joined ? 'family' : null, error: null }; }),
    from: vi.fn(() => ({ select: () => ({ eq: () => ({ maybeSingle: async () => { order.push('member'); return { data: membership, error: null }; } }) }) })),
  };
  return { client, order, sdk: client as unknown as SupabaseClient };
}
const location = { hash: '#join=secret', pathname: '/baby-diary/', search: '?from=family' };
describe('anonymous invite access', () => {
  it('hashes SHA-256 without uploading the token', async () => {
    expect(await hashToken('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    const token = generateToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(generateToken()).not.toBe(token);
  });
  it('goes from no session to anonymous to join to membership and removes the fragment', async () => {
    const server = fake(false);
    const remove = vi.fn();
    expect(await enterFamily(server.sdk, location, remove)).toEqual({ userId: 'device', membership });
    expect(server.order).toEqual(['session', 'anonymous', 'join', 'member']);
    expect(server.client.rpc).toHaveBeenCalledWith('join_family', { p_token: 'secret' });
    expect(remove).toHaveBeenCalledWith('/baby-diary/?from=family');
  });
  it('reuses an existing device session and checks membership without a token', async () => {
    const server = fake(true);
    await enterFamily(server.sdk, { ...location, hash: '' }, vi.fn());
    expect(server.order).toEqual(['session', 'member']);
    expect(server.client.auth.signInAnonymously).not.toHaveBeenCalled();
  });
  it('returns no family for an anonymous visitor without an invite', async () => {
    const server = fake(false);
    server.client.from.mockReturnValue({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null as unknown as typeof membership, error: null }) }) }) });
    expect((await enterFamily(server.sdk, { ...location, hash: '' }, vi.fn())).membership).toBeNull();
    expect(server.client.rpc).not.toHaveBeenCalled();
  });
  it('shows the calm invite message on invalid, revoked, or rate-limited joins', async () => {
    const server = fake(false, false);
    await expect(enterFamily(server.sdk, location, vi.fn())).rejects.toThrow(inviteFailure);
    expect(server.order).toEqual(['session', 'anonymous', 'join']);
  });
  it('revoke removes old invites and devices for the target, keeping the caller, then creates only a hashed replacement', async () => {
    const invites = [{ member: 'mom', revoked: false }, { member: 'dad', revoked: false }];
    let devices = [{ id: 'caller', member: 'dad' }, { id: 'old-dad', member: 'dad' }, { id: 'wife', member: 'mom' }];
    const calls: string[] = [];
    const rpc = vi.fn(async (name: string, args: Record<string, string>) => {
      calls.push(name);
      if (name === 'revoke_invites') {
        invites.forEach((item) => { if (item.member === args.p_member_id)
          item.revoked = true; });
        devices = devices.filter((item) => item.member !== args.p_member_id || item.id === 'caller');
      }
      return { data: null, error: null };
    });
    const link = await makeInvite({ rpc } as unknown as SupabaseClient, 'dad', true);
    expect(calls).toEqual(['revoke_invites', 'create_invite']);
    expect(devices.map((item) => item.id)).toEqual(['caller', 'wife']);
    expect(invites.map((item) => item.revoked)).toEqual([false, true]);
    const token = link.split('#join=')[1];
    expect(link).toMatch(/^https:\/\/minq0322-droid.github.io\/baby-diary\/#join=/);
    expect(rpc).toHaveBeenLastCalledWith('create_invite', { p_member_id: 'dad', p_token_hash: await hashToken(token) });
    expect(JSON.stringify(rpc.mock.calls)).not.toContain(token);
  });
  it('does not create a replacement when revocation fails', async () => {
    const rpc = vi.fn(async () => ({ error: new Error('not_granted') }));
    await expect(makeInvite({ rpc } as unknown as SupabaseClient, 'mom', true)).rejects.toThrow('not_granted');
    expect(rpc).toHaveBeenCalledTimes(1);
  });
  it('sets the Pages base, manifest start URL, scope, and icon consistently', () => {
    expect(pwaPaths(true)).toEqual({ base: '/baby-diary/', start_url: '/baby-diary/', scope: '/baby-diary/', icon: '/baby-diary/icon.svg' });
    expect(pwaPaths(false).base).toBe('/');
  });
});
