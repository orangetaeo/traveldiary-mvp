/**
 * 온보딩 베트남 단일 국가 정책 검증 — feedback_vietnam_only_focus 준수.
 */

import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

const src = fs.readFileSync(
  path.resolve(__dirname, "../../app/onboarding/page.tsx"),
  "utf-8",
);

describe("온보딩 — 베트남 단일 국가 정책", () => {
  it("DESTINATIONS에 비-베트남 도시 없음 (도쿄/방콕/치앙마이 등)", () => {
    // DESTINATIONS 배열 영역만 추출
    const destMatch = src.match(/const DESTINATIONS = \[([\s\S]*?)\];/);
    expect(destMatch).not.toBeNull();
    const destBlock = destMatch![1];
    expect(destBlock).not.toContain("도쿄");
    expect(destBlock).not.toContain("방콕");
    expect(destBlock).not.toContain("치앙마이");
    expect(destBlock).not.toContain("오사카");
  });

  it("베트남 6개 도시 포함 (푸꾸옥/다낭/호치민/하노이/나트랑/��랏)", () => {
    const destMatch = src.match(/const DESTINATIONS = \[([\s\S]*?)\];/);
    const destBlock = destMatch![1];
    expect(destBlock).toContain("푸꾸옥");
    expect(destBlock).toContain("다낭");
    expect(destBlock).toContain("호치민");
    expect(destBlock).toContain("하노이");
    expect(destBlock).toContain("나트랑");
    expect(destBlock).toContain("달랏");
  });

  it("destinationToCode에 베트남 6개 코드 매핑", () => {
    expect(src).toContain('"PQC"');
    expect(src).toContain('"DAD"');
    expect(src).toContain('"SGN"');
    expect(src).toContain('"HAN"');
    expect(src).toContain('"NHA"');
    expect(src).toContain('"DLI"');
  });

  it("destinationToCode에 비-베트남 코드 없음", () => {
    const codeMatch = src.match(/function destinationToCode[\s\S]*?\}/);
    expect(codeMatch).not.toBeNull();
    const codeBlock = codeMatch![0];
    expect(codeBlock).not.toContain('"TYO"');
    expect(codeBlock).not.toContain('"BKK"');
  });

  it("Step2 설명에 '베트남' 포함", () => {
    expect(src).toContain("베트남");
  });
});
