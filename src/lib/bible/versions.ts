export type BibleVersion = {
  id: string;
  abbreviation: string;
  name: string;
  /** bible-api.com identifier when the full text can be shown in the app. */
  bibleApiId?: string;
  gatewayId: string;
};

export const DEFAULT_BIBLE_VERSION_ID = "web";

/** Versions available on daily reading. Public-domain text loads in-app. */
export const BIBLE_VERSIONS: BibleVersion[] = [
  {
    id: "web",
    abbreviation: "WEB",
    name: "World English Bible",
    bibleApiId: "web",
    gatewayId: "WEB",
  },
  {
    id: "kjv",
    abbreviation: "KJV",
    name: "King James Version",
    bibleApiId: "kjv",
    gatewayId: "KJV",
  },
  {
    id: "nkjv",
    abbreviation: "NKJV",
    name: "New King James Version",
    gatewayId: "NKJV",
  },
  {
    id: "amp",
    abbreviation: "AMP",
    name: "Amplified Bible",
    gatewayId: "AMP",
  },
  {
    id: "tpt",
    abbreviation: "TPT",
    name: "The Passion Translation",
    gatewayId: "TPT",
  },
  {
    id: "nlt",
    abbreviation: "NLT",
    name: "New Living Translation",
    gatewayId: "NLT",
  },
];

const byId = new Map(BIBLE_VERSIONS.map((version) => [version.id, version]));

export function getBibleVersion(id: string | null | undefined): BibleVersion {
  return byId.get(id ?? "") ?? byId.get(DEFAULT_BIBLE_VERSION_ID)!;
}

export function isBibleVersionId(id: string | null | undefined): id is string {
  return Boolean(id && byId.has(id));
}

export function hasInAppText(version: BibleVersion): boolean {
  return Boolean(version.bibleApiId);
}

export function bibleGatewayUrl(bookChapter: string, version: BibleVersion): string {
  return `https://www.biblegateway.com/passage/?search=${encodeURIComponent(
    bookChapter
  )}&version=${encodeURIComponent(version.gatewayId)}`;
}
