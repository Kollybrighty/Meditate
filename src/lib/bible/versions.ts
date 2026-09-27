export type BibleVersion = {
  id: string;
  abbreviation: string;
  name: string;
  /** bible-api.com identifier when the full text can be shown in the app. */
  bibleApiId?: string;
  /** scripture.api.bible identifier for licensed in-app editions such as NLT. */
  apiBibleId?: string;
  gatewayId: string;
  copyright?: string;
};

export const DEFAULT_BIBLE_VERSION_ID = "web";

/** Default API.Bible edition id for NLT. Override with API_BIBLE_NLT_ID. */
export const DEFAULT_NLT_BIBLE_ID = "065c64f65a13ca21-01";

/** Versions available on daily reading. WEB/KJV use bible-api.com; NLT uses API.Bible. */
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
    apiBibleId: DEFAULT_NLT_BIBLE_ID,
    gatewayId: "NLT",
    copyright:
      "Holy Bible, New Living Translation, copyright © 1996, 2004, 2015 by Tyndale House Foundation. Used by permission of Tyndale House Publishers, Carol Stream, Illinois 60188. All rights reserved.",
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
  return Boolean(version.bibleApiId || version.apiBibleId);
}

export function formatInAppVersionList(): string {
  const names = BIBLE_VERSIONS.filter(hasInAppText).map(
    (version) => version.abbreviation
  );
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

export function bibleGatewayUrl(bookChapter: string, version: BibleVersion): string {
  return `https://www.biblegateway.com/passage/?search=${encodeURIComponent(
    bookChapter
  )}&version=${encodeURIComponent(version.gatewayId)}`;
}
