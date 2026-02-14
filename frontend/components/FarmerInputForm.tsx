// components/FarmerInputForm.tsx - Form for capturing farmer input

'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/translations';
import { Mic, Loader2, Map, Copy, Check, Camera, Sparkles } from 'lucide-react';
import { FarmerInput } from '@/lib/api';
import {
  isSpeechRecognitionSupported,
  saveToLocalStorage,
  loadFromLocalStorage,
} from '@/lib/utils';
import { AddressDetails, Coordinates } from '@/lib/location-types';
import dynamic from 'next/dynamic';
import LocationInput from './LocationInput';

// Dynamically import LocationMap to avoid SSR issues with Leaflet
const LocationMap = dynamic(() => import('./LocationMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[200px] bg-gray-100 rounded-xl">
      <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
    </div>
  ),
});

// Dynamically import VideoGuidanceSession to avoid SSR issues
const VideoGuidanceSession = dynamic(
  () => import('./VideoGuidance/VideoGuidanceSession'),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <Loader2 className="w-12 h-12 animate-spin text-white" />
      </div>
    ),
  }
);

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
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [addressDetails, setAddressDetails] = useState<AddressDetails | null>(null);
  const [landSize, setLandSize] = useState('');
  const [waterSource, setWaterSource] = useState('');
  const [previousCrops, setPreviousCrops] = useState<string[]>([]);
  const [budget, setBudget] = useState('');
  const [notes, setNotes] = useState('');

  // UI state
  const [isListening, setIsListening] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [showVideoGuidance, setShowVideoGuidance] = useState(false);
  const [visualAssessmentId, setVisualAssessmentId] = useState<string | null>(null);
  const [tempSessionId] = useState(() => `temp-${Date.now()}`);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  // Copy address to clipboard
  const handleCopyAddress = () => {
    if (!location) return;

    navigator.clipboard.writeText(location).then(() => {
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    });
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
      visualAssessmentId: visualAssessmentId || undefined,
    };

    onSubmit(formData);
  };

  // Handle visual assessment completion
  const handleVisualAssessmentComplete = (assessmentId: string) => {
    setVisualAssessmentId(assessmentId);
    setShowVideoGuidance(false);
  };

  // Handle visual assessment cancel
  const handleVisualAssessmentCancel = () => {
    setShowVideoGuidance(false);
  };

  return (
    <>
      {/* Video Guidance Modal */}
      {showVideoGuidance && coordinates && (
        <VideoGuidanceSession
          sessionId={tempSessionId}
          location={{ lat: coordinates.lat, lon: coordinates.lon }}
          onComplete={handleVisualAssessmentComplete}
          onCancel={handleVisualAssessmentCancel}
        />
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
        {/* Visual Assessment Option Card - Always visible but disabled if no location */}
        {!visualAssessmentId && (
          <div className={`rounded-xl p-5 border-2 shadow-md ${coordinates
            ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300'
            : 'bg-gray-50 border-gray-200 opacity-75'
            }`}>
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${coordinates
                ? 'bg-gradient-to-br from-blue-600 to-blue-700'
                : 'bg-gray-400'
                }`}>
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className={`text-lg font-bold ${coordinates ? 'text-blue-900' : 'text-gray-700'}`}>
                    Want Higher Accuracy?
                  </h3>
                  {coordinates && <Sparkles className="w-4 h-4 text-yellow-500" />}
                </div>
                <p className={`text-sm mb-1 ${coordinates ? 'text-blue-800' : 'text-gray-600'}`}>
                  Take photos of your soil and crops for{' '}
                  <span className="font-bold">85-90% accuracy</span> (vs 70-80%
                  satellite-only)
                </p>
                <ul className={`text-xs space-y-0.5 mb-4 ml-4 ${coordinates ? 'text-blue-700' : 'text-gray-500'}`}>
                  <li>• Direct soil analysis from your field</li>
                  <li>• Crop health detection</li>
                  <li>• Better fertilizer recommendations</li>
                </ul>

                <button
                  type="button"
                  onClick={() => setShowVideoGuidance(true)}
                  disabled={!coordinates}
                  className={`w-full min-h-touch px-6 py-3 font-bold rounded-lg transition-all shadow-lg flex items-center justify-center gap-2 ${coordinates
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                  <Camera className="w-5 h-5" />
                  {coordinates ? 'Take Photos (Optional - 2 min)' : 'Enter Location First to Enable Photos'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Visual Assessment Completed Badge */}
        {visualAssessmentId && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-300 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                <Check className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-green-900">
                  Visual Assessment Complete!
                </p>
                <p className="text-sm text-green-700">
                  Your images will boost recommendation accuracy
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setVisualAssessmentId(null);
                  setShowVideoGuidance(true);
                }}
                className="text-sm text-green-700 hover:text-green-900 font-semibold underline"
              >
                Retake
              </button>
            </div>
          </div>
        )}

        {/* Location */}
        <div>
          <LocationInput
            coordinates={coordinates}
            address={location}
            onCoordinatesChange={setCoordinates}
            onAddressChange={setLocation}
            onAddressDetailsChange={setAddressDetails}
            addressDetails={addressDetails}
            error={errors.location}
          />

          {/* Location Preview Card with Detailed Address */}
          {coordinates && (
            <div className="mt-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-200 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <Map className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-base font-bold text-green-800">
                    Exact Location
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="p-2 bg-white rounded-lg border border-green-300 hover:bg-green-50 transition-colors"
                  aria-label="Copy address"
                >
                  {copiedAddress ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-green-600" />
                  )}
                </button>
              </div>

              {/* Detailed Address Display */}
              {addressDetails && (
                <div className="mb-4 bg-white rounded-lg p-4 border border-green-200 space-y-2">
                  <div className="text-sm font-bold text-green-800 mb-2">
                    Address Details:
                  </div>
                  {addressDetails.road && (
                    <div className="flex text-sm">
                      <span className="font-semibold text-gray-700 w-24">Street:</span>
                      <span className="text-gray-600 flex-1">{addressDetails.road}</span>
                    </div>
                  )}
                  {(addressDetails.suburb || addressDetails.neighbourhood) && (
                    <div className="flex text-sm">
                      <span className="font-semibold text-gray-700 w-24">Area:</span>
                      <span className="text-gray-600 flex-1">
                        {addressDetails.suburb || addressDetails.neighbourhood}
                      </span>
                    </div>
                  )}
                  {(addressDetails.city || addressDetails.town || addressDetails.village) && (
                    <div className="flex text-sm">
                      <span className="font-semibold text-gray-700 w-24">City:</span>
                      <span className="text-gray-600 flex-1">
                        {addressDetails.city || addressDetails.town || addressDetails.village}
                      </span>
                    </div>
                  )}
                  {(addressDetails.district || addressDetails.county) && (
                    <div className="flex text-sm">
                      <span className="font-semibold text-gray-700 w-24">District:</span>
                      <span className="text-gray-600 flex-1">
                        {addressDetails.district || addressDetails.county}
                      </span>
                    </div>
                  )}
                  {addressDetails.state && (
                    <div className="flex text-sm">
                      <span className="font-semibold text-gray-700 w-24">State:</span>
                      <span className="text-gray-600 flex-1">{addressDetails.state}</span>
                    </div>
                  )}
                  {addressDetails.postcode && (
                    <div className="flex text-sm">
                      <span className="font-semibold text-gray-700 w-24">PIN:</span>
                      <span className="text-gray-600 flex-1">{addressDetails.postcode}</span>
                    </div>
                  )}
                  <div className="flex text-sm pt-2 border-t border-gray-200">
                    <span className="font-semibold text-gray-700 w-24">Coordinates:</span>
                    <span className="text-gray-600 flex-1 font-mono text-xs">
                      {coordinates.lat.toFixed(6)}, {coordinates.lon.toFixed(6)}
                    </span>
                  </div>
                </div>
              )}

              {/* Full Address (if no detailed breakdown available) */}
              {!addressDetails && location && (
                <div className="mb-4 bg-white rounded-lg p-4 border border-green-200">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Address:</span> {location}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    <span className="font-semibold">Coordinates:</span>{' '}
                    {coordinates.lat.toFixed(6)}, {coordinates.lon.toFixed(6)}
                  </p>
                </div>
              )}

              {/* Map Preview */}
              <div className="rounded-xl overflow-hidden shadow-lg">
                <LocationMap
                  coordinates={coordinates}
                  address={location}
                  height="200px"
                  showSatellite={false}
                  zoom={13}
                />
              </div>
            </div>
          )}
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
                className={`min-h-touch px-4 py-3 text-base rounded-lg border-2 transition-all ${previousCrops.includes(crop)
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
            {isMounted && isSpeechRecognitionSupported() && (
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
    </>
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
