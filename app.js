// CSS Academy 2025 - Comprehensive Curriculum
// Modern CSS Features & Interactive Learning

const lessons = [
    // ============ BEGINNER (1-8) ============
    {
        id: 1,
        title: "Colors & Typography",
        level: "beginner",
        desc: "Learn CSS color formats and typography basics",
        html: '<h1>Hello CSS!</h1>\n<p>Colors make the web beautiful</p>',
        css: 'h1 {\n  color: #6366f1;\n  font-size: 3rem;\n  font-weight: 800;\n}\n\np {\n  color: rgb(139, 92, 246);\n  font-size: 1.25rem;\n}'
    },
    {
        id: 2,
        title: "Box Model",
        level: "beginner",
        desc: "Master padding, margin, and borders",
        html: '<div class="box">Content Area</div>',
        css: '.box {\n  width: 200px;\n  padding: 20px;\n  margin: 30px;\n  border: 4px solid #6366f1;\n  background: #e0e7ff;\n  box-sizing: border-box;\n}'
    },
    {
        id: 3,
        title: "Positioning",
        level: "beginner",
        desc: "Control element positioning (static, relative, absolute, fixed)",
        html: '<div class="container">\n  <div class="box relative">Relative</div>\n  <div class="box absolute">Absolute</div>\n</div>',
        css: '.container {\n  position: relative;\n  height: 300px;\n  background: #f3f4f6;\n}\n\n.box {\n  padding: 15px;\n  background: #6366f1;\n  color: white;\n}\n\n.relative {\n  position: relative;\n  top: 20px;\n  left: 20px;\n}\n\n.absolute {\n  position: absolute;\n  bottom: 20px;\n  right: 20px;\n}'
    },
    {
        id: 4,
        title: "Flexbox Basics",
        level: "beginner",
        desc: "Create flexible one-dimensional layouts",
        html: '<div class="flex-container">\n  <div class="item">1</div>\n  <div class="item">2</div>\n  <div class="item">3</div>\n</div>',
        css: '.flex-container {\n  display: flex;\n  gap: 15px;\n  padding: 20px;\n  background: #f9fafb;\n}\n\n.item {\n  flex: 1;\n  padding: 30px;\n  background: linear-gradient(135deg, #6366f1, #8b5cf6);\n  color: white;\n  text-align: center;\n  border-radius: 12px;\n}'
    },
    {
        id: 5,
        title: "Grid Basics",
        level: "beginner",
        desc: "Build two-dimensional grid layouts",
        html: '<div class="grid">\n  <div class="card">1</div>\n  <div class="card">2</div>\n  <div class="card">3</div>\n  <div class="card">4</div>\n</div>',
        css: '.grid {\n  display: grid;\n  grid-template-columns: repeat(2, 1fr);\n  gap: 20px;\n  padding: 20px;\n}\n\n.card {\n  padding: 40px;\n  background: linear-gradient(135deg, #ec4899, #8b5cf6);\n  color: white;\n  border-radius: 12px;\n  text-align: center;\n  font-size: 1.5rem;\n}'
    },
    {
        id: 6,
        title: "Selectors & Specificity",
        level: "beginner",
        desc: "Target elements with precision",
        html: '<div class="container">\n  <p class="highlight">Class selector</p>\n  <p id="special">ID selector</p>\n  <p>Element selector</p>\n</div>',
        css: '.container p {\n  padding: 10px;\n  margin: 5px;\n}\n\n.highlight {\n  background: #fef3c7;\n  color: #92400e;\n}\n\n#special {\n  background: #dbeafe;\n  color: #1e40af;\n  font-weight: 600;\n}'
    },
    {
        id: 7,
        title: "Pseudo-classes",
        level: "beginner",
        desc: "Style elements based on their state",
        html: '<button class="btn">Hover Me!</button>\n<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n  <li>Item 3</li>\n</ul>',
        css: '.btn {\n  padding: 15px 30px;\n  background: #6366f1;\n  color: white;\n  border: none;\n  border-radius: 8px;\n  cursor: pointer;\n  transition: all 0.3s;\n}\n\n.btn:hover {\n  background: #4f46e5;\n  transform: scale(1.05);\n}\n\nli:nth-child(odd) {\n  background: #e0e7ff;\n}'
    },
    {
        id: 8,
        title: "Pseudo-elements",
        level: "beginner",
        desc: "Create virtual elements with ::before and ::after",
        html: '<p class="quote">CSS is awesome!</p>',
        css: '.quote {\n  position: relative;\n  padding: 20px;\n  background: #f3f4f6;\n  border-left: 4px solid #6366f1;\n}\n\n.quote::before {\n  content: \\"\\201C\\";\n  font-size: 3rem;\n  color: #6366f1;\n  position: absolute;\n  top: -10px;\n  left: 10px;\n}\n\n.quote::after {\n  content: \\"\\201D\\";\n  font-size: 3rem;\n  color: #6366f1;\n}'
    },

    // ============ INTERMEDIATE (9-18) ============
    {
        id: 9,
        title: "Advanced Flexbox",
        level: "intermediate",
        desc: "Master flex-wrap, align-items, and justify-content",
        html: '<div class="flex-advanced">\n  <div class="box">A</div>\n  <div class="box large">B</div>\n  <div class="box">C</div>\n</div>',
        css: '.flex-advanced {\n  display: flex;\n  flex-wrap: wrap;\n  justify-content: space-between;\n  align-items: center;\n  gap: 15px;\n  min-height: 200px;\n  padding: 20px;\n  background: #f9fafb;\n}\n\n.box {\n  padding: 20px;\n  background: #6366f1;\n  color: white;\n  border-radius: 8px;\n}\n\n.large {\n  flex: 1;\n  min-width: 150px;\n}'
    },
    {
        id: 10,
        title: "Advanced Grid",
        level: "intermediate",
        desc: "Grid template areas and complex layouts",
        html: '<div class="grid-layout">\n  <header>Header</header>\n  <aside>Sidebar</aside>\n  <main>Main</main>\n  <footer>Footer</footer>\n</div>',
        css: '.grid-layout {\n  display: grid;\n  grid-template-areas:\n    "header header"\n    "sidebar main"\n    "footer footer";\n  grid-template-columns: 200px 1fr;\n  gap: 15px;\n  min-height: 300px;\n}\n\nheader { grid-area: header; background: #6366f1; }\naside { grid-area: sidebar; background: #8b5cf6; }\nmain { grid-area: main; background: #ec4899; }\nfooter { grid-area: footer; background: #10b981; }\n\nheader, aside, main, footer {\n  padding: 20px;\n  color: white;\n  border-radius: 8px;\n}'
    },
    {
        id: 11,
        title: "Responsive Design",
        level: "intermediate",
        desc: "Media queries and responsive units",
        html: '<div class="responsive">\n  <p>Resize your browser!</p>\n</div>',
        css: '.responsive {\n  padding: clamp(1rem, 5vw, 3rem);\n  background: #6366f1;\n  color: white;\n  border-radius: 12px;\n  font-size: clamp(1rem, 2.5vw, 2rem);\n  text-align: center;\n}\n\n@media (max-width: 768px) {\n  .responsive {\n    background: #ec4899;\n  }\n}\n\n@media (min-width: 769px) {\n  .responsive {\n    background: #10b981;\n  }\n}'
    },
    {
        id: 12,
        title: "Transitions",
        level: "intermediate",
        desc: "Smooth property changes over time",
        html: '<div class="transition-box">Hover for smooth transition</div>',
        css: '.transition-box {\n  padding: 40px;\n  background: #6366f1;\n  color: white;\n  border-radius: 12px;\n  text-align: center;\n  transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);\n}\n\n.transition-box:hover {\n  background: #ec4899;\n  transform: scale(1.1) rotate(5deg);\n  border-radius: 50px;\n}'
    },
    {
        id: 13,
        title: "2D Transforms",
        level: "intermediate",
        desc: "Rotate, scale, skew, and translate",
        html: '<div class="transform-grid">\n  <div class="t-box rotate">Rotate</div>\n  <div class="t-box scale">Scale</div>\n  <div class="t-box skew">Skew</div>\n</div>',
        css: '.transform-grid {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 20px;\n  padding: 40px;\n}\n\n.t-box {\n  padding: 30px;\n  background: #6366f1;\n  color: white;\n  text-align: center;\n  transition: transform 0.3s;\n}\n\n.rotate:hover { transform: rotate(15deg); }\n.scale:hover { transform: scale(1.2); }\n.skew:hover { transform: skewX(10deg); }'
    },
    {
        id: 14,
        title: "3D Transforms",
        level: "intermediate",
        desc: "Add depth with 3D transformations",
        html: '<div class="perspective">\n  <div class="card-3d">3D Card</div>\n</div>',
        css: '.perspective {\n  perspective: 1000px;\n  padding: 50px;\n}\n\n.card-3d {\n  width: 200px;\n  height: 200px;\n  background: linear-gradient(135deg, #6366f1, #8b5cf6);\n  color: white;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  font-size: 1.5rem;\n  transition: transform 0.5s;\n  transform-style: preserve-3d;\n}\n\n.card-3d:hover {\n  transform: rotateY(180deg) rotateX(10deg);\n}'
    },
    {
        id: 15,
        title: "Animations",
        level: "intermediate",
        desc: "Create complex keyframe animations",
        html: '<div class="animated-ball"></div>',
        css: '@keyframes bounce {\n  0%, 100% {\n    transform: translateY(0);\n    background: #6366f1;\n  }\n  50% {\n    transform: translateY(-100px);\n    background: #ec4899;\n  }\n}\n\n.animated-ball {\n  width: 80px;\n  height: 80px;\n  background: #6366f1;\n  border-radius: 50%;\n  margin: 150px auto 50px;\n  animation: bounce 2s ease-in-out infinite;\n  box-shadow: 0 10px 20px rgba(0,0,0,0.2);\n}'
    },
    {
        id: 16,
        title: "Gradients",
        level: "intermediate",
        desc: "Linear, radial, and conic gradients",
        html: '<div class="gradient-grid">\n  <div class="g-box linear">Linear</div>\n  <div class="g-box radial">Radial</div>\n  <div class="g-box conic">Conic</div>\n</div>',
        css: '.gradient-grid {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 15px;\n  padding: 20px;\n}\n\n.g-box {\n  height: 150px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  color: white;\n  font-weight: 600;\n  border-radius: 12px;\n}\n\n.linear {\n  background: linear-gradient(135deg, #6366f1 0%, #ec4899 100%);\n}\n\n.radial {\n  background: radial-gradient(circle, #8b5cf6, #3730a3);\n}\n\n.conic {\n  background: conic-gradient(from 45deg, #6366f1, #ec4899, #10b981, #6366f1);\n}'
    },
    {
        id: 17,
        title: "Shadows",
        level: "intermediate",
        desc: "Box shadows and text shadows for depth",
        html: '<div class="shadow-demo">\n  <h2>Elevated Card</h2>\n  <p>Beautiful shadows create depth</p>\n</div>',
        css: '.shadow-demo {\n  padding: 30px;\n  background: white;\n  border-radius: 16px;\n  box-shadow:\n    0 1px 3px rgba(0,0,0,0.12),\n    0 8px 24px rgba(99,102,241,0.2);\n  transition: box-shadow 0.3s;\n}\n\n.shadow-demo:hover {\n  box-shadow:\n    0 10px 40px rgba(0,0,0,0.15),\n    0 20px 60px rgba(99,102,241,0.3);\n}\n\nh2 {\n  color: #6366f1;\n  text-shadow: 2px 2px 4px rgba(0,0,0,0.1);\n}'
    },
    {
        id: 18,
        title: "Filters",
        level: "intermediate",
        desc: "Apply visual effects with CSS filters",
        html: '<div class="filter-grid">\n  <div class="f-box blur">Blur</div>\n  <div class="f-box bright">Brightness</div>\n  <div class="f-box saturate">Saturate</div>\n</div>',
        css: '.filter-grid {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 15px;\n  padding: 20px;\n}\n\n.f-box {\n  height: 120px;\n  background: linear-gradient(135deg, #6366f1, #8b5cf6);\n  color: white;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  border-radius: 12px;\n  transition: filter 0.3s;\n}\n\n.blur:hover { filter: blur(4px); }\n.bright:hover { filter: brightness(1.5); }\n.saturate:hover { filter: saturate(3); }'
    },

    // ============ ADVANCED (19-26) ============
    {
        id: 19,
        title: "Custom Properties",
        level: "advanced",
        desc: "CSS Variables for dynamic theming",
        html: '<div class="themed" style="--theme-color: #6366f1;">\n  <h3>Custom Theme</h3>\n  <p>Dynamic colors with CSS variables</p>\n</div>',
        css: '.themed {\n  --spacing: 20px;\n  --radius: 12px;\n  \n  padding: var(--spacing);\n  background: var(--theme-color);\n  color: white;\n  border-radius: var(--radius);\n}\n\n.themed:hover {\n  --theme-color: #ec4899;\n  transform: scale(1.02);\n  transition: all 0.3s;\n}'
    },
    {
        id: 20,
        title: "Container Queries",
        level: "advanced",
        desc: "Responsive components based on container size",
        html: '<div class="container-query">\n  <div class="card">Resize me!</div>\n</div>',
        css: '.container-query {\n  container-type: inline-size;\n  resize: horizontal;\n  overflow: auto;\n  border: 2px dashed #6366f1;\n  padding: 20px;\n  max-width: 100%;\n}\n\n.card {\n  padding: 20px;\n  background: #6366f1;\n  color: white;\n  border-radius: 8px;\n}\n\n@container (min-width: 400px) {\n  .card {\n    background: #10b981;\n    padding: 40px;\n  }\n}'
    },
    {
        id: 21,
        title: "CSS Nesting",
        level: "advanced",
        desc: "Write cleaner CSS with nesting (modern browsers)",
        html: '<nav class="nav">\n  <a href="#">Home</a>\n  <a href="#">About</a>\n  <a href="#">Contact</a>\n</nav>',
        css: '.nav {\n  display: flex;\n  gap: 10px;\n  padding: 20px;\n  background: #f3f4f6;\n  border-radius: 12px;\n  \n  a {\n    padding: 10px 20px;\n    background: #6366f1;\n    color: white;\n    text-decoration: none;\n    border-radius: 8px;\n    transition: all 0.3s;\n    \n    &:hover {\n      background: #4f46e5;\n      transform: translateY(-2px);\n    }\n  }\n}'
    },
    {
        id: 22,
        title: "Scroll Snap",
        level: "advanced",
        desc: "Create smooth scrolling experiences",
        html: '<div class="scroll-container">\n  <div class="snap-section" style="background: #6366f1;">Section 1</div>\n  <div class="snap-section" style="background: #8b5cf6;">Section 2</div>\n  <div class="snap-section" style="background: #ec4899;">Section 3</div>\n</div>',
        css: '.scroll-container {\n  height: 300px;\n  overflow-y: scroll;\n  scroll-snap-type: y mandatory;\n  border-radius: 12px;\n}\n\n.snap-section {\n  height: 300px;\n  scroll-snap-align: start;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  color: white;\n  font-size: 2rem;\n  font-weight: 700;\n}'
    },
    {
        id: 23,
        title: "Aspect Ratio",
        level: "advanced",
        desc: "Maintain proportions with aspect-ratio",
        html: '<div class="aspect-grid">\n  <div class="aspect-box square">1:1</div>\n  <div class="aspect-box wide">16:9</div>\n  <div class="aspect-box tall">9:16</div>\n</div>',
        css: '.aspect-grid {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 15px;\n  padding: 20px;\n}\n\n.aspect-box {\n  background: linear-gradient(135deg, #6366f1, #ec4899);\n  color: white;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  border-radius: 12px;\n  font-weight: 600;\n}\n\n.square { aspect-ratio: 1 / 1; }\n.wide { aspect-ratio: 16 / 9; }\n.tall { aspect-ratio: 9 / 16; }'
    },
    {
        id: 24,
        title: "Clamp, Min, Max",
        level: "advanced",
        desc: "Fluid typography and spacing",
        html: '<div class="fluid">\n  <h2>Responsive Text</h2>\n  <p>This scales smoothly with viewport size!</p>\n</div>',
        css: '.fluid {\n  padding: clamp(1rem, 5vw, 4rem);\n  background: #6366f1;\n  color: white;\n  border-radius: 12px;\n}\n\n.fluid h2 {\n  font-size: clamp(1.5rem, 5vw, 3rem);\n  margin-bottom: min(2rem, 5vw);\n}\n\n.fluid p {\n  font-size: clamp(1rem, 2.5vw, 1.5rem);\n  max-width: min(600px, 90vw);\n}'
    },
    {
        id: 25,
        title: "Glassmorphism",
        level: "advanced",
        desc: "Modern frosted glass effect",
        html: '<div class="glass-bg">\n  <div class="glass-card">\n    <h3>Glassmorphism</h3>\n    <p>Frosted glass effect</p>\n  </div>\n</div>',
        css: '.glass-bg {\n  padding: 50px;\n  background: linear-gradient(135deg, #6366f1, #ec4899);\n  border-radius: 12px;\n}\n\n.glass-card {\n  padding: 30px;\n  background: rgba(255, 255, 255, 0.15);\n  backdrop-filter: blur(10px);\n  -webkit-backdrop-filter: blur(10px);\n  border: 1px solid rgba(255, 255, 255, 0.2);\n  border-radius: 16px;\n  color: white;\n  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);\n}'
    },
    {
        id: 26,
        title: "Blend Modes",
        level: "advanced",
        desc: "Mix colors and layers creatively",
        html: '<div class="blend-container">\n  <div class="blend-box" style="background: #6366f1;">Box 1</div>\n  <div class="blend-box" style="background: #ec4899;">Box 2</div>\n</div>',
        css: '.blend-container {\n  position: relative;\n  height: 250px;\n  background: #f3f4f6;\n  border-radius: 12px;\n  padding: 20px;\n}\n\n.blend-box {\n  position: absolute;\n  width: 200px;\n  height: 200px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  color: white;\n  font-weight: 600;\n  border-radius: 12px;\n  mix-blend-mode: multiply;\n}\n\n.blend-box:nth-child(1) { top: 20px; left: 50px; }\n.blend-box:nth-child(2) { top: 80px; left: 150px; }'
    }
];

