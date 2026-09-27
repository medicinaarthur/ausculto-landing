import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  presentation,
  validatePresentation,
  renderPresentationArticles,
  appLink,
} from "./academy-presentation.mjs";
import { renderMarkdown, safePublicUrl } from "./academy-markdown.mjs";
const hash = (s) => createHash("sha256").update(s).digest("hex");
test("published identities with coherent metadata and application deep links", () => {
  assert.equal(validatePresentation().catalogue.length + presentation.ecgModules.length, presentation.source.entryCount);
  assert.equal(presentation.catalogue.length, presentation.source.themeCount);
  assert.ok(presentation.catalogue.every(s=> !/^ecg-\d{2}-/.test(s.summaryId)));
  for (const s of presentation.catalogue) {
    assert.equal(
      new URL(appLink(s.summaryId)).searchParams.get("returnTo"),
      "academy-summary:" + s.summaryId,
    );
    assert.ok(s.title);
  }
  const bad = structuredClone(presentation);
  bad.catalogue[1].summaryId = bad.catalogue[0].summaryId;
  assert.throws(() => validatePresentation(bad));
});
test("selected source sections and image hashes reject drift", () => {
  const bad = structuredClone(presentation);
  bad.articles[0].blocks[0].text += " invented clinical sentence";
  assert.throws(() => validatePresentation(bad), /drift/);
  const missing = structuredClone(presentation);
  missing.articles[0].blocks.pop();
  assert.throws(() => validatePresentation(missing));
  const wrongVersion = structuredClone(presentation);
  wrongVersion.articles[0].version = 'unpublished';
  assert.throws(() => validatePresentation(wrongVersion));
  assert.equal(new Set(presentation.assets.map(a=>a.url)).size,presentation.assets.length);
  for (const a of presentation.assets)
    assert.equal(
      hash(readFileSync(new URL("../site" + a.url, import.meta.url))),
      a.sha256,
    );
});
test("Markdown renders original spaced tables, lists and safe images without raw HTML", () => {
  const html = renderMarkdown(presentation.articles[0].blocks.find(b=>b.title.includes("Tabela Comparativa")).text);
  assert.match(html, /<table>/);
  assert.equal((html.match(/<tr>/g) || []).length, 6);
  assert.match(html, /Gravidez ectópica rota/);
  assert.match(renderMarkdown("- First\n- Second"), /<ul>/);
  const escaped = renderMarkdown("<script>alert(1)</script>");
  assert.doesNotMatch(escaped, /<script>/);
  assert.match(escaped, /&lt;script&gt;/);
  assert.doesNotMatch(
    renderMarkdown("[link](javascript:alert(1))"),
    /href="javascript/,
  );
  for (const url of [
    "javascript:alert(1)",
    "data:image/svg+xml,x",
    "file:///c:/private",
    "//example.com/a",
    "https://u:p@example.com",
    "/assets/academy/material/../secret.png",
    "https://example.com/evil.png",
  ])
    assert.throws(() => safePublicUrl(url, true));
  assert.throws(() => renderMarkdown("C:\\Users\\private"));
});
test("institutional article metadata has no fabricated reviewer or review date", () => {
  const articles = renderPresentationArticles();
  assert.equal(articles.length, 3);
  for (const article of articles) {
    const data = JSON.parse(
      article.html.match(
        /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
      )[1],
    );
    assert.equal(data.author["@type"], "Organization");
    assert.equal(data.author.name, "Ausculto Academy");
    assert.equal(data.dateModified, presentation.articles.find(a=>article.path.includes(a.summaryId)).reviewedAt);
    assert.equal(data.reviewedBy.name, presentation.articles.find(a=>article.path.includes(a.summaryId)).reviewer);
    assert.match(article.html, /Referências/);
    assert.match(article.html, /returnTo=academy-summary%3A/);
  }
});
test("only authorized complete themes expose bodies, never private assets or PDFs", () => {
  const articles=renderPresentationArticles();
  assert.equal(articles.length,3);
  for(const a of presentation.articles) {
    assert.equal(a.blocks.length,a.sectionCount);
    assert.equal(a.blocks.map(b=>b.sourceSha256).join(':'),a.sourceBlockHashes.join(':'));
  }
  for(const a of articles) assert.doesNotMatch(a.html,/academy-asset:|pdfStoragePath|academy_summary_assets|candidate\.json|\.local-demo|local-pdf:/);
  for(const entry of presentation.catalogue) assert.equal(entry.blocks,undefined);
});
test("preview is an isolated allowlisted static package with canonical URLs and noindex", () => {
  const root = new URL(
    "../../ausculto-academy-sites-preview/",
    import.meta.url,
  );
  const manifest = JSON.parse(
    readFileSync(new URL("preview-manifest.json", root), "utf8"),
  );
  assert.equal(
    Object.keys(manifest.files).filter((f) => f.endsWith(".html")).length,
    7,
  );
  for (const [path, sha] of Object.entries(manifest.files)) {
    const data = readFileSync(new URL("out/" + path, root));
    assert.equal(hash(data), sha);
    assert.doesNotMatch(
      path,
      /\.pdf$|candidate|private|source-map|\.local-demo/i,
    );
    if (path.endsWith(".html")) {
      const html = data.toString();
      assert.match(html, /noindex,nofollow,noarchive/);
      assert.match(
        html,
        /<link rel="canonical" href="https:\/\/(?:www|enamed)\.auscultoapp\.com\//,
      );
      assert.doesNotMatch(
        html,
        /<a[^>]+href="https:\/\/www\.auscultoapp\.com\/(?:estudantes|conteudos)/,
      );
    }
  }
});
