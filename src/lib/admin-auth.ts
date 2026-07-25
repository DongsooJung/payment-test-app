import "server-only";

import { timingSafeEqual } from "crypto";

export function isAdminTokenConfigured() {
  return Boolean(process.env.PAYMENT_ADMIN_TOKEN);
}

export function isAuthorizedAdminRequest(request: Request) {
  const expectedToken = process.env.PAYMENT_ADMIN_TOKEN;
  const authorization = request.headers.get("authorization");

  if (!expectedToken || !authorization?.startsWith("Bearer ")) {
    return false;
  }

  const providedToken = authorization.slice("Bearer ".length);
  const expectedBuffer = Buffer.from(expectedToken);
  const providedBuffer = Buffer.from(providedToken);

  return (
    expectedBuffer.length === providedBuffer.length &&
    timingSafeEqual(expectedBuffer, providedBuffer)
  );
}
