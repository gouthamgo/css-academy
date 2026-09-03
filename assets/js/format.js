/* ============================================================
   Tiny inline formatter, shared by the lesson renderer and the
   diagram engine. Lives in its own module so the two can both
   use it without importing each other.

   Supports `code`, **strong**, *emphasis* and [text](url).
   Everything is escaped first, so lesson text can contain <, >
   and & without ceremony.
   ============================================================ */

export const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

export function fmt(text) {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(
      /\[([^\]]+)\]\(([^)\s]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );
}
