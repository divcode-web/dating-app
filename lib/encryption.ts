/**
 * Simple message encryption using Web Crypto API
 * This provides basic encryption for messages
 * For production, consider using more robust solutions like Signal Protocol
 */

const ENCRYPTION_KEY_NAME = 'dating-app-encryption-key';

// Generate or retrieve encryption key
async function getEncryptionKey(): Promise<CryptoKey> {
  // In a real app, you'd want to derive this from user's password or use a more secure method
  // This is a simplified version for demonstration
  const keyData = new TextEncoder().encode(
    process.env.NEXT_PUBLIC_ENCRYPTION_SECRET || 'default-encryption-key-change-me'
  );

  // Hash the key data to get a proper 256-bit key
  const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);

  return crypto.subtle.importKey(
    'raw',
    hashBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a message
 */
export async function encryptMessage(message: string): Promise<string> {
  try {
    const key = await getEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12)); // Initialization vector
    const encodedMessage = new TextEncoder().encode(message);

    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encodedMessage
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedData), iv.length);

    // Convert to base64 for storage
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption error:', error);
    // Fallback: return original message if encryption fails
    return message;
  }
}

/**
 * Decrypt a message
 */
export async function decryptMessage(encryptedMessage: string): Promise<string> {
  try {
    const key = await getEncryptionKey();

    // Convert from base64
    const combined = Uint8Array.from(atob(encryptedMessage), c => c.charCodeAt(0));

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);

    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encryptedData
    );

    return new TextDecoder().decode(decryptedData);
  } catch (error) {
    console.error('Decryption error:', error);
    // Fallback: return encrypted message if decryption fails
    return encryptedMessage;
  }
}

/**
 * Check if a message is encrypted (simple heuristic)
 */
export function isEncrypted(message: string): boolean {
  // Encrypted messages will be base64 encoded
  try {
    return /^[A-Za-z0-9+/]+=*$/.test(message) && message.length > 20;
  } catch {
    return false;
  }
}