// ============================================
// Application State
// ============================================

let currentLesson = 0;
let currentTab = 'html';
let currentFilter = 'all';
let autoRunTimeout = null;
let completedLessons = JSON.parse(localStorage.getItem('completedLessons')) || [];

// ============================================
// DOM Elements
// ============================================

const lessonList = document.getElementById('lessonList');
const lessonTitle = document.getElementById('lessonTitle');
const lessonDesc = document.getElementById('lessonDesc');
const lessonBadge = document.getElementById('lessonBadge');
const htmlCode = document.getElementById('htmlCode');
const cssCode = document.getElementById('cssCode');
const preview = document.getElementById('preview');
const previewWrapper = document.getElementById('previewWrapper');
const runBtn = document.getElementById('runBtn');
const resetBtn = document.getElementById('resetBtn');
const copyBtn = document.getElementById('copyBtn');
const themeBtn = document.getElementById('themeBtn');
const toast = document.getElementById('toast');
const toastText = document.getElementById('toastText');
const progressStat = document.getElementById('progress');
const tabs = document.querySelectorAll('.tab');
const filterBtns = document.querySelectorAll('.filter-btn');
const deviceBtns = document.querySelectorAll('.device-btn');

// ============================================
// Initialization
// ============================================

function init() {
    renderLessonList();
    loadLesson(0);
    setupEventListeners();
    loadTheme();
    updateProgress();
}

