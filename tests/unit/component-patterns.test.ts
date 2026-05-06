/**
 * Component 횡단 패턴 검증.
 *
 * components/ 디렉토리의 모든 컴포넌트가 일관된 규칙을 따르는지 확인:
 * - "use client" 필요 여부 (useState/useEffect 사용 시)
 * - server-only import 미사용 (컴포넌트는 서버 전용 모듈 직접 import 금지)
 * - named export 표준 (export default 지양)
 * - JSDoc/주석 헤더 존재
 * - 접근성 기본 패턴
 */

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

/** 재귀적으로 .tsx/.ts 파일 수집 */
function collectComponentFiles(dir: string): { relPath: string; src: string }[] {
  const results: { relPath: string; src: string }[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectComponentFiles(fullPath));
    } else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) {
      const relPath = path.relative(path.resolve("components"), fullPath).replace(/\\/g, "/");
      results.push({ relPath, src: fs.readFileSync(fullPath, "utf-8") });
    }
  }
  return results;
}

const COMPONENTS_DIR = path.resolve("components");
const ALL_COMPONENTS = collectComponentFiles(COMPONENTS_DIR);
const TSX_COMPONENTS = ALL_COMPONENTS.filter((f) => f.relPath.endsWith(".tsx"));

// React hooks 사용 = "use client" 필수
const CLIENT_HOOKS = ["useState", "useEffect", "useCallback", "useRef", "useTransition", "useOptimistic"];

// "use client" 없이도 가능한 예외 (onClick prop 전달만, 직접 hook 미사용)
const USE_CLIENT_EXCEPTIONS = [
  "ui/Card.tsx",           // onClick prop 전달만, hook 미사용
  "ui/BottomNav.tsx",      // Link 기반 Server Component
  "share/SharedPageCards.tsx", // callback prop 전달만
];

/* ════════════════════════════════════════════
 * 파일 수 불변성
 * ════════════════════════════════════════════ */

describe("component 파일 목록", () => {
  it("74개 이상 컴포넌트 파일 존재", () => {
    expect(ALL_COMPONENTS.length).toBeGreaterThanOrEqual(74);
  });

  it("TSX 파일 72개 이상", () => {
    expect(TSX_COMPONENTS.length).toBeGreaterThanOrEqual(72);
  });
});

/* ════════════════════════════════════════════
 * "use client" 일관성 — hook 사용 시 필수
 * ════════════════════════════════════════════ */

