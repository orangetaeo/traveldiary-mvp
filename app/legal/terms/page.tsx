/**
 * 이용약관 — 정식 문서.
 *
 * 한국 전자상거래법·약관규제법 기반. 실제 서비스 운영 현황 반영.
 * AI 생성 콘텐츠 면책, OTA 어필리에이트, 사용자 데이터 소유권 명시.
 */

import type { Metadata } from "next";
import { LegalDocumentShell } from "@/components/legal/LegalDocumentShell";

export const metadata: Metadata = {
  title: "이용약관 — TRAVELDIARY",
  description: "TravelDiary 이용약관.",
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

export default function TermsPage() {
  return (
    <LegalDocumentShell title="이용약관" lastUpdated="2026-05-09">

      <Section id="purpose" title="제1조 (목적)">
        <p>
          본 약관은 TravelDiary(이하 &quot;서비스&quot;)가 제공하는 자유여행자를 위한 AI 여행 동반자
          서비스의 이용 조건 및 절차, 이용자와 서비스 간의 권리·의무·책임 사항을 규정함을 목적으로 합니다.
        </p>
      </Section>

      <Section id="definitions" title="제2조 (정의)">
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>&quot;서비스&quot;</strong> — TravelDiary가 웹·모바일 웹을 통해 제공하는 AI 여행 계획·번역·비용 관리·협업 기능 일체.</li>
          <li><strong>&quot;이용자&quot;</strong> — 본 약관에 따라 서비스에 가입하여 이용하는 자.</li>
          <li><strong>&quot;AI 콘텐츠&quot;</strong> — 서비스가 인공지능을 활용해 생성한 일정·번역·추천·분석 결과.</li>
          <li><strong>&quot;여행 데이터&quot;</strong> — 이용자가 직접 작성·입력한 일정·체크리스트·비용 기록·댓글·리액션.</li>
          <li><strong>&quot;동기화 키&quot;</strong> — 여행을 공유하기 위해 생성되는 고유 식별 코드.</li>
        </ul>
      </Section>

      <Section id="terms-display" title="제3조 (약관의 게시 및 변경)">
        <ul className="list-disc pl-5 space-y-1">
          <li>본 약관은 서비스 내 설정 &gt; 이용약관에서 언제든 확인할 수 있습니다.</li>
          <li>약관 변경 시 시행일 7일 전 앱 내 알림으로 공지합니다.</li>
          <li>수집 항목 추가, 제3자 제공, 이용자 권리 제한 등 중대한 변경은 시행일 30일 전 공지합니다.</li>
          <li>변경된 약관에 동의하지 않는 이용자는 탈퇴할 수 있으며, 시행일 이후 서비스 이용을 계속하면 변경에 동의한 것으로 간주합니다.</li>
        </ul>
      </Section>

      <Section id="signup" title="제4조 (가입 및 인증)">
        <ul className="list-disc pl-5 space-y-1">
          <li>서비스는 카카오 OAuth 로그인으로 가입합니다. 별도 비밀번호는 저장하지 않습니다.</li>
          <li>만 14세 미만은 가입할 수 없습니다.</li>
          <li>이용자는 정확한 정보를 제공해야 하며, 타인의 계정을 무단 사용할 수 없습니다.</li>
        </ul>
      </Section>

      <Section id="service-scope" title="제5조 (서비스의 내용)">
        <p>서비스는 다음 기능을 제공합니다:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>AI 기반 여행 일정 생성 및 맞춤 추천</li>
          <li>카메라 메뉴판 번역 및 알레르기 정보 분석</li>
          <li>여행 비용 기록 및 정산</li>
          <li>체크리스트 관리 (출발 전·여행 중)</li>
          <li>동기화 키를 통한 일행 간 여행 공유 및 협업</li>
          <li>D-Day 모드 자동 전환 (여행 중 UI 최적화)</li>
          <li>도시 컨텍스트 정보 (응급·실용·교통 안내)</li>
        </ul>
      </Section>

      <Section id="ai-disclaimer" title="제6조 (AI 콘텐츠 면책)">
        <p className="font-medium text-ink">AI가 생성한 일정·번역·추천은 참고용이며, 이용자의 판단과 책임하에 활용해야 합니다.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>AI 콘텐츠는 실시간 상황(영업시간 변경, 임시 휴무, 가격 변동 등)을 완벽히 반영하지 못할 수 있습니다.</li>
          <li>서비스는 추천 근거 패널을 통해 AI 판단의 출처를 투명하게 제공하지만, 정확성을 보증하지 않습니다.</li>
          <li>메뉴 번역·알레르기 분석 결과는 참고 정보이며, 심각한 알레르기가 있는 경우 반드시 현지에서 직접 확인해야 합니다.</li>
          <li>AI 콘텐츠 활용으로 발생한 손해에 대해 서비스는 고의 또는 중과실이 없는 한 책임을 지지 않습니다.</li>
        </ul>
      </Section>

      <Section id="user-data" title="제7조 (사용자 데이터 소유권)">
        <p className="font-medium text-ink">이용자가 작성한 여행 데이터는 이용자 본인이 소유합니다.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>서비스는 이용자의 여행 데이터를 서비스 제공 목적으로만 이용합니다.</li>
          <li>이용자는 설정 &gt; 내 데이터 내보내기에서 JSON 형식으로 데이터를 다운로드할 수 있습니다.</li>
          <li>계정 삭제 시 이용자의 여행 데이터는 삭제됩니다. 단, 공유 여행에서 다른 이용자가 작성한 데이터는 유지됩니다.</li>
        </ul>
      </Section>

      <Section id="ota" title="제8조 (OTA 어필리에이트 링크)">
        <ul className="list-disc pl-5 space-y-1">
          <li>서비스는 일정 상세 화면에서 OTA(온라인 여행사) 가격 비교 정보를 제공하며, 해당 링크에는 어필리에이트 코드가 포함됩니다.</li>
          <li>이용자가 어필리에이트 링크를 통해 외부 사이트에서 예약·구매 시, 해당 사이트의 이용약관이 별도 적용됩니다.</li>
          <li>서비스는 외부 OTA 사이트의 가격·서비스 품질·환불 정책에 대해 책임지지 않습니다.</li>
          <li>어필리에이트 수익은 서비스 운영·개선에 사용됩니다.</li>
        </ul>
      </Section>

      <Section id="sharing" title="제9조 (여행 공유 및 협업)">
        <ul className="list-disc pl-5 space-y-1">
          <li>동기화 키를 공유한 상대방은 해당 여행의 일정·비용·체크리스트를 열람·편집할 수 있습니다.</li>
          <li>동기화 키는 이용자가 직접 관리하며, 키 유출로 인한 무단 접근에 대해 서비스는 책임지지 않습니다.</li>
          <li>공유 여행 내 댓글·리액션은 익명 식별자로 표시되며 다른 이용자에게 노출됩니다.</li>
        </ul>
      </Section>

      <Section id="prohibited" title="제10조 (금지 행위)">
        <p>이용자는 다음 행위를 해서는 안 됩니다:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>타인의 계정을 도용하거나 동기화 키를 무단으로 수집·공유하는 행위</li>
          <li>서비스를 이용한 자동화 스크래핑, 크롤링 또는 API 악용</li>
          <li>서비스의 정상 운영을 방해하는 행위 (과도한 요청, 시스템 공격 등)</li>
          <li>불법·유해 콘텐츠를 댓글·공유 기능을 통해 유포하는 행위</li>
          <li>서비스를 상업적 목적으로 무단 이용하는 행위</li>
        </ul>
      </Section>

      <Section id="suspension" title="제11조 (서비스 중단 및 변경)">
        <ul className="list-disc pl-5 space-y-1">
          <li>서비스는 시스템 점검, 장애, 천재지변 등 불가피한 사유로 일시 중단될 수 있습니다.</li>
          <li>서비스 내용의 추가·변경·중단은 사전 공지 후 시행합니다. 단, 긴급 상황은 사후 공지할 수 있습니다.</li>
          <li>무료 서비스의 전부 또는 일부 중단 시 별도 보상 의무는 없습니다.</li>
        </ul>
      </Section>

      <Section id="termination" title="제12조 (계정 해지 및 탈퇴)">
        <ul className="list-disc pl-5 space-y-1">
          <li>이용자는 설정 &gt; 계정 삭제에서 언제든 탈퇴할 수 있습니다.</li>
          <li>탈퇴 시 개인 식별 정보는 즉시 익명화 처리됩니다.</li>
          <li>제10조를 위반한 이용자의 계정은 사전 통보 후 이용이 제한되거나 해지될 수 있습니다.</li>
        </ul>
      </Section>

      <Section id="liability" title="제13조 (책임의 제한)">
        <ul className="list-disc pl-5 space-y-1">
          <li>서비스는 무료로 제공되며, 서비스 이용과 관련하여 고의 또는 중과실이 없는 한 손해배상 책임을 지지 않습니다.</li>
          <li>이용자가 서비스에 게시한 정보·데이터의 정확성과 적법성은 이용자 본인에게 책임이 있습니다.</li>
          <li>외부 API(Google, 카카오, Anthropic 등)의 장애·오류로 인한 서비스 기능 제한에 대해 서비스는 책임을 지지 않습니다.</li>
        </ul>
      </Section>

      <Section id="governing" title="제14조 (준거법 및 관할)">
        <ul className="list-disc pl-5 space-y-1">
          <li>본 약관은 대한민국 법률에 따라 해석됩니다.</li>
          <li>서비스 이용과 관련한 분쟁은 민사소송법에 따른 관할 법원에서 해결합니다.</li>
        </ul>
      </Section>

      <Section id="contact" title="제15조 (문의)">
        <ul className="list-none space-y-1">
          <li>담당: TravelDiary 운영팀</li>
          <li>이메일: <a href="mailto:bizcomhome@gmail.com" className="text-purple-deep hover:underline">bizcomhome@gmail.com</a></li>
        </ul>
        <p className="mt-td-xs">
          서비스 이용 관련 문의·불만·건의는 위 연락처로 접수해 주시면 신속히 처리하겠습니다.
        </p>
      </Section>

    </LegalDocumentShell>
  );
}
