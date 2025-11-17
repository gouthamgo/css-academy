/**
 * CSS Academy - Interactive Learning Platform
 * Complete redesign for beginners
 */

(function() {
    'use strict';

    // =============================
    // LESSON CURRICULUM
    // =============================

    const lessons = [
        {
            id: 'intro-css',
            icon: '👋',
            name: 'Welcome to CSS',
            category: 'basics',
            steps: [
                {
                    title: 'What is CSS?',
                    content: 'CSS (Cascading Style Sheets) makes websites look beautiful! It controls colors, sizes, layouts, and animations.',
                    html: '<h1>Hello CSS!</h1>\n<p>I can be styled!</p>',
                    css: 'h1 {\n  color: #4361ee;\n  font-size: 2rem;\n}\n\np {\n  color: #666;\n}',
                    hint: 'Try changing the color values! Use color names like "red" or "blue"'
                },
                {
                    title: 'Your First Style',
                    content: 'Let\'s add a background color! Use the `background-color` property.',
                    html: '<div class="box">\n  I have a background!\n</div>',
                    css: '.box {\n  background-color: lightblue;\n  padding: 20px;\n}',
                    hint: 'Try different colors: pink, yellow, lightgreen!'
                }
            ]
        },
        {
            id: 'colors-fonts',
            icon: '🎨',
            name: 'Colors & Fonts',
            category: 'basics',
            steps: [
                {
                    title: 'Text Colors',
                    content: 'Use `color` to change text color. You can use names, hex codes (#FF0000), or RGB values.',
                    html: '<h2>Colorful Text</h2>\n<p class="red">Red text</p>\n<p class="blue">Blue text</p>',
                    css: '.red {\n  color: #ff0000;\n}\n\n.blue {\n  color: rgb(0, 100, 255);\n}',
                    hint: 'Hex codes start with # followed by 6 characters (0-9, A-F)'
                },
                {
                    title: 'Font Sizes',
                    content: 'Control text size with `font-size`. Use pixels (px), rems, or percentages.',
                    html: '<p class="small">Small text</p>\n<p class="medium">Medium text</p>\n<p class="large">Large text</p>',
                    css: '.small { font-size: 12px; }\n.medium { font-size: 16px; }\n.large { font-size: 24px; }',
                    hint: 'Try changing the pixel values!'
                }
            ]
        },
        {
            id: 'box-model',
            icon: '📦',
            name: 'The Box Model',
            category: 'layout',
            steps: [
                {
                    title: 'Understanding Padding',
                    content: 'Padding creates space INSIDE an element, between content and border.',
                    html: '<div class="padded-box">\n  I have padding!\n</div>',
                    css: '.padded-box {\n  padding: 20px;\n  background: lightblue;\n  border: 2px solid blue;\n}',
                    hint: 'Try changing padding to 40px or 5px!'
                },
                {
                    title: 'Adding Margins',
                    content: 'Margin creates space OUTSIDE an element, between it and other elements.',
                    html: '<div class="box1">Box 1</div>\n<div class="box2">Box 2</div>',
                    css: '.box1, .box2 {\n  background: coral;\n  padding: 10px;\n}\n\n.box1 {\n  margin-bottom: 20px;\n}',
                    hint: 'Margin creates space between boxes!'
                }
            ]
        },
        {
            id: 'flexbox',
            icon: '↔️',
            name: 'Flexbox Layout',
            category: 'layout',
            steps: [
                {
                    title: 'Flexbox Basics',
                    content: 'Flexbox arranges items in rows or columns. Add `display: flex` to the container!',
                    html: '<div class="flex-container">\n  <div class="item">1</div>\n  <div class="item">2</div>\n  <div class="item">3</div>\n</div>',
                    css: '.flex-container {\n  display: flex;\n  gap: 10px;\n}\n\n.item {\n  background: #4361ee;\n  color: white;\n  padding: 20px;\n}',
                    hint: 'Try adding flex-direction: column to the container!'
                },
                {
                    title: 'Centering with Flexbox',
                    content: 'Use `justify-content` and `align-items` to center items perfectly!',
                    html: '<div class="center-box">\n  <div class="centered">Centered!</div>\n</div>',
                    css: '.center-box {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  height: 200px;\n  background: #f0f0f0;\n}\n\n.centered {\n  background: #4361ee;\n  color: white;\n  padding: 20px;\n}',
                    hint: 'Flexbox makes centering super easy!'
                }
            ]
        },
        {
            id: 'grid',
            icon: '📐',
            name: 'CSS Grid',
            category: 'layout',
            steps: [
                {
                    title: 'Grid Basics',
                    content: 'Grid creates 2D layouts with rows and columns. Perfect for card layouts!',
                    html: '<div class="grid-container">\n  <div class="card">1</div>\n  <div class="card">2</div>\n  <div class="card">3</div>\n  <div class="card">4</div>\n</div>',
                    css: '.grid-container {\n  display: grid;\n  grid-template-columns: 1fr 1fr;\n  gap: 10px;\n}\n\n.card {\n  background: #f72585;\n  color: white;\n  padding: 30px;\n  text-align: center;\n}',
                    hint: 'Change 1fr 1fr to 1fr 1fr 1fr for 3 columns!'
                }
            ]
        },
        {
            id: 'animations',
            icon: '✨',
            name: 'Animations',
            category: 'effects',
            steps: [
                {
                    title: 'Hover Effects',
                    content: 'Make elements interactive with :hover! Add transitions for smooth changes.',
                    html: '<button class="cool-button">Hover Me!</button>',
                    css: '.cool-button {\n  background: #4361ee;\n  color: white;\n  padding: 15px 30px;\n  border: none;\n  border-radius: 8px;\n  font-size: 1rem;\n  cursor: pointer;\n  transition: all 0.3s;\n}\n\n.cool-button:hover {\n  background: #3651d4;\n  transform: scale(1.1);\n}',
                    hint: 'Hover over the button to see the effect!'
                },
                {
                    title: 'Keyframe Animations',
                    content: 'Create continuous animations with @keyframes!',
                    html: '<div class="bouncing-ball"></div>',
                    css: '.bouncing-ball {\n  width: 50px;\n  height: 50px;\n  background: #f72585;\n  border-radius: 50%;\n  animation: bounce 1s infinite;\n}\n\n@keyframes bounce {\n  0%, 100% { transform: translateY(0); }\n  50% { transform: translateY(-30px); }\n}',
                    hint: 'The ball bounces forever! Try changing the animation time.'
                }
            ]
        }
    ];

    // =============================
    // CHALLENGES DATA
    // =============================

    const challenges = [
        {
            id: 'challenge-1',
            name: 'Center a Button',
            difficulty: 'easy',
            points: 10,
            description: 'Center a button using Flexbox',
            requirements: [
                'Container must use display: flex',
                'Button must be centered horizontally and vertically',
                'Container height must be at least 200px'
            ],
            starterHTML: '<div class="container">\n  <button>Click Me</button>\n</div>',
            starterCSS: '/* Add your CSS here */\n',
            solution: {
                css: '.container {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  height: 200px;\n}'
            }
        },
        {
            id: 'challenge-2',
            name: 'Colorful Cards',
            difficulty: 'easy',
            points: 15,
            description: 'Create a grid of colorful cards',
            requirements: [
                'Use CSS Grid with 3 columns',
                'Each card should have padding and background color',
                'Add border-radius to make cards rounded'
            ],
            starterHTML: '<div class="grid">\n  <div class="card">Card 1</div>\n  <div class="card">Card 2</div>\n  <div class="card">Card 3</div>\n</div>',
            starterCSS: '/* Create your grid layout */\n',
            solution: {
                css: '.grid {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 15px;\n}\n\n.card {\n  padding: 20px;\n  background: #4361ee;\n  color: white;\n  border-radius: 8px;\n  text-align: center;\n}'
            }
        },
        {
            id: 'challenge-3',
            name: 'Animated Button',
            difficulty: 'medium',
            points: 25,
            description: 'Create a button that grows on hover',
            requirements: [
                'Button must scale up on hover',
                'Use transition for smooth animation',
                'Change background color on hover'
            ],
            starterHTML: '<button class="fancy-btn">Hover Me</button>',
            starterCSS: '/* Make it fancy! */\n',
            solution: {
                css: '.fancy-btn {\n  padding: 15px 30px;\n  background: #4361ee;\n  color: white;\n  border: none;\n  border-radius: 8px;\n  cursor: pointer;\n  transition: all 0.3s ease;\n}\n\n.fancy-btn:hover {\n  transform: scale(1.1);\n  background: #f72585;\n}'
            }
        }
    ];

    // =============================
    // STATE MANAGEMENT
    // =============================

    let currentMode = 'tutorial';
    let currentLesson = 0;
    let currentStep = 0;
    let completedLessons = JSON.parse(localStorage.getItem('completedLessons') || '[]');
    let completedChallenges = JSON.parse(localStorage.getItem('completedChallenges') || '[]');
    let currentTheme = localStorage.getItem('theme') || 'light';

    // =============================
    // DOM ELEMENTS
    // =============================

    const elements = {
        // Mode buttons
        modeBtns: document.querySelectorAll('.mode-btn'),
        modeContents: document.querySelectorAll('.mode-content'),

        // Tutorial elements
        lessonsList: document.getElementById('lessons-list'),
        lessonTitle: document.getElementById('lesson-title'),
        lessonContent: document.getElementById('lesson-content'),
        lessonSteps: document.getElementById('lesson-steps'),
        prevStepBtn: document.getElementById('prev-step'),
        nextStepBtn: document.getElementById('next-step'),

        // Editors
        htmlEditor: document.getElementById('html-editor'),
        cssEditor: document.getElementById('css-editor'),
        editorTabs: document.querySelectorAll('.editor-tab'),

        // Preview
        previewFrame: document.getElementById('preview-frame'),
        runCodeBtn: document.getElementById('run-code'),
        resetCodeBtn: document.getElementById('reset-code'),
        hintBox: document.getElementById('hint-box'),
        hintText: document.getElementById('hint-text'),

        // Playground
        playgroundHTML: document.getElementById('playground-html'),
        playgroundCSS: document.getElementById('playground-css'),
        playgroundPreview: document.getElementById('playground-preview'),
        projectName: document.getElementById('project-name'),
        saveProjectBtn: document.getElementById('save-project'),
        newProjectBtn: document.getElementById('new-project'),

        // Challenges
        challengesList: document.getElementById('challenges-list'),
        challengeTitle: document.getElementById('challenge-title'),
        challengeDifficulty: document.getElementById('challenge-difficulty'),
        challengePoints: document.getElementById('challenge-points'),
        challengeDescription: document.getElementById('challenge-description'),
        challengeRequirements: document.getElementById('challenge-requirements'),
        startChallengeBtn: document.getElementById('start-challenge'),
        challengeBrief: document.getElementById('challenge-brief'),
        challengeEditor: document.getElementById('challenge-editor'),
        challengeHTML: document.getElementById('challenge-html'),
        challengeCSS: document.getElementById('challenge-css'),
        challengePreview: document.getElementById('challenge-preview'),
        submitChallengeBtn: document.getElementById('submit-challenge'),
        challengeValidation: document.getElementById('challenge-validation'),

        // UI
        themeToggle: document.getElementById('theme-toggle'),
        themeIcon: document.getElementById('theme-icon'),
        progressFill: document.getElementById('progress-fill'),
        progressText: document.getElementById('progress-text'),
        toast: document.getElementById('toast'),
        toastMessage: document.getElementById('toast-message'),
        toastIcon: document.getElementById('toast-icon'),
        modal: document.getElementById('success-modal'),
        successMessage: document.getElementById('success-message'),
        continueBtn: document.getElementById('continue-learning'),
        closeModalBtn: document.getElementById('close-modal')
    };

    // =============================
    // INITIALIZATION
    // =============================

    function init() {
        setupTheme();
        setupModeSwitcher();
        setupTutorialMode();
        setupPlaygroundMode();
        setupChallengeMode();
        setupCodeEditors();
        updateProgress();

        // Load first lesson
        loadLesson(0, 0);
    }

    // =============================
    // THEME MANAGEMENT
    // =============================

    function setupTheme() {
        document.documentElement.setAttribute('data-theme', currentTheme);
        elements.themeIcon.textContent = currentTheme === 'dark' ? '☀️' : '🌙';

        elements.themeToggle.addEventListener('click', () => {
            currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', currentTheme);
            elements.themeIcon.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
            localStorage.setItem('theme', currentTheme);
            showToast('Theme changed!', '✓');
        });
    }

    // =============================
    // MODE SWITCHING
    // =============================

    function setupModeSwitcher() {
        elements.modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                switchMode(mode);
            });
        });
    }

    function switchMode(mode) {
        currentMode = mode;

        // Update buttons
        elements.modeBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        // Update content
        elements.modeContents.forEach(content => {
            content.classList.toggle('active', content.id === `${mode}-mode`);
        });

        showToast(`Switched to ${mode} mode`, '✓');
    }

    // =============================
    // TUTORIAL MODE
    // =============================

    function setupTutorialMode() {
        // Populate lessons list
        lessons.forEach((lesson, index) => {
            const item = document.createElement('div');
            item.className = 'lesson-item';
            if (completedLessons.includes(lesson.id)) {
                item.classList.add('completed');
            }

            item.innerHTML = `
                <span class="lesson-icon">${lesson.icon}</span>
                <div class="lesson-info">
                    <div class="lesson-name">${lesson.name}</div>
                    <div class="lesson-progress">${lesson.steps.length} steps</div>
                </div>
                ${completedLessons.includes(lesson.id) ? '<span class="check-icon">✓</span>' : ''}
            `;

            item.addEventListener('click', () => {
                loadLesson(index, 0);
            });

            elements.lessonsList.appendChild(item);
        });

        // Step navigation
        elements.prevStepBtn.addEventListener('click', () => {
            if (currentStep > 0) {
                loadLesson(currentLesson, currentStep - 1);
            }
        });

        elements.nextStepBtn.addEventListener('click', () => {
            const lesson = lessons[currentLesson];
            if (currentStep < lesson.steps.length - 1) {
                loadLesson(currentLesson, currentStep + 1);
            } else {
                completeLesson();
            }
        });
    }

    function loadLesson(lessonIndex, stepIndex) {
        currentLesson = lessonIndex;
        currentStep = stepIndex;

        const lesson = lessons[lessonIndex];
        const step = lesson.steps[stepIndex];

        // Update active lesson in sidebar
        document.querySelectorAll('.lesson-item').forEach((item, index) => {
            item.classList.toggle('active', index === lessonIndex);
        });

        // Update lesson content
        elements.lessonTitle.textContent = step.title;
        elements.lessonContent.innerHTML = `<p>${step.content}</p>`;
        elements.hintText.textContent = step.hint;

        // Update step indicators
        elements.lessonSteps.innerHTML = '';
        lesson.steps.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.className = 'step-dot';
            if (index < stepIndex) dot.classList.add('completed');
            if (index === stepIndex) dot.classList.add('active');
            elements.lessonSteps.appendChild(dot);
        });

        // Load code
        elements.htmlEditor.textContent = step.html;
        elements.cssEditor.textContent = step.css;

        // Update navigation buttons
        elements.prevStepBtn.disabled = stepIndex === 0;
        elements.nextStepBtn.textContent = stepIndex === lesson.steps.length - 1
            ? 'Complete Lesson ✓'
            : 'Next Step →';

        // Run code
        runCode();
    }

    function completeLesson() {
        const lesson = lessons[currentLesson];

        if (!completedLessons.includes(lesson.id)) {
            completedLessons.push(lesson.id);
            localStorage.setItem('completedLessons', JSON.stringify(completedLessons));
            updateProgress();

            elements.successMessage.textContent = `You've completed "${lesson.name}"! Keep learning!`;
            elements.modal.classList.add('active');
        }

        // Move to next lesson
        if (currentLesson < lessons.length - 1) {
            setTimeout(() => {
                loadLesson(currentLesson + 1, 0);
            }, 300);
        }
    }

    // =============================
    // PLAYGROUND MODE
    // =============================

    function setupPlaygroundMode() {
        // Auto-run code
        let typingTimer;
        [elements.playgroundHTML, elements.playgroundCSS].forEach(editor => {
            editor.addEventListener('input', () => {
                clearTimeout(typingTimer);
                typingTimer = setTimeout(runPlaygroundCode, 500);
            });
        });

        // Save project
        elements.saveProjectBtn.addEventListener('click', saveProject);
        elements.newProjectBtn.addEventListener('click', newProject);

        // Initial run
        runPlaygroundCode();
    }

    function runPlaygroundCode() {
        const html = elements.playgroundHTML.textContent;
        const css = elements.playgroundCSS.textContent;

        elements.playgroundPreview.innerHTML = `
            <style>${css}</style>
            ${html}
        `;
    }

    function saveProject() {
        const name = elements.projectName.value || 'Untitled Project';
        const projects = JSON.parse(localStorage.getItem('projects') || '[]');

        projects.push({
            name,
            html: elements.playgroundHTML.textContent,
            css: elements.playgroundCSS.textContent,
            date: new Date().toISOString()
        });

        localStorage.setItem('projects', JSON.stringify(projects));
        showToast('Project saved!', '💾');
    }

    function newProject() {
        elements.playgroundHTML.textContent = '<div class="container">\n  <h1>New Project</h1>\n</div>';
        elements.playgroundCSS.textContent = '.container {\n  padding: 20px;\n}';
        elements.projectName.value = '';
        runPlaygroundCode();
        showToast('New project created!', '✨');
    }

    // =============================
    // CHALLENGE MODE
    // =============================

    function setupChallengeMode() {
        // Populate challenges
        challenges.forEach((challenge, index) => {
            const item = document.createElement('div');
            item.className = 'challenge-item';
            if (completedChallenges.includes(challenge.id)) {
                item.classList.add('completed');
            }

            item.innerHTML = `
                <div style="font-weight: 600; margin-bottom: 4px;">${challenge.name}</div>
                <div style="font-size: 0.875rem; color: var(--text-secondary);">
                    <span class="difficulty-badge ${challenge.difficulty}">${challenge.difficulty}</span>
                    <span style="margin-left: 8px;">${challenge.points} pts</span>
                </div>
            `;

            item.addEventListener('click', () => loadChallenge(index));
            elements.challengesList.appendChild(item);
        });

        // Start challenge button
        elements.startChallengeBtn.addEventListener('click', startChallenge);
        elements.submitChallengeBtn.addEventListener('click', submitChallenge);
    }

    function loadChallenge(index) {
        const challenge = challenges[index];

        elements.challengeTitle.textContent = challenge.name;
        elements.challengeDifficulty.textContent = challenge.difficulty;
        elements.challengeDifficulty.className = `difficulty-badge ${challenge.difficulty}`;
        elements.challengePoints.textContent = `${challenge.points} points`;
        elements.challengeDescription.textContent = challenge.description;

        elements.challengeRequirements.innerHTML = '<h4>Requirements:</h4><ul>' +
            challenge.requirements.map(req => `<li>${req}</li>`).join('') +
            '</ul>';

        elements.challengeBrief.style.display = 'block';
        elements.challengeEditor.style.display = 'none';

        // Store current challenge
        window.currentChallenge = index;
    }

    function startChallenge() {
        const challenge = challenges[window.currentChallenge];

        elements.challengeHTML.textContent = challenge.starterHTML;
        elements.challengeCSS.textContent = challenge.starterCSS;
        elements.challengeBrief.style.display = 'none';
        elements.challengeEditor.style.display = 'block';

        runChallengeCode();
    }

    function runChallengeCode() {
        const html = elements.challengeHTML.textContent;
        const css = elements.challengeCSS.textContent;

        elements.challengePreview.innerHTML = `
            <style>${css}</style>
            ${html}
        `;
    }

    function submitChallenge() {
        const challenge = challenges[window.currentChallenge];
        const userCSS = elements.challengeCSS.textContent;

        // Simple validation (in real app, would be more sophisticated)
        const passed = challenge.requirements.every(req => {
            // Check if certain keywords exist in CSS
            if (req.includes('flex')) return userCSS.includes('display: flex') || userCSS.includes('display:flex');
            if (req.includes('grid')) return userCSS.includes('display: grid') || userCSS.includes('display:grid');
            if (req.includes('center')) return userCSS.includes('center');
            return true;
        });

        if (passed) {
            if (!completedChallenges.includes(challenge.id)) {
                completedChallenges.push(challenge.id);
                localStorage.setItem('completedChallenges', JSON.stringify(completedChallenges));
                updateProgress();
            }

            elements.challengeValidation.innerHTML = `
                <div style="padding: 20px; background: #d4edda; color: #155724; border-radius: 8px; margin-top: 20px;">
                    <h3>✓ Challenge Completed!</h3>
                    <p>You earned ${challenge.points} points! Great work!</p>
                </div>
            `;
            showToast('Challenge completed!', '🏆');
        } else {
            elements.challengeValidation.innerHTML = `
                <div style="padding: 20px; background: #f8d7da; color: #721c24; border-radius: 8px; margin-top: 20px;">
                    <h3>Not quite right...</h3>
                    <p>Review the requirements and try again!</p>
                </div>
            `;
        }
    }

    // =============================
    // CODE EDITORS
    // =============================

    function setupCodeEditors() {
        // Tab switching
        elements.editorTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const lang = tab.dataset.lang;

                elements.editorTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                elements.htmlEditor.classList.toggle('active', lang === 'html');
                elements.cssEditor.classList.toggle('active', lang === 'css');
            });
        });

        // Run and reset buttons
        elements.runCodeBtn.addEventListener('click', runCode);
        elements.resetCodeBtn.addEventListener('click', () => {
            loadLesson(currentLesson, currentStep);
            showToast('Code reset!', '🔄');
        });

        // Auto-run on typing (debounced)
        let typingTimer;
        [elements.htmlEditor, elements.cssEditor].forEach(editor => {
            editor.addEventListener('input', () => {
                clearTimeout(typingTimer);
                typingTimer = setTimeout(runCode, 500);
            });
        });

        // Keyboard shortcut: Ctrl+Enter to run
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                runCode();
                showToast('Code executed!', '▶️');
            }
        });
    }

    function runCode() {
        const html = elements.htmlEditor.textContent;
        const css = elements.cssEditor.textContent;

        try {
            elements.previewFrame.innerHTML = `
                <style>${css}</style>
                ${html}
            `;
        } catch (error) {
            elements.previewFrame.innerHTML = `
                <div style="color: red; padding: 20px;">
                    Error: ${error.message}
                </div>
            `;
        }
    }

    // =============================
    // PROGRESS TRACKING
    // =============================

    function updateProgress() {
        const totalLessons = lessons.length;
        const totalChallenges = challenges.length;
        const total = totalLessons + totalChallenges;
        const completed = completedLessons.length + completedChallenges.length;
        const percentage = Math.round((completed / total) * 100);

        elements.progressFill.style.width = `${percentage}%`;
        elements.progressText.textContent = `${percentage}%`;

        // Update lesson items
        document.querySelectorAll('.lesson-item').forEach((item, index) => {
            const lesson = lessons[index];
            if (completedLessons.includes(lesson.id)) {
                item.classList.add('completed');
                if (!item.querySelector('.check-icon')) {
                    item.innerHTML += '<span class="check-icon">✓</span>';
                }
            }
        });
    }

    // =============================
    // UI HELPERS
    // =============================

    function showToast(message, icon = '✓') {
        elements.toastMessage.textContent = message;
        elements.toastIcon.textContent = icon;
        elements.toast.classList.add('show');

        setTimeout(() => {
            elements.toast.classList.remove('show');
        }, 3000);
    }

    // Modal handlers
    elements.continueBtn.addEventListener('click', () => {
        elements.modal.classList.remove('active');
    });

    elements.closeModalBtn.addEventListener('click', () => {
        elements.modal.classList.remove('active');
    });

    // =============================
    // START THE APP
    // =============================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
