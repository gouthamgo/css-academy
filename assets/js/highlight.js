/* ============================================================
   Minimal syntax highlighter for C++ and Rust.

   Deliberately not a full parser. It is a single-pass tokenizer
   with an ordered alternation: whatever matches first at the
   current position wins. Comments and strings come first so that
   keywords inside them are never highlighted.

   The tokenizer runs over the whole source exactly once. Line
   splitting happens afterwards, on the token stream, so a block
   comment or raw string that spans lines still colours correctly.
   ============================================================ */

const CPP_KEYWORDS = new Set([
  'alignas','alignof','and','asm','auto','break','case','catch','class','concept',
  'const','consteval','constexpr','constinit','const_cast','continue','co_await',
  'co_return','co_yield','decltype','default','delete','do','dynamic_cast','else',
  'enum','explicit','export','extern','false','for','friend','goto','if','inline',
  'mutable','namespace','new','noexcept','not','nullptr','operator','or','private',
  'protected','public','register','reinterpret_cast','requires','return','sizeof',
  'static','static_assert','static_cast','struct','switch','template','this',
  'thread_local','throw','true','try','typedef','typeid','typename','union','using',
  'virtual','volatile','while','xor',
]);

const CPP_TYPES = new Set([
  'bool','char','char8_t','char16_t','char32_t','double','float','int','long',
  'short','signed','unsigned','void','wchar_t','size_t','ptrdiff_t','nullptr_t',
  'int8_t','int16_t','int32_t','int64_t','uint8_t','uint16_t','uint32_t','uint64_t',
  'intptr_t','uintptr_t','std','string','string_view','vector','array','span',
  'unique_ptr','shared_ptr','weak_ptr','optional','variant','tuple','pair','map',
  'unordered_map','set','unordered_set','deque','list','atomic','mutex','thread',
  'function','initializer_list','byte',
]);

const RUST_KEYWORDS = new Set([
  'as','async','await','break','const','continue','crate','dyn','else','enum',
  'extern','false','fn','for','if','impl','in','let','loop','match','mod','move',
  'mut','pub','ref','return','self','Self','static','struct','super','trait','true',
  'type','union','unsafe','use','where','while','box','yield',
]);

