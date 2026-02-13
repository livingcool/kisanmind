/**
 * TTS Service - Multi-language instruction translations
 *
 * Contains all audio instruction templates for the 7-step video guidance
 * capture flow. Supports English (en), Hindi (hi), Marathi (mr),
 * Tamil (ta), and Telugu (te).
 *
 * Each instruction set maps to a capture step or quality feedback event.
 */

export type SupportedLanguage = 'en' | 'hi' | 'mr' | 'ta' | 'te';

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['en', 'hi', 'mr', 'ta', 'te'];

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  hi: 'Hindi',
  mr: 'Marathi',
  ta: 'Tamil',
  te: 'Telugu',
};

export interface InstructionTemplate {
  id: string;
  category: 'step_instruction' | 'quality_feedback' | 'session_control';
  translations: Record<SupportedLanguage, string>;
}

// ---------------------------------------------------------------------------
// Step instructions - spoken when each capture step begins
// ---------------------------------------------------------------------------

export const STEP_INSTRUCTIONS: Record<string, InstructionTemplate> = {
  soil_1: {
    id: 'soil_1',
    category: 'step_instruction',
    translations: {
      en: 'Step 1. Show me your soil up close. Dig about 6 inches deep and hold the sample one foot from your camera.',
      hi: 'पहला कदम। मिट्टी को करीब से दिखाएं। लगभग 6 इंच गहराई तक खोदें और नमूने को कैमरे से एक फुट दूर पकड़ें।',
      mr: 'पहिली पायरी. तुमची माती जवळून दाखवा. सहा इंच खोल खणा आणि नमुना कॅमेऱ्यापासून एक फूट दूर धरा.',
      ta: 'படி 1. உங்கள் மண்ணை நெருக்கமாக காட்டுங்கள். 6 அங்குலம் ஆழம் தோண்டி, மாதிரியை கேமராவிலிருந்து ஒரு அடி தொலைவில் பிடிக்கவும்.',
      te: 'దశ 1. మీ మట్టిని దగ్గరగా చూపించండి. 6 అంగుళాల లోతుగా తవ్వి, నమూనాను కెమెరా నుండి ఒక అడుగు దూరంలో పట్టుకోండి.',
    },
  },

  soil_2: {
    id: 'soil_2',
    category: 'step_instruction',
    translations: {
      en: 'Step 2. Now move to a different part of your field, at least 20 feet away. Take another soil sample the same way.',
      hi: 'दूसरा कदम। अब खेत के दूसरे हिस्से में जाएं, कम से कम 20 फुट दूर। उसी तरह एक और मिट्टी का नमूना लें।',
      mr: 'दुसरी पायरी. आता शेताच्या दुसऱ्या भागात जा, किमान 20 फूट दूर. त्याच पद्धतीने आणखी एक माती नमुना घ्या.',
      ta: 'படி 2. இப்போது வயலின் வேறு பகுதிக்கு, குறைந்தது 20 அடி தொலைவில் செல்லுங்கள். அதே முறையில் மற்றொரு மண் மாதிரியை எடுங்கள்.',
      te: 'దశ 2. ఇప్పుడు మీ పొలంలో వేరే భాగానికి, కనీసం 20 అడుగుల దూరంలోకి వెళ్ళండి. అదే విధంగా మరొక మట్టి నమూనా తీసుకోండి.',
    },
  },

  crop_healthy: {
    id: 'crop_healthy',
    category: 'step_instruction',
    translations: {
      en: 'Step 3. Show me a healthy crop leaf. Hold it 6 to 12 inches from the camera. Show both the top and bottom of the leaf.',
      hi: 'तीसरा कदम। एक स्वस्थ फसल का पत्ता दिखाएं। इसे कैमरे से 6 से 12 इंच दूर पकड़ें। पत्ते के ऊपर और नीचे दोनों तरफ दिखाएं।',
      mr: 'तिसरी पायरी. एक निरोगी पिकाचे पान दाखवा. ते कॅमेऱ्यापासून 6 ते 12 इंच दूर धरा. पानाची वरची आणि खालची बाजू दोन्ही दाखवा.',
      ta: 'படி 3. ஆரோக்கியமான பயிர் இலையைக் காட்டுங்கள். கேமராவிலிருந்து 6 முதல் 12 அங்குலம் தொலைவில் பிடிக்கவும். இலையின் மேல் மற்றும் கீழ் இரண்டையும் காட்டுங்கள்.',
      te: 'దశ 3. ఆరోగ్యకరమైన పంట ఆకును చూపించండి. కెమెరా నుండి 6 నుండి 12 అంగుళాల దూరంలో పట్టుకోండి. ఆకు పై మరియు క్రింది భాగాలను రెండింటినీ చూపించండి.',
    },
  },

  crop_diseased: {
    id: 'crop_diseased',
    category: 'step_instruction',
    translations: {
      en: 'Step 4. Now show me any damaged or diseased leaves. Focus on spots, discoloration, or holes in the leaves.',
      hi: 'चौथा कदम। अब कोई खराब या बीमार पत्ता दिखाएं। धब्बे, रंग बदलाव या पत्तों में छेद पर ध्यान दें।',
      mr: 'चौथी पायरी. आता कोणतेही खराब किंवा रोगट पान दाखवा. पानावरील डाग, रंग बदल किंवा छिद्रांवर लक्ष केंद्रित करा.',
      ta: 'படி 4. இப்போது சேதமடைந்த அல்லது நோயுற்ற இலைகளைக் காட்டுங்கள். புள்ளிகள், நிறமாற்றம் அல்லது இலைகளில் உள்ள துளைகளில் கவனம் செலுத்துங்கள்.',
      te: 'దశ 4. ఇప్పుడు దెబ్బతిన్న లేదా వ్యాధిగ్రస్తమైన ఆకులను చూపించండి. మచ్చలు, రంగు మార్పు లేదా ఆకులలోని రంధ్రాలపై దృష్టి పెట్టండి.',
    },
  },

  water_source: {
    id: 'water_source',
    category: 'step_instruction',
    translations: {
      en: 'Step 5. Show me your water source. Point your camera at the borewell, well, canal, or pond you use for irrigation.',
      hi: 'पांचवां कदम। अपना पानी का स्रोत दिखाएं। कैमरे को बोरवेल, कुएं, नहर या तालाब की ओर करें जिसका उपयोग सिंचाई के लिए करते हैं।',
      mr: 'पाचवी पायरी. तुमचा पाण्याचा स्रोत दाखवा. सिंचनासाठी वापरत असलेल्या बोअरवेल, विहीर, कालवा किंवा तलावाकडे कॅमेरा दाखवा.',
      ta: 'படி 5. உங்கள் நீர் ஆதாரத்தைக் காட்டுங்கள். நீங்கள் பாசனத்திற்குப் பயன்படுத்தும் போர்வெல், கிணறு, கால்வாய் அல்லது குளத்தை கேமராவில் காட்டுங்கள்.',
      te: 'దశ 5. మీ నీటి వనరును చూపించండి. మీరు నీటిపారుదలకు ఉపయోగించే బోర్‌వెల్, బావి, కాలువ లేదా చెరువు వైపు కెమెరాను చూపించండి.',
    },
  },

  field_overview: {
    id: 'field_overview',
    category: 'step_instruction',
    translations: {
      en: 'Step 6. Stand at the edge of your field and take a wide photo showing as much of your field as possible.',
      hi: 'छठा कदम। खेत के किनारे खड़े होकर जितना हो सके पूरा खेत दिखाने वाली चौड़ी फोटो लें।',
      mr: 'सहावी पायरी. शेताच्या कडेला उभे राहून शक्य तितके जास्त शेत दाखवणारा रुंद फोटो काढा.',
      ta: 'படி 6. வயலின் விளிம்பில் நின்று, உங்கள் வயலை முடிந்தவரை அதிகமாகக் காட்டும் பரந்த புகைப்படம் எடுங்கள்.',
      te: 'దశ 6. మీ పొలం అంచున నిలబడి, మీ పొలాన్ని సాధ్యమైనంత ఎక్కువగా చూపించే విశాలమైన ఫోటో తీయండి.',
    },
  },

  weeds_issues: {
    id: 'weeds_issues',
    category: 'step_instruction',
    translations: {
      en: 'Step 7. Last step! Show me any weeds, pests, or other problems you see in your field.',
      hi: 'सातवां कदम। आखिरी कदम! खेत में दिख रहे खरपतवार, कीट या अन्य समस्याएं दिखाएं।',
      mr: 'सातवी पायरी. शेवटची पायरी! शेतात दिसणारे तण, कीटक किंवा इतर समस्या दाखवा.',
      ta: 'படி 7. கடைசி படி! உங்கள் வயலில் நீங்கள் காணும் களைகள், பூச்சிகள் அல்லது பிற பிரச்சனைகளைக் காட்டுங்கள்.',
      te: 'దశ 7. చివరి దశ! మీ పొలంలో మీరు చూసే కలుపు మొక్కలు, పురుగులు లేదా ఇతర సమస్యలను చూపించండి.',
    },
  },
};

