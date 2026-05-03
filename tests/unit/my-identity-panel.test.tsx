/**
 * 사이클 SS — MyIdentityPanel 단위 테스트.
 *
 * 컴포넌트가 useEffect로 LocalStorage를 읽으므로 SSR 시점에는 uuid="" → null 반환.
 * SSR HTML 단언만 가능 (renderToStaticMarkup). 상호작용 테스트는 별도 e2e 스코프.
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MyIdentityPanel } from "@/components/share/MyIdentityPanel";

describe("사이클 SS — MyIdentityPanel SSR", () => {
  it("SSR 시 uuid 빈 → null 렌더 (빈 출력)", () => {
    // Node 환경 — window 없음 → useEffect 미실행 → uuid="" → return null
    const html = renderToStaticMarkup(<MyIdentityPanel />);
    expect(html).toBe("");
  });
});
