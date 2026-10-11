---
id: ai-master-prompt
title: Master AI Integration Prompt
sidebar_label: 1-Click AI Master Prompt
sidebar_position: 2
description: Copy-paste master AI integration prompt to automatically integrate 180 Identity and 180 Pay using ChatGPT, Claude, Cursor, or Antigravity into any independent application.
---

# 🤖 Master AI Integration Prompt

Integrate **180 Identity** and **180 Pay** into any independent application in under 2 minutes. Copy the master prompt below, replace the bracketed placeholders (`YOUR_CLIENT_ID`, `YOUR_CLIENT_SECRET`, `YOUR_WEBHOOK_SECRET`) with your credentials from the [180 Developer Console](https://developer.180core.cloud), and paste it directly into **Cursor, Claude 3.5 Sonnet, ChatGPT, Antigravity, or GitHub Copilot**.

:::tip Zero-Friction In-DOM Bottom Sheet
180 Core has simplified single-application integration. By using `uxMode: 'bottom_sheet'`, authentication renders directly inside your application's DOM via a responsive slide-up modal with zero browser popup blocker interference on mobile devices, automatic WhatsApp OTP verification, and instant redirection to your destination callback URL.
:::

---

## 📋 The Copy-Paste Master Prompt

```markdown
You are an expert senior full-stack engineer integrating 180 Core (180 Identity & 180 Pay) into my independent application.

Follow these strict, modern integration specifications:

### Application Credentials & Canonical Endpoints:
- CLIENT_ID: "YOUR_CLIENT_ID"
- CLIENT_SECRET: "YOUR_CLIENT_SECRET"
- WEBHOOK_SECRET: "YOUR_WEBHOOK_SECRET"
- CORE_API_URL: "https://api.180core.cloud"
- IDENTITY_AUTH_URL: "https://profile.180core.cloud"
- JWKS_KEYRING_URL: "https://api.180core.cloud/certs/jwks.json"
- DEVELOPER_CONSOLE_URL: "https://developer.180core.cloud"

---

### Integration Architecture Rules:
1. **In-DOM Bottom Sheet UX**: Always default to `uxMode: 'bottom_sheet'`. Do NOT rely on popup windows (`window.open`), which get blocked by Safari iOS, Chrome Mobile, and privacy browsers.
2. **Stateless Security**: Tokens are RS256 JWTs signed by 180 Sovereign Cloud. Verify them statelessly using the public JWKS Keyring (`https://api.180core.cloud/certs/jwks.json`) or perform RFC 6749 authorization code exchange on the backend.
3. **Decoupled Architecture**: Never expose `CLIENT_SECRET` or `WEBHOOK_SECRET` in client-side bundles.
4. **Automatic Post-Auth Redirect**: Upon successful authentication, close the sheet and smoothly navigate the user to their target callback URL (or dashboard).

---

### Step 1: Environment Configuration
Add the following variables to my `.env` (or `.env.local` / `.env.production`) file:
```env
# Public Client Configuration
NEXT_PUBLIC_180_CLIENT_ID=YOUR_CLIENT_ID
NEXT_PUBLIC_180_CORE_URL=https://api.180core.cloud
NEXT_PUBLIC_180_AUTH_URL=https://profile.180core.cloud

# Server-Only Confidential Secrets
ONE_EIGHTY_CLIENT_SECRET=YOUR_CLIENT_SECRET
ONE_EIGHTY_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET
```

---

### Step 2: Client-Side Integration (Choose NPM Package, CDN Script, or Web Component)

#### Option 2A: Official NPM SDK (`@workspace/identity-sdk`)
```bash
npm install @workspace/identity-sdk
```

```tsx
'use client';

import React, { useState } from 'react';
import { OneEightyAuth } from '@workspace/identity-sdk';

export function LoginButton({ redirectUrl = '/dashboard' }: { redirectUrl?: string }) {
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    OneEightyAuth.openBottomSheet({
      clientId: process.env.NEXT_PUBLIC_180_CLIENT_ID!,
      redirectUri: `${window.location.origin}/api/auth/callback`,
      scope: 'openid identity:read identity:email identity:phone',
      uxMode: 'bottom_sheet',
      onSuccess: async (data: { code: string; token?: string }) => {
        // Exchange code with backend
        const res = await fetch('/api/auth/exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: data.code }),
        });
        const result = await res.json();
        if (result.success) {
          window.location.href = redirectUrl;
        } else {
          setLoading(false);
          alert('Login verification failed: ' + result.error);
        }
      },
      onError: (err: any) => {
        console.error('180 Identity login failed:', err);
        setLoading(false);
      },
      onCancel: () => {
        setLoading(false);
      }
    });
  };

  return (
    <button
      onClick={handleLogin}
      disabled={loading}
      className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all flex items-center gap-2 shadow-xl shadow-indigo-600/25 active:scale-[0.98]"
    >
      <span>{loading ? 'Opening 180 Identity...' : 'Sign in with 180 Profile'}</span>
    </button>
  );
}
```

#### Option 2B: Pure HTML / CDN Script Tag (< 10 lines of code)
```html
<!-- Include official CDN script -->
<script src="https://profile.180core.cloud/sdk/v1/180-core-sdk.js" async></script>

<!-- Add button with delegated data attribute or click handler -->
<button id="180-login-btn">Sign in with 180</button>

<script>
  document.getElementById('180-login-btn').addEventListener('click', function () {
    window.OneEightyAuth.openBottomSheet({
      clientId: 'YOUR_CLIENT_ID',
      uxMode: 'bottom_sheet',
      scope: 'openid identity:read identity:email',
      onSuccess: function (data) {
        // Automatically redirects or invokes custom handler
        window.location.href = '/dashboard';
      }
    });
  });
</script>
```

#### Option 2C: Declarative Web Component
```html
<script src="https://profile.180core.cloud/sdk/v1/180-core-sdk.js" async></script>

<one-eighty-login-sheet 
  client-id="YOUR_CLIENT_ID" 
  button-text="Sign in with 180" 
  redirect-url="/dashboard">
</one-eighty-login-sheet>
```

---

### Step 3: Backend Token Exchange (Next.js / Node.js Express / Python FastAPI)

#### 3A: Next.js App Router (`app/api/auth/exchange/route.ts`)
```ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { code } = await req.json();
    if (!code) {
      return NextResponse.json({ success: false, error: 'Missing code' }, { status: 400 });
    }

    const tokenRes = await fetch(`${process.env.NEXT_PUBLIC_180_CORE_URL || 'https://api.180core.cloud'}/api/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.NEXT_PUBLIC_180_CLIENT_ID,
        client_secret: process.env.ONE_EIGHTY_CLIENT_SECRET,
        redirect_uri: `${new URL(req.url).origin}/api/auth/callback`,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      return NextResponse.json({ success: false, error: tokenData.error || 'Token exchange failed' }, { status: 400 });
    }

    // Fetch verified user profile
    const userRes = await fetch(`${process.env.NEXT_PUBLIC_180_CORE_URL || 'https://api.180core.cloud'}/api/oauth/userinfo`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const user = await userRes.json();

    // Create secure HTTP-only session cookie
    const response = NextResponse.json({ success: true, user });
    response.cookies.set({
      name: '180_session',
      value: tokenData.access_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
```

#### 3B: Python FastAPI Backend (`backend/auth.py`)
```python
from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel
import httpx
import os

router = APIRouter(prefix="/api/auth")

CORE_URL = os.getenv("NEXT_PUBLIC_180_CORE_URL", "https://api.180core.cloud")
CLIENT_ID = os.getenv("NEXT_PUBLIC_180_CLIENT_ID")
CLIENT_SECRET = os.getenv("ONE_EIGHTY_CLIENT_SECRET")

class ExchangeRequest(BaseModel):
    code: str

@router.post("/exchange")
async def exchange_token(payload: ExchangeRequest, response: Response):
    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            f"{CORE_URL}/api/oauth/token",
            json={
                "grant_type": "authorization_code",
                "code": payload.code,
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
            }
        )
        if token_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Token exchange failed")
        
        token_data = token_res.json()
        access_token = token_data["access_token"]
        
        user_res = await client.get(
            f"{CORE_URL}/api/oauth/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        user_data = user_res.json()
        
        response.set_cookie(
            key="180_session",
            value=access_token,
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=604800
        )
        return {"success": True, "user": user_data}
```

---

### Step 4: Stateless RS256 JWKS Verification (Zero Backend Network Round-Trip)
For microservices and edge workers, verify incoming Bearer tokens instantly using the public JWKS Keyring without making database calls:

```ts
import { createRemoteJWKSet, jwtVerify } from 'jose';

const JWKS = createRemoteJWKSet(
  new URL('https://api.180core.cloud/certs/jwks.json')
);

export async function verify180BearerToken(token: string) {
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: 'https://profile.180core.cloud',
    audience: process.env.NEXT_PUBLIC_180_CLIENT_ID,
  });
  return payload; // { sub: "usr_...", email: "...", phone: "..." }
}
```

---

### Step 5: 1-Click Payments via 180 Pay Drawer
```tsx
'use client';

import { OneEightyPay } from '@workspace/identity-sdk';

export function PricingUpgradeButton({ planCode = 'pro_plan', amount = 499 }) {
  const handleUpgrade = () => {
    OneEightyPay.openBottomSheet({
      amount,
      currency: 'INR',
      title: 'Pro Plan Upgrade',
      description: 'Instant sovereign checkout via 180 Pay',
      planCode,
      onSuccess: (res: any) => {
        alert('Payment confirmed! Transaction ID: ' + (res.transactionId || res.sessionId));
        window.location.reload();
      },
      onCancel: () => console.log('Payment modal dismissed'),
    });
  };

  return (
    <button onClick={handleUpgrade} className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold">
      Upgrade Plan (₹{amount})
    </button>
  );
}
```

---

### Step 6: HMAC SHA-256 Webhook Verification Route (`app/api/webhooks/180-pay/route.ts`)
```ts
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-180-signature');
    const timestamp = req.headers.get('x-180-timestamp');
    const webhookSecret = process.env.ONE_EIGHTY_WEBHOOK_SECRET;

    if (!signature || !timestamp || !webhookSecret) {
      return NextResponse.json({ error: 'Missing security headers' }, { status: 400 });
    }

    // 1. Replay attack defense (< 5 mins)
    const currentTime = Math.floor(Date.now() / 1000);
    const parsedTimestamp = parseInt(timestamp, 10);
    if (Math.abs(currentTime - parsedTimestamp) > 300) {
      return NextResponse.json({ error: 'Timestamp expired' }, { status: 401 });
    }

    // 2. Compute expected HMAC-SHA256 signature
    const signPayload = `${timestamp}.${rawBody}`;
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(signPayload)
      .digest('hex');

    // 3. Constant-time comparison
    const bufA = Buffer.from(signature);
    const bufB = Buffer.from(expectedSignature);
    if (bufA.length !== bufB.length || !crypto.timingSafeEqual(bufA, bufB)) {
      return NextResponse.json({ error: 'Invalid HMAC signature' }, { status: 401 });
    }

    // 4. Handle events & fulfill user entitlement
    const event = JSON.parse(rawBody);
    if (event.event === 'payment.captured' || event.event === 'subscription.created') {
      console.log('Fulfilling purchase for:', event.data.customerEmail);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

---

Now inspect my current codebase, detect the framework, and write the files cleanly matching my project's conventions.
```

---

## How to Use with Cursor or Antigravity

1. Open your project in **Cursor** or **Antigravity**.
2. Press `Cmd + L` (or `Ctrl + L`) to open the Composer / Chat window.
3. Paste the prompt above.
4. Replace `YOUR_CLIENT_ID`, `YOUR_CLIENT_SECRET`, and `YOUR_WEBHOOK_SECRET` with the credentials from your [180 Developer Console](https://developer.180core.cloud).
5. Watch the AI automatically generate all frontend components, backend handlers, and webhook verification routes in 30 seconds!
