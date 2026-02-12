# KisanMind Frontend

AI-powered agricultural intelligence interface for Indian farmers. Built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- **Multi-language Support**: English, Hindi, Marathi, Tamil, Telugu
- **Mobile-First Design**: Optimized for smartphone users
- **Voice Input**: Speech-to-text for easy data entry
- **Interactive Maps**: Leaflet.js for mandi (market) locations
- **Real-time Progress**: Live status of AI agent analysis
- **Accessible**: WCAG AA compliant, keyboard navigation
- **PWA Ready**: Offline support and install prompts

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with custom agricultural theme
- **i18n**: i18next for translations
- **Maps**: Leaflet.js + React Leaflet
- **Icons**: Lucide React
- **API**: Axios for backend communication

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- npm, yarn, or pnpm

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local

# Edit .env.local with your settings
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Development

```bash
# Start development server
npm run dev

# The app will be available at http://localhost:3000
```

### Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Type Checking

```bash
npm run type-check
```

## Project Structure

```
frontend/
├── app/                      # Next.js App Router pages
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   ├── globals.css          # Global styles
│   ├── input/               # Farmer input page
│   ├── results/             # Results page
│   └── about/               # About page
├── components/              # React components
│   ├── FarmerInputForm.tsx  # Main input form
│   ├── FarmingReport.tsx    # Results display
│   ├── LoadingProgress.tsx  # Agent progress indicator
│   ├── MandiMap.tsx         # Interactive map
│   ├── SchemeCard.tsx       # Government scheme display
│   └── LanguageSelector.tsx # Language switcher
├── lib/                     # Utility libraries
│   ├── api.ts              # API integration
│   └── utils.ts            # Helper functions
├── public/                  # Static assets
│   └── locales/            # Translation files
│       ├── en/
│       ├── hi/
│       ├── mr/
│       ├── ta/
│       └── te/
├── i18n.config.ts          # i18next configuration
└── tailwind.config.js      # Tailwind CSS config
```

## Key Components

### FarmerInputForm

Captures farmer details with:
- Location picker (GPS + manual entry)
- Land size input
- Water source selection
- Previous crops (multi-select)
- Budget (optional)
- Voice input support

### FarmingReport

Displays AI-generated farming plan:
- Recommended crop with profit estimate
- Sowing details (variety, date, spacing)
- Water management strategy
- Selling strategy with mandi map
- Government schemes
- Risk warnings
- Month-by-month action plan

### MandiMap

Interactive Leaflet map showing:
- Farmer's location
- Nearby mandis (markets)
- Current crop prices
- Distance calculations
- Navigation links

### LoadingProgress

Real-time status display for:
- Ground Analyzer
- Water Assessor
- Climate Forecaster
- Market Intel
- Scheme Finder

## Multi-Language Support

The app supports 5 languages with complete translations:

- **English** (en)
- **Hindi** (hi) - हिन्दी
- **Marathi** (mr) - मराठी
- **Tamil** (ta) - தமிழ்
- **Telugu** (te) - తెలుగు

Language preference is saved to `localStorage` and persists across sessions.

## API Integration

The frontend connects to the orchestrator backend at `NEXT_PUBLIC_API_URL`:

```typescript
// Submit farmer input
POST /api/farming-plan
Body: { location, landSize, waterSource, previousCrops, budget, notes }
Response: { sessionId }

// Get farming plan status
GET /api/farming-plan/:sessionId
Response: FarmingPlan (with agent statuses and synthesis)

// Get nearby mandis
GET /api/mandis?lat=20.9&lon=77.75&radius=50
Response: MandiLocation[]

// Download PDF
GET /api/farming-plan/:sessionId/pdf
Response: PDF blob
```

## Responsive Design

- **Mobile**: 360px - 767px (optimized for smartphones)
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px+

All interactive elements have minimum 48x48px touch targets for accessibility.

## Accessibility Features

- Semantic HTML5 elements
- ARIA labels and roles
- Keyboard navigation support
- Focus indicators
- High contrast mode support
- Screen reader compatible
- Color contrast WCAG AA compliant

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Optimizations

- Code splitting with Next.js dynamic imports
- Image optimization with Next.js Image component
- Lazy loading for maps and heavy components
- LocalStorage caching for form data
- API response caching
- Optimized for 3G/4G networks

## Environment Variables

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001

# Enable voice input (optional)
NEXT_PUBLIC_ENABLE_VOICE=true
```

## Demo Mode

If the backend is unavailable, the app automatically falls back to mock data for demonstration purposes. This allows users to explore the interface without a live backend.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -m 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Open a Pull Request

## License

Open source project for the Anthropic Claude Code Hackathon (Feb 10-16, 2026).

## Support

For questions or issues, contact: support@kisanmind.in

---

Built with Claude Opus 4.6 for the Anthropic Claude Code Hackathon