describe("component — 'use client' 일관성", () => {
  const COMPONENTS_WITH_HOOKS = TSX_COMPONENTS.filter(
    (f) =>
      CLIENT_HOOKS.some((hook) => {
        // import 문이 아닌 실제 hook 호출 감지 (주석 제외)
        const hookCallRegex = new RegExp(`(?<!//.*?)\\b${hook}\\s*[(<]`);
        return hookCallRegex.test(f.src);
      }) && !USE_CLIENT_EXCEPTIONS.includes(f.relPath),
  );

  it.each(COMPONENTS_WITH_HOOKS.map((f) => [f.relPath, f.src]))(
    "%s — hook 사용 → 'use client' 선언 존재",
    (_path, src) => {
      expect(src).toMatch(/^["']use client["']/m);
    },
  );
});

/* ════════════════════════════════════════════
 * server-only import 금지 (컴포넌트에서)
 * ════════════════════════════════════════════ */

describe("component — server-only import 미사용", () => {
  it.each(ALL_COMPONENTS.map((f) => [f.relPath, f.src]))(
    "%s — 'server-only' import 없음",
    (_path, src) => {
      expect(src).not.toContain('"server-only"');
    },
  );
});

/* ════════════════════════════════════════════
 * named export 표준 (export default 지양)
 * ════════════════════════════════════════════ */

describe("component — named export 표준", () => {
  // export default 허용 예외: lazy import용 모달
  const DEFAULT_EXPORT_EXCEPTIONS = [
    "modals/OtaInterstitialModal.tsx",
    "modals/ReplanConflictModal.tsx",
  ];

  const COMPONENTS_WITHOUT_EXCEPTIONS = ALL_COMPONENTS.filter(
    (f) => !DEFAULT_EXPORT_EXCEPTIONS.includes(f.relPath),
  );

  it.each(COMPONENTS_WITHOUT_EXCEPTIONS.map((f) => [f.relPath, f.src]))(
    "%s — export default 미사용",
    (_path, src) => {
      expect(src).not.toMatch(/^export default /m);
    },
  );

  it("export default 예외는 lazy import용 모달만 (2개)", () => {
    const defaultExportFiles = ALL_COMPONENTS.filter((f) =>
      /^export default /m.test(f.src),
    );
    expect(defaultExportFiles.length).toBe(2);
    for (const f of defaultExportFiles) {
      expect(DEFAULT_EXPORT_EXCEPTIONS).toContain(f.relPath);
    }
  });
});

/* ════════════════════════════════════════════
 * 접근성 — 대화형 컴포넌트 aria 속성
 * ════════════════════════════════════════════ */

describe("component — 접근성 aria 속성", () => {
  // form 관련 input 컴포넌트 (generic UI 칩은 호출자가 aria 전달)
  const FORM_COMPONENTS = TSX_COMPONENTS.filter(
    (f) =>
      (f.relPath.includes("Form") ||
        f.relPath.includes("SearchInput") ||
        f.relPath.includes("Filter")) &&
      f.relPath !== "ui/FilterChip.tsx",
  );

  it.each(FORM_COMPONENTS.map((f) => [f.relPath, f.src]))(
    "%s — aria-label 또는 aria-labelledby 존재",
    (_path, src) => {
      const hasAria =
        src.includes("aria-label") ||
        src.includes("aria-labelledby") ||
        src.includes("aria-describedby") ||
        src.includes("htmlFor"); // label의 htmlFor도 접근성 패턴
      expect(hasAria).toBe(true);
    },
  );

  // Modal 컴포넌트
  const MODAL_COMPONENTS = TSX_COMPONENTS.filter(
    (f) => f.relPath.includes("Modal") || f.relPath.includes("Sheet"),
  );

  it.each(MODAL_COMPONENTS.map((f) => [f.relPath, f.src]))(
    "%s — aria-label 또는 role 존재",
    (_path, src) => {
      const hasModalAria =
        src.includes("aria-label") ||
        src.includes("aria-labelledby") ||
        src.includes('role="dialog"') ||
        src.includes('role="alertdialog"');
      expect(hasModalAria).toBe(true);
    },
  );
});

/* ════════════════════════════════════════════
 * 디렉토리 구조 — 하위 디렉토리 존재
 * ════════════════════════════════════════════ */

describe("component — 디렉토리 구조", () => {
  const EXPECTED_DIRS = [
    "ui",
    "itinerary",
    "checklist",
    "cost",
    "share",
    "city",
    "translate",
    "travel",
    "dashboard",
    "vote",
  ];

  it.each(EXPECTED_DIRS.map((d) => [d]))(
    "components/%s/ 디렉토리 존재",
    (dir) => {
      const hasFiles = ALL_COMPONENTS.some((f) => f.relPath.startsWith(`${dir}/`));
      expect(hasFiles, `${dir}/ 디렉토리에 파일 없음`).toBe(true);
    },
  );

  it("10개 이상 하위 디렉토리 존재", () => {
    const dirs = new Set(ALL_COMPONENTS.map((f) => f.relPath.split("/")[0]));
    expect(dirs.size).toBeGreaterThanOrEqual(10);
  });
});

/* ════════════════════════════════════════════
 * JSDoc/주석 헤더 — 대형 컴포넌트
 * ════════════════════════════════════════════ */

describe("component — JSDoc 헤더 (View 컴포넌트)", () => {
  // View 컴포넌트 = 페이지 주요 뷰 (50행 이상)
  const VIEW_COMPONENTS = TSX_COMPONENTS.filter(
    (f) => f.relPath.includes("View") || f.relPath.includes("Home"),
  );

  it.each(VIEW_COMPONENTS.map((f) => [f.relPath, f.src]))(
    "%s — 파일 상단 주석 존재",
    (_path, src) => {
      const hasHeader =
        src.trimStart().startsWith("/**") ||
        src.trimStart().startsWith("//") ||
        src.trimStart().startsWith('"use client"');
      expect(hasHeader).toBe(true);
    },
  );
});

/* ════════════════════════════════════════════
 * 컴포넌트별 파일 수 분포
 * ════════════════════════════════════════════ */

describe("component — 디렉토리별 파일 수 분포", () => {
  const countByDir = new Map<string, number>();
  for (const f of ALL_COMPONENTS) {
    const dir = f.relPath.split("/")[0];
    countByDir.set(dir, (countByDir.get(dir) ?? 0) + 1);
  }

  it("itinerary/ — 가장 많은 컴포넌트 (15개 이상)", () => {
    expect(countByDir.get("itinerary")!).toBeGreaterThanOrEqual(15);
  });

  it("ui/ — 기본 UI 컴포넌트 8개 이상", () => {
    expect(countByDir.get("ui")!).toBeGreaterThanOrEqual(8);
  });

  it("checklist/ — 체크리스트 컴포넌트 6개 이상", () => {
    expect(countByDir.get("checklist")!).toBeGreaterThanOrEqual(6);
  });

  it("cost/ — 비용 컴포넌트 4개 이상", () => {
    expect(countByDir.get("cost")!).toBeGreaterThanOrEqual(4);
  });

  it("share/ — 공유 컴포넌트 5개 이상", () => {
    expect(countByDir.get("share")!).toBeGreaterThanOrEqual(5);
  });
});

/* ════════════════════════════════════════════
 * import 패턴 — @/ alias 사용
 * ════════════════════════════════════════════ */

describe("component — import 패턴", () => {
  // 일부 컴포넌트는 외부 import 없이 순수 TSX만 사용 (JsonLd, ItineraryMap 등)
  const COMPONENTS_WITH_IMPORTS = TSX_COMPONENTS.filter(
    (f) => f.src.includes("import "),
  );

  it.each(COMPONENTS_WITH_IMPORTS.map((f) => [f.relPath, f.src]))(
    "%s — import source가 유효한 경로",
    (_path, src) => {
      const hasValidImport =
        src.includes("from \"react\"") ||
        src.includes("from \"next") ||
        src.includes("from \"@/") ||
        src.includes("from \"./") ||
        src.includes("from \"../");
      expect(hasValidImport).toBe(true);
    },
  );
});

/* ════════════════════════════════════════════
 * UI 컴포넌트 — Tailwind 클래스 사용
 * ════════════════════════════════════════════ */

describe("component — Tailwind CSS 사용", () => {
  // UI 컴포넌트는 Tailwind 클래스 필수
  const UI_COMPONENTS = TSX_COMPONENTS.filter((f) => f.relPath.startsWith("ui/"));

  it.each(UI_COMPONENTS.map((f) => [f.relPath, f.src]))(
    "%s — className 또는 Tailwind 클래스 존재",
    (_path, src) => {
      const hasTailwind =
        src.includes("className") || src.includes("class=");
      expect(hasTailwind).toBe(true);
    },
  );
});
