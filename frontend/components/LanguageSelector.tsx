// components/LanguageSelector.tsx - Language selector (simplified for demo)

'use client';

import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { saveToLocalStorage, loadFromLocalStorage } from '@/lib/utils';

interface LanguageSelectorProps {
  className?: string;
}

const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
];

export default function LanguageSelector({ className = '' }: LanguageSelectorProps) {
  const [currentLanguage, setCurrentLanguage] = useState('en');

  useEffect(() => {
    // Load saved language preference
    const savedLang = loadFromLocalStorage<string>('kisanmind_language');
    if (savedLang) {
      setCurrentLanguage(savedLang);
    }
  }, []);

  const handleLanguageChange = (languageCode: string) => {
    setCurrentLanguage(languageCode);
    saveToLocalStorage('kisanmind_language', languageCode);
    // In a full implementation, this would trigger i18n language change
    // For now, English is the default and only supported language
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div className="flex items-center gap-2">
        <Globe className="w-5 h-5 text-primary-600" />
        <select
          value={currentLanguage}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="min-w-touch min-h-touch px-3 py-2 pr-8 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 cursor-pointer text-base appearance-none bg-no-repeat bg-right hover:border-primary-400 transition-colors"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
            backgroundPosition: 'right 0.5rem center',
            backgroundSize: '1.5em 1.5em',
          }}
          aria-label="Select language"
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.nativeName}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
