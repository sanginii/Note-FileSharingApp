import crypto from 'crypto';

const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

/**
 * Hash a password using PBKDF2
 */
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
  return { hash, salt };
}

/**
 * Verify a password against a hash and salt
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const hashToVerify = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
  return hash === hashToVerify;
}


