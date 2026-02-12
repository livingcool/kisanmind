// Simple translation fallback for demo
// Full i18next integration requires client-side context setup

export const translations = {
  common: {
    appName: 'KisanMind',
    tagline: 'What should I plant to make the most money?',
  },
  home: {
    title: 'Smart Farming Decisions with AI',
    subtitle: 'Get personalized crop recommendations based on your farm\'s unique conditions',
    cta: 'Get Started',
    howItWorks: 'How It Works',
    step1: '1. Tell Us About Your Farm',
    step1Desc: 'Share your location, land size, water source, and farming goals',
    step2: '2. AI Analysis',
    step2Desc: 'Our 5 AI agents analyze soil, water, climate, market, and government schemes',
    step3: '3. Get Your Plan',
    step3Desc: 'Receive a complete farming plan with profit estimates and month-by-month actions',
  },
  input: {
    title: 'Tell Us About Your Farm',
  },
  errors: {
    serverError: 'Server error occurred',
  },
};

// Simple hook replacement
export function useTranslation() {
  const t = (key: string) => {
    const keys = key.split('.');
    let value: any = translations;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  return { t, ready: true };
}
