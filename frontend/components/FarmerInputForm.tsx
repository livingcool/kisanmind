// components/FarmerInputForm.tsx - Form for capturing farmer input

'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/translations';
import { Mic, MapPin, Loader2, Info } from 'lucide-react';
import { FarmerInput } from '@/lib/api';
import {
  isSpeechRecognitionSupported,
  saveToLocalStorage,
  loadFromLocalStorage,
} from '@/lib/utils';

interface FarmerInputFormProps {
  onSubmit: (data: FarmerInput) => void;
  isSubmitting?: boolean;
}

const WATER_SOURCES = ['borewell', 'canal', 'rainfed', 'well', 'river'];
const CROP_OPTIONS = [
  'cotton',
  'soybean',
  'wheat',
  'rice',
  'sugarcane',
  'maize',
  'groundnut',
  'chilli',
  'turmeric',
  'onion',
  'tomato',
  'other',
];

export default function FarmerInputForm({
  onSubmit,
  isSubmitting = false,
}: FarmerInputFormProps) {
  const { t } = useTranslation();

  // Form state
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lon: number } | null>(
    null
  );
  const [landSize, setLandSize] = useState('');
  const [waterSource, setWaterSource] = useState('');
  const [previousCrops, setPreviousCrops] = useState<string[]>([]);
  const [budget, setBudget] = useState('');
  const [notes, setNotes] = useState('');

  // UI state
  const [isListening, setIsListening] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load saved data on mount
  useEffect(() => {
    const savedData = loadFromLocalStorage<FarmerInput>('kisanmind_input');
    if (savedData) {
      setLocation(savedData.location.address || '');
      setCoordinates(savedData.location.coordinates || null);
      setLandSize(savedData.landSize.toString());
      setWaterSource(savedData.waterSource);
      setPreviousCrops(savedData.previousCrops);
      setBudget(savedData.budget?.toString() || '');
      setNotes(savedData.notes || '');
    }
  }, []);

  // Auto-save form data
  useEffect(() => {
    const data: Partial<FarmerInput> = {
      location: {
        address: location,
        coordinates: coordinates || undefined,
      },
      landSize: parseFloat(landSize) || 0,
      waterSource,
      previousCrops,
      budget: parseFloat(budget) || undefined,
      notes,
    };
    saveToLocalStorage('kisanmind_input', data);
  }, [location, coordinates, landSize, waterSource, previousCrops, budget, notes]);

  // Get current location
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setErrors((prev) => ({ ...prev, location: t('errors.locationError') }));
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
        setLocation(
          `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`
        );
        setIsGettingLocation(false);
        setErrors((prev) => ({ ...prev, location: '' }));
      },
      (error) => {
        console.error('Location error:', error);
        setErrors((prev) => ({ ...prev, location: t('errors.locationError') }));
        setIsGettingLocation(false);
      }
    );
  };

  // Voice input handler
  const handleVoiceInput = () => {
    if (!isSpeechRecognitionSupported()) {
      alert(t('errors.voiceNotSupported'));
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'en-IN'; // Indian English
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setNotes((prev) => (prev ? `${prev} ${transcript}` : transcript));
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      alert(t('errors.voiceError'));
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // Toggle crop selection
  const toggleCrop = (crop: string) => {
    setPreviousCrops((prev) =>
      prev.includes(crop) ? prev.filter((c) => c !== crop) : [...prev, crop]
    );
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!location && !coordinates) {
      newErrors.location = t('input.validation.locationRequired');
    }

    if (!landSize || parseFloat(landSize) <= 0) {
      newErrors.landSize = t('input.validation.landSizePositive');
    }

    if (!waterSource) {
      newErrors.waterSource = t('input.validation.waterSourceRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const formData: FarmerInput = {
      location: {
        address: location,
        coordinates: coordinates || undefined,
      },
      landSize: parseFloat(landSize),
      waterSource,
      previousCrops,
      budget: budget ? parseFloat(budget) : undefined,
      notes,
    };

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      {/* Location */}
      <div>
        <label
          htmlFor="location"
          className="block text-base font-semibold text-gray-900 mb-2"
        >
          {t('input.location')} <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={t('input.locationPlaceholder')}
            className="flex-1 min-h-touch px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <button
            type="button"
            onClick={handleGetLocation}
            disabled={isGettingLocation}
            className="min-w-touch min-h-touch px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400 flex items-center justify-center"
            aria-label="Get current location"
          >
            {isGettingLocation ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <MapPin className="w-5 h-5" />
            )}
          </button>
        </div>
        {errors.location && (
          <p className="mt-1 text-sm text-red-600">{errors.location}</p>
        )}
        <p className="mt-1 text-sm text-gray-500 flex items-center gap-1">
          <Info className="w-4 h-4" />
          {t('input.locationHelper')}
        </p>
      </div>

      {/* Land Size */}
      <div>
        <label
          htmlFor="landSize"
          className="block text-base font-semibold text-gray-900 mb-2"
        >
          {t('input.landSize')} <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2 items-center">
          <input
            id="landSize"
            type="number"
            step="0.1"
            min="0"
            value={landSize}
            onChange={(e) => setLandSize(e.target.value)}
            placeholder={t('input.landSizePlaceholder')}
            className="flex-1 min-h-touch px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <span className="text-gray-700 font-medium">{t('input.acres')}</span>
        </div>
        {errors.landSize && (
          <p className="mt-1 text-sm text-red-600">{errors.landSize}</p>
        )}
      </div>

      {/* Water Source */}
      <div>
        <label
          htmlFor="waterSource"
          className="block text-base font-semibold text-gray-900 mb-2"
        >
          {t('input.waterSource')} <span className="text-red-500">*</span>
        </label>
        <select
          id="waterSource"
          value={waterSource}
          onChange={(e) => setWaterSource(e.target.value)}
          className="w-full min-h-touch px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">{t('input.waterSourcePlaceholder')}</option>
          {WATER_SOURCES.map((source) => (
            <option key={source} value={source}>
              {t(`input.waterSources.${source}`)}
            </option>
          ))}
        </select>
        {errors.waterSource && (
          <p className="mt-1 text-sm text-red-600">{errors.waterSource}</p>
        )}
      </div>

      {/* Previous Crops */}
      <div>
        <label className="block text-base font-semibold text-gray-900 mb-3">
          {t('input.previousCrops')}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CROP_OPTIONS.map((crop) => (
            <button
              key={crop}
              type="button"
              onClick={() => toggleCrop(crop)}
              className={`min-h-touch px-4 py-3 text-base rounded-lg border-2 transition-all ${
                previousCrops.includes(crop)
                  ? 'bg-primary-600 border-primary-600 text-white font-semibold'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-primary-400'
              }`}
            >
              {t(`input.crops.${crop}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Budget */}
      <div>
        <label
          htmlFor="budget"
          className="block text-base font-semibold text-gray-900 mb-2"
        >
          {t('input.budget')}
        </label>
        <div className="flex gap-2 items-center">
          <span className="text-gray-700 font-medium">{t('common.rupee')}</span>
          <input
            id="budget"
            type="number"
            step="1000"
            min="0"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder={t('input.budgetPlaceholder')}
            className="flex-1 min-h-touch px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label
          htmlFor="notes"
          className="block text-base font-semibold text-gray-900 mb-2"
        >
          {t('input.notes')}
        </label>
        <div className="relative">
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('input.notesPlaceholder')}
            rows={4}
            className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          {isSpeechRecognitionSupported() && (
            <button
              type="button"
              onClick={handleVoiceInput}
              disabled={isListening}
              className="absolute right-2 top-2 min-w-touch min-h-touch p-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors disabled:bg-gray-200"
              aria-label={t('input.voiceInput')}
            >
              <Mic
                className={`w-5 h-5 ${isListening ? 'animate-pulse text-red-500' : ''}`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full min-h-touch px-6 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white text-lg font-bold rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin" />
            {t('common.loading')}
          </>
        ) : (
          t('input.submitPlan')
        )}
      </button>
    </form>
  );
}

/**
 * Usage example:
 *
 * import FarmerInputForm from '@/components/FarmerInputForm';
 *
 * const handleSubmit = (data: FarmerInput) => {
 *   console.log('Form data:', data);
 *   // Submit to API
 * };
 *
 * <FarmerInputForm onSubmit={handleSubmit} isSubmitting={false} />
 */
