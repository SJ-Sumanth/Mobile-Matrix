# 📱 Mobile Matrix - AI-Powered Phone Comparison Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Google AI](https://img.shields.io/badge/Google%20AI-Flash%202.5-orange)](https://ai.google.dev/)

> An intelligent phone comparison platform powered by Google's Flash 2.5 AI model, providing personalized recommendations and detailed comparisons to help users find their perfect smartphone.

## ✨ Features

- 🤖 **AI-Powered Chat Interface** - Interactive conversations using Google Flash 2.5
- 📊 **Advanced Phone Comparisons** - Detailed side-by-side analysis with scoring
- 🎯 **Smart Recommendations** - Personalized suggestions based on user preferences
- 📱 **Comprehensive Database** - Extensive phone specifications and pricing data
- 🚀 **Real-time Performance** - Fast responses with intelligent caching
- 🎨 **Modern UI/UX** - Responsive design with dark/light theme support
- 🔒 **Production Ready** - Complete deployment infrastructure with monitoring

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+**
- **npm or yarn**
- **Google AI Studio Account** (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/mobile-matrix.git
   cd mobile-matrix
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your configuration:
   ```bash
   # Required: Get your API key from https://aistudio.google.com/
   GEMINI_API_KEY="your_gemini_api_key_here"
   
   # Database (optional for development)
   DATABASE_URL="your_database_url"
   
   # Other optional configurations...
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🏗️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Custom Design System
- **AI**: Google Gemini Flash 2.5 with Function Calling
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for performance optimization
- **Testing**: Vitest, Testing Library, Playwright
- **Deployment**: Docker, Kubernetes, Nginx
- **Monitoring**: Prometheus, Grafana, AlertManager

## 📖 Documentation

- 📋 **[Complete Project Documentation](PROJECT_DOCUMENTATION.md)** - Comprehensive guide
- 🤖 **[AI Setup Guide](AI_SETUP.md)** - Google Flash 2.5 configuration
- 🚀 **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment
- 🔧 **[Operations Runbook](docs/OPERATIONS.md)** - Maintenance and troubleshooting

## 🎯 Key Capabilities

### AI-Powered Features
- **Natural Language Processing** - Understand user queries in conversational format
- **Function Calling** - Dynamic phone searches and real-time comparisons
- **Context Awareness** - Maintain conversation history for better recommendations
- **Safety Filtering** - Content moderation and appropriate responses

### Phone Comparison Engine
- **Multi-dimensional Analysis** - Camera, battery, performance, display, design scores
- **Intelligent Scoring** - Weighted comparisons based on user priorities
- **Visual Comparisons** - Interactive charts and detailed breakdowns
- **Price Tracking** - Real-time pricing from multiple sources

### Performance & Scalability
- **Flash 2.5 Speed** - 2x faster responses than previous AI models
- **Intelligent Caching** - Redis-based caching for optimal performance
- **Auto-scaling** - Kubernetes deployment with horizontal pod autoscaling
- **Monitoring** - Comprehensive observability with metrics and alerts

## � ️ Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Testing
npm test                # Run all tests
npm run test:unit       # Run unit tests
npm run test:e2e        # Run end-to-end tests
npm run test:coverage   # Run tests with coverage

# Code Quality
npm run lint            # Run ESLint
npm run format          # Format code with Prettier
npm run type-check      # TypeScript type checking

# Database
npm run db:migrate      # Run database migrations
npm run db:seed         # Seed database with sample data
```

### Project Structure

```
src/
├── app/                 # Next.js App Router
├── components/          # React components
│   ├── chat/           # Chat interface
│   ├── comparison/     # Phone comparison
│   ├── phone/          # Phone selection
│   └── ui/             # Reusable UI components
├── services/           # Business logic
│   ├── ai.ts          # Advanced AI service (Flash 2.5)
│   └── external/      # External API integrations
├── types/             # TypeScript definitions
└── utils/             # Utility functions
```

## 🚀 Deployment

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Production deployment
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes Deployment

```bash
# Deploy to Kubernetes
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n mobile-matrix
```

### Environment Configuration

The application supports multiple deployment environments:

- **Development** - Local development with hot reloading
- **Staging** - Pre-production testing environment
- **Production** - Full production deployment with monitoring

## 📊 Monitoring & Observability

- **Grafana Dashboards** - Visual metrics and performance monitoring
- **Prometheus Metrics** - Application and infrastructure metrics
- **Health Checks** - Automated service health monitoring
- **Alerting** - Real-time alerts for issues and anomalies

Access monitoring dashboards:
- Grafana: `http://your-domain:3001`
- Prometheus: `http://your-domain:9090`

## 🧪 Testing

The project includes comprehensive testing:

- **Unit Tests** - Component and service testing
- **Integration Tests** - API and database testing
- **End-to-End Tests** - Full user journey testing
- **Performance Tests** - Load and stress testing

```bash
# Run specific test suites
npm test src/services/     # Service tests
npm test src/components/   # Component tests
npm run test:e2e          # End-to-end tests
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run tests: `npm test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Areas for Contribution

- 🎨 **UI/UX Improvements** - Better user interface and experience
- 🧪 **Test Coverage** - Additional test cases and scenarios
- 🚀 **Performance** - Optimization and speed improvements
- 📱 **Features** - New comparison features and capabilities
- 📚 **Documentation** - Improved guides and examples

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google AI** - For the amazing Flash 2.5 model
- **Next.js Team** - For the excellent React framework
- **Vercel** - For deployment and hosting solutions
- **Open Source Community** - For the incredible tools and libraries

## 📞 Support

- 📖 **Documentation** - Check our comprehensive docs
- 🐛 **Issues** - Report bugs or request features
- 💬 **Discussions** - Join community discussions
- 📧 **Contact** - Reach out for support

## 🌟 Star History

If you find this project helpful, please consider giving it a star! ⭐

---

**Built with ❤️ by the Mobile Matrix team**

*Making phone comparisons intelligent and accessible for everyone.*