// ---------------------------------------------------------------------------
// Quality feedback - spoken when quality issues are detected in frames
// ---------------------------------------------------------------------------

export const QUALITY_FEEDBACK: Record<string, InstructionTemplate> = {
  too_blurry: {
    id: 'too_blurry',
    category: 'quality_feedback',
    translations: {
      en: 'Hold your phone steady. The image is blurry.',
      hi: 'फोन को स्थिर रखें। तस्वीर धुंधली है।',
      mr: 'फोन स्थिर धरा. फोटो अस्पष्ट आहे.',
      ta: 'உங்கள் தொலைபேசியை நிலையாக வைத்திருங்கள். படம் மங்கலாக உள்ளது.',
      te: 'మీ ఫోన్‌ను స్థిరంగా పట్టుకోండి. చిత్రం అస్పష్టంగా ఉంది.',
    },
  },

  too_dark: {
    id: 'too_dark',
    category: 'quality_feedback',
    translations: {
      en: 'Go to a brighter area. The image is too dark.',
      hi: 'उजाले में जाएं। तस्वीर बहुत अंधेरी है।',
      mr: 'उजेडात जा. फोटो खूप गडद आहे.',
      ta: 'ஒளி உள்ள இடத்திற்கு செல்லுங்கள். படம் மிகவும் இருட்டாக உள்ளது.',
      te: 'వెలుతురు ఉన్న ప్రాంతానికి వెళ్ళండి. చిత్రం చాలా చీకటిగా ఉంది.',
    },
  },

  too_bright: {
    id: 'too_bright',
    category: 'quality_feedback',
    translations: {
      en: 'Move to a shaded area. The image is too bright.',
      hi: 'छाया वाली जगह पर जाएं। तस्वीर बहुत चमकदार है।',
      mr: 'सावलीत जा. फोटो खूप उजळ आहे.',
      ta: 'நிழல் உள்ள பகுதிக்கு செல்லுங்கள். படம் மிகவும் பிரகாசமாக உள்ளது.',
      te: 'నీడ ఉన్న ప్రాంతానికి వెళ్ళండి. చిత్రం చాలా ప్రకాశవంతంగా ఉంది.',
    },
  },

  too_far: {
    id: 'too_far',
    category: 'quality_feedback',
    translations: {
      en: 'Come closer to the subject.',
      hi: 'और पास आएं।',
      mr: 'जवळ या.',
      ta: 'நெருங்கி வாருங்கள்.',
      te: 'దగ్గరగా రండి.',
    },
  },

  too_close: {
    id: 'too_close',
    category: 'quality_feedback',
    translations: {
      en: 'Move a little further back.',
      hi: 'थोड़ा पीछे हटें।',
      mr: 'थोडे मागे जा.',
      ta: 'கொஞ்சம் பின்னால் செல்லுங்கள்.',
      te: 'కొంచెం వెనక్కి జరగండి.',
    },
  },

  quality_good: {
    id: 'quality_good',
    category: 'quality_feedback',
    translations: {
      en: 'Very good! Now press the capture button.',
      hi: 'बहुत अच्छा! अब कैप्चर बटन दबाएं।',
      mr: 'खूप छान! आता कॅप्चर बटण दाबा.',
      ta: 'மிக நன்று! இப்போது கேப்சர் பொத்தானை அழுத்தவும்.',
      te: 'చాలా బాగుంది! ఇప్పుడు క్యాప్చర్ బటన్ నొక్కండి.',
    },
  },

  quality_acceptable: {
    id: 'quality_acceptable',
    category: 'quality_feedback',
    translations: {
      en: 'Good enough. You can capture now or try for better quality.',
      hi: 'ठीक है। अभी कैप्चर कर सकते हैं या बेहतर गुणवत्ता के लिए कोशिश करें।',
      mr: 'ठीक आहे. आता कॅप्चर करू शकता किंवा चांगल्या गुणवत्तेसाठी प्रयत्न करा.',
      ta: 'போதுமானது. இப்போது கேப்சர் செய்யலாம் அல்லது சிறந்த தரத்திற்கு முயற்சிக்கவும்.',
      te: 'సరిపోతుంది. ఇప్పుడు క్యాప్చర్ చేయవచ్చు లేదా మెరుగైన నాణ్యత కోసం ప్రయత్నించండి.',
    },
  },
};

