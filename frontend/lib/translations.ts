// Comprehensive translation system for KisanMind
// Replace with react-i18next for multi-language support

export const translations = {
  common: {
    appName: 'KisanMind',
    tagline: 'What should I plant to make the most money?',
    rupee: '₹',
    loading: 'Processing...',
  },
  home: {
    title: 'Smart Farming Decisions with AI',
    subtitle: 'Get personalized crop recommendations based on your farm\'s unique conditions',
    cta: 'Get Your Free Farming Plan',
    howItWorks: 'How It Works',
    step1: '1. Share Farm Details',
    step1Desc: 'Tell us about your land, location, water source, and previous crops',
    step2: '2. AI Analysis',
    step2Desc: '5 specialized AI agents analyze soil, water, climate, market prices, and government schemes',
    step3: '3. Get Your Plan',
    step3Desc: 'Receive a complete farming plan with profit estimates and month-by-month guidance',
  },
  input: {
    title: 'Tell Us About Your Farm',
    location: 'Farm Location',
    locationPlaceholder: 'Enter village, district, or coordinates',
    locationHelper: 'Click the location icon to use your current location',
    landSize: 'Farm Size',
    landSizePlaceholder: 'Enter area',
    acres: 'acres',
    waterSource: 'Water Source',
    waterSourcePlaceholder: 'Select water source',
    previousCrops: 'Previous Crops (Optional)',
    budget: 'Available Budget (Optional)',
    budgetPlaceholder: 'Enter amount',
    notes: 'Additional Notes (Optional)',
    notesPlaceholder: 'Any other details like soil issues, failed crops, etc.',
    voiceInput: 'Use voice input',
    submitPlan: 'Get My Farming Plan',
    waterSources: {
      borewell: 'Borewell',
      canal: 'Canal',
      rainfed: 'Rainfed',
      well: 'Well',
      river: 'River',
    },
    crops: {
      cotton: 'Cotton',
      soybean: 'Soybean',
      wheat: 'Wheat',
      rice: 'Rice',
      sugarcane: 'Sugarcane',
      maize: 'Maize',
      groundnut: 'Groundnut',
      chilli: 'Chilli',
      turmeric: 'Turmeric',
      onion: 'Onion',
      tomato: 'Tomato',
      other: 'Other',
    },
    validation: {
      locationRequired: 'Location is required',
      landSizePositive: 'Land size must be greater than 0',
      waterSourceRequired: 'Water source is required',
    },
  },
  results: {
    title: 'Your Personalized Farming Plan',
    analyzing: 'Analyzing Your Farm Data',
    nearbyMandis: 'Nearby Markets (Mandis)',
    sections: {
      recommendedCrop: '🌾 Recommended Crop',
      profitEstimate: 'Expected Profit',
      sowingDetails: '📅 Sowing Details',
      waterManagement: '💧 Water Management',
      sellingStrategy: '📈 Selling Strategy',
      governmentSchemes: '🎁 Government Schemes',
      riskWarnings: '⚠️ Risk Warnings',
      actionPlan: '📋 Month-by-Month Action Plan',
    },
    sowingFields: {
      sowingDate: 'Best Sowing Date',
      spacing: 'Plant Spacing',
      seedRate: 'Seed Rate',
    },
    actions: {
      downloadPDF: 'Download PDF',
      share: 'Share Plan',
      newPlan: 'Create New Plan',
    },
  },
  errors: {
    serverError: 'Unable to connect to server',
    locationError: 'Unable to get your location',
    voiceNotSupported: 'Voice input is not supported in your browser',
    voiceError: 'Voice input failed. Please try again.',
  },
};

// Simple hook replacement for react-i18next
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
