/**
 * 개인정보 처리방침 — 정식 문서.
 *
 * 한국 개인정보보호법 기반. 실제 데이터 수집·처리·보관 현황 반영.
 * ADR-017 (위치 클라이언트 전용), ADR-019 (캐시 TTL), ADR-046 (감사 로그 마스킹).
 */

import type { Metadata } from "next";
import { LegalDocumentShell } from "@/components/legal/LegalDocumentShell";

export const metadata: Metadata = {
  title: "개인정보 처리방침 — TRAVELDIARY",
  description: "TravelDiary 개인정보 처리방침.",
};

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id}>
      <h2 className="text-td-card-title font-bold text-ink mb-td-sm">{title}</h2>
      <div className="text-td-body text-ink-soft space-y-td-xs leading-relaxed">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <LegalDocumentShell title="개인정보 처리방침" lastUpdated="2026-05-09">

      <Section id="intro" title="1. 개요">
        <p>
          TravelDiary(이하 &quot;서비스&quot;)는 자유여행자를 위한 AI 여행 동반자입니다.
          본 개인정보 처리방침은 서비스가 이용자의 개인정보를 어떻게 수집·이용·보관·파기하는지 설명합니다.
        </p>
      </Section>

      <Section id="collected" title="2. 수집하는 개인정보 항목">
        <p className="font-medium text-ink">필수 항목</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>카카오 계정 정보: 카카오 ID, 닉네임</li>
          <li>서비스 이용 기록: 여행 일정, 체크리스트, 비용 기록, 투표</li>
        </ul>
        <p className="font-medium text-ink mt-td-sm">선택 항목</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>이메일 주소 (카카오 연동 시 동의한 경우에 한함)</li>
          <li>프로필 이미지 URL (카카오 프로필에서 제공)</li>
          <li>위치 정보 (D-Day 모드 자동 전환에 동의한 경우)</li>
          <li>카메라/갤러리 이미지 (메뉴 번역 시 일시 사용)</li>
        </ul>
        <p className="font-medium text-ink mt-td-sm">자동 수집 항목</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>서비스 이용 로그 (감사 로그 — 생성·수정·삭제 이력)</li>
          <li>온보딩 퍼널 진행 단계</li>
          <li>A/B 테스트 변형 배정 (localStorage 기반)</li>
        </ul>
      </Section>

      <Section id="purpose" title="3. 개인정보의 수집 및 이용 목적">
        <ul className="list-disc pl-5 space-y-1">
          <li>회원 식별 및 인증 (카카오 OAuth 로그인)</li>
          <li>AI 여행 일정 생성 및 맞춤 추천</li>
          <li>메뉴판 번역 및 알레르기 정보 분석</li>
          <li>여행 데이터 저장 및 동기화 (일정·비용·체크리스트)</li>
          <li>일행 간 여행 공유 및 협업</li>
          <li>서비스 개선을 위한 이용 패턴 분석 (내부 분석만, 제3자 분석 도구 미사용)</li>
        </ul>
      </Section>

      <Section id="retention" title="4. 개인정보의 보유 및 이용 기간">
        <div className="overflow-x-auto">
          <table className="w-full text-td-caption border-collapse">
            <thead>
              <tr className="border-b border-divider">
                <th className="text-left py-2 pr-4 text-ink font-medium">데이터 유형</th>
                <th className="text-left py-2 text-ink font-medium">보관 기간</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              <tr><td className="py-2 pr-4">회원 계정 정보</td><td className="py-2">탈퇴 시까지</td></tr>
              <tr><td className="py-2 pr-4">여행·일정·비용·체크리스트</td><td className="py-2">삭제 요청 시까지</td></tr>
              <tr><td className="py-2 pr-4">카메라 번역 OCR 캐시</td><td className="py-2">7일 후 자동 삭제</td></tr>
              <tr><td className="py-2 pr-4">AI 번역 결과 캐시</td><td className="py-2">30일 후 자동 삭제</td></tr>
              <tr><td className="py-2 pr-4">장소 검색 캐시</td><td className="py-2">1~24시간 후 자동 삭제</td></tr>
              <tr><td className="py-2 pr-4">감사 로그</td><td className="py-2">영구 (사용자 식별 키 자동 마스킹)</td></tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="third-party" title="5. 개인정보의 제3자 제공">
        <p>서비스는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 다만, 서비스 제공을 위해 다음 외부 API를 이용하며 해당 데이터가 처리됩니다:</p>
        <div className="overflow-x-auto mt-td-xs">
          <table className="w-full text-td-caption border-collapse">
            <thead>
              <tr className="border-b border-divider">
                <th className="text-left py-2 pr-4 text-ink font-medium">서비스</th>
                <th className="text-left py-2 pr-4 text-ink font-medium">전송 데이터</th>
                <th className="text-left py-2 text-ink font-medium">목적</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              <tr><td className="py-2 pr-4">카카오</td><td className="py-2 pr-4">OAuth 인증 코드</td><td className="py-2">로그인 인증</td></tr>
              <tr><td className="py-2 pr-4">Google Places API</td><td className="py-2 pr-4">장소 검색어</td><td className="py-2">장소 정보 조회</td></tr>
              <tr><td className="py-2 pr-4">Google Cloud Vision</td><td className="py-2 pr-4">메뉴판 이미지</td><td className="py-2">텍스트 추출 (OCR)</td></tr>
              <tr><td className="py-2 pr-4">Anthropic Claude</td><td className="py-2 pr-4">OCR 텍스트</td><td className="py-2">메뉴 번역·알레르기 분석</td></tr>
              <tr><td className="py-2 pr-4">Naver 검색 API</td><td className="py-2 pr-4">장소 검색어</td><td className="py-2">한국어 후기 수집</td></tr>
              <tr><td className="py-2 pr-4">Railway</td><td className="py-2 pr-4">전체 서비스 데이터</td><td className="py-2">호스팅·데이터베이스</td></tr>
            </tbody>
          </table>
        </div>
        <p className="mt-td-xs">각 외부 서비스의 개인정보 처리방침은 해당 서비스에서 확인하실 수 있습니다.</p>
      </Section>

      <Section id="location" title="6. 위치 정보 처리">
        <p>
          서비스는 D-Day 모드(여행 중 자동 전환)를 위해 이용자의 GPS 위치를 사용할 수 있습니다.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>위치 좌표는 기기에서만 처리</strong>되며 서버에 전송·저장되지 않습니다.</li>
          <li>위치 권한은 선택 사항이며, 거부해도 서비스의 핵심 기능은 정상 작동합니다.</li>
          <li>브라우저 설정에서 언제든 위치 권한을 변경할 수 있습니다.</li>
        </ul>
      </Section>

      <Section id="camera" title="7. 카메라·이미지 처리">
        <p>메뉴판 번역 기능 사용 시:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>촬영/선택한 이미지는 서버에 영구 저장되지 않습니다.</li>
          <li>이미지는 Google Cloud Vision API로 전송되어 텍스트를 추출한 후 즉시 폐기됩니다.</li>
          <li>추출된 텍스트(OCR 결과)만 7일간 캐시됩니다.</li>
          <li>카메라 권한은 선택 사항이며 갤러리 사진 선택으로 대체 가능합니다.</li>
        </ul>
      </Section>

      <Section id="cookies" title="8. 쿠키 및 로컬 저장소">
        <p className="font-medium text-ink">쿠키</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><code className="text-td-caption bg-surface-soft px-1 rounded">access_token</code> — 인증 토큰 (15분, httpOnly, Secure)</li>
          <li><code className="text-td-caption bg-surface-soft px-1 rounded">refresh_token</code> — 갱신 토큰 (30일, httpOnly, Secure)</li>
          <li>제3자 추적 쿠키는 사용하지 않습니다.</li>
        </ul>
        <p className="font-medium text-ink mt-td-sm">로컬 저장소 (브라우저)</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>익명 식별자 (협업 댓글용)</li>
          <li>A/B 테스트 변형 배정</li>
          <li>학습 진행률 (베트남어 문장 카드)</li>
        </ul>
        <p className="mt-td-xs">설정 &gt; 캐시 삭제에서 로컬 저장소를 초기화할 수 있습니다.</p>
      </Section>

      <Section id="security" title="9. 개인정보 보호 조치">
        <ul className="list-disc pl-5 space-y-1">
          <li>모든 통신은 TLS/SSL 암호화 적용</li>
          <li>인증 토큰은 httpOnly·Secure 쿠키로 저장 (JavaScript 접근 불가)</li>
          <li>비밀번호는 저장하지 않음 (카카오 OAuth 위임 인증)</li>
          <li>감사 로그에서 API 키·세션 토큰 등 민감 정보 13종 자동 마스킹</li>
          <li>관리자 페이지는 별도 인증 키로 보호</li>
        </ul>
      </Section>

      <Section id="rights" title="10. 이용자의 권리">
        <p>이용자는 언제든 다음 권리를 행사할 수 있습니다:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>열람권</strong> — 설정 &gt; 내 데이터 내보내기에서 JSON 파일로 다운로드</li>
          <li><strong>정정권</strong> — 프로필 편집에서 닉네임 등 수정</li>
          <li><strong>삭제권</strong> — 설정 &gt; 계정 삭제에서 계정 및 관련 데이터 삭제</li>
          <li><strong>이동권</strong> — JSON 형식으로 데이터를 다운로드하여 타 서비스로 이전 가능</li>
        </ul>
        <p className="mt-td-xs">계정 삭제 시 개인 식별 정보(이름, 이메일, 카카오 ID)는 즉시 익명화 처리됩니다.</p>
      </Section>

      <Section id="analytics" title="11. 분석 및 추적">
        <ul className="list-disc pl-5 space-y-1">
          <li>Google Analytics, Segment, Mixpanel 등 제3자 분석 도구를 사용하지 않습니다.</li>
          <li>서비스 개선을 위한 분석은 자체 서버에서만 수행됩니다.</li>
          <li>OTA 어필리에이트 링크 클릭은 수익 정산을 위해 기록됩니다.</li>
        </ul>
      </Section>

      <Section id="children" title="12. 아동의 개인정보 보호">
        <p>
          본 서비스는 만 14세 미만 아동의 개인정보를 수집하지 않습니다.
          만 14세 미만임이 확인되면 해당 계정과 데이터를 즉시 삭제합니다.
        </p>
      </Section>

      <Section id="officer" title="13. 개인정보 보호책임자">
        <ul className="list-none space-y-1">
          <li>담당: TravelDiary 운영팀</li>
          <li>이메일: <a href="mailto:bizcomhome@gmail.com" className="text-purple-deep hover:underline">bizcomhome@gmail.com</a></li>
        </ul>
        <p className="mt-td-xs">
          개인정보 관련 문의·불만·피해 구제는 위 연락처로 접수해 주시면 지체 없이 처리하겠습니다.
        </p>
      </Section>

      <Section id="changes" title="14. 처리방침 변경">
        <p>
          본 처리방침이 변경되는 경우 시행일 7일 전부터 앱 내 알림으로 공지합니다.
          중대한 변경(수집 항목 추가, 제3자 제공 등)은 시행일 30일 전 공지합니다.
        </p>
      </Section>

    </LegalDocumentShell>
  );
}
