# Frontend Builder Memory

## Project Structure
- **Location**: `E:/2026/Claude-Hackathon/kisanmind/frontend/`
- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with custom agricultural theme

## Key Architectural Decisions

### 1. Multi-Language Support (i18next)
- Translation files in `public/locales/{lang}/translation.json`
- 5 languages: English, Hindi, Marathi, Tamil, Telugu
- Language preference stored in localStorage
- Nested translation keys for organization (e.g., `input.waterSources.borewell`)

### 2. Mobile-First Design Principles
- All touch targets minimum 48x48px
- Forms optimized for vertical smartphone screens
- Large fonts (text-base = 16px minimum)
- High contrast colors for rural lighting conditions
- Network optimization for 3G/4G connections

### 3. Component Pattern: Form State Management
- Auto-save to localStorage on every input change
- Load saved data on mount for persistence
- Validation happens on submit, not on blur (farmer-friendly)
- Clear error messages with actionable guidance

### 4. API Integration Strategy
- Graceful fallback to mock data when backend unavailable
- This enables demo mode without live orchestrator
- Error states show helpful messages, not technical jargon
- Polling pattern for long-running AI analysis

### 5. Accessibility Standards
- Semantic HTML5 throughout
- ARIA labels on all interactive elements
- Focus indicators with `focus-visible` utility
- Color contrast meets WCAG AA
- Screen reader compatible with proper heading hierarchy

## Reusable Component Patterns

### Form Inputs
- Always include label with `htmlFor` matching input `id`
- Required fields marked with red asterisk
- Helper text below input with Info icon
- Error messages in red below helper text

### Button Design
```tsx
className="min-h-touch px-6 py-3 bg-primary-600 text-white font-semibold
  rounded-lg hover:bg-primary-700 transition-colors"
```

### Card Layout
```tsx
className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
```

## Tailwind Custom Classes

### Color Palette
- **Primary**: Green shades (primary-50 to primary-900) for agriculture theme
- **Earth**: Brown tones for soil-related elements
- **Water**: Blue tones for water-related elements

### Touch Targets
- `min-h-touch`: 48px minimum height
- `min-w-touch`: 48px minimum width

## i18n Key Naming Convention
```
{section}.{subsection}.{key}
Examples:
- input.waterSources.borewell
- results.sections.recommendedCrop
- errors.networkError
```

## File Organization
- **Pages**: `app/{route}/page.tsx` (Next.js App Router)
- **Components**: `components/{ComponentName}.tsx`
- **Utilities**: `lib/{utility}.ts`
- **Translations**: `public/locales/{lang}/translation.json`

## Common Issues & Solutions

### Leaflet Map in Next.js
- Must check `typeof window !== 'undefined'` before rendering
- Create custom icons with data URLs to avoid static file issues
- Set map container `z-index: 0` to prevent overlay conflicts

### Speech Recognition Browser Support
- Check for `SpeechRecognition` or `webkitSpeechRecognition`
- Set language to `en-IN` for Indian English
- Provide fallback message if not supported

### Form Persistence Pattern
```tsx
// Save on every change
useEffect(() => {
  saveToLocalStorage('key', formData);
}, [formData]);

// Load on mount
useEffect(() => {
  const saved = loadFromLocalStorage('key');
  if (saved) setFormData(saved);
}, []);
```

## API Response Handling
- Always wrap API calls in try-catch
- Log errors for debugging but show user-friendly messages
- Provide mock data fallback for demo purposes
- Use TypeScript interfaces for all API responses

## Testing Checklist
- [ ] Test on 360px mobile viewport
- [ ] Verify touch targets are large enough
- [ ] Check color contrast ratios
- [ ] Test keyboard navigation
- [ ] Verify all languages load correctly
- [ ] Test with slow 3G throttling
- [ ] Check print styles for PDF generation

## Performance Optimizations Applied
1. Dynamic imports for heavy components (maps)
2. Image optimization with Next.js Image
3. Code splitting by route
4. LocalStorage caching for form data
5. Debounced search inputs

## Links to Detailed Docs
- See `frontend/README.md` for full setup instructions
- See `lib/api.ts` for API integration patterns
- See `components/` for component usage examples
