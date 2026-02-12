// components/LanguageSelector.tsx - Multi-language selector component

'use client';

import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { useEffect } from 'react';
import { saveToLocalStorage } from '@/lib/utils';

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
  const { i18n, t } = useTranslation();

  useEffect(() => {
    // Save language preference whenever it changes
    saveToLocalStorage('kisanmind_language', i18n.language);
  }, [i18n.language]);

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div className="flex items-center gap-2">
        <Globe className="w-5 h-5 text-primary-600" />
        <select
          value={i18n.language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="min-w-touch min-h-touch px-3 py-2 pr-8 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 cursor-pointer text-base appearance-none bg-no-repeat bg-right"
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

/**
 * Usage example:
 *
 * import LanguageSelector from '@/components/LanguageSelector';
 *
 * <LanguageSelector className="mb-4" />
 */
