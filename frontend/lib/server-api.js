/**
 * Server-side API utilities
 * This file contains API helpers that are safe to use in API routes and server components
 * It avoids importing client-side dependencies like React context
 */

// Use the ElizaOS backend URL for API requests
export const API_PREFIX = "https://crossmind.reponchain.com/api";

/**
 * Server-side fetch wrapper
 * @param {string} url - Relative or absolute URL to fetch
 * @param {object} options - Fetch options
 * @returns {Promise<any>} - JSON response
 */
export async function serverFetch(url, options = {}) {
  try {
    // Determine if URL is absolute or needs API_PREFIX
    const fullUrl = url.startsWith('http') ? url : `${API_PREFIX}${url}`;
    
    // Set default headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers || {}
    };
    
    const response = await fetch(fullUrl, {
      ...options,
      headers
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error ${response.status}: ${errorText}`);
    }
    
    // Try to parse JSON response, fall back to text if not JSON
    try {
      return await response.json();
    } catch (e) {
      return await response.text();
    }
  } catch (error) {
    console.error('Server API error:', error);
    throw error;
  }
}

/**
 * Submit a message to the messaging system
 * @param {object} data - Message data
 * @returns {Promise<object>} - Response data
 */
export async function submitMessage(data) {
  return serverFetch('/messaging/submit', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}
