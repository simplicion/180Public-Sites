'use strict';

import crypto from 'crypto';

export interface VerifyWebhookInput {
  rawBody: string;
  signature: string;
  timestamp: string;
  secret: string;
  toleranceSeconds?: number;
}

export interface CouponValidateInput {
  appId: string;
  code: string;
  orderAmount: number;
  customerEmail?: string;
  origin?: string;
}

export interface CreatePaymentLinkSdkInput {
  title: string;
  amount: number;
  currency?: string;
  customSlug?: string;
  collectPhone?: boolean;
  collectAddress?: boolean;
  allowCoupons?: boolean;
  redirectUrl?: string;
  fulfillmentMessage?: string;
  fulfillmentFileUrl?: string;
  maxPurchases?: number;
  metadata?: Record<string, any>;
}

export interface CreatePortalSessionSdkInput {
  appId: string;
  customerEmail: string;
  returnUrl: string;
  externalCustomerId?: string;
}

export interface AgentPurchaseSdkInput {
  agentKey: string;
  appId: string;
  amount: number;
  currency?: string;
  title?: string;
  planId?: string;
  idempotencyKey?: string;
  metadata?: Record<string, any>;
}

export interface OneEightyPaymentCapturedData {
  orderId?: string;
  order_id?: string;
  sessionId: string;
  session_id?: string;
  transactionId?: string;
  transaction_id?: string;
  amount: number;
  currency: string;
  customerEmail?: string;
  customer_email?: string;
  customerPhone?: string;
  customer_phone?: string;
  customerName?: string;
  metadata?: Record<string, any>;
  planCode?: string;
  createdAt?: string;
}

export interface OneEightySubscriptionCreatedData {
  subscriptionId: string;
  planCode: string;
  amount: number;
  currency: string;
  customerEmail: string;
  currentPeriodEnd: string;
  metadata?: Record<string, any>;
}

export interface OneEightySubscriptionRenewedData {
  subscriptionId: string;
  amount: number;
  currency: string;
  nextBillingDate: string;
  transactionId?: string;
}

export interface OneEightySubscriptionCancelledData {
  subscriptionId: string;
  planCode?: string;
  cancelReason?: string;
  currentPeriodEnd: string;
}

export interface OneEightyCouponRedeemedData {
  couponCode: string;
  discountAmount: number;
  sessionId: string;
}

export interface OneEightyUserRevokedData {
  userId: string;
  appId: string;
  revokedAt: string;
}

export type OneEightyWebhookEventType =
  | 'payment.captured'
  | 'subscription.created'
  | 'subscription.renewed'
  | 'subscription.cancelled_by_customer'
  | 'coupon.redeemed'
  | 'identity.user.revoked'
  | string;

export interface OneEightyWebhookEvent<T = any> {
  id?: string;
  event: OneEightyWebhookEventType;
  timestamp: number | string;
  data: T;
}

/**
 * Sovereign 180 Pay Server Utilities & Webhook Verification
 */
export class Sovereign180Pay {
  /**
   * Cryptographically verifies an incoming webhook from 180 Pay.
   * Defends against replay attacks, timing leaks, and payload tampering.
   */
  static verifyWebhookSignature(input: VerifyWebhookInput): boolean {
    const { rawBody, signature, timestamp, secret, toleranceSeconds = 300 } = input;

    if (!rawBody || !signature || !timestamp || !secret) {
      return false;
    }

    // Replay attack check (5-minute tolerance default)
    const currentTime = Math.floor(Date.now() / 1000);
    const parsedTimestamp = parseInt(timestamp, 10);
    if (isNaN(parsedTimestamp) || Math.abs(currentTime - parsedTimestamp) > toleranceSeconds) {
      return false;
    }

    const signPayload = `${timestamp}.${rawBody}`;
    const expected = crypto.createHmac('sha256', secret).update(signPayload).digest('hex');

    const bufA = Buffer.from(expected);
    const bufB = Buffer.from(signature);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  }
}

/**
 * 1-line turnkey helper to verify and parse incoming 180 Pay Webhook events.
 * Defends against replay attacks, timing leaks, buffer length mismatches, and payload tampering.
 */
