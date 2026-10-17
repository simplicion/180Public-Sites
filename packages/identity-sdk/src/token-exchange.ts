'use strict';

export interface TokenExchangeParams {
  tokenEndpoint: string;
  clientId: string;
  clientSecret?: string;
  code: string;
  redirectUri: string;
  codeVerifier?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  id_token?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

export interface RefreshTokenParams {
  tokenEndpoint: string;
  clientId: string;
  clientSecret?: string;
  refreshToken: string;
  scope?: string;
}

export class TokenExchangeClient {
  /**
   * Exchange authorization code for tokens (supports PKCE and Confidential Secret)
   */
  static async exchangeCode(params: TokenExchangeParams): Promise<TokenResponse> {
    const body: Record<string, string> = {
      grant_type: 'authorization_code',
      client_id: params.clientId,
      code: params.code,
      redirect_uri: params.redirectUri,
    };

    if (params.clientSecret) {
      body.client_secret = params.clientSecret;
    }

    if (params.codeVerifier) {
      body.code_verifier = params.codeVerifier;
    }

    const res = await fetch(params.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data: TokenResponse = await res.json();
    if (!res.ok) {
      throw new Error(data.error_description || data.error || `Token exchange failed with status ${res.status}`);
    }

    return data;
  }

  /**
   * Perform silent token refresh before 15-minute access token expiration
   */
  static async refreshToken(params: RefreshTokenParams): Promise<TokenResponse> {
    const body: Record<string, string> = {
      grant_type: 'refresh_token',
      client_id: params.clientId,
      refresh_token: params.refreshToken,
    };

    if (params.clientSecret) {
      body.client_secret = params.clientSecret;
    }

    if (params.scope) {
      body.scope = params.scope;
    }

    const res = await fetch(params.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data: TokenResponse = await res.json();
    if (!res.ok) {
      throw new Error(data.error_description || data.error || `Silent token refresh failed with status ${res.status}`);
    }

    return data;
  }
}

export interface ExchangeAuthCodeOptions {
  tokenEndpoint?: string;
  userInfoEndpoint?: string;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  codeVerifier?: string;
}

/**
 * 1-line turnkey helper to exchange authorization code for verified user profile and tokens.
 */
export async function exchangeAuthCode(
  code: string,
  options?: ExchangeAuthCodeOptions
): Promise<{ user: any; tokens: TokenResponse }> {
  const tokenEndpoint = options?.tokenEndpoint || 'https://api.180core.cloud/api/oauth/token';
  const userInfoEndpoint = options?.userInfoEndpoint || 'https://api.180core.cloud/api/oauth/userinfo';
  const clientId =
    options?.clientId ||
    (typeof process !== 'undefined' ? process.env.ONE_EIGHTY_CLIENT_ID || process.env.NEXT_PUBLIC_180_CLIENT_ID : '') ||
    '';
  const clientSecret =
    options?.clientSecret ||
    (typeof process !== 'undefined' ? process.env.ONE_EIGHTY_CLIENT_SECRET : '') ||
    '';
  const redirectUri = options?.redirectUri || '';

  const tokens = await TokenExchangeClient.exchangeCode({
    tokenEndpoint,
    clientId,
    clientSecret,
    code,
    redirectUri,
    codeVerifier: options?.codeVerifier,
  });

  let user: any = null;
  if (tokens.access_token) {
    try {
      const userRes = await fetch(userInfoEndpoint, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (userRes.ok) {
        user = await userRes.json();
      }
    } catch (e) {
      // Fallback to token response user
    }
  }

  return {
    user: user || (tokens as any).user || null,
    tokens,
  };
}
