---
id: sdk-reference
title: 180 Core SDK & Architecture Reference
sidebar_label: SDK & Architecture Reference
sidebar_position: 5
description: Complete SDK reference, authoritative dual-domain directory, NextAuth v5 provider, Flutter 3.24+ service, and framework integration guides.
---

# 180 Core SDK & Architecture Reference

The **180 Core SDK** (`180-core-sdk.js` / `@workspace/identity-sdk`) is a zero-dependency, high-performance client library that provides universal modal injection, RFC 7636 PKCE cryptographic security, responsive bottom-sheet viewports, and unified single sign-on across the 180 ecosystem.

---

## 1. Authoritative Architecture & Dual-Domain Directory

To avoid 404 errors, routing confusion, and CORS misconfigurations:

| Domain | Role & Purpose | Key Endpoints |
| :--- | :--- | :--- |
| **`auth.180workspace.com`**<br/>*(Mirror: `profile.180core.cloud`)* | **Hosted User Interfaces**<br/>(Universal SSO, 1-Click Checkout, CDN SDK script) | `GET /sdk/v1/180-core-sdk.js`<br/>`GET /auth/login`<br/>`GET /checkout` |
| **`api.180core.cloud`** | **Core OAuth & Token Engine**<br/>(RFC 6749 Auth Code Exchange, OIDC Profiles, 180 Pay APIs) | `POST /api/oauth/token`<br/>`GET /api/oauth/userinfo`<br/>`GET /certs/jwks.json` (RS256 Keyring)<br/>`POST /api/v1/pay/checkout-session` |
| **`developer.180core.cloud`** | **Developer Management Console** | Client Keys, Webhook URLs, Allowed Origins |

---

## 2. Global Namespaces & Window Aliases

When loaded via `<script src="https://profile.180core.cloud/sdk/v1/180-core-sdk.js"></script>`, the SDK attaches itself to the global `window` object:

```javascript
window.OneEighty         // Root instance: { auth, pay, ui, version, init, ... }
window.OneEightyCore     // Canonical alias for window.OneEighty
window.OneEightyAuth     // Canonical Auth service: { signIn, openBottomSheet, signOut, ... }
window.OneEightyIdentity // Alias for window.OneEightyAuth
window.OneEightyPay      // Universal Checkout service: { checkout, openBottomSheet, ... }
```

### Key Methods on `OneEightyIdentity` / `OneEightyAuth`:
```typescript
// Primary authentication trigger (opens in-DOM bottom sheet by default)
window.OneEightyIdentity.openBottomSheet(options): Promise<AuthResult | null>

// Modal / Popup fallback
window.OneEightyIdentity.openLoginPopup(options): Promise<AuthResult | null>
window.OneEightyIdentity.signIn(options): Promise<AuthResult | null>

// Session & profile helpers
window.OneEightyIdentity.signOut(): void
window.OneEightyIdentity.getUser(): UserProfile | null
window.OneEightyIdentity.getAccessToken(): string | null
```

---

## 3. Normalized OpenID Connect Claims Contract

The `/api/oauth/userinfo` endpoint and the decoded identity token return universally normalized OIDC claims to ensure zero schema breakages across databases (Prisma, Drizzle, etc.):

```typescript
export interface OneEightyUserProfile {
  /** RFC 7519 Subject Identifier */
  sub: string;
  id: string;

  /** Standard OIDC Profile Claims */
  name: string;
  preferred_username?: string;
  username?: string;
  email: string;
  email_verified?: boolean;

  /** Phone number normalization */
  phone_number?: string;
  phone?: string;
  phoneNumber?: string;
  phone_verified?: boolean;

  /** Avatar normalization */
  picture?: string;
  avatarUrl?: string;

  /** Multi-tenant metadata */
  companyId?: string | null;
  role?: string;

  /** Nested compatibility object */
  user?: {
    id: string;
    email: string;
    name: string;
    phone?: string;
    avatarUrl?: string;
  };
}
```

---

## 4. NextAuth.js (Auth.js v5) Custom Provider

Integrate 180 Identity directly into NextAuth.js applications:

```typescript
import NextAuth from 'next-auth';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    {
      id: '180-identity',
      name: '180 Identity',
      type: 'oauth',
      authorization: {
        url: 'https://auth.180workspace.com/auth/login',
        params: {
          scope: 'openid identity:read identity:email identity:phone',
          ux_mode: 'bottom_sheet'
        },
      },
      token: 'https://api.180core.cloud/api/oauth/token',
      userinfo: 'https://api.180core.cloud/api/oauth/userinfo',
      clientId: process.env.ONE_EIGHTY_CLIENT_ID,
      clientSecret: process.env.ONE_EIGHTY_CLIENT_SECRET,
      profile(profile) {
        return {
          id: profile.sub || profile.id,
          name: profile.name || profile.preferred_username,
          email: profile.email,
          image: profile.picture || profile.avatarUrl,
        };
      },
    },
  ],
});
```

---

## 5. Flutter 3.24+ / Dart 3.5+ Mobile SDK Service

A complete, production-ready Dart service class handling both Universal SSO and 180 Pay checkout:

```dart
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

class OneEightyIntegrationService {
  static const String hostedAuthUrl = 'https://auth.180workspace.com/auth/login';
  static const String hostedCheckoutUrl = 'https://auth.180workspace.com/checkout';

  /// Launch Universal 180 Identity SSO
  static Future<bool> launchHostedLogin({
    required String clientId,
    required String redirectUri,
    String scope = 'openid identity:read identity:email identity:phone',
  }) async {
    final uri = Uri.parse(hostedAuthUrl).replace(queryParameters: {
      'client_id': clientId,
      'redirect_uri': redirectUri,
      'response_type': 'code',
      'scope': scope,
      'ux_mode': 'bottom_sheet',
    });

    if (await canLaunchUrl(uri)) {
      return await launchUrl(uri, mode: LaunchMode.inAppBrowserView);
    }
    return false;
  }

  /// Launch 180 Pay Sovereign 1-Click Checkout
  static Future<bool> launchCheckout({
    required String orderId,
    required num amountInRupees, // WHOLE UNITS (e.g. 499 for ₹499)
    required String title,
    required String returnUrl,
    String currency = 'INR',
    String? clientId,
  }) async {
    final uri = Uri.parse(hostedCheckoutUrl).replace(queryParameters: {
      'amount': amountInRupees.toString(),
      'currency': currency,
      'title': title,
      'order_id': orderId,
      'return_url': returnUrl,
      if (clientId != null) 'clientId': clientId,
    });

    if (await canLaunchUrl(uri)) {
      return await launchUrl(uri, mode: LaunchMode.inAppBrowserView);
    }
    return false;
  }
}
```

---

## 6. Python (FastAPI) Token Verification with PyJWKClient

Verify RS256 Bearer tokens statelessly without remote database calls:

```python
import jwt
from jwt import PyJWKClient
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

app = FastAPI()
security = HTTPBearer()

JWKS_URL = "https://api.180core.cloud/certs/jwks.json"
jwks_client = PyJWKClient(JWKS_URL)

async def verify_180_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        data = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={"verify_aud": False}
        )
        return data # Contains sub, email, name, phone_number
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: {str(e)}"
        )

@app.get("/api/protected-profile")
async def get_profile(user: dict = Depends(verify_180_token)):
    return {"status": "authenticated", "user": user}
```
