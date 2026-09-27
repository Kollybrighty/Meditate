import { describe, expect, it } from "vitest";
import {
  formatInAppVersionList,
  getBibleVersion,
  hasInAppText,
} from "./versions";

describe("hasInAppText", () => {
  it("keeps WEB and KJV on the public-domain path", () => {
    expect(hasInAppText(getBibleVersion("web"))).toBe(true);
    expect(hasInAppText(getBibleVersion("kjv"))).toBe(true);
    expect(getBibleVersion("web").bibleApiId).toBe("web");
    expect(getBibleVersion("kjv").bibleApiId).toBe("kjv");
    expect(getBibleVersion("web").apiBibleId).toBeUndefined();
  });

  it("enables in-app NLT through API.Bible", () => {
    const nlt = getBibleVersion("nlt");
    expect(hasInAppText(nlt)).toBe(true);
    expect(nlt.apiBibleId).toBeTruthy();
    expect(nlt.bibleApiId).toBeUndefined();
  });

  it("leaves other licensed editions on Bible Gateway", () => {
    expect(hasInAppText(getBibleVersion("nkjv"))).toBe(false);
    expect(hasInAppText(getBibleVersion("amp"))).toBe(false);
    expect(hasInAppText(getBibleVersion("tpt"))).toBe(false);
  });
});

describe("formatInAppVersionList", () => {
  it("lists WEB, KJV, and NLT", () => {
    expect(formatInAppVersionList()).toBe("WEB, KJV, and NLT");
  });
});
