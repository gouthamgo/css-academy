const lessons = [
    {
        id: 1,
        title: "Hello CSS",
        desc: "Change colors and see the magic happen!",
        html: '<h1>Hello World!</h1>\n<p>I am learning CSS!</p>',
        css: 'h1 {\n  color: blue;\n  font-size: 3rem;\n}\n\np {\n  color: green;\n}'
    },
    {
        id: 2,
        title: "Box Model",
        desc: "Learn about padding, margin, and borders",
        html: '<div class="box">I am a box!</div>',
        css: '.box {\n  padding: 20px;\n  margin: 10px;\n  border: 3px solid red;\n  background: lightblue;\n}'
    },
    {
        id: 3,
        title: "Flexbox",
        desc: "Create flexible layouts easily",
        html: '<div class="container">\n  <div class="item">1</div>\n  <div class="item">2</div>\n  <div class="item">3</div>\n</div>',
        css: '.container {\n  display: flex;\n  gap: 10px;\n}\n\n.item {\n  padding: 20px;\n  background: coral;\n  color: white;\n}'
    },
    {
        id: 4,
        title: "Hover Effects",
        desc: "Make buttons interactive!",
        html: '<button class="btn">Hover Me!</button>',
        css: '.btn {\n  padding: 15px 30px;\n  background: #4361ee;\n  color: white;\n  border: none;\n  border-radius: 8px;\n  font-size: 1rem;\n  cursor: pointer;\n  transition: all 0.3s;\n}\n\n.btn:hover {\n  background: #3651d4;\n  transform: scale(1.1);\n}'
    },
    {
        id: 5,
        title: "Animations",
        desc: "Create smooth animations",
        html: '<div class="ball"></div>',
        css: '.ball {\n  width: 50px;\n  height: 50px;\n  background: red;\n  border-radius: 50%;\n  animation: bounce 1s infinite;\n}\n\n@keyframes bounce {\n  0%, 100% { transform: translateY(0); }\n  50% { transform: translateY(-50px); }\n}'
    },
    {
        id: 6,
        title: "Grid Layout",
        desc: "Build card layouts with CSS Grid",
        html: '<div class="grid">\n  <div class="card">Card 1</div>\n  <div class="card">Card 2</div>\n  <div class="card">Card 3</div>\n  <div class="card">Card 4</div>\n</div>',
        css: '.grid {\n  display: grid;\n  grid-template-columns: repeat(2, 1fr);\n  gap: 15px;\n}\n\n.card {\n  padding: 30px;\n  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n  color: white;\n  border-radius: 10px;\n  text-align: center;\n}'
    }
];

let currentLesson = 0;
let currentTab = 'html';

const lessonList = document.getElementById('lessonList');
const lessonTitle = document.getElementById('lessonTitle');
const lessonDesc = document.getElementById('lessonDesc');
const htmlCode = document.getElementById('htmlCode');
const cssCode = document.getElementById('cssCode');
const preview = document.getElementById('preview');
const runBtn = document.getElementById('runBtn');
const resetBtn = document.getElementById('resetBtn');
const themeBtn = document.getElementById('themeBtn');
const tabs = document.querySelectorAll('.tab');

function init() {
    renderLessonList();
    loadLesson(0);
    setupEventListeners();
    loadTheme();
}

function renderLessonList() {
    lessonList.innerHTML = lessons.map((lesson, index) => `
        <div class="lesson-item ${index === 0 ? 'active' : ''}" onclick="loadLesson(${index})">
            <strong>Lesson ${lesson.id}</strong>
            <div>${lesson.title}</div>
        </div>
    `).join('');
}

function loadLesson(index) {
    currentLesson = index;
    const lesson = lessons[index];
    lessonTitle.textContent = lesson.title;
    lessonDesc.textContent = lesson.desc;
    htmlCode.value = lesson.html;
    cssCode.value = lesson.css;
    document.querySelectorAll('.lesson-item').forEach((item, i) => {
        item.classList.toggle('active', i === index);
    });
    runCode();
}

function runCode() {
    const html = htmlCode.value;
    const css = cssCode.value;
    const content = `<!DOCTYPE html><html><head><style>body { font-family: Arial, sans-serif; padding: 20px; }${css}</style></head><body>${html}</body></html>`;
    preview.srcdoc = content;
}

function resetLesson() {
    loadLesson(currentLesson);
}

function switchTab(lang) {
    currentTab = lang;
    tabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.lang === lang);
    });
    htmlCode.classList.toggle('active', lang === 'html');
    cssCode.classList.toggle('active', lang === 'css');
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

function setupEventListeners() {
    runBtn.addEventListener('click', runCode);
    resetBtn.addEventListener('click', resetLesson);
    themeBtn.addEventListener('click', toggleTheme);
    tabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.lang));
    });
    let timeout;
    [htmlCode, cssCode].forEach(editor => {
        editor.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(runCode, 500);
        });
    });
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            runCode();
        }
    });
}

init();