// ---------------------------------------------------------------------------
// Session control - spoken for session lifecycle events
// ---------------------------------------------------------------------------

export const SESSION_CONTROL: Record<string, InstructionTemplate> = {
  session_start: {
    id: 'session_start',
    category: 'session_control',
    translations: {
      en: 'Welcome to KisanMind visual assessment. I will guide you through capturing images of your farm. Let us begin.',
      hi: 'किसानमाइंड विजुअल असेसमेंट में आपका स्वागत है। मैं आपको खेत की तस्वीरें लेने में मार्गदर्शन करूंगा। शुरू करते हैं।',
      mr: 'किसानमाइंड व्हिज्युअल असेसमेंटमध्ये आपले स्वागत आहे. मी तुम्हाला शेताचे फोटो काढण्यात मार्गदर्शन करेन. सुरू करूया.',
      ta: 'கிசான்மைண்ட் காட்சி மதிப்பீட்டுக்கு வரவேற்கிறோம். உங்கள் வயலின் படங்களை எடுப்பதில் நான் உங்களுக்கு வழிகாட்டுவேன். தொடங்குவோம்.',
      te: 'కిసాన్‌మైండ్ దృశ్య అంచనాకు స్వాగతం. మీ పొలం చిత్రాలను తీయడంలో నేను మీకు మార్గదర్శనం చేస్తాను. ప్రారంభిద్దాం.',
    },
  },

  session_complete: {
    id: 'session_complete',
    category: 'session_control',
    translations: {
      en: 'All images captured successfully! Your farm data is being analyzed. You will receive your personalized farming recommendations shortly.',
      hi: 'सभी तस्वीरें सफलतापूर्वक ली गईं! आपके खेत का डेटा विश्लेषित किया जा रहा है। आपको जल्द ही व्यक्तिगत खेती की सिफारिशें मिलेंगी।',
      mr: 'सर्व फोटो यशस्वीरित्या घेतले! तुमच्या शेताचा डेटा विश्लेषित केला जात आहे. तुम्हाला लवकरच वैयक्तिक शेतीच्या शिफारसी मिळतील.',
      ta: 'அனைத்து படங்களும் வெற்றிகரமாக எடுக்கப்பட்டன! உங்கள் வயல் தரவு பகுப்பாய்வு செய்யப்படுகிறது. விரைவில் உங்களுக்கான தனிப்பயன் விவசாய பரிந்துரைகளைப் பெறுவீர்கள்.',
      te: 'అన్ని చిత్రాలు విజయవంతంగా తీయబడ్డాయి! మీ పొలం డేటా విశ్లేషించబడుతోంది. మీకు త్వరలో వ్యక్తిగత వ్యవసాయ సిఫార్సులు అందజేయబడతాయి.',
    },
  },

  step_skipped: {
    id: 'step_skipped',
    category: 'session_control',
    translations: {
      en: 'Step skipped. Moving to the next step.',
      hi: 'कदम छोड़ा गया। अगले कदम पर जा रहे हैं।',
      mr: 'पायरी वगळली. पुढच्या पायरीवर जात आहोत.',
      ta: 'படி தவிர்க்கப்பட்டது. அடுத்த படிக்கு செல்கிறோம்.',
      te: 'దశ దాటవేయబడింది. తదుపరి దశకు వెళ్తున్నాము.',
    },
  },

  capture_success: {
    id: 'capture_success',
    category: 'session_control',
    translations: {
      en: 'Image captured! Moving to the next step.',
      hi: 'तस्वीर ली गई! अगले कदम पर जा रहे हैं।',
      mr: 'फोटो काढला! पुढच्या पायरीवर जात आहोत.',
      ta: 'படம் எடுக்கப்பட்டது! அடுத்த படிக்கு செல்கிறோம்.',
      te: 'చిత్రం తీయబడింది! తదుపరి దశకు వెళ్తున్నాము.',
    },
  },

  retake_prompt: {
    id: 'retake_prompt',
    category: 'session_control',
    translations: {
      en: 'Would you like to retake this image?',
      hi: 'क्या आप यह तस्वीर दोबारा लेना चाहेंगे?',
      mr: 'तुम्हाला हा फोटो पुन्हा काढायचा आहे का?',
      ta: 'இந்த படத்தை மீண்டும் எடுக்க விரும்புகிறீர்களா?',
      te: 'ఈ చిత్రాన్ని మళ్ళీ తీయాలనుకుంటున్నారా?',
    },
  },

  upload_starting: {
    id: 'upload_starting',
    category: 'session_control',
    translations: {
      en: 'Uploading your images. Please wait.',
      hi: 'आपकी तस्वीरें अपलोड हो रही हैं। कृपया प्रतीक्षा करें।',
      mr: 'तुमचे फोटो अपलोड होत आहेत. कृपया प्रतीक्षा करा.',
      ta: 'உங்கள் படங்கள் பதிவேற்றப்படுகின்றன. தயவுசெய்து காத்திருங்கள்.',
      te: 'మీ చిత్రాలు అప్‌లోడ్ అవుతున్నాయి. దయచేసి వేచి ఉండండి.',
    },
  },

  error_camera: {
    id: 'error_camera',
    category: 'session_control',
    translations: {
      en: 'Camera access failed. Please check your browser permissions.',
      hi: 'कैमरा एक्सेस विफल रहा। कृपया ब्राउज़र अनुमतियां जांचें।',
      mr: 'कॅमेरा प्रवेश अयशस्वी. कृपया ब्राउझर परवानग्या तपासा.',
      ta: 'கேமரா அணுகல் தோல்வி. தயவுசெய்து உலாவி அனுமதிகளைச் சரிபார்க்கவும்.',
      te: 'కెమెరా యాక్సెస్ విఫలమైంది. దయచేసి బ్రౌజర్ అనుమతులను తనిఖీ చేయండి.',
    },
  },
};

