import { Region, Frame, Arrow, Text, Tag, Box } from '../../viz/primitives.js';

/* Layout constants for the scene, so every step agrees on geometry. */
const REGION = { x: 210, y: 46, w: 250, h: 320 };
const FRAME_X = 228;
const MAIN_Y = 78;
const SQUARE_Y = 186;
const FRAME_H = 90; // 30 header + 2 rows * 26 + 8 padding

const region = () => [
  Region({
    key: 'region',
    x: REGION.x,
    y: REGION.y,
    w: REGION.w,
    h: REGION.h,
    label: 'THE STACK',
    tone: 'stack',
  }),
  Text({
    key: 'hi',
    x: REGION.x + REGION.w + 14,
    y: REGION.y + 12,
    text: 'higher addresses',
    size: 10,
    mono: true,
    opacity: 0.5,
  }),
  Text({
    key: 'lo',
    x: REGION.x + REGION.w + 14,
    y: REGION.y + REGION.h - 8,
    text: 'lower addresses',
    size: 10,
    mono: true,
    opacity: 0.5,
  }),
  Text({
    key: 'grow',
    x: REGION.x + REGION.w + 14,
    y: REGION.y + REGION.h / 2,
    text: 'grows ↓',
    size: 11,
    mono: true,
    tone: 'stack',
    opacity: 0.9,
  }),
];

/* The stack pointer: one arrow that slides to the current top of stack.
   Because it keeps the same key across steps, it travels rather than
   blinking to the new place — and that travel is the lesson. */
const sp = (y) =>
  Arrow({
    key: 'sp',
    from: [138, y],
    to: [REGION.x - 6, y],
    shape: 'straight',
    tone: 'highlight',
    label: 'stack pointer',
    bend: 0,
    thick: true,
  });