// ============================================
// Lesson Management
// ============================================

function renderLessonList(filter = 'all') {
    const filteredLessons = filter === 'all'
        ? lessons
        : lessons.filter(l => l.level === filter);

    lessonList.innerHTML = filteredLessons.map((lesson, index) => {
        const isCompleted = completedLessons.includes(lesson.id);
        const actualIndex = lessons.findIndex(l => l.id === lesson.id);
        return `
            <div class="lesson-item ${actualIndex === currentLesson ? 'active' : ''}"
                 onclick="loadLesson(${actualIndex})"
                 data-level="${lesson.level}">
                <div class="lesson-number">Lesson ${lesson.id}</div>
                <div class="lesson-name">${lesson.title} ${isCompleted ? '✓' : ''}</div>
                <span class="lesson-level">${lesson.level}</span>
            </div>
        `;
    }).join('');
}

function loadLesson(index) {
    currentLesson = index;
    const lesson = lessons[index];

    lessonTitle.textContent = lesson.title;
    lessonDesc.textContent = lesson.desc;
    lessonBadge.textContent = lesson.level.toUpperCase();
    lessonBadge.style.background = getLevelColor(lesson.level);

    htmlCode.value = lesson.html;
    cssCode.value = lesson.css;

    document.querySelectorAll('.lesson-item').forEach((item, i) => {
        const itemIndex = lessons.findIndex(l => l.id === parseInt(item.querySelector('.lesson-number').textContent.split(' ')[1]));
        item.classList.toggle('active', itemIndex === index);
    });

    runCode();

    // Mark as completed after viewing
    if (!completedLessons.includes(lesson.id)) {
        completedLessons.push(lesson.id);
        localStorage.setItem('completedLessons', JSON.stringify(completedLessons));
        updateProgress();
        renderLessonList(currentFilter);
    }
}

