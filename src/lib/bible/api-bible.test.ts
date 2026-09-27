import { describe, expect, it } from "vitest";
import {
  apiBibleChapterId,
  parseApiBibleContent,
} from "./api-bible";

describe("apiBibleChapterId", () => {
  it("maps canon names to API.Bible chapter ids", () => {
    expect(apiBibleChapterId("Genesis", 1)).toBe("GEN.1");
    expect(apiBibleChapterId("John", 3)).toBe("JHN.3");
    expect(apiBibleChapterId("Song of Solomon", 2)).toBe("SNG.2");
    expect(apiBibleChapterId("1 Corinthians", 13)).toBe("1CO.13");
    expect(apiBibleChapterId("Psalms", 23)).toBe("PSA.23");
  });

  it("rejects unknown books and invalid chapters", () => {
    expect(apiBibleChapterId("Unknown", 1)).toBeNull();
    expect(apiBibleChapterId("John", 0)).toBeNull();
    expect(apiBibleChapterId("John", 3.5)).toBeNull();
  });
});

describe("parseApiBibleContent", () => {
  it("reads verse-span HTML from API.Bible", () => {
    const html = `
      <p class="p"><span class="verse-span" data-verse-id="JHN.3.16"><span data-number="16" class="v">16</span>For this is how God loved the world. </span><span class="verse-span" data-verse-id="JHN.3.17"><span data-number="17" class="v">17</span>God sent his Son into the world.</span></p>
    `;
    expect(parseApiBibleContent(html)).toEqual([
      { verse: 16, text: "For this is how God loved the world." },
      { verse: 17, text: "God sent his Son into the world." },
    ]);
  });

  it("reads verse number spans without verse-span wrappers", () => {
    const html =
      '<p class="p"><span data-number="1" class="v">1</span>In the beginning God created the heavens and the earth. <span data-number="2" class="v">2</span>The earth was formless and empty.</p>';
    expect(parseApiBibleContent(html)).toEqual([
      {
        verse: 1,
        text: "In the beginning God created the heavens and the earth.",
      },
      { verse: 2, text: "The earth was formless and empty." },
    ]);
  });

  it("uses the first number from a combined verse marker", () => {
    const html =
      '<p class="p"><span data-number="2-6" class="v">2-6</span>From Abraham to King David the ancestors are listed.</p>';
    expect(parseApiBibleContent(html)).toEqual([
      {
        verse: 2,
        text: "From Abraham to King David the ancestors are listed.",
      },
    ]);
  });

  it("walks structured JSON content", () => {
    const content = [
      {
        name: "para",
        items: [
          { name: "verse", attrs: { number: "16", sid: "JHN.3.16" } },
          {
            type: "text",
            text: "For this is how God loved the world.",
          },
          { name: "verse", attrs: { sid: "JHN.3.17" } },
          { type: "text", text: "God sent his Son into the world." },
        ],
      },
    ];
    expect(parseApiBibleContent(content)).toEqual([
      { verse: 16, text: "For this is how God loved the world." },
      { verse: 17, text: "God sent his Son into the world." },
    ]);
  });

  it("falls back to [n] plain text", () => {
    expect(
      parseApiBibleContent(
        "[1] In the beginning God created the heavens and the earth. [2] The earth was formless."
      )
    ).toEqual([
      {
        verse: 1,
        text: "In the beginning God created the heavens and the earth.",
      },
      { verse: 2, text: "The earth was formless." },
    ]);
  });

  it("decodes common HTML entities", () => {
    const html =
      '<span data-number="1" class="v">1</span>Jesus said, &quot;Come &amp; see.&quot;';
    expect(parseApiBibleContent(html)).toEqual([
      { verse: 1, text: 'Jesus said, "Come & see."' },
    ]);
  });
});