export function constructWebhookEvent(
  rawBody: string,
  signature: string | string[] | undefined,
  secret: string,
  timestamp: string | string[] | undefined,
  toleranceSeconds: number = 300
): OneEightyWebhookEvent {
  const sig = Array.isArray(signature) ? signature[0] : signature;
  const ts = Array.isArray(timestamp) ? timestamp[0] : timestamp;

  if (!rawBody || typeof rawBody !== 'string') {
    throw new Error('[180 Pay Webhook] rawBody must be a non-empty string. Ensure your server preserves raw body bytes before parsing.');
  }
  if (!sig) {
    throw new Error('[180 Pay Webhook] Missing x-180-signature header.');
  }
  if (!ts) {
    throw new Error('[180 Pay Webhook] Missing x-180-timestamp header.');
  }
  if (!secret) {
    throw new Error('[180 Pay Webhook] Missing ONE_EIGHTY_WEBHOOK_SECRET.');
  }

  const isValid = Sovereign180Pay.verifyWebhookSignature({
    rawBody,
    signature: sig,
    timestamp: ts,
    secret,
    toleranceSeconds,
  });

  if (!isValid) {
    throw new Error('[180 Pay Webhook] Invalid webhook signature or timestamp expired (replay attack defense).');
  }

  try {
    const parsed = JSON.parse(rawBody);
    return {
      id: parsed.id,
      event: parsed.event || parsed.type,
      timestamp: parsed.timestamp || ts,
      data: parsed.data || parsed,
    };
  } catch (err: any) {
    throw new Error(`[180 Pay Webhook] Failed to parse webhook JSON payload: ${err.message}`);
  }
}

/**
 * 180 Pay Server Client for 3rd-Party Backend Integrations
 */
export class Sovereign180PayClient {
  private clientId: string;
  private clientSecret: string;
  private baseUrl: string;

  constructor(config: { clientId: string; clientSecret: string; baseUrl?: string }) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.baseUrl = (config.baseUrl || 'https://api.180core.cloud').replace(/\/+$/, '');
  }

  get webhooks() {
    return {
      verifySignature: (input: Omit<VerifyWebhookInput, 'secret'> & { secret?: string }) => {
        return Sovereign180Pay.verifyWebhookSignature({
          ...input,
          secret: input.secret || this.clientSecret,
        });
      },
    };
  }

  get coupons() {
    return {
      validate: async (input: CouponValidateInput) => {
        const res = await fetch(`${this.baseUrl}/api/v1/coupons/validate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(input.origin ? { Origin: input.origin } : {}),
          },
          body: JSON.stringify(input),
        });
        return await res.json();
      },
    };
  }

  get paymentLinks() {
    return {
      create: async (appId: string, input: CreatePaymentLinkSdkInput, bearerToken?: string) => {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (bearerToken) {
          headers['Authorization'] = `Bearer ${bearerToken}`;
        }
        const res = await fetch(`${this.baseUrl}/api/v1/payment-links/apps/${appId}`, {
          method: 'POST',
          headers,
          body: JSON.stringify(input),
        });
        return await res.json();
      },
      getPublic: async (slug: string) => {
        const res = await fetch(`${this.baseUrl}/api/v1/payment-links/public/${slug}`);
        return await res.json();
      },
    };
  }

  get portal() {
    return {
      createSession: async (input: CreatePortalSessionSdkInput) => {
        const res = await fetch(`${this.baseUrl}/api/v1/portal/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });
        return await res.json();
      },
      getData: async (token: string) => {
        const res = await fetch(`${this.baseUrl}/api/v1/portal/data?token=${encodeURIComponent(token)}`);
        return await res.json();
      },
    };
  }

  get agents() {
    return {
      purchase: async (input: AgentPurchaseSdkInput) => {
        const res = await fetch(`${this.baseUrl}/api/v1/checkout/agent-purchase`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-180-Agent-Key': input.agentKey,
            ...(input.idempotencyKey ? { 'Idempotency-Key': input.idempotencyKey } : {}),
          },
          body: JSON.stringify(input),
        });
        return await res.json();
      },
    };
  }
}