// ---------------------------------------------------------------------------
// Helper utilities
// ---------------------------------------------------------------------------

/**
 * Get all instruction templates as a flat list for pre-generation.
 */
export function getAllInstructions(): InstructionTemplate[] {
  return [
    ...Object.values(STEP_INSTRUCTIONS),
    ...Object.values(QUALITY_FEEDBACK),
    ...Object.values(SESSION_CONTROL),
  ];
}

/**
 * Get the translated text for a given instruction and language.
 * Falls back to English if the language is not supported.
 */
export function getTranslation(
  instructionId: string,
  language: SupportedLanguage,
): string | null {
  const allMaps = [STEP_INSTRUCTIONS, QUALITY_FEEDBACK, SESSION_CONTROL];

  for (const map of allMaps) {
    if (map[instructionId]) {
      return map[instructionId].translations[language]
        ?? map[instructionId].translations.en
        ?? null;
    }
  }

  return null;
}

/**
 * Get all instruction IDs that need pre-generated audio.
 */
export function getPreGenerationManifest(): Array<{ id: string; language: SupportedLanguage; text: string }> {
  const manifest: Array<{ id: string; language: SupportedLanguage; text: string }> = [];

  for (const instruction of getAllInstructions()) {
    for (const lang of SUPPORTED_LANGUAGES) {
      const text = instruction.translations[lang] ?? instruction.translations.en;
      manifest.push({
        id: instruction.id,
        language: lang,
        text,
      });
    }
  }

  return manifest;
}
