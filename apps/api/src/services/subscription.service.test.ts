import { describe, expect, it } from "vitest";
import { isSubscriptionActive, mapStripeSubscriptionStatus } from "./subscription.service.js";

describe("isSubscriptionActive", () => {
  it("permite ACTIVE com período válido", () => {
    const future = new Date(Date.now() + 86400000);
    expect(isSubscriptionActive("ACTIVE", future)).toBe(true);
  });

  it("bloqueia PAST_DUE", () => {
    expect(isSubscriptionActive("PAST_DUE", new Date(Date.now() + 86400000))).toBe(
      false,
    );
  });

  it("bloqueia ACTIVE com período expirado", () => {
    const past = new Date(Date.now() - 1000);
    expect(isSubscriptionActive("ACTIVE", past)).toBe(false);
  });
});

describe("mapStripeSubscriptionStatus", () => {
  it("mapeia past_due", () => {
    expect(mapStripeSubscriptionStatus("past_due")).toBe("PAST_DUE");
  });
});
