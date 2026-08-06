import assert from "node:assert/strict";
import test from "node:test";
import { buildContentSecurityPolicy } from "../src/lib/security/csp";

test("la CSP de producción autoriza scripts con nonce y elimina unsafe-inline", () => {
  const policy = buildContentSecurityPolicy("nonce-de-prueba", {
    development: false,
    production: true
  });
  const scriptDirective = policy.split("; ").find((directive) => directive.startsWith("script-src"));

  assert.match(scriptDirective ?? "", /'nonce-nonce-de-prueba'/);
  assert.match(scriptDirective ?? "", /'strict-dynamic'/);
  assert.doesNotMatch(scriptDirective ?? "", /'unsafe-inline'/);
  assert.doesNotMatch(scriptDirective ?? "", /'unsafe-eval'/);
  assert.match(policy, /upgrade-insecure-requests/);
});

test("la CSP conserva unsafe-eval exclusivamente para desarrollo", () => {
  const policy = buildContentSecurityPolicy("nonce-de-prueba", {
    development: true,
    production: false
  });
  const scriptDirective = policy.split("; ").find((directive) => directive.startsWith("script-src"));

  assert.match(scriptDirective ?? "", /'unsafe-eval'/);
  assert.doesNotMatch(policy, /upgrade-insecure-requests/);
});
