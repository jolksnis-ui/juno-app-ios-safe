import { getUserData, getToken, clearAuthData } from '../services/secureStorage';

const API_BASE_URL = 'https://dev.junomoney.org/restapi';

// Custom error class for token expiration
export class TokenExpiredError extends Error {
  constructor(message: string = 'Token expired or invalid') {
    super(message);
    this.name = 'TokenExpiredError';
  }
}

interface APIRequestOptions {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  requiresAuth?: boolean;
  customHeaders?: Record<string, string>;
}

interface APIResponse<T = any> {
  data: T;
  status: number;
  headers: Headers;
}

export class APIClient {
  private static baseURL = API_BASE_URL;

  /**
   * Clear existing cookies before making requests
   */
  private static clearExistingCookies(): void {
    if (typeof document !== 'undefined') {
      // Clear all cookies for the domain
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
    }
  }

  /**
   * Get authentication data
   */
  private static async getAuthData() {
    const userData = await getUserData();
    const token = await getToken();
    
    if (!userData || !token) {
      await clearAuthData();
      throw new TokenExpiredError('Authentication required. Please login again.');
    }
    
    return { userData, token };
  }

  /**
   * Handle authentication errors (401, 403)
   */
  private static async handleAuthError(response: Response): Promise<void> {
    if (response.status === 401 || response.status === 403) {
      try {
        const errorData = await response.json();
        if (errorData.success === false && (errorData.message === 'Invalid Token' || response.status === 401)) {
          await clearAuthData();
          throw new TokenExpiredError('Session expired. Please login again.');
        }
      } catch (parseError) {
        // If JSON parsing fails, still handle 401/403 status
        if (response.status === 401 || response.status === 403) {
          await clearAuthData();
          throw new TokenExpiredError('Session expired. Please login again.');
        }
      }
    }
  }

  /**
   * Build request headers
   */
  private static buildHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-interface-type': 'web',
      ...customHeaders
    };

    return headers;
  }

  /**
   * Main request method
   */
  static async request<T = any>(options: APIRequestOptions): Promise<APIResponse<T>> {
    const {
      endpoint,
      method = 'POST',
      body,
      requiresAuth = true,
      customHeaders
    } = options;

    try {
      // Get authentication data if required
      let authData = null;
      if (requiresAuth) {
        authData = await this.getAuthData();
      }

      // Clear existing cookies to prevent duplication
      this.clearExistingCookies();

      // Build headers
      const headers = this.buildHeaders(customHeaders);

      // Build request URL
      const url = `${this.baseURL}${endpoint}`;

      // Make the request
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      // Handle authentication errors
      await this.handleAuthError(response);

      // Handle other HTTP errors
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${errorText}`);
      }

      // Parse response
      const data = await response.json();

      return {
        data,
        status: response.status,
        headers: response.headers
      };

    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Convenience method for GET requests
   */
  static async get<T = any>(
    endpoint: string, 
    options?: Partial<Omit<APIRequestOptions, 'endpoint' | 'method'>>
  ): Promise<APIResponse<T>> {
    return this.request<T>({ 
      ...options, 
      endpoint, 
      method: 'GET' 
    });
  }

  /**
   * Convenience method for POST requests
   */
  static async post<T = any>(
    endpoint: string, 
    body?: any, 
    options?: Partial<Omit<APIRequestOptions, 'endpoint' | 'method' | 'body'>>
  ): Promise<APIResponse<T>> {
    return this.request<T>({ 
      ...options, 
      endpoint, 
      method: 'POST', 
      body 
    });
  }

  /**
   * Convenience method for PUT requests
   */
  static async put<T = any>(
    endpoint: string, 
    body?: any, 
    options?: Partial<Omit<APIRequestOptions, 'endpoint' | 'method' | 'body'>>
  ): Promise<APIResponse<T>> {
    return this.request<T>({ 
      ...options, 
      endpoint, 
      method: 'PUT', 
      body 
    });
  }

  /**
   * Convenience method for DELETE requests
   */
  static async delete<T = any>(
    endpoint: string, 
    options?: Partial<Omit<APIRequestOptions, 'endpoint' | 'method'>>
  ): Promise<APIResponse<T>> {
    return this.request<T>({ 
      ...options, 
      endpoint, 
      method: 'DELETE' 
    });
  }
}
