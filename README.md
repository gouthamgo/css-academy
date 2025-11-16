# CSS Academy 🎨

> Interactive CSS Learning Platform - Learn by Doing

An interactive, hands-on CSS learning playground that allows students and developers to explore CSS concepts through live code editing and instant visual feedback.

![CSS Academy](https://img.shields.io/badge/CSS-Academy-4361ee?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-success?style=for-the-badge)
![Status](https://img.shields.io/badge/status-active-success?style=for-the-badge)

## 🌟 Features

### Current Features (Phase 1)
- ✅ **Live Code Editor**: Edit HTML and CSS in real-time with instant preview
- ✅ **10 Core CSS Concepts**: Comprehensive coverage of essential CSS topics
- ✅ **Copy to Clipboard**: Easy code snippet sharing
- ✅ **Responsive Design**: Mobile-friendly interface
- ✅ **Accessibility**: WCAG compliant with keyboard navigation & screen reader support
- ✅ **Security**: XSS protection with input sanitization
- ✅ **Error Handling**: User-friendly error messages
- ✅ **Keyboard Shortcuts**: Ctrl/Cmd + Enter to run code

### CSS Concepts Covered

#### Layout
- **Flexbox** - Flexible responsive layouts
- **CSS Grid** - Two-dimensional grid systems
- **Position** - Absolute and relative positioning
- **Box Model** - Understanding margin, padding, border

#### Visual Effects
- **Animation** - Keyframe animations
- **Transition** - Smooth property changes
- **Transform** - Rotate, scale, translate effects
- **Filters** - Visual effects (blur, brightness, etc.)
- **Gradients** - Linear, radial, and conic gradients
- **Shadows** - Box shadows and text shadows

## 🚀 Getting Started

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/gouthamgo/css-academy.git
   cd css-academy
   ```

2. **Open in browser**
   ```bash
   # Simply open the HTML file
   open css.html  # macOS
   start css.html # Windows
   xdg-open css.html # Linux
   ```

   Or use a local server:
   ```bash
   # Python 3
   python -m http.server 8000

   # Node.js (with http-server)
   npx http-server
   ```

3. **Start learning!**
   - Navigate to `http://localhost:8000`
   - Select a CSS concept from the sidebar
   - Edit the code and click "Run Code"
   - See instant results in the preview pane

### Deployment

The project is configured for GitHub Pages deployment:

1. Push to `main` branch
2. GitHub Actions automatically deploys to GitHub Pages
3. Access at: `https://[username].github.io/css-academy/`

## 📁 Project Structure

```
css-academy/
├── css.html              # Main HTML file
├── c.css                 # Stylesheet
├── app.js                # Application logic
├── README.md             # Documentation
└── .github/
    └── workflows/
        └── static.yml    # GitHub Pages deployment
```

## 🎯 Usage

### Basic Usage

1. **Select a Concept**: Click on any CSS concept in the left sidebar
2. **Edit Code**: Modify HTML or CSS in the code editor
3. **Run Code**: Click "Run Code" button or press `Ctrl/Cmd + Enter`
4. **View Results**: See live preview in the preview pane
5. **Copy Code**: Click "Copy Code" to copy current code to clipboard

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Enter` | Run code |
| `Tab` | Navigate between concepts |
| `Enter/Space` | Select focused concept |

## 🛠️ Technology Stack

- **HTML5** - Semantic markup
- **CSS3** - Modern CSS features (Grid, Flexbox, Custom Properties)
- **Vanilla JavaScript** - No frameworks, pure ES6+
- **GitHub Actions** - CI/CD for automated deployment

### Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 🗺️ Roadmap

### Phase 2: Enhanced Features (Coming Soon)
- [ ] Monaco Editor integration for syntax highlighting
- [ ] Dark/Light theme toggle
- [ ] LocalStorage save/load functionality
- [ ] Expanded to 20+ CSS concepts
- [ ] Search and filter for concepts
- [ ] Improved mobile experience

### Phase 3: Interactive Learning
- [ ] Challenge mode with exercises
- [ ] Progress tracking
- [ ] Step-by-step tutorials
- [ ] Video/GIF demonstrations
- [ ] Difficulty levels
- [ ] Quiz system

### Phase 4: Social & Advanced
- [ ] URL sharing with encoded snippets
- [ ] Export to CodePen/JSFiddle
- [ ] Community examples gallery
- [ ] Performance optimizations
- [ ] Testing suite
- [ ] Analytics integration

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Development Guidelines

- Follow existing code style
- Add comments for complex logic
- Test across multiple browsers
- Ensure accessibility compliance
- Update documentation as needed

## 🐛 Bug Reports

Found a bug? Please open an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Browser and OS information
- Screenshots if applicable

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by interactive learning platforms
- Built with modern web standards
- Designed for accessibility first

## 📧 Contact

**Project Maintainer**: [Your Name]
- GitHub: [@gouthamgo](https://github.com/gouthamgo)

## 🌐 Live Demo

Visit the live demo: [CSS Academy Live](https://gouthamgo.github.io/css-academy/)

---

**Made with ❤️ for CSS learners everywhere**

*Last updated: 2024*
