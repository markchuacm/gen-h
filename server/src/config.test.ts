import { describe, expect, it } from "vitest";
import { databaseTlsIssues } from "./config.js";

describe("production database TLS", () => {
  it("allows local PostgreSQL without TLS", () => {
    expect(databaseTlsIssues("postgres://user:pass@postgres:5432/verae")).toEqual([]);
  });

  it("requires hostname verification and an explicit CA for remote PostgreSQL", () => {
    expect(databaseTlsIssues("postgres://user:pass@database.example/verae?sslmode=no-verify")).toEqual([
      "must use sslmode=verify-full",
      "must provide sslrootcert",
    ]);
  });

  it("accepts a fully verified remote PostgreSQL URL", () => {
    expect(databaseTlsIssues(
      "postgres://user:pass@database.example/verae?sslmode=verify-full&sslrootcert=/etc/verae/rds.pem",
    )).toEqual([]);
  });
});
