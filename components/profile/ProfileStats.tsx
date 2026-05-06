/**
 * Profile 통계 카드 — 사이클 BLOCKER2.
 *
 * 클라이언트 컴포넌트: LocalStorage에서 받은 공유 수 + 닉네임 표시.
 * tripCount는 서버에서 prop으로 전달.
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listReceivedKeys } from "@/lib/share/receivedKeys";
import { getOrCreateClientUuid, getStoredNickname } from "@/lib/share/clientId";

interface ProfileStatsProps {
  tripCount: number;
  isAuthenticated: boolean;
}

export function ProfileStats({ tripCount, isAuthenticated }: ProfileStatsProps) {
  const [receivedCount, setReceivedCount] = useState(0);
  const [clientUuid, setClientUuid] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);

  useEffect(() => {
    setReceivedCount(listReceivedKeys().length);
    setClientUuid(getOrCreateClientUuid());
    setNickname(getStoredNickname());
  }, []);

  return (
    <section className="space-y-td-sm">
      <h2 className="text-td-card-title text-ink font-bold">내 활동</h2>

      {/* 익명 ID 카드 */}
      <div className="bg-surface-card border border-divider rounded-md p-td-md shadow-sm">
        <div className="flex items-center gap-td-sm mb-td-sm">
          <div className="w-10 h-10 rounded-full bg-purple-soft flex items-center justify-center">
            <span className="material-symbols-outlined text-purple" aria-hidden>
              person
            </span>
          </div>
          <div>
            <p className="text-td-card-title text-ink font-medium">
              {nickname || "익명 여행자"}
            </p>
            {clientUuid && (
              <p className="text-td-caption text-ink-mute tabular-nums">
                ID: {clientUuid.slice(0, 8)}
              </p>
            )}
          </div>
        </div>

        {!isAuthenticated && (
          <p className="text-td-caption text-ink-mute">
            협업 댓글/리액션에 사용되는 익명 ID입니다. 닉네임은{" "}
            <Link href="/shared" className="text-purple-deep underline">
              받은 여행
            </Link>
            에서 변경할 수 있어요.
          </p>
        )}
      </div>

      {/* 숫자 통계 */}
      <div className="grid grid-cols-2 gap-td-sm">
        <Link
          href="/trips"
          className="bg-surface-card border border-divider rounded-md p-td-md text-center hover:border-purple/40 transition-colors"
        >
          <p className="text-2xl font-bold text-purple tabular-nums">{tripCount}</p>
          <p className="text-td-caption text-ink-soft mt-td-xxs">내 여행</p>
        </Link>
        <Link
          href="/shared"
          className="bg-surface-card border border-divider rounded-md p-td-md text-center hover:border-purple/40 transition-colors"
        >
          <p className="text-2xl font-bold text-purple tabular-nums">{receivedCount}</p>
          <p className="text-td-caption text-ink-soft mt-td-xxs">받은 여행</p>
        </Link>
      </div>
    </section>
  );
}
