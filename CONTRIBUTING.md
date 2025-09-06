# Contributing to Mobile Matrix

Thank you for considering contributing to Mobile Matrix! 🎉

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git
- Basic knowledge of React, TypeScript, and Next.js

### Development Setup

1. **Fork the repository**
   ```bash
   # Click the "Fork" button on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/mobile-matrix.git
   cd mobile-matrix
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Run tests**
   ```bash
   npm test
   ```

## 🤝 How Can I Contribute?

### 🐛 Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates.

**When submitting a bug report, please include:**

- A clear and descriptive title
- Steps to reproduce the behavior
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Environment details (OS, Node.js version, browser)

### 💡 Suggesting Enhancements

Enhancement suggestions are welcome! Please provide:

- A clear and descriptive title
- A detailed description of the proposed feature
- Use cases and benefits
- Possible implementation approach

### 🔧 Code Contributions

We welcome code contributions in these areas:

#### High Priority
- 🧪 **Test Coverage** - Improve test coverage
- 🎨 **UI/UX Improvements** - Better user interface and experience
- 🚀 **Performance** - Optimize response times and resource usage
- 📱 **Mobile Responsiveness** - Improve mobile experience

#### Medium Priority
- 🌍 **Internationalization** - Multi-language support
- 🔌 **API Integrations** - Additional phone data sources
- 🎯 **Accessibility** - Better accessibility features

## 🛠️ Development Workflow

### Branch Naming Convention

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `test/description` - Test improvements

### Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): description

[optional body]
```

**Examples:**
```bash
feat(ai): add function calling support for phone search
fix(ui): resolve mobile navigation menu issue
docs(readme): update installation instructions
test(ai): add unit tests for AI integration
```

## 🔄 Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make your changes**
   - Write clean, readable code
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   ```bash
   npm test
   npm run lint
   npm run type-check
   npm run build
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Create a Pull Request**
   - Use a clear and descriptive title
   - Describe what changes you made and why
   - Link related issues

### Pull Request Checklist

- [ ] Code follows the project's style guidelines
- [ ] Self-review of the code has been performed
- [ ] Tests have been added for new functionality
- [ ] All tests pass locally
- [ ] Documentation has been updated
- [ ] No breaking changes (or clearly documented)

## 📝 Style Guidelines

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow ESLint and Prettier configurations
- Use meaningful variable and function names
- Prefer functional components and hooks

### React Components

- Use functional components with hooks
- Keep components small and focused
- Use proper prop types with TypeScript
- Follow the existing component structure

### CSS/Styling

- Use Tailwind CSS classes
- Follow the existing design system
- Ensure responsive design
- Test on multiple screen sizes

## 🧪 Testing Guidelines

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

- Test files should be in `__tests__` directories
- Use descriptive test names
- Follow the AAA pattern (Arrange, Act, Assert)
- Mock external dependencies

## 📚 Documentation

### Code Documentation

- Add JSDoc comments for public functions
- Include parameter and return type descriptions
- Provide usage examples for complex functions

### README Updates

- Update README.md for new features
- Add examples for new functionality
- Keep installation instructions current

## 🏆 Recognition

Contributors will be recognized in:

- README.md contributors section
- Release notes for significant contributions
- GitHub contributors page

## 💬 Community

### Getting Help

- 💬 **Discussions**: [GitHub Discussions](https://github.com/your-username/mobile-matrix/discussions)
- 🐛 **Issues**: [GitHub Issues](https://github.com/your-username/mobile-matrix/issues)
- 📖 **Documentation**: [README](./README.md)

### Communication Guidelines

- Be respectful and inclusive
- Use clear and concise language
- Provide context for questions
- Search existing discussions before posting

## 🎯 Good First Issues

Looking for a place to start? Check out issues labeled:

- `good first issue` - Perfect for newcomers
- `help wanted` - We need community help
- `documentation` - Improve our docs
- `testing` - Add or improve tests

## 📞 Contact

If you have questions about contributing, feel free to:

- Open a discussion on GitHub
- Create an issue with the "question" label
- Check our documentation

---

**Thank you for contributing to Mobile Matrix! 🙏**

*Together, we're building the best AI-powered phone comparison platform.*