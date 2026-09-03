export const PRODUCTS = {
  "alipay-test": {
    id: "alipay-test",
    name: "STARGATE Alipay+ Test Product",
    description: "Eximbay Alipay+ integration verification",
    amountMinor: 100,
    currency: "USD" as const,
  },
} as const;

export type ProductId = keyof typeof PRODUCTS;

export function getProduct(productId: string) {
  return PRODUCTS[productId as ProductId];
}
