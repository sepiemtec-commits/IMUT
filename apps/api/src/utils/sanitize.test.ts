import { describe, expect, it } from "vitest";
import { sanitizeCsvField, escapeXml } from "./sanitize.js";

// ─────────────────────────────────────────────
// sanitizeCsvField
// ─────────────────────────────────────────────
describe("sanitizeCsvField", () => {
  it("retorna valor normal sem alteração", () => {
    expect(sanitizeCsvField("Estoque A")).toBe("Estoque A");
  });

  it("prefixes com aspas simples fórmula com '='", () => {
    expect(sanitizeCsvField("=SUM(A1:A10)")).toBe("'=SUM(A1:A10)");
  });

  it("prefixes com aspas simples fórmula com '+'", () => {
    expect(sanitizeCsvField("+1234")).toBe("'+1234");
  });

  it("prefixes com aspas simples fórmula com '-'", () => {
    expect(sanitizeCsvField("-1234")).toBe("'-1234");
  });

  it("prefixes com aspas simples fórmula com '@'", () => {
    expect(sanitizeCsvField("@SUM")).toBe("'@SUM");
  });

  it("prefixes com aspas simples string com tab", () => {
    expect(sanitizeCsvField("\tCMD")).toBe("'\tCMD");
  });

  it("envolve em aspas duplas campo com vírgula", () => {
    expect(sanitizeCsvField("São Paulo, SP")).toBe('"São Paulo, SP"');
  });

  it("envolve em aspas duplas campo com quebra de linha", () => {
    expect(sanitizeCsvField("linha1\nlinha2")).toBe('"linha1\nlinha2"');
  });

  it("escapa aspas duplas internas duplicando-as", () => {
    expect(sanitizeCsvField('diz "olá"')).toBe('"diz ""olá"""');
  });

  it("combina: fórmula com vírgula — prefix com aspas simples + envolve em aspas duplas", () => {
    // "=MALICIOUS,FOO" → primeiro prefix com ' → "'=MALICIOUS,FOO"
    // depois vírgula detectada → envolvido em aspas duplas: "'=MALICIOUS,FOO""
    const result = sanitizeCsvField("=MALICIOUS,FOO");
    expect(result.startsWith('"')).toBe(true);
    expect(result).toContain("'=MALICIOUS,FOO");
    expect(result.endsWith('"')).toBe(true);
  });
});

// ─────────────────────────────────────────────
// escapeXml
// ─────────────────────────────────────────────
describe("escapeXml", () => {
  it("retorna string sem caracteres especiais sem alteração", () => {
    expect(escapeXml("Câmara Fria")).toBe("Câmara Fria");
  });

  it("escapa &", () => {
    expect(escapeXml("P&G")).toBe("P&amp;G");
  });

  it("escapa <", () => {
    expect(escapeXml("<script>")).toBe("&lt;script&gt;");
  });

  it("escapa >", () => {
    expect(escapeXml("a > b")).toBe("a &gt; b");
  });

  it("escapa aspas duplas", () => {
    expect(escapeXml('valor="teste"')).toBe("valor=&quot;teste&quot;");
  });

  it("escapa aspas simples", () => {
    expect(escapeXml("it's")).toBe("it&apos;s");
  });

  it("escapa payload XSS completo", () => {
    const xss = `<img src=x onerror="alert('xss')">`;
    const result = escapeXml(xss);
    expect(result).not.toContain("<");
    expect(result).not.toContain(">");
    expect(result).not.toContain('"');
    expect(result).toContain("&lt;img");
  });

  it("escapa múltiplos '&' em sequência", () => {
    expect(escapeXml("a & b & c")).toBe("a &amp; b &amp; c");
  });
});
