import { describe, expect, it } from "vitest";
import { cmiHash, verifyCmiHash, escapeCmi } from "@/lib/payments/cmi";
import { decryptBuffer, encryptBuffer, sha256 } from "@/lib/storage/crypto";
import { can, ROLE_PERMISSIONS } from "@/lib/auth/permissions";
import { safeNext } from "@/lib/validation";
import { createZip, crc32 } from "@/lib/zip";

describe("CMI hash (ver3)", () => {
  it("escapes pipes and backslashes", () => {
    expect(escapeCmi("a|b\\c")).toBe("a\\|b\\\\c");
  });
  it("sorts keys case-insensitively, ignores hash/encoding, and verifies", () => {
    const params = { oid: "PAY-1", amount: "750.00", clientid: "123", encoding: "UTF-8", Zeta: "z", alpha: "a" };
    const h = cmiHash(params, "storekey");
    expect(cmiHash({ ...params, encoding: "other" }, "storekey")).toBe(h);
    expect(verifyCmiHash({ ...params, HASH: h }, "storekey")).toBe(true);
    expect(verifyCmiHash({ ...params, amount: "1.00", HASH: h }, "storekey")).toBe(false);
    expect(verifyCmiHash({ ...params, HASH: h }, "wrong")).toBe(false);
    expect(verifyCmiHash(params, "storekey")).toBe(false);
  });
});

describe("document encryption", () => {
  it("round-trips with AES-256-GCM and detects tampering", () => {
    const plain = Buffer.from("%PDF-1.4 passport copy");
    const enc = encryptBuffer(plain);
    expect(enc.includes(plain)).toBe(false);
    expect(decryptBuffer(enc).equals(plain)).toBe(true);
    enc[enc.length - 1] ^= 0xff;
    expect(() => decryptBuffer(enc)).toThrow();
    expect(sha256(plain)).toHaveLength(64);
  });
});

describe("RBAC", () => {
  it("restricts staff and customers", () => {
    expect(can("CUSTOMER", "applications.view")).toBe(false);
    expect(can("STAFF", "applications.manage")).toBe(true);
    expect(can("STAFF", "finance.manage")).toBe(false);
    expect(can("ADMIN", "users.manage")).toBe(false);
    expect(can("OWNER", "users.manage")).toBe(true);
    expect(ROLE_PERMISSIONS.OWNER.length).toBeGreaterThan(ROLE_PERMISSIONS.ADMIN.length);
  });
});

describe("open-redirect protection", () => {
  it("only allows local paths", () => {
    expect(safeNext("/fr/account", "/x")).toBe("/fr/account");
    expect(safeNext("//evil.com", "/x")).toBe("/x");
    expect(safeNext("https://evil.com", "/x")).toBe("/x");
    expect(safeNext("/\\evil.com", "/x")).toBe("/x");
  });
});

describe("zip", () => {
  it("computes standard CRC32 and builds a valid archive", () => {
    expect(crc32(Buffer.from("123456789")).toString(16)).toBe("cbf43926");
    const z = createZip([{ name: "a.txt", data: Buffer.from("hello") }, { name: "a.txt", data: Buffer.from("x") }]);
    expect(z.readUInt32LE(0)).toBe(0x04034b50);
    expect(z.readUInt32LE(z.length - 22)).toBe(0x06054b50);
    expect(z.readUInt16LE(z.length - 22 + 10)).toBe(2);
  });
});
