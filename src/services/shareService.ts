import type { Project } from '../core/types';
import { parseSerializedProject, serializeProject } from './storageService';

export const SHARE_HASH_PREFIX = '#project=';
export const SHARE_HASH_WARNING_BYTES = 8 * 1024;

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlToBytes(encoded: string): Uint8Array | null {
  if (!encoded || !/^[A-Za-z0-9_-]+$/.test(encoded)) return null;

  try {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const binary = atob(padded);
    return Uint8Array.from(binary, character => character.charCodeAt(0));
  } catch {
    return null;
  }
}

async function transformBytes(
  bytes: Uint8Array,
  transform: CompressionStream | DecompressionStream,
): Promise<Uint8Array> {
  const input = new Blob([bytes as BlobPart]).stream();
  const output = input.pipeThrough(transform);
  return new Uint8Array(await new Response(output).arrayBuffer());
}

export async function encodeProjectToHash(project: Project): Promise<string> {
  const serialized = new TextEncoder().encode(serializeProject(project));
  const compressed = await transformBytes(serialized, new CompressionStream('gzip'));
  return `${SHARE_HASH_PREFIX}${bytesToBase64Url(compressed)}`;
}

export async function decodeProjectFromHash(hash: string): Promise<Project | null> {
  if (!hash.startsWith(SHARE_HASH_PREFIX)) return null;

  const compressed = base64UrlToBytes(hash.slice(SHARE_HASH_PREFIX.length));
  if (!compressed) return null;

  try {
    const serialized = await transformBytes(compressed, new DecompressionStream('gzip'));
    return parseSerializedProject(new TextDecoder().decode(serialized));
  } catch {
    return null;
  }
}

export function getHashByteLength(hash: string): number {
  return new TextEncoder().encode(hash).byteLength;
}

export function isShareHashOversized(hash: string): boolean {
  return getHashByteLength(hash) > SHARE_HASH_WARNING_BYTES;
}

