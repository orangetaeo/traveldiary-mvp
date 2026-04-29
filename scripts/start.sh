#!/usr/bin/env sh
# TravelDiary 시작 스크립트 (사이클 5b-1 / ADR-013)
#
# 정책:
#   - DATABASE_URL이 있으면 prisma migrate deploy 후 next start
#   - 없으면 next start만 (데모 모드 — ADR-009/016)
#   - migrate 실패 시 로그 남기고 next start 진행 (앱은 데모 모드로 폴백, healthcheck는 degraded)

set -e

if [ -n "$DATABASE_URL" ]; then
  echo "[start.sh] DATABASE_URL detected — running prisma migrate deploy"
  npx prisma migrate deploy || {
    echo "[start.sh] WARN: migrate deploy failed, falling back to demo via app handling"
  }
else
  echo "[start.sh] no DATABASE_URL — demo mode"
fi

echo "[start.sh] starting next..."
exec npx next start -p "${PORT:-3000}"
