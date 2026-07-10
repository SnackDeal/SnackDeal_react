import type { ShippingPolicy } from '@/lib/api';

const FALLBACK_BASE_FEE = 3000;

export function getDisplayShippingBaseFee(policy: ShippingPolicy | null): number {
  if (!policy) return 0;
  if (policy.baseFee > 0) return policy.baseFee;
  return policy.freeThreshold > 0 ? FALLBACK_BASE_FEE : 0;
}

export function getShippingFeeForAmount(
  policy: ShippingPolicy | null,
  productAmount: number
): number {
  if (!policy || productAmount <= 0) return 0;
  if (productAmount >= policy.freeThreshold) return 0;
  return getDisplayShippingBaseFee(policy);
}
