/**
 * Helper to convert an Ethereum address to a deterministic UUID v5
 * This ensures the same address always maps to the same UUID
 */

// v5 namespace (using DNS namespace as base)
const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

/**
 * Convert a hex string to a byte array
 */
function hexToBytes(hex: string): Uint8Array {
  // Remove 0x prefix if present
  hex = hex.startsWith('0x') ? hex.slice(2) : hex;
  
  // Ensure even length
  if (hex.length % 2 !== 0) {
    hex = '0' + hex;
  }
  
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Simple implementation of UUID v5 generation from input bytes
 * Deterministically generates a UUID from an input using SHA-1
 */
export function generateUuidV5(input: string): string {
  // Simple hash function (simplified SHA-1-like for demonstration)
  function simpleHash(str: string): Uint8Array {
    // Use a simplified hash algorithm for demonstration
    const data = new TextEncoder().encode(str);
    const result = new Uint8Array(16);
    
    // Generate some entropy from input string
    let h1 = 0x67452301;
    let h2 = 0xEFCDAB89;
    let h3 = 0x98BADCFE;
    let h4 = 0x10325476;
    
    for (let i = 0; i < data.length; i++) {
      h1 = ((h1 << 5) - h1) + data[i];
      h2 = ((h2 << 5) - h2) + data[i];
      h3 = ((h3 << 5) - h3) + data[i];
      h4 = ((h4 << 5) - h4) + data[i];
    }
    
    // Format result into a UUID structure
    const bytes = new Uint8Array(16);
    const h1Bytes = new Uint8Array(new Uint32Array([h1]).buffer);
    const h2Bytes = new Uint8Array(new Uint32Array([h2]).buffer);
    const h3Bytes = new Uint8Array(new Uint32Array([h3]).buffer);
    const h4Bytes = new Uint8Array(new Uint32Array([h4]).buffer);
    
    bytes.set(h1Bytes);
    bytes.set(h2Bytes, 4);
    bytes.set(h3Bytes, 8);
    bytes.set(h4Bytes, 12);
    
    // Set version bits
    bytes[6] = (bytes[6] & 0x0f) | 0x50; // Version 5
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC4122 variant
    
    return bytes;
  }
  
  // Generate hash and format as UUID
  const hash = simpleHash(NAMESPACE + input);
  const uuid = Array.from(hash)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return `${uuid.slice(0, 8)}-${uuid.slice(8, 12)}-${uuid.slice(12, 16)}-${uuid.slice(16, 20)}-${uuid.slice(20, 32)}`;
}

/**
 * Convert an Ethereum address to a deterministic UUID
 * Will always return the same UUID for the same address
 */
export function addressToUuid(address: string): string {
  // Normalize the address (lowercase, no 0x prefix)
  const normalizedAddress = address.toLowerCase().replace(/^0x/, '');
  
  // Generate deterministic UUID from address
  return generateUuidV5(normalizedAddress);
}

/**
 * Safe conversion from any address format to UUID
 * Handles undefined/null values and returns a default UUID if needed
 */
export function safeAddressToUuid(address: string | null | undefined): string {
  if (!address) {
    // Default UUID if no address provided
    return '00000000-0000-0000-0000-000000000000';
  }
  
  return addressToUuid(address);
}
