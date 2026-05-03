/**
 * 사이클 U — schema.prisma VarChar 한도와 코드 검증 정합성.
 *
 * 백로그 정리: validateBody(200) ↔ DB VarChar(1000)이 worst-case escape 비율
 * 안에 들어가는지, validateNickname(10) ↔ VarChar(50)도 동일 비율인지 회귀.
 *
 * 정합성 깨지면 schema 또는 코드 검증 중 한쪽이 잘못된 것이라 반드시 fail.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SCHEMA_PATH = join(process.cwd(), "prisma", "schema.prisma");

function readNumericVarChar(modelName: string, field: string): number {
  const src = readFileSync(SCHEMA_PATH, "utf8");
  const modelStart = src.indexOf(`model ${modelName} {`);
  if (modelStart === -1) throw new Error(`model ${modelName} not found`);
  const modelEnd = src.indexOf("\n}", modelStart);
  const block = src.slice(modelStart, modelEnd);
  const re = new RegExp(`${field}\\s+\\S+\\s+@db\\.VarChar\\((\\d+)\\)`);
  const m = block.match(re);
  if (!m) throw new Error(`${modelName}.${field} VarChar(N) not found`);
  return Number(m[1]);
}

describe("사이클 U — ShareComment VarChar 정합성", () => {
  // worst-case HTML escape: ' → &#39; (5x). 5배 마진을 절대 규칙으로.
  const ESCAPE_FACTOR = 5;

  it("nickname VarChar는 validateNickname 한도(10자)의 escape 마진 안", () => {
    const varchar = readNumericVarChar("ShareComment", "nickname");
    expect(varchar).toBeGreaterThanOrEqual(10 * ESCAPE_FACTOR);
    expect(varchar).toBeLessThanOrEqual(100); // 과도한 여유 방지
  });

  it("body VarChar는 validateBody 한도(200자)의 escape 마진 안", () => {
    const varchar = readNumericVarChar("ShareComment", "body");
    expect(varchar).toBeGreaterThanOrEqual(200 * ESCAPE_FACTOR);
    expect(varchar).toBeLessThanOrEqual(2000); // 과도한 여유 방지
  });
});

describe("사이클 U — validateBody 경계 회귀", () => {
  it("200자 정확히 → ok, 201자 → reject", async () => {
    const { validateBody } = await import("@/lib/repositories/shareComment.repository");
    expect(validateBody("a".repeat(200)).ok).toBe(true);
    expect(validateBody("a".repeat(201)).ok).toBe(false);
  });
});
