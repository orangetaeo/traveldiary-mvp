/**
 * JSON-LD 구조화 데이터 — 시나리오 C Phase C3 SEO.
 *
 * 검색 엔진 리치 결과를 위한 Schema.org 마크업.
 */

interface OrganizationProps {
  name: string;
  url: string;
  description: string;
  logo: string;
}

export function OrganizationJsonLd({ name, url, description, logo }: OrganizationProps) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url,
    description,
    logo,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

interface WebAppProps {
  name: string;
  url: string;
  description: string;
  applicationCategory: string;
  operatingSystem: string;
}

export function WebAppJsonLd({ name, url, description, applicationCategory, operatingSystem }: WebAppProps) {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name,
    url,
    description,
    applicationCategory,
    operatingSystem,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "KRW",
    },
    inLanguage: "ko",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
