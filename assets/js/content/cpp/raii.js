import { Region, Box, Arrow, Text, Tag } from '../../viz/primitives.js';

/* One function-scope box that never moves, and one fixed point off to
   the right where "the destructor ran" always lands — no matter which
   line inside the scope sent execution there. That single landing
   point, reached from three different places, is the whole lesson. */
const SCOPE = { x: 30, y: 60, w: 320, h: 300 };
const GUARD = { x: 54, y: 92, w: 270, h: 54 };
const DTOR = { x: 430, y: 168, w: 250, h: 58 };

const EARLY = { x: 66, y: 190 };
const THROW = { x: 66, y: 250 };
const NORMAL = { x: 66, y: 310 };

const scope = (label) => [
  Region({ key: 'scope', ...SCOPE, label: label ?? 'process_order()', tone: 'stack' }),
];

const waypoints = (focusKey) => [
  Tag({
    key: 'wpEarly',
    x: EARLY.x,
    y: EARLY.y,
    text: 'if (!row.valid) return false;',
    tone: focusKey === 'early' ? 'highlight' : 'neutral',
  }),
  Tag({
    key: 'wpThrow',
    x: THROW.x,
    y: THROW.y,
    text: 'parse_line(row.text);  // throws',
    tone: focusKey === 'throw' ? 'highlight' : 'neutral',
  }),
  Tag({
    key: 'wpNormal',
    x: NORMAL.x,
    y: NORMAL.y,
    text: '}  // closing brace',
    tone: focusKey === 'normal' ? 'highlight' : 'neutral',
  }),
];