function getLevelColor(level) {
    const colors = {
        beginner: 'linear-gradient(135deg, #10b981, #059669)',
        intermediate: 'linear-gradient(135deg, #f59e0b, #d97706)',
        advanced: 'linear-gradient(135deg, #ef4444, #dc2626)'
    };
    return colors[level] || colors.beginner;
}

function updateProgress() {
    progressStat.textContent = completedLessons.length;
}

// ============================================
// Code Execution
// ============================================

function runCode() {
    const html = htmlCode.value;
    const css = cssCode.value;
    const content = `<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            padding: 20px;
            margin: 0;
        }
        ${css}
    </style>
</head>
<body>${html}</body>
</html>`;

    preview.srcdoc = content;
}

function resetLesson() {
    loadLesson(currentLesson);
    showToast('Code reset to default');
}

function copyCode() {
    const activeEditor = currentTab === 'html' ? htmlCode : cssCode;
    const text = activeEditor.value;

    navigator.clipboard.writeText(text).then(() => {
        showToast('Code copied to clipboard!');
    }).catch(err => {
        showToast('Failed to copy code');
    });
}

// ============================================
// UI Controls
// ============================================

function switchTab(lang) {
    currentTab = lang;
    tabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.lang === lang);
    });
    htmlCode.classList.toggle('active', lang === 'html');
    cssCode.classList.toggle('active', lang === 'css');
}

