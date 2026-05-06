/**
 * Prisma DB Seed — 시드 장소 풀 + 데모 trip 초기 데이터.
 *
 * 사용법:
 *   npx tsx prisma/seed.ts
 *
 * 주의: DATABASE_URL이 설정된 상태에서만 실행.
 * 이미 존재하는 Place는 googlePlaceId 기준으로 upsert.
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL 미설정");

const adapter = new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

interface SeedPlace {
  id: string;
  googlePlaceId: string;
  name: string;
  nameLocal: string;
  category: string;
  subCategory: string;
  location: { lat: number; lng: number; address: string };
  estimatedPrice?: { amount: number; currency: string };
  defaultDurationMinutes: number;
  evidence: object;
  photos: string[];
  rating?: number;
  userRatingsTotal?: number;
  qualityScore: number;
  zone: string;
}

async function seedPlaces(cityCode: string, jsonPath: string) {
  if (!existsSync(jsonPath)) {
    console.log(`  ⏭ ${jsonPath} 없음 — 스킵`);
    return 0;
  }

  const places: SeedPlace[] = JSON.parse(readFileSync(jsonPath, "utf-8"));
  console.log(`  ${cityCode}: ${places.length}곳 upsert 시작...`);

  let created = 0;
  let updated = 0;

  for (const p of places) {
    const data = {
      cityCode,
      name: p.name,
      nameLocal: p.nameLocal !== p.name ? p.nameLocal : undefined,
      category: p.category,
      subCategory: p.subCategory,
      lat: p.location.lat,
      lng: p.location.lng,
      address: p.location.address,
      photos: p.photos,
      rating: p.rating ?? undefined,
      userRatingsTotal: p.userRatingsTotal ?? undefined,
      estimatedPrice: p.estimatedPrice ?? undefined,
      evidence: p.evidence as object,
      qualityScore: p.qualityScore,
      zone: p.zone,
      defaultDurationMinutes: p.defaultDurationMinutes,
      isActive: true,
    };

    if (p.googlePlaceId) {
      await prisma.place.upsert({
        where: { googlePlaceId: p.googlePlaceId },
        create: { googlePlaceId: p.googlePlaceId, ...data },
        update: data,
      });
    } else {
      await prisma.place.create({ data });
      created++;
      continue;
    }

    // upsert 결과 카운트 (간이)
    created++;
  }

  console.log(`  ${cityCode}: ${created}곳 완료`);
  return created;
}

async function main() {
  console.log("🌱 시드 시작...\n");

  const root = join(__dirname, "..");
  let total = 0;

  // 푸꾸옥
  total += await seedPlaces(
    "PQC",
    join(root, "lib", "seed", "places", "phu-quoc-places.json"),
  );

  // 다낭 (파이프라인 실행 후 추가됨)
  total += await seedPlaces(
    "DAD",
    join(root, "lib", "seed", "places", "da-nang-places.json"),
  );

  console.log(`\n🌱 시드 완료: 총 ${total}곳`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("시드 실패:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
