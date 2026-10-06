export type PromoCodeType = "Referral" | "Coupon";

export interface PromoCode {
  id: string;
  code: string;
  type: PromoCodeType;
  amount: number;
  expiresAt: string;
  isActive: boolean;
  isExpired: boolean;
  createdAt: string;
  redemptionCount: number;
  totalCredited: number;
}

export interface CreatePromoCodeInput {
  /** Leave empty to have the server generate one. */
  code?: string;
  type: PromoCodeType;
  amount: number;
  /** ISO instant. */
  expiresAt: string;
}

export interface UpdatePromoCodeInput {
  isActive?: boolean;
  amount?: number;
  expiresAt?: string;
}

export interface PromoCodeRedemption {
  userId: string;
  userName?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  amount: number;
  redeemedAt: string;
}

export interface RedeemCouponResult {
  amount: number;
  balance: number;
}

/** Error codes the redeem endpoint returns, mapped to translated messages by the UI. */
export type RedeemErrorCode = "invalid_code" | "already_redeemed" | "too_many_attempts" | "unknown";

export class RedeemCouponError extends Error {
  constructor(public code: RedeemErrorCode, message: string) {
    super(message);
    this.name = "RedeemCouponError";
  }
}
