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
      name: "AES-GCM",
      length: 256,
    },
    true, // extractable
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt data using AES-256-GCM
 */
export async function encrypt(
  data: string | ArrayBuffer
): Promise<EncryptionResult> {
  const key = await generateKey();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM

  const dataArray =
    typeof data === "string" ? new TextEncoder().encode(data) : data;

  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
      tagLength: 128,
    },
    key,
    dataArray
  );

  // Split ciphertext and auth tag
  const authTagLength = 16; // 128 bits
  const encryptedData = encrypted.slice(
    0,
    encrypted.byteLength - authTagLength
  );
  const authTag = encrypted.slice(encrypted.byteLength - authTagLength);

  // Export key
  const exportedKey = await crypto.subtle.exportKey("raw", key);

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
    "raw",
    keyData,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  const ivArray = base64ToArrayBuffer(iv);
  const encryptedArray = base64ToArrayBuffer(encryptedData);
  const tagArray = base64ToArrayBuffer(authTag);

  // Combine ciphertext + auth tag
  const combined = new Uint8Array(
    encryptedArray.byteLength + tagArray.byteLength
  );
  combined.set(new Uint8Array(encryptedArray), 0);
  combined.set(new Uint8Array(tagArray), encryptedArray.byteLength);

  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: ivArray, tagLength: 128 },
      key,
      combined.buffer
    );

    try {
      return new TextDecoder().decode(decrypted);
    } catch {
      return decrypted;
    }
  } catch {
    throw new Error(
      "Decryption failed. Data may be corrupted or key is incorrect."
    );
  }
}

/**
 * Convert ArrayBuffer or TypedArray to Base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const cleaned = base64.replace(/[^A-Za-z0-9+/=]/g, "");
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
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
