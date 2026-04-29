# Skill S-08: Allergen Filter (알레르기·식이 필터)

> **스킬 유형**: 도메인 (한국인 특화)
> **핵심**: 사용자의 알레르기/식이 제한과 메뉴 매칭
> **사용 에이전트**: T6 Translation Specialist, T1 Trip Architect

## 데이터 모델 (UserPreferences.excludes)

```typescript
interface UserPreferences {
  vibes: string[];
  pace: PaceType;
  excludes: string[]; // 알레르기/식이 제한
}

// 예시
const prefs: UserPreferences = {
  excludes: ['새우 알레르기', '갑각류 알레르기', '땅콩 알레르기', '비건', '돼지고기 안 먹음'],
};
```

## 표준 알레르기/식이 카테고리

```typescript
type AllergenCategory = 
  // 식약처 19개 알레르기
  | '난류' | '우유' | '메밀' | '땅콩' | '대두' | '밀'
  | '고등어' | '게' | '새우' | '돼지고기' | '복숭아' | '토마토'
  | '아황산류' | '호두' | '닭고기' | '쇠고기' | '오징어' | '조개류' | '잣'
  // 식이 제한
  | '비건' | '베지테리언' | '할랄' | '코셔' | '글루텐 프리'
  // 종교
  | '돼지고기 금지' | '소고기 금지';
```

## 매칭 알고리즘

```typescript
// lib/allergen-filter.ts

const ALLERGEN_KEYWORDS: Record<string, string[]> = {
  '새우': ['새우', '에비', 'shrimp', '海老', 'えび'],
  '게': ['게', '카니', 'crab', '蟹', 'かに'],
  '갑각류': ['새우', '게', '바닷가재', 'shrimp', 'crab', 'lobster', '海老', '蟹'],
  '땅콩': ['땅콩', 'peanut', '落花生', 'ピーナッツ'],
  '계란': ['계란', '달걀', 'egg', '卵', 'たまご'],
  '우유': ['우유', '치즈', '버터', 'milk', 'cheese', 'butter', '牛乳'],
  '돼지고기': ['돼지', '돈까스', 'pork', '豚', '豚肉', 'ぶた', 'とん'],
  '비건': /* 동물성 모두 */ ['고기', '생선', '계란', '우유', '치즈', '버터', 'meat', 'fish'],
  // ...
};

export function matchAllergens(
  menuText: string,
  userExcludes: string[]
): AllergenMatch[] {
  const matches: AllergenMatch[] = [];
  
  for (const exclude of userExcludes) {
    const category = normalizeExclude(exclude); // "새우 알레르기" → "새우"
    const keywords = ALLERGEN_KEYWORDS[category] ?? [category];
    
    for (const keyword of keywords) {
      if (menuText.toLowerCase().includes(keyword.toLowerCase())) {
        matches.push({
          category,
          keyword,
          severity: getSeverity(exclude),
        });
        break; // 한 카테고리당 한 번만
      }
    }
  }
  
  return matches;
}

function normalizeExclude(exclude: string): string {
  // "새우 알레르기" → "새우"
  // "비건" → "비건"
  // "갑각류 알레르기" → "갑각류"
  return exclude.replace(/\s*알레르기\s*$/, '').replace(/\s*안\s*먹음\s*$/, '').trim();
}

function getSeverity(exclude: string): 'critical' | 'preference' {
  if (exclude.includes('알레르기')) return 'critical';
  return 'preference';
}
```

## 메뉴 결과 적용

```typescript
export function applyAllergenFilter(
  translated: TranslationResult,
  userExcludes: string[]
): MenuResult {
  return {
    items: translated.items.map(item => {
      const matches = matchAllergens(
        `${item.original} ${item.translated} ${item.ingredients.join(' ')}`,
        userExcludes
      );
      
      return {
        ...item,
        allergenMatches: matches,
        warning: matches.length > 0 ? buildWarning(matches) : undefined,
      };
    }),
  };
}

function buildWarning(matches: AllergenMatch[]): string {
  const critical = matches.filter(m => m.severity === 'critical');
  if (critical.length > 0) {
    return `⚠️ ${critical.map(m => m.category).join(', ')} 알레르기 위험`;
  }
  return `${matches.map(m => m.category).join(', ')} 포함`;
}
```

## UI 표시 (T17 협업)

| 매치 종류 | UI |
|----------|-----|
| critical 알레르기 | 🔴 빨간 카드 + 경고 아이콘 + "위험" 표시 |
| preference 제한 | 🟡 노란 태그 + 카테고리 라벨 |
| 매치 없음 | 🟢 안전 표시 (선택적) |

## 환각 방지

```
1. 키워드 매칭은 100% 확정만 (예: "새우" 텍스트 포함 시)
2. 추론 매칭은 하지 않음 (예: "해산물 → 새우 포함" 추정 X)
3. LLM이 "이 메뉴에는 새우가 들어있을 수도 있어요" → 표시 안 함
4. 불확실하면 "확인 필요" 라벨 (사용자가 점원에게 물어볼 수 있게)
```

> **알레르기는 생명과 직결**. 추측은 절대 금지.

## 다국어 키워드 사전 (확장 가능)

```typescript
// lib/allergen-keywords.ts

export const ALLERGEN_KEYWORDS_MULTILANG: Record<string, string[]> = {
  '새우': [
    // 한국어
    '새우', '대하', '왕새우',
    // 일본어
    'えび', 'エビ', '海老', '蝦',
    // 영어
    'shrimp', 'prawn',
    // 중국어
    '虾', '蝦',
  ],
  // ...
};
```

새 키워드 발견 시 T18 회고를 통해 보강 (자가 진화).

## 계산 예시

```typescript
const userPrefs: UserPreferences = {
  excludes: ['갑각류 알레르기', '땅콩 알레르기'],
};

const menu = '海老天ぷら定食 (새우 튀김 정식)';

const matches = matchAllergens(menu, userPrefs.excludes);
// → [{ category: '갑각류', keyword: '海老', severity: 'critical' }]

const warning = buildWarning(matches);
// → "⚠️ 갑각류 알레르기 위험"
```

## 사용자 경험 원칙

```
1. 명시적 동의: 사용자가 "알레르기 정보 입력" 단계에서 명시적으로 동의
2. 클라이언트 매칭 우선: 가능하면 서버에 알레르기 정보 미전송
3. 공유 시 옵션: 동행자에게 노출은 사용자가 켤 때만
4. 만료: 여행 종료 후 알레르기 정보 정리 옵션 제공
```

## 테스트 (S-14)

```typescript
describe('Allergen Filter', () => {
  it('갑각류 알레르기 + 새우 메뉴 → critical 매치', () => {
    const matches = matchAllergens('새우 튀김', ['갑각류 알레르기']);
    expect(matches[0].severity).toBe('critical');
  });
  
  it('비건 + 고기 메뉴 → preference 매치', () => {
    const matches = matchAllergens('소고기 스테이크', ['비건']);
    expect(matches.length).toBeGreaterThan(0);
  });
  
  it('일본어 한자 키워드 매칭', () => {
    const matches = matchAllergens('海老天ぷら', ['새우 알레르기']);
    expect(matches.length).toBe(1);
  });
  
  it('확신 없는 메뉴는 매치하지 않는다 (환각 금지)', () => {
    const matches = matchAllergens('해산물 모듬', ['새우 알레르기']);
    expect(matches.length).toBe(0); // "새우" 키워드 없음
  });
});
```

## 파일 위치

`c:\Projects\traveldiary-mvp\.claude\skills\allergen-filter.md`
