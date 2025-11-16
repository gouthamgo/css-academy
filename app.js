// CSS Academy - Interactive Learning Platform
// Main Application Logic

(function() {
    'use strict';

    // Concept data
    const conceptData = {
        flexbox: {
            title: "Flexbox",
            description: "Flexbox is a layout model that allows you to design flexible responsive layouts without using float or positioning.",
            html: `<div class="flex-preview">
  <div class="flex-item">Item 1</div>
  <div class="flex-item">Item 2</div>
  <div class="flex-item">Item 3</div>
</div>`,
            css: `.flex-preview {
  display: flex;
  gap: 10px;
  padding: 10px;
  background-color: #e9ecef;
  border-radius: 4px;
}

.flex-item {
  background-color: #4895ef;
  color: white;
  padding: 20px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}`
        },
        grid: {
            title: "CSS Grid",
            description: "CSS Grid is a two-dimensional layout system that handles both rows and columns, perfect for complex web layouts.",
            html: `<div class="grid-preview">
  <div class="grid-item">1</div>
  <div class="grid-item">2</div>
  <div class="grid-item">3</div>
  <div class="grid-item">4</div>
  <div class="grid-item">5</div>
  <div class="grid-item">6</div>
</div>`,
            css: `.grid-preview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 10px;
  background-color: #e9ecef;
  border-radius: 4px;
}

.grid-item {
  background-color: #f72585;
  color: white;
  padding: 20px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}`
        },
        position: {
            title: "Position",
            description: "Positioning allows you to take elements out of normal document flow and place them precisely.",
            html: `<div class="position-preview">
  <div class="position-box" style="top: 20px; left: 20px;">Top Left</div>
  <div class="position-box" style="bottom: 20px; right: 20px;">Bottom Right</div>
</div>`,
            css: `.position-preview {
  position: relative;
  height: 150px;
  background-color: #e9ecef;
  border-radius: 4px;
}

.position-box {
  position: absolute;
  width: 80px;
  height: 80px;
  background-color: #4361ee;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}`
        },
        "box-model": {
            title: "Box Model",
            description: "Every element is a rectangular box with content, padding, border, and margin.",
            html: `<div class="box-model-preview">Box Model</div>`,
            css: `.box-model-preview {
  width: 200px;
  height: 200px;
  padding: 20px;
  border: 10px solid #4895ef;
  margin: 20px;
  background-color: #4361ee;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}`
        },
        animation: {
            title: "Animation",
            description: "CSS animations let you create gradual transitions between style configurations.",
            html: `<div class="animation-preview"></div>`,
            css: `.animation-preview {
  width: 100px;
  height: 100px;
  background-color: #4cc9f0;
  border-radius: 50%;
  margin: 20px auto;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}`
        },
        transition: {
            title: "Transition",
            description: "CSS transitions allow you to change property values smoothly over a specified duration.",
            html: `<div class="transition-preview"></div>`,
            css: `.transition-preview {
  width: 100px;
  height: 100px;
  background-color: #4895ef;
  border-radius: 4px;
  margin: 20px auto;
  transition: all 0.3s ease;
}

.transition-preview:hover {
  transform: scale(1.2);
  background-color: #4361ee;
}`
        },
        transform: {
            title: "Transform",
            description: "CSS transforms let you rotate, scale, skew, or translate elements.",
            html: `<div class="transform-preview">
  <div class="transform-box">Hover Me</div>
</div>`,
            css: `.transform-preview {
  padding: 20px;
  background-color: #e9ecef;
  border-radius: 4px;
  text-align: center;
}

.transform-box {
  width: 100px;
  height: 100px;
  background-color: #4361ee;
  margin: 20px auto;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: transform 0.5s ease;
}

.transform-box:hover {
  transform: rotate(45deg) scale(1.2);
}`
        },
        filters: {
            title: "Filters",
            description: "CSS filters provide graphical effects like blurring, brightening, or color shifting for an element.",
            html: `<div class="filters-preview">
  <div class="filter-box" style="filter: blur(2px);">blur</div>
  <div class="filter-box" style="filter: brightness(150%);">brightness</div>
  <div class="filter-box" style="filter: contrast(200%);">contrast</div>
  <div class="filter-box" style="filter: grayscale(100%);">grayscale</div>
  <div class="filter-box" style="filter: hue-rotate(90deg);">hue</div>
  <div class="filter-box" style="filter: sepia(100%);">sepia</div>
</div>`,
            css: `.filters-preview {
  padding: 20px;
  background-color: #e9ecef;
  border-radius: 4px;
  text-align: center;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.filter-box {
  width: 80px;
  height: 80px;
  background-color: #4361ee;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
}`
        },
        gradients: {
            title: "Gradients",
            description: "CSS gradients let you display smooth transitions between two or more specified colors.",
            html: `<div class="gradient-preview">
  <div class="gradient-box" style="background: linear-gradient(to right, #4361ee, #4cc9f0);">Linear</div>
  <div class="gradient-box" style="background: radial-gradient(circle, #f72585, #3a0ca3);">Radial</div>
  <div class="gradient-box" style="background: conic-gradient(from 45deg, #4361ee, #f72585, #4cc9f0, #4361ee);">Conic</div>
</div>`,
            css: `.gradient-preview {
  height: 200px;
  background-color: #e9ecef;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
}

.gradient-box {
  flex: 1;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
}`
        },
        shadows: {
            title: "Shadows",
            description: "CSS shadows add depth to elements with box-shadow for containers and text-shadow for text.",
            html: `<div class="shadow-preview">
  <div class="shadow-box" style="box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Subtle</div>
  <div class="shadow-box" style="box-shadow: 0 8px 16px rgba(0,0,0,0.3);">Strong</div>
  <div class="shadow-box" style="box-shadow: 0 0 10px rgba(67, 97, 238, 0.5);">Colored</div>
  <div class="shadow-box" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.5); font-size: 1.5rem; font-weight: bold;">Text</div>
</div>`,
            css: `.shadow-preview {
  padding: 20px;
  background-color: #e9ecef;
  border-radius: 4px;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
}

.shadow-box {
  width: 100px;
  height: 100px;
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  color: var(--dark);
  font-size: 0.8rem;
}`
        }
    };

    // DOM Elements
    let conceptItems;
    let conceptTitle;
    let conceptDescription;
    let previewBox;
    let htmlEditor;
    let cssEditor;
    let codeTabs;
    let runBtn;
    let copyBtn;
    let notification;
    let themeToggle;
    let themeIcon;

    // Utility function to sanitize HTML to prevent XSS
    function sanitizeHTML(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    }

    // Function to switch between concepts
    function switchConcept(conceptName) {
        // Update the active class
        conceptItems.forEach(item => {
            if (item.getAttribute('data-concept') === conceptName) {
                item.classList.add('active');
                item.setAttribute('aria-selected', 'true');
            } else {
                item.classList.remove('active');
                item.setAttribute('aria-selected', 'false');
            }
        });

        // Get concept data
        const data = conceptData[conceptName];

        if (!data) {
            console.error(`Concept "${conceptName}" not found`);
            showNotification('Error: Concept not found', 'error');
            return;
        }

        // Update the UI
        conceptTitle.textContent = data.title;
        conceptDescription.textContent = data.description;
        htmlEditor.textContent = data.html;
        cssEditor.textContent = data.css;

        // Run the code
        runCode();
    }

    // Function to run the code
    function runCode() {
        try {
            const html = htmlEditor.textContent || htmlEditor.innerText;
            const css = cssEditor.textContent || cssEditor.innerText;

            // Create sanitized style tag
            const styleTag = document.createElement('style');
            styleTag.textContent = css;

            // Clear preview and add new content
            previewBox.innerHTML = '';
            previewBox.appendChild(styleTag);

            // Create a temporary div to parse HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;

            // Append parsed content to preview
            while (tempDiv.firstChild) {
                previewBox.appendChild(tempDiv.firstChild);
            }
        } catch (e) {
            console.error("Error running code:", e);
            previewBox.innerHTML = `<div style="color: #dc3545; padding: 20px; background: #f8d7da; border-radius: 4px; border: 1px solid #f5c2c7;">
                <strong>Error:</strong> ${sanitizeHTML(e.message)}
            </div>`;
        }
    }

    // Function to show notification
    function showNotification(message = 'Code copied to clipboard!', type = 'success') {
        notification.textContent = message;
        notification.className = 'notification show';

        if (type === 'error') {
            notification.style.backgroundColor = '#dc3545';
        } else {
            notification.style.backgroundColor = '#4cc9f0';
        }

        setTimeout(() => {
            notification.classList.remove('show');
        }, 2000);
    }

    // Function to copy code to clipboard
    function copyCode() {
        const activeEditor = htmlEditor.style.display === 'none' ? cssEditor : htmlEditor;
        const text = activeEditor.textContent;

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                showNotification('Code copied to clipboard!', 'success');
            }).catch(err => {
                console.error('Failed to copy:', err);
                showNotification('Failed to copy code', 'error');
            });
        } else {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                showNotification('Code copied to clipboard!', 'success');
            } catch (err) {
                console.error('Failed to copy:', err);
                showNotification('Failed to copy code', 'error');
            }
            document.body.removeChild(textarea);
        }
    }

    // Function to switch between HTML/CSS tabs
    function switchTab(tabType) {
        codeTabs.forEach(t => {
            t.classList.remove('active');
            t.setAttribute('aria-selected', 'false');
        });

        const activeTab = Array.from(codeTabs).find(t => t.getAttribute('data-tab') === tabType);
        if (activeTab) {
            activeTab.classList.add('active');
            activeTab.setAttribute('aria-selected', 'true');
        }

        if (tabType === 'html') {
            htmlEditor.style.display = 'block';
            cssEditor.style.display = 'none';
        } else {
            htmlEditor.style.display = 'none';
            cssEditor.style.display = 'block';
        }
    }

    // Theme Management
    function getTheme() {
        return localStorage.getItem('css-academy-theme') || 'light';
    }

    function setTheme(theme) {
        localStorage.setItem('css-academy-theme', theme);
        document.documentElement.setAttribute('data-theme', theme);

        // Update icon
        if (themeIcon) {
            themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
        }

        // Update aria-label
        if (themeToggle) {
            themeToggle.setAttribute('aria-label',
                theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
        }
    }

    function toggleTheme() {
        const currentTheme = getTheme();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    }

    // Initialize the application
    function init() {
        // Cache DOM elements
        conceptItems = document.querySelectorAll('.concept-item');
        conceptTitle = document.querySelector('.concept-title');
        conceptDescription = document.querySelector('.concept-description');
        previewBox = document.getElementById('preview');
        htmlEditor = document.getElementById('html-editor');
        cssEditor = document.getElementById('css-editor');
        codeTabs = document.querySelectorAll('.code-tab');
        runBtn = document.getElementById('run-btn');
        copyBtn = document.getElementById('copy-btn');
        notification = document.getElementById('notification');
        themeToggle = document.getElementById('theme-toggle');
        themeIcon = document.getElementById('theme-icon');

        // Initialize theme
        const savedTheme = getTheme();
        setTheme(savedTheme);

        // Add click event to concept items
        conceptItems.forEach(item => {
            item.addEventListener('click', function() {
                const concept = this.getAttribute('data-concept');
                switchConcept(concept);
            });

            // Add keyboard support
            item.setAttribute('role', 'tab');
            item.setAttribute('tabindex', '0');
            item.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const concept = this.getAttribute('data-concept');
                    switchConcept(concept);
                }
            });
        });

        // Switch between HTML/CSS tabs
        codeTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const tabType = this.getAttribute('data-tab');
                switchTab(tabType);
            });
        });

        // Run code button
        runBtn.addEventListener('click', runCode);

        // Copy code button
        copyBtn.addEventListener('click', copyCode);

        // Theme toggle button
        if (themeToggle) {
            themeToggle.addEventListener('click', toggleTheme);
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            // Ctrl/Cmd + Enter to run code
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                runCode();
            }
            // Ctrl/Cmd + S to save (prevent default browser save)
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                showNotification('Auto-save coming soon!', 'success');
            }
        });

        // Initialize with first concept
        runCode();
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
