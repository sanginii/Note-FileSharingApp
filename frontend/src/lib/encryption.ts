/**
 * Client-side encryption using Web Crypto API (AES-256-GCM)
 * All encryption happens before data leaves the device
 */

export interface EncryptionResult {
  encryptedData: string; // Base64
  iv: string; // Base64
  authTag: string; // Base64
  key: string; // Base64 - the encryption key (should be shared securely)
}

/**
 * Generate a random encryption key
 */
export async function generateKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data using AES-256-GCM
 */
export async function encrypt(data: string | ArrayBuffer): Promise<EncryptionResult> {
  const key = await generateKey();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
  
  const dataArray = typeof data === 'string' 
    ? new TextEncoder().encode(data) 
    : data;

  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      tagLength: 128, // 128-bit authentication tag
    },
    key,
    dataArray
  );

  // Extract the encrypted data and auth tag
  // In GCM, the auth tag is appended to the ciphertext
  const authTagLength = 16; // 128 bits = 16 bytes
  const encryptedData = encrypted.slice(0, encrypted.byteLength - authTagLength);
  const authTag = encrypted.slice(encrypted.byteLength - authTagLength);

  // Export the key
  const exportedKey = await crypto.subtle.exportKey('raw', key);

  return {
    encryptedData: arrayBufferToBase64(encryptedData),
    iv: arrayBufferToBase64(iv),
    authTag: arrayBufferToBase64(authTag),
    key: arrayBufferToBase64(exportedKey),
  };
}

/**
 * Decrypt data using AES-256-GCM
 */
export async function decrypt(
  encryptedData: string,
  iv: string,
  authTag: string,
  keyBase64: string
): Promise<string | ArrayBuffer> {
  const keyData = base64ToArrayBuffer(keyBase64);
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  const ivArray = base64ToArrayBuffer(iv);
  const encryptedArray = base64ToArrayBuffer(encryptedData);
  const tagArray = base64ToArrayBuffer(authTag);

  // Combine encrypted data and auth tag for GCM decryption
  const combined = new Uint8Array(encryptedArray.byteLength + tagArray.byteLength);
  combined.set(new Uint8Array(encryptedArray), 0);
  combined.set(new Uint8Array(tagArray), encryptedArray.byteLength);

  try {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivArray,
        tagLength: 128,
      },
      key,
      combined
    );

    // Try to decode as text, if it fails, return as ArrayBuffer
    try {
      return new TextDecoder().decode(decrypted);
    } catch {
      return decrypted;
    }
  } catch (error) {
    throw new Error('Decryption failed. The data may be corrupted or the key is incorrect.');
  }
}

/**
 * Convert ArrayBuffer to Base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  try {
    // Clean the base64 string (remove any whitespace or invalid characters)
    const cleanedBase64 = base64.replace(/[^A-Za-z0-9+/=]/g, '');
    const binary = atob(cleanedBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  } catch (error) {
    throw new Error(`Invalid base64 string: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convert File to ArrayBuffer
 */
export async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}