export default {
  oneLiner:
    'Where your local variables actually live, and why they vanish the moment a function returns.',

  whyJob:
    'Every "why did this crash" and every "why is this fast" conversation starts here. Returning a pointer to a stack local is the single most common C++ bug that gets a candidate rejected on the spot.',

  mentalModel:
    'Think of a stack of plates by the sink. A function starting is *putting a plate on top*; a function returning is *taking it off*. You can only ever touch the top plate, and that restriction is exactly what makes it fast — the machine does not search for space, it just moves one number.',

  scene: {
    id: 'call-stack',
    title: 'A function call, one frame at a time',
    width: 720,
    height: 400,
    legend: [
      { tone: 'stack', label: 'live stack frame' },
      { tone: 'moved', label: 'popped — memory reusable' },
      { tone: 'highlight', label: 'stack pointer' },
    ],
    steps: [
      {
        say: 'The stack is a plain block of memory with one rule: you may only add or remove at one end. Right now nothing is on it, and the stack pointer sits at the top.',
        mark: [],
        shapes: () => [...region(), sp(REGION.y + 14)],
      },
      {
        say: 'main() starts. The machine reserves a block for its locals — that block is a stack frame. Reserving it costs one instruction: move the stack pointer down.',
        mark: ['8-9'],
        shapes: () => [
          ...region(),
          Frame({
            key: 'main',
            x: FRAME_X,
            y: MAIN_Y,
            label: 'main()',
            vars: [
              { name: 'x', value: '5' },
              { name: 'y', value: '?', tone: 'moved' },
            ],
          }),
          sp(MAIN_Y + FRAME_H + 6),
        ],
      },
      {
        say: 'main() calls square(x). The argument is copied, and a brand-new frame is pushed underneath. main()’s frame is untouched — it is frozen, waiting.',
        mark: ['10', '3'],
        shapes: () => [
          ...region(),
          Frame({
            key: 'main',
            x: FRAME_X,
            y: MAIN_Y,
            label: 'main()',
            vars: [
              { name: 'x', value: '5' },
              { name: 'y', value: '?', tone: 'moved' },
            ],
          }),
          Frame({
            key: 'square',
            x: FRAME_X,
            y: SQUARE_Y,
            label: 'square()',
            tone: 'highlight',
            vars: [
              { name: 'n', value: '5' },
              { name: 'result', value: '?', tone: 'moved' },
            ],
          }),
          sp(SQUARE_Y + FRAME_H + 6),
        ],
      },
      {
        say: 'Inside square(), result is computed. Two frames are alive at once — this is what "the call stack" means when you see it in a debugger.',
        mark: ['4'],
        shapes: () => [
          ...region(),
          Frame({
            key: 'main',
            x: FRAME_X,
            y: MAIN_Y,
            label: 'main()',
            vars: [
              { name: 'x', value: '5' },
              { name: 'y', value: '?', tone: 'moved' },
            ],
          }),
          Frame({
            key: 'square',
            x: FRAME_X,
            y: SQUARE_Y,
            label: 'square()',
            tone: 'highlight',
            vars: [
              { name: 'n', value: '5' },
              { name: 'result', value: '25', tone: 'owned' },
            ],
          }),
          sp(SQUARE_Y + FRAME_H + 6),
        ],
      },
      {
        say: 'square() returns 25. The value is copied out first — then the frame is popped by moving the stack pointer back up. No cleanup loop, no bookkeeping.',
        mark: ['5'],
        shapes: () => [
          ...region(),
          Frame({
            key: 'main',
            x: FRAME_X,
            y: MAIN_Y,
            label: 'main()',
            vars: [
              { name: 'x', value: '5' },
              { name: 'y', value: '25', tone: 'owned' },
            ],
          }),
          Box({
            key: 'ghost',
            x: FRAME_X,
            y: SQUARE_Y,
            w: 190,
            h: FRAME_H,
            label: 'reusable',
            tone: 'moved',
            dashed: true,
            labelSize: 11,
            mono: true,
          }),
          Tag({
            key: 'gone',
            x: FRAME_X + 200,
            y: SQUARE_Y + FRAME_H / 2 - 10,
            text: 'popped',
            tone: 'moved',
          }),
          sp(MAIN_Y + FRAME_H + 6),
        ],
      },
      {
        say: 'The bytes square() used are still physically sitting there — but they are no longer yours. The very next call will write over them. A pointer to result would now be pointing at a landmine.',
        mark: ['11'],
        shapes: () => [
          ...region(),
          Frame({
            key: 'main',
            x: FRAME_X,
            y: MAIN_Y,
            label: 'main()',
            vars: [
              { name: 'x', value: '5' },
              { name: 'y', value: '25', tone: 'owned' },
            ],
          }),
          Box({
            key: 'ghost',
            x: FRAME_X,
            y: SQUARE_Y,
            w: 190,
            h: FRAME_H,
            label: 'stale bytes',
            tone: 'freed',
            dashed: true,
            labelSize: 11,
            mono: true,
          }),
          Tag({
            key: 'gone',
            x: FRAME_X + 200,
            y: SQUARE_Y + FRAME_H / 2 - 10,
            text: 'do not touch',
            tone: 'freed',
          }),
          sp(MAIN_Y + FRAME_H + 6),
        ],
      },
      {
        say: 'main() returns and its frame pops too. The stack is empty again. Nothing was ever manually freed — that automatic cleanup is the whole appeal, and it is why this memory is called "automatic storage".',
        mark: ['12-13'],
        shapes: () => [...region(), sp(REGION.y + 14)],
      },
    ],
  },

  code: {
    lang: 'cpp',
    filename: 'stack.cpp',
    source: `#include <cstdio>

int square(int n) {
    int result = n * n;
    return result;
}

int main() {
    int x = 5;
    int y = square(x);
    printf("%d\\n", y);
    return 0;
}`,
    annotations: [
      {
        lines: '4',
        text: '`result` lives in `square`’s frame. It exists only between the call and the return.',
      },
      {
        lines: '5',
        text: 'The **value** 25 is copied out before the frame disappears. Copying is what makes this safe.',
      },
      {
        lines: '9-10',
        text: '`x` and `y` live in `main`’s frame, which outlives the call to `square`.',
      },
    ],
  },

  deeper: [
    'Physically, the stack pointer is a CPU register — `rsp` on x86-64. "Allocating" a stack frame is a single subtraction on that register, which is why stack allocation is effectively free: there is no search for a free block, no bookkeeping structure, no lock.',
    'Because frames are always pushed and popped in strict order, the memory a function uses is almost always still in the CPU cache from the last call that used it. This is a quiet but enormous performance win, and it is a large part of why passing small values around costs so little.',
    'The stack has a fixed size — typically 1 MB on Windows, 8 MB on Linux by default. Recursion that never terminates, or a very large local array, walks the stack pointer past the end of that region and the program dies with a stack overflow. This is why you do not put a 10 MB buffer in a local variable.',
    'The compiler decides frame layout, and it is free to keep variables purely in registers and never touch memory at all. The diagram above is the *model*; optimised assembly frequently has no frame for a small function because it was inlined away entirely.',
  ],

  gotchas: [
    'Returning a pointer or reference to a local is the classic disaster: `int* f() { int n = 1; return &n; }`. It often *appears* to work, because the bytes have not been overwritten yet. That is the worst possible outcome — a bug that hides.',
    'A large local array (`int buf[1'+'000'+'000];`) will blow the stack. Anything big belongs on the heap, which is the next lesson.',
    'Stack memory is not zeroed. An uninitialised local holds whatever the previous function left there, which is why uninitialised reads produce values that change as you edit unrelated code.',
    'Deep recursion is a stack overflow waiting to happen. Interviewers ask "what if the input has a million elements?" specifically to see whether you noticed.',
  ],

  interview: {
    q: 'What is wrong with this function, and what actually happens when you call it?\n\n`const char* greet() { char msg[] = "hello"; return msg; }`',
    a: [
      '`msg` is an array living in `greet`’s stack frame. Returning it returns a pointer to memory that stops being valid the instant the function returns — the frame is popped, and the stack pointer moves back above those bytes.',
      'The important part of the answer is what happens *next*: this is undefined behaviour, not a guaranteed crash. The bytes are usually still intact immediately after the return, so a quick `printf` often prints "hello" and the bug looks like it is not there. The next function call reuses that region and overwrites it, so the failure shows up somewhere else entirely, often much later. That delayed, action-at-a-distance failure is exactly why this class of bug is so expensive.',
      'The fixes, in rough order of preference: return by value (`std::string`), take a caller-supplied buffer, use a string literal (`return "hello";` is fine, because literals have static storage duration, not automatic), or allocate on the heap and hand back ownership with `std::unique_ptr`. Mentioning that the literal case is safe *and why* is the detail that separates a memorised answer from an understood one.',
    ],
  },

  exercise: [
    'Compile the broken `greet()` above with `-fsanitize=address` and run it. Read the report — AddressSanitizer names the exact bug class, `stack-use-after-return`. Getting comfortable reading sanitizer output now will save you many hours later.',
    'Then write a function that recurses without a base case, run it, and confirm the stack overflow. Print the address of a local at each level; watch the addresses march steadily downward. Seeing the numbers move is what turns "the stack grows down" from a phrase you repeat into something you know.',
  ],
};
