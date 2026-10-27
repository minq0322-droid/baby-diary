// Public-repository backups contain only authenticated ciphertext.
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto';
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

export function encrypt(bytes, token) {
  const salt = randomBytes(32);
  const iv = randomBytes(12);
  const key = hkdfSync('sha256', Buffer.from(token), salt, 'baby-diary-backup-v1', 32);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(bytes), cipher.final()]);
  return Buffer.concat([Buffer.from('BD01'), salt, iv, cipher.getAuthTag(), encrypted]);
}
export function decrypt(bytes, token) {
  if (bytes.subarray(0, 4).toString() !== 'BD01') throw new Error('Invalid backup');
  const key = hkdfSync('sha256', Buffer.from(token), bytes.subarray(4, 36), 'baby-diary-backup-v1', 32);
  const cipher = createDecipheriv('aes-256-gcm', key, bytes.subarray(36, 48));
  cipher.setAuthTag(bytes.subarray(48, 64));
  return Buffer.concat([cipher.update(bytes.subarray(64)), cipher.final()]);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const token = process.env.BACKUP_JOIN_TOKEN;
  if (!token) throw new Error('BACKUP_JOIN_TOKEN is required');
  const [mode, source, target] = process.argv.slice(2);
  if (!source || !target) throw new Error('Usage: encrypt.mjs encrypt <directory> <file.enc> | decrypt <file.enc> <file.zip>');
  if (mode === 'decrypt') {
    await writeFile(target, decrypt(await readFile(source), token));
  } else if (mode === 'encrypt') {
    const zip = new JSZip();
    async function add(directory, prefix = '') {
      for (const item of await readdir(directory, { withFileTypes: true })) {
        const name = prefix + item.name;
        if (item.isDirectory()) await add(path.join(directory, item.name), name + '/');
        else if (item.isFile()) zip.file(name, await readFile(path.join(directory, item.name)));
      }
    }
    await add(source);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, encrypt(await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }), token));
  } else throw new Error('Unknown mode');
}