export default {
  oneLiner:
    'Tying a resource\'s lifetime to an object\'s lifetime, so releasing it stops being something you have to remember to do.',

  whyJob:
    'Nearly every "we leaked a file handle / a lock / a database connection under an error path" production incident in C++ traces back to a resource released with an explicit call instead of a destructor. Interviewers use this to check whether you reason about exception safety by construction or by hoping.',

  mentalModel:
    'Think of the object as a *claim ticket* for the resource: picking up the ticket (construction) happens in the same instant as acquiring the resource, and losing the ticket (destruction) happens in the same instant as giving it back — whether you handed it in politely at the counter or it was *snatched out of your hand* by an exception three calls away. The ticket does not care which one happened. It always gets collected.',

  scene: {
    id: 'raii-exit-paths',
    title: 'Three ways out of a scope, one destructor call',
    width: 720,
    height: 400,
    legend: [
      { tone: 'owned', label: 'resource held (constructed)' },
      { tone: 'highlight', label: 'the exit actually taken' },
      { tone: 'hit', label: 'destructor ran — resource released' },
      { tone: 'freed', label: 'cleanup that was never reached' },
    ],
    steps: [
      {
        say: 'A file on disk is a resource the operating system tracks with a small integer, the file descriptor. Nothing has happened yet — `process_order` has not been called.',
        mark: [],
        shapes: () => [...scope()],
      },
      {
        say: '`FileGuard f("orders.log")` constructs. Its constructor is the acquisition: by the time this line finishes, the OS handle is open and stored inside `f`. From here on, "the file is open" and "`f` exists" are the same fact.',
        mark: ['29'],
        shapes: () => [
          ...scope(),
          Box({ key: 'guard', ...GUARD, tone: 'owned', label: 'FileGuard f', sub: 'fd 7 — open' }),
          ...waypoints(),
        ],
      },
      {
        say: 'Three things can happen next: the row fails validation and the function returns early, `parse_line` throws, or nothing goes wrong and control reaches the closing brace. Each is a different exit — watch where each one actually goes.',
        mark: ['29', '32', '35', '39'],
        shapes: () => [
          ...scope(),
          Box({ key: 'guard', ...GUARD, tone: 'owned', label: 'FileGuard f', sub: 'fd 7 — open' }),
          ...waypoints(),
        ],
      },
      {
        say: 'Say the row is invalid. The function returns at line 32, seven lines before the closing brace. `f`\'s scope ends exactly there, not at the brace — so its destructor fires on the spot, before `return false` is allowed to actually hand control back to the caller.',
        mark: ['32'],
        focus: ['scope', 'guard', 'wpEarly', 'path', 'dtor'],
        shapes: () => [
          ...scope(),
          Box({ key: 'guard', ...GUARD, tone: 'owned', label: 'FileGuard f', sub: 'fd 7 — open' }),
          ...waypoints('early'),
          Arrow({ key: 'path', from: [EARLY.x + 210, EARLY.y + 10], to: [DTOR.x, DTOR.y + 29], tone: 'highlight', bend: -20 }),
          Box({ key: 'dtor', ...DTOR, tone: 'hit', label: '~FileGuard()', sub: 'closes fd 7' }),
        ],
      },
      {
        say: 'Now say validation passes but `parse_line` throws, three calls deep, with no `catch` in `process_order`. There is no `return` on this path, and none of your code runs at the point of the throw — yet exactly the same thing happens: the stack unwinds, and every live local between the throw and the nearest handler is destroyed in reverse order. `f` included.',
        mark: ['35'],
        focus: ['scope', 'guard', 'wpThrow', 'path', 'dtor'],
        predict: {
          ask: 'Does `orders.log` leak its file descriptor when `parse_line` throws here?',
          options: [
            { label: 'Yes — nothing after the throw ever runs, including cleanup', correct: false },
            { label: 'No — unwinding still destroys `f`, which still closes fd 7', correct: true },
            { label: 'Only if the exception is later caught somewhere', correct: false },
          ],
          because:
            'Stack unwinding is not "skip to the nearest catch and hope." The runtime walks back through every stack frame between the throw and the handler and destroys each frame\'s live objects on the way, in reverse construction order — the same mechanism, the same destructor call, whether the frame exits by `return` or by an exception passing through it.',
        },
        shapes: () => [
          ...scope(),
          Box({ key: 'guard', ...GUARD, tone: 'owned', label: 'FileGuard f', sub: 'fd 7 — open' }),
          ...waypoints('throw'),
          Arrow({ key: 'path', from: [THROW.x + 200, THROW.y + 10], to: [DTOR.x, DTOR.y + 29], tone: 'highlight', bend: -10 }),
          Box({ key: 'dtor', ...DTOR, tone: 'hit', label: '~FileGuard()', sub: 'closes fd 7 — even here' }),
        ],
      },
      {
        say: 'And when nothing goes wrong at all, the closing brace is just a third road to the same destination: `f` goes out of scope there too, and the same destructor runs. Three completely different exits, one guaranteed call.',
        mark: ['39'],
        focus: ['scope', 'guard', 'wpNormal', 'path', 'dtor'],
        shapes: () => [
          ...scope(),
          Box({ key: 'guard', ...GUARD, tone: 'owned', label: 'FileGuard f', sub: 'fd 7 — open' }),
          ...waypoints('normal'),
          Arrow({ key: 'path', from: [NORMAL.x + 90, NORMAL.y + 10], to: [DTOR.x, DTOR.y + 29], tone: 'highlight', bend: 0 }),
          Box({ key: 'dtor', ...DTOR, tone: 'hit', label: '~FileGuard()', sub: 'closes fd 7' }),
        ],
      },
      {
        say: 'Now compare the version that manages the handle by hand: a raw `FILE*` and an explicit `fclose(fp)` sitting near the bottom of the function. `fclose` is just a statement — it is not tied to any scope. When the same exception is thrown at the same point, unwinding has nothing of yours to call, and execution jumps straight past it on the way out.',
        mark: [],
        shapes: () => [
          ...scope('process_order_manual()'),
          Box({ key: 'guard', ...GUARD, tone: 'owned', label: 'FILE* fp', sub: 'fd 7 — open' }),
          Tag({
            key: 'wpThrow',
            x: THROW.x,
            y: THROW.y,
            text: 'parse_line(row.text);  // throws',
            tone: 'highlight',
          }),
          Tag({
            key: 'wpNormal',
            x: NORMAL.x,
            y: NORMAL.y,
            text: 'fclose(fp);  // never reached',
            tone: 'freed',
          }),
          Arrow({ key: 'path', from: [THROW.x + 200, THROW.y + 10], to: [DTOR.x, DTOR.y + 29], tone: 'freed', bend: -30 }),
          Box({ key: 'dtor', ...DTOR, tone: 'freed', label: 'fd 7', sub: 'LEAKED — no destructor to call' }),
        ],
      },
    ],
  },

  code: {
    lang: 'cpp',
    filename: 'raii.cpp',
    source: `#include <cstdio>
#include <stdexcept>
#include <string>

class FileGuard {
public:
    explicit FileGuard(const char* path) : fp_(std::fopen(path, "w")) {
        if (!fp_) throw std::runtime_error("could not open file");
    }
    ~FileGuard() {
        if (fp_) std::fclose(fp_);   // runs on every exit path, guaranteed
    }
    FileGuard(const FileGuard&) = delete;
    FileGuard& operator=(const FileGuard&) = delete;

    std::FILE* get() const { return fp_; }

private:
    std::FILE* fp_;
};

struct Row { bool valid; std::string text; };

void parse_line(const std::string& s) {
    if (s.empty()) throw std::runtime_error("empty line");
}

bool process_order(const Row& row) {
    FileGuard f("orders.log");           // acquired here

    if (!row.valid) {
        return false;                    // early exit -- ~FileGuard() still runs
    }

    parse_line(row.text);                // may throw -- ~FileGuard() still runs

    std::fprintf(f.get(), "%s\\n", row.text.c_str());
    return true;                         // normal exit -- ~FileGuard() runs here
}`,
    annotations: [
      {
        lines: '7-9',
        text: 'The constructor does the acquiring. If the file cannot be opened it throws immediately, which means it is impossible to hold a `FileGuard` that does not own a valid handle.',
      },
      {
        lines: '10-12',
        text: 'The destructor is the entire mechanism. It is called automatically at scope exit — by the compiler, not by you — on every path out of that scope, including one it was never told about explicitly.',
      },
      {
        lines: '13-14',
        text: 'Deleted rather than left to the compiler. A `FileGuard` that could be copied would let two objects believe they each owned fd 7, and the second destructor to run would close it twice.',
      },
      {
        lines: '32, 35, 39',
        text: 'Three different exits from `process_order` — an early return, a call that may throw, and the closing brace. All three run `~FileGuard()` on the same object.',
      },
    ],
  },

  deeper: [
    'The mechanism behind "the destructor still runs during an exception" is stack unwinding, and it is generated code, not magic. The compiler emits exception-handling tables alongside the function that record which objects are live at which program points; when a `throw` executes, the runtime walks up the call stack frame by frame, consults that table for each frame, and calls the destructor of every live object in it, in reverse construction order, before moving to the next frame up. This continues until a matching `catch` is found or the program gives up and calls `std::terminate`. Either way, the destructors between the throw and that point have already run.',
    'Languages without RAII approximate this with a keyword: Java and C# have `try`/`finally`, Python has `with`. Each of those requires the programmer to remember, at every call site, to wrap the risky code in the right block. RAII needs no such reminder, because the guarantee lives in the type, not in the calling code — a `FileGuard` is safe everywhere it is used, including in code written by someone who has never heard the word "exception safety". This is why C++ leans on RAII instead of adding a `finally` keyword: the language decided the pattern should be the feature.',
    '`std::lock_guard` and `std::unique_lock` are RAII applied to mutexes: the constructor locks, the destructor unlocks. This is precisely why "forgot to unlock on the error path" is a bug class that has mostly disappeared from modern C++ codebases — not because programmers got more careful, but because the careful part got moved into a type that is used once and then forgotten about correctly.',
    'RAII promises the destructor runs; it does not promise the destructor can fail safely. Destructors are implicitly `noexcept` since C++11, and if one throws while the stack is already unwinding because of a different exception, the runtime calls `std::terminate` immediately — there is no sensible way to have two exceptions in flight for the same stack. This is why cleanup that can genuinely fail, like flushing a buffered write, needs an explicit method — `close()` or `commit()` — that the caller can call and check, with the destructor kept as a non-throwing fallback that does its best if that call was skipped.',
    'This idea is the foundation for everything that follows it in this curriculum. `std::unique_ptr` is RAII applied to a single heap allocation. `std::vector` is RAII applied to a resizable buffer. `std::lock_guard` is RAII applied to a mutex. There is no separate feature for each resource type — one pattern, applied consistently, is what makes C++ memory-safe-by-construction in the cases where it is safe at all.',
  ],

  gotchas: [
    'A destructor that throws while another exception is already unwinding the stack calls `std::terminate` and ends the program immediately. Never let a destructor throw — catch and swallow or log instead.',
    'Leaking the raw handle out of the guard — `FILE* raw = f.get();` stored somewhere and used after `f` is destroyed — recreates the exact bug RAII exists to prevent, just one level removed.',
    'Forgetting to delete (or correctly implement) the copy constructor on a class holding a single owned resource means the compiler generates a shallow copy for you, and the second copy\'s destructor double-frees the resource the first one already released.',
    'RAII only helps the class that actually implements it. A class that stores a raw resource and relies on the caller remembering to call `close()` "eventually" has recreated the manual-management version from the last scene, just hidden one layer down.',
  ],

  interview: {
    q: 'Why is RAII described as making exception safety "free", and what specifically would you look for in a code review to check whether a class actually delivers that benefit?',
    a: [
      'It is free in the sense that the guarantee is proven once, at the class definition, rather than re-derived at every call site. Once `FileGuard`\'s constructor and destructor are written correctly, every function that uses a `FileGuard` local is automatically exception-safe with respect to that resource — nobody calling it has to add a `try`/`catch`, a `finally`, or a mental checklist. The cost of writing the guard is paid once; the safety is inherited everywhere it is used, including call sites nobody has reviewed yet.',
      'In review I would check that the resource is acquired in the constructor rather than a separate `init()` the caller has to remember to call — otherwise there is a window where the object exists without owning anything, and RAII\'s core promise, "existence implies ownership", is already broken. Then I would check that release genuinely happens in the destructor and nowhere else, that copying is either deleted or does a real deep copy with its own resource, and that the destructor cannot throw.',
      'The single most common near-miss is a class that looks like RAII — constructor takes a resource, destructor exists — but also exposes a public `close()` that callers are expected to invoke, with the destructor calling it too "just in case". That is not a bug on the happy path, but it means the resource\'s lifetime is being tracked in two places, which is exactly the discipline RAII is supposed to remove the need for.',
    ],
  },

  exercise: [
    'Build the code block, then add a `printf` inside `FileGuard`\'s constructor and destructor. Call `process_order` three times — once with an invalid row, once with an empty `text` (which makes `parse_line` throw), and once with valid data — wrapping the throwing call in a `try`/`catch` in `main`. Read the order the prints appear in: the destructor print appears before your `catch` block\'s own print runs, for all three calls. That ordering is unwinding, made visible.',
    'Then comment out the body of `~FileGuard()` — leave it empty — rebuild, and run `strace -e openat,close ./raii` (or `lsof -p <pid>` on a long-running variant) on the early-return and exception paths. Watching the `open` with no matching `close` is the negative-space proof that the destructor, not good intentions, was doing the work.',
  ],
};