const RUST_TYPES = new Set([
  'bool','char','f32','f64','i8','i16','i32','i64','i128','isize','str','u8','u16',
  'u32','u64','u128','usize','String','Vec','Box','Rc','Arc','RefCell','Cell','Mutex',
  'RwLock','Option','Result','Some','None','Ok','Err','HashMap','HashSet','BTreeMap',
  'VecDeque','Cow','Pin','Future','Iterator','IntoIterator','Copy','Clone','Drop',
  'Deref','Send','Sync','Sized','Ordering','AtomicUsize','AtomicU64','AtomicBool',
  'Duration','Instant','PhantomData','MaybeUninit','NonNull',
]);

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* Ordered rules. First match at the cursor wins. */
function rulesFor(lang) {
  const common = [
    ['com', /^\/\/[^\n]*/],
    ['com', /^\/\*[\s\S]*?(?:\*\/|$)/],
    ['num', /^\b0[xXbB][0-9a-fA-F_]+(?:[uif](?:8|16|32|64|128|size)?)?\b/],
    ['num', /^\b\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?(?:[uif](?:8|16|32|64|128|size)?|[fFuUlL]+)?\b/],
  ];

  if (lang === 'rust') {
    return [
      ['com', /^\/\/[^\n]*/],
      ['com', /^\/\*[\s\S]*?(?:\*\/|$)/],
      ['str', /^r#*"[\s\S]*?"#*/],
      ['str', /^b?"(?:[^"\\]|\\[\s\S])*"?/],
      ['str', /^b?'(?:[^'\\]|\\[\s\S])'/],
      ...common.slice(2),
      ['attr', /^#!?\[[\s\S]*?\]/],
      ['macro', /^\b[a-zA-Z_][a-zA-Z0-9_]*!/],
      ['lifetime', /^'(?:static|[a-z_][a-z0-9_]*)\b/],
      ['word', /^\b[A-Za-z_][A-Za-z0-9_]*\b/],
      ['punct', /^[{}()[\];,.:<>+\-*/%!&|^~=?@#]+/],
    ];
  }

  return [
    ['com', /^\/\/[^\n]*/],
    ['com', /^\/\*[\s\S]*?(?:\*\/|$)/],
    ['str', /^R"([^(]*)\([\s\S]*?\)\1"/],
    ['str', /^"(?:[^"\\\n]|\\.)*"?/],
    ['str', /^'(?:[^'\\\n]|\\.)'/],
    ...common.slice(2),
    ['macro', /^#[ \t]*[a-z_]+/],
    ['str', /^<[A-Za-z_][A-Za-z0-9_/]*(?:\.h)?>/],
    ['word', /^\b[A-Za-z_][A-Za-z0-9_]*\b/],
    ['punct', /^[{}()[\];,.:<>+\-*/%!&|^~=?]+/],
  ];
}

function classifyWord(word, lang, rest) {
  const kw = lang === 'rust' ? RUST_KEYWORDS : CPP_KEYWORDS;
  const ty = lang === 'rust' ? RUST_TYPES : CPP_TYPES;
  if (kw.has(word)) return 'kw';
  if (ty.has(word)) return 'ty';
  if (/^\s*\(/.test(rest)) return 'fn';           // called like a function
  if (/^[A-Z][A-Z0-9_]{2,}$/.test(word)) return 'num'; // SCREAMING_CASE constant
  if (/^[A-Z][A-Za-z0-9_]*$/.test(word)) return 'ty';  // PascalCase type
  return null;
}

/**
 * Tokenize source into a flat list of { cls, text }.
 * `cls` is null for text that should be left unstyled.
 */
function tokenize(source, lang) {
  const rules = rulesFor(lang);
  const tokens = [];
  let plain = '';
  let i = 0;

  const flush = () => {
    if (plain) {
      tokens.push({ cls: null, text: plain });
      plain = '';
    }
  };

  outer: while (i < source.length) {
    const rest = source.slice(i);

    for (const [kind, re] of rules) {
      const m = re.exec(rest);
      if (!m || m[0].length === 0) continue;

      const text = m[0];
      if (kind === 'word') {
        const cls = classifyWord(text, lang, rest.slice(text.length));
        if (cls) {
          flush();
          tokens.push({ cls, text });
        } else {
          plain += text;
        }
      } else {
        flush();
        // `lifetime` reuses the string colour but keeps its own semantics.
        tokens.push({ cls: kind === 'lifetime' ? 'str' : kind, text });
      }
      i += text.length;
      continue outer;
    }

    plain += source[i];
    i += 1;
  }

  flush();
  return tokens;
}

const wrap = ({ cls, text }) =>
  cls ? `<span class="tok-${cls}">${esc(text)}</span>` : esc(text);

/** Highlight source into a single HTML string. */
export function highlight(source, lang = 'cpp') {
  return tokenize(source, lang).map(wrap).join('');
}

/**
 * Highlight and wrap each source line in its own element so individual
 * lines can be emphasised. `marked` is an array of 1-based line numbers.
 *
 * Tokens that straddle a newline are split at the boundary and each
 * fragment is wrapped separately, which keeps every line's markup
 * balanced without losing the token's colour.
 */
export function highlightLines(source, lang = 'cpp', marked = []) {
  const set = new Set(marked);
  const lines = [[]];

  for (const token of tokenize(source, lang)) {
    const parts = token.text.split('\n');
    parts.forEach((part, idx) => {
      if (idx > 0) lines.push([]);
      if (part) lines[lines.length - 1].push({ cls: token.cls, text: part });
    });
  }

  return lines
    .map((tokens, idx) => {
      const cls = set.has(idx + 1) ? 'codeline is-marked' : 'codeline';
      const body = tokens.length ? tokens.map(wrap).join('') : '&nbsp;';
      return `<span class="${cls}">${body}</span>`;
    })
    .join('\n');
}
