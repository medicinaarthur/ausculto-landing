import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import {
  renderArticles,
  validateRelease,
  renderIndex,
} from "./academy-articles.mjs";

const fixture = () => ({
  schemaVersion: 1,
  releaseId: "test-release",
  summaries: [
    {
      summaryId: "example",
      version: "v1",
      releaseId: "test-release",
      title: "Test <title>",
      description: "An educational test fixture",
      author: "Test Author",
      reviewer: "Test Reviewer",
      reviewedAt: "2026-09-14",
      specialty: "Test",
      publicationAllowed: true,
      rightsCleared: true,
      clinicalReviewed: true,
      published: true,
      blocks: [
        {
          id: "SUM-01",
          type: "concept",
          title: "Public section",
          text: "Public <script>alert(1)</script>",
        },
        {
          id: "SUM-02",
          type: "concept",
          title: "Private section",
          text: "PREMIUM_SENTINEL",
        },
      ],
      publicSectionIds: ["SUM-01"],
      references: [
        { label: "Reference", url: "https://example.org/reference" },
      ],
      pdfStoragePath: "PRIVATE_MASTER_SENTINEL",
      pdfSha256: "PRIVATE_HASH_SENTINEL",
    },
  ],
});

test("public rendering exports only selected sections, no master or body JSON", () => {
  const html = renderArticles(fixture())[0].html;
  assert.ok(html.includes("Public section"));
  assert.ok(!html.includes("PREMIUM_SENTINEL"));
  assert.ok(!html.includes("PRIVATE_MASTER_SENTINEL"));
  assert.ok(!html.includes("PRIVATE_HASH_SENTINEL"));
  assert.ok(html.includes("academy-summary%3Aexample"));
  assert.ok(html.includes('rel="canonical"'));
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(html.includes("application/ld+json"));
});
test("one unapproved summary blocks whole release", () => {
  const release = fixture();
  release.summaries[0].clinicalReviewed = false;
  assert.throws(() => renderArticles(release), /Unapproved/);
});
test("unsafe paths, source URLs and public selection fail closed", () => {
  const release = fixture();
  release.summaries[0].summaryId = "../secret";
  assert.throws(() => validateRelease(release));
  const second = fixture();
  second.summaries[0].references[0].url = "javascript:alert(1)";
  assert.throws(() => validateRelease(second));
  const third = fixture();
  third.summaries[0].publicSectionIds = ["missing"];
  assert.throws(() => validateRelease(third));
});
test("student landing preserves the brand and advertises only available study resources", () => {
  execFileSync(process.execPath, ["scripts/build-site.mjs"], {
    cwd: process.cwd(),
    stdio: "pipe",
  });
  const html = readFileSync("dist/site/estudantes/index.html", "utf8");
  assert.match(html, /class="academy-public academy-students"/);
  assert.match(html, /academy_logo_mark\.png/);
  assert.match(html, /14.345/);
  assert.doesNotMatch(html, /50\.000\+/);
  assert.match(html, /70 mil/);
  assert.doesNotMatch(html, /69 temas|101 temas/);
  assert.match(html, /academy-hero-background.png/);
  assert.match(html, /academy-hero-people-01.png/);
  assert.match(html, /academy-hero-doctor\.png/);
  assert.match(html, /academy-hero-people-01-m\.webp/);
  assert.match(html, /class="sticky-cta"/);
  assert.match(html, /data-rail-dots/);
  assert.match(html, /clipPath id="ah-clip"/);
  assert.match(html, /card-navy\.webp/);
  assert.match(html, /card-cream\.webp/);
  assert.match(html, /path-figure--doctor/);
  assert.strictEqual((html.match(/data-people-pair/g) || []).length, 2);
  assert.strictEqual((html.match(/data-benefit-panel/g) || []).length, 2);
  assert.match(html, /O que você encontra no Ausculto./);
  assert.match(html, /enamed-commented\.webp/);
  assert.strictEqual((html.match(/data-book data-book-name=/g) || []).length, 3);
  assert.match(html, /data-book-name="Gasometria"/);
  assert.strictEqual((html.match(/class="resource-card/g) || []).length, 7);
  assert.match(html, /quiz-torax\.webp/);
  assert.match(html, /trilha-clinica\.webp/);
  assert.match(html, /class="reading-dialog"/);
  assert.match(html, /pro-student.png/);
  assert.match(html, /pro-screen\.png/);
  assert.doesNotMatch(html, /pro-laptop|pro-reading"|academy-hero-desk-overlay/);
  assert.doesNotMatch(html, /pro-panel/);
  assert.match(html, /AUSCULTO PRO/);
  assert.match(html, /R\$ 239,90/);
  assert.match(html, /CNPJ 67\.097\.849\/0001-04/);
  assert.match(html, /suporte@auscultoapp\.com/);
  assert.doesNotMatch(html, /Tópico Clínico 0|Quadro Comparativo e Parâmetros em|sem confirmação|Abrir resumo/);
  assert.doesNotMatch(html, /comentados por especialistas|organizados por especialistas|melhores evidências/);
  assert.match(html, /catalogue-search/);
  assert.doesNotMatch(html, /<table[ >]|sample-excerpt/);
  assert.match(html, /academy-redesign\.css/);
  assert.match(html, /academy-account-loader\.js/);
  assert.match(html, /data-account-open/);
  assert.match(html, /id="academy-account"/);
  assert.doesNotMatch(html, /pr\?ximo|resid\?ncia|quest\?es|forma\?\?o|M\?DICOS/);
  assert.doesNotMatch(html, /hero-natural-|hero-reference-/);
  assert.doesNotMatch(html, /academy-study-scene|Ainda não disponíveis/);
  assert.match(html, /sem assinatura separada por módulo/);
  assert.match(html, /https:\/\/app\.auscultoapp\.com\//);
  assert.doesNotMatch(
    html,
    /learning-sculpture|brand__glyph|academy-campaign__paper|campaign-materials|student-layer|doctor-female|doctor-male|medical-group-natural|brazil-study-context|\/assets\/academy\/study-scene-v1|sonar|constelacao|<video\b/,
  );
});

test("editorial versions accept the backend version grammar", () => {
  const release = fixture();
  release.summaries[0].version = "build-editorial_draft.1";
  assert.doesNotThrow(() => validateRelease(release));
});

test("empty catalog makes no claim that draft material is available", () => {
  assert.ok(renderIndex().includes("revisão editorial"));
});
