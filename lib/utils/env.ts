/**
 * 환경 변수 유틸리티.
 *
 * getApiKey() 패턴 8개 파일 DRY 추출.
 */

/** env 변수 값이 비어있지 않으면 반환, 없으면 null. */
export function getEnvKey(envVar: string): string | null {
  const val = process.env[envVar];
  return val && val.length > 0 ? val : null;
}