function filterLessons(level) {
    currentFilter = level;
    filterBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === level);
    });
    renderLessonList(level);
}

function switchDevice(device) {
    deviceBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.device === device);
    });

    previewWrapper.className = 'preview-wrapper';
    if (device !== 'desktop') {
        previewWrapper.classList.add(device);
    }
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    themeBtn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('theme', newTheme);
}

function loadTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    themeBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function showToast(message) {
    toastText.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

// ============================================
// Event Listeners
// ============================================

function setupEventListeners() {
    // Buttons
    runBtn.addEventListener('click', runCode);
    resetBtn.addEventListener('click', resetLesson);
    copyBtn.addEventListener('click', copyCode);
    themeBtn.addEventListener('click', toggleTheme);

    // Tabs
    tabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.lang));
    });

    // Filters
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => filterLessons(btn.dataset.filter));
    });

    // Device Toggle
    deviceBtns.forEach(btn => {
        btn.addEventListener('click', () => switchDevice(btn.dataset.device));
    });

    // Auto-run on code change
    [htmlCode, cssCode].forEach(editor => {
        editor.addEventListener('input', () => {
            clearTimeout(autoRunTimeout);
            autoRunTimeout = setTimeout(runCode, 500);
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Enter to run
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            runCode();
        }
        // Ctrl/Cmd + S to save (prevent browser save)
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            showToast('Auto-save active!');
        }
        // Arrow keys for navigation
        if (e.altKey && e.key === 'ArrowRight' && currentLesson < lessons.length - 1) {
            loadLesson(currentLesson + 1);
        }
        if (e.altKey && e.key === 'ArrowLeft' && currentLesson > 0) {
            loadLesson(currentLesson - 1);
        }
    });
}

// ============================================
// Start Application
// ============================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
