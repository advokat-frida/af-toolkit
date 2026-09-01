import { getLegacyVerifyRedirect, getVerifyLogUrl } from "./urls";

describe("Redactorium verification URLs", () => {
  test("builds the verifier route from a standalone page", () => {
    expect(getVerifyLogUrl({ href: "https://tools.example/redactorium/" }))
      .toBe("https://tools.example/redactorium/#/verify-log");
  });

  test("preserves an embed query when building the verifier route", () => {
    expect(getVerifyLogUrl({ href: "https://tools.example/redactorium/?embed=1#/" }))
      .toBe("https://tools.example/redactorium/?embed=1#/verify-log");
  });

  test("redirects a legacy verifier path to the hash route", () => {
    expect(getLegacyVerifyRedirect({
      origin: "https://tools.example",
      pathname: "/redactorium/verify-log",
      search: "",
      hash: ""
    })).toBe("https://tools.example/redactorium/#/verify-log");
  });

  test("leaves normal and already-hashed routes alone", () => {
    expect(getLegacyVerifyRedirect({ origin: "https://tools.example", pathname: "/redactorium/", search: "", hash: "" })).toBeNull();
    expect(getLegacyVerifyRedirect({ origin: "https://tools.example", pathname: "/redactorium/verify-log", search: "", hash: "#/verify-log" })).toBeNull();
  });
});
