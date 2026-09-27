import MarkdownIt from "markdown-it";
export function safePublicUrl(value, image = false) {
  if (typeof value !== "string" || /[\u0000-\u0020\\]/.test(value))
    throw Error("Unsafe public URL");
  if (/^\/assets\/academy\/(?:material|illustrations)\/[a-z0-9-]+\.(?:png|jpe?g|webp)$/.test(value))
    return value;
  if (!image && /^#[a-z0-9-]+$/.test(value)) return value;
  const u = new URL(value);
  if (u.protocol !== "https:" || u.username || u.password || image)
    throw Error("Unsafe public URL");
  return u.href;
}
export const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: false,
});
markdown.validateLink = (value) => {
  try {
    safePublicUrl(value);
    return true;
  } catch {
    return false;
  }
};
const imageRule = markdown.renderer.rules.image;
markdown.renderer.rules.image = (tokens, index, options, env, self) => {
  const token = tokens[index];
  safePublicUrl(token.attrGet("src"), true);
  token.attrSet("loading", "lazy");
  token.attrSet("decoding", "async");
  return imageRule(tokens, index, options, env, self);
};
markdown.renderer.rules.table_open = () =>
  '<div class="table-scroll" role="region" tabindex="0" aria-label="Tabela do resumo"><table>';
markdown.renderer.rules.table_close = () => "</table></div>";
export function renderMarkdown(text) {
  if (
    /(?:\b[A-Z]:[\\/]|file:|academy-asset:|academy_summary_assets\/|\.local-demo)/i.test(
      text,
    )
  )
    throw Error("Private source path in public Markdown");
  // Editorial exports space table rows apart. Normalize whitespace only; retain every cell.
  return markdown.render(
    text.replace(/(\|[^\n]*\|)\n(?:[ \t]*\n)+(?=\|)/g, "$1\n"),
  );
}
