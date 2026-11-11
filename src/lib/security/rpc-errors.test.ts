import { expect, it } from "vitest";
import { isRpcRateLimit } from "./rpc-errors";
it("recognizes only the explicit database quota status and safe message", () => {
  expect(isRpcRateLimit({ code: "PT429", message: "rpc_rate_limited" })).toBe(
    true,
  );
  for (const error of [
    null,
    undefined,
    {},
    { code: "P0001", message: "rpc_rate_limited" },
    { code: "PT429", message: "private provider payload" },
  ])
    expect(isRpcRateLimit(error)).toBe(false);
});
