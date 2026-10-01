// Reply languages for the help assistant. `key` is sent to the server,
// `native` is shown in the picker, `short` fits the header button.
export const ASSISTANT_LANGUAGES = [
  {
    key: 'auto', native: 'Auto', english: 'Same as my message', short: 'Auto',
    suggestions: ['Meri upcoming bookings dikhao', 'Jaipur me kya kya dekhein?', 'Weekend trip idea from Ahmedabad', 'How do I book a vehicle?', 'Booking cancel kaise karu?', 'Refund kab tak aayega?'],
    greeting: "Hi! I'm the TransRentals Assistant. Ask me where to travel, or anything about booking, quotes, payment, your trip, cancellation, refunds or support — in any language, jis bhi bhasha me aap comfortable ho.",
  },
  {
    key: 'english', native: 'English', english: 'English', short: 'EN',
    suggestions: ['How many upcoming bookings do I have?', 'Best places to visit in Jaipur?', 'Weekend trip ideas from Ahmedabad', 'How do I book a vehicle?', 'How do I cancel my booking?', 'When will I get my refund?'],
    greeting: "Hi! I'm the TransRentals Assistant. Ask me where to travel, or anything about booking, payment, your trip, cancellation or refunds.",
  },
  {
    key: 'hindi', native: 'हिंदी', english: 'Hindi', short: 'हिं',
    suggestions: ['मेरी कितनी आने वाली बुकिंग हैं?', 'जयपुर में क्या-क्या देखें?', 'अहमदाबाद से वीकेंड ट्रिप के आइडिया', 'गाड़ी कैसे बुक करूँ?', 'बुकिंग कैसे कैंसल करूँ?', 'रिफंड कब तक आएगा?'],
    greeting: 'नमस्ते! मैं TransRentals असिस्टेंट हूँ। मुझसे पूछिए कहाँ घूमने जाएँ, या बुकिंग, पेमेंट, ट्रिप, कैंसलेशन और रिफंड से जुड़ा कोई भी सवाल।',
  },
  {
    key: 'hinglish', native: 'Hinglish', english: 'Hindi in English letters', short: 'Hing',
    suggestions: ['Meri kitni upcoming bookings hain?', 'Jaipur me kya kya dekhein?', 'Ahmedabad se weekend trip idea', 'Gaadi kaise book karu?', 'Booking cancel kaise karu?', 'Refund kab tak aayega?'],
    greeting: 'Namaste! Main TransRentals Assistant hoon. Mujhse poochiye kahan ghoomne jaayein, ya booking, payment, trip, cancellation aur refund se juda koi bhi sawaal.',
  },
  {
    key: 'gujarati', native: 'ગુજરાતી', english: 'Gujarati', short: 'ગુ',
    suggestions: ['મારી કેટલી આગામી બુકિંગ છે?', 'જયપુરમાં શું જોવું?', 'અમદાવાદથી વીકએન્ડ ટ્રિપ આઇડિયા', 'વાહન કેવી રીતે બુક કરું?', 'બુકિંગ કેવી રીતે રદ કરું?', 'રિફંડ ક્યારે આવશે?'],
    greeting: 'નમસ્તે! હું TransRentals આસિસ્ટન્ટ છું. ક્યાં ફરવા જવું, અથવા બુકિંગ, પેમેન્ટ, ટ્રિપ, કેન્સલેશન અને રિફંડ વિશે કંઈ પણ પૂછો.',
  },
  {
    key: 'marathi', native: 'मराठी', english: 'Marathi', short: 'म',
    suggestions: ['माझ्या किती आगामी बुकिंग आहेत?', 'जयपूरमध्ये काय पाहावे?', 'पुण्याहून वीकेंड ट्रिप आयडिया', 'गाडी कशी बुक करू?', 'बुकिंग कशी रद्द करू?', 'रिफंड कधी मिळेल?'],
    greeting: 'नमस्कार! मी TransRentals असिस्टंट आहे. कुठे फिरायला जायचे, किंवा बुकिंग, पेमेंट, ट्रिप, रद्द करणे आणि रिफंडबद्दल काहीही विचारा.',
  },
  {
    key: 'bengali', native: 'বাংলা', english: 'Bengali', short: 'বা',
    suggestions: ['আমার কতগুলো আসন্ন বুকিং আছে?', 'জয়পুরে কী কী দেখব?', 'কলকাতা থেকে উইকেন্ড ট্রিপের আইডিয়া', 'কীভাবে গাড়ি বুক করব?', 'কীভাবে বুকিং বাতিল করব?', 'রিফান্ড কবে পাব?'],
    greeting: 'নমস্কার! আমি TransRentals অ্যাসিস্ট্যান্ট। কোথায় বেড়াতে যাবেন, বা বুকিং, পেমেন্ট, ট্রিপ, বাতিল ও রিফান্ড নিয়ে যেকোনো প্রশ্ন করুন।',
  },
  {
    key: 'tamil', native: 'தமிழ்', english: 'Tamil', short: 'த',
    suggestions: ['எனக்கு எத்தனை வரவிருக்கும் முன்பதிவுகள் உள்ளன?', 'ஜெய்ப்பூரில் என்ன பார்க்கலாம்?', 'சென்னையிலிருந்து வார இறுதி பயண யோசனைகள்', 'வாகனத்தை எப்படி முன்பதிவு செய்வது?', 'முன்பதிவை எப்படி ரத்து செய்வது?', 'பணம் எப்போது திரும்ப வரும்?'],
    greeting: 'வணக்கம்! நான் TransRentals உதவியாளர். எங்கே சுற்றுலா செல்லலாம், அல்லது முன்பதிவு, கட்டணம், பயணம், ரத்து மற்றும் பணத்திருப்பம் பற்றி எதையும் கேளுங்கள்.',
  },
  {
    key: 'telugu', native: 'తెలుగు', english: 'Telugu', short: 'తె',
    suggestions: ['నాకు ఎన్ని రాబోయే బుకింగ్‌లు ఉన్నాయి?', 'జైపూర్‌లో ఏమి చూడాలి?', 'హైదరాబాద్ నుండి వీకెండ్ ట్రిప్ ఐడియాలు', 'వాహనాన్ని ఎలా బుక్ చేయాలి?', 'బుకింగ్‌ను ఎలా రద్దు చేయాలి?', 'రీఫండ్ ఎప్పుడు వస్తుంది?'],
    greeting: 'నమస్కారం! నేను TransRentals అసిస్టెంట్. ఎక్కడికి వెళ్లాలి, లేదా బుకింగ్, పేమెంట్, ట్రిప్, రద్దు మరియు రీఫండ్ గురించి ఏదైనా అడగండి.',
  },
  {
    key: 'kannada', native: 'ಕನ್ನಡ', english: 'Kannada', short: 'ಕ',
    suggestions: ['ನನ್ನ ಎಷ್ಟು ಮುಂಬರುವ ಬುಕಿಂಗ್‌ಗಳಿವೆ?', 'ಜೈಪುರದಲ್ಲಿ ಏನು ನೋಡಬೇಕು?', 'ಬೆಂಗಳೂರಿನಿಂದ ವೀಕೆಂಡ್ ಟ್ರಿಪ್ ಐಡಿಯಾಗಳು', 'ವಾಹನವನ್ನು ಹೇಗೆ ಬುಕ್ ಮಾಡುವುದು?', 'ಬುಕಿಂಗ್ ಅನ್ನು ಹೇಗೆ ರದ್ದು ಮಾಡುವುದು?', 'ಮರುಪಾವತಿ ಯಾವಾಗ ಬರುತ್ತದೆ?'],
    greeting: 'ನಮಸ್ಕಾರ! ನಾನು TransRentals ಸಹಾಯಕ. ಎಲ್ಲಿಗೆ ಪ್ರವಾಸ ಹೋಗಬೇಕು, ಅಥವಾ ಬುಕಿಂಗ್, ಪಾವತಿ, ಪ್ರವಾಸ, ರದ್ದತಿ ಮತ್ತು ಮರುಪಾವತಿ ಬಗ್ಗೆ ಏನು ಬೇಕಾದರೂ ಕೇಳಿ.',
  },
  {
    key: 'malayalam', native: 'മലയാളം', english: 'Malayalam', short: 'മ',
    suggestions: ['എനിക്ക് എത്ര വരാനിരിക്കുന്ന ബുക്കിംഗുകൾ ഉണ്ട്?', 'ജയ്പൂരിൽ എന്തൊക്കെ കാണണം?', 'കൊച്ചിയിൽ നിന്ന് വീക്കെൻഡ് ട്രിപ്പ് ഐഡിയകൾ', 'വാഹനം എങ്ങനെ ബുക്ക് ചെയ്യാം?', 'ബുക്കിംഗ് എങ്ങനെ റദ്ദാക്കാം?', 'റീഫണ്ട് എപ്പോൾ ലഭിക്കും?'],
    greeting: 'നമസ്കാരം! ഞാൻ TransRentals അസിസ്റ്റന്റ് ആണ്. എവിടെ യാത്ര പോകണം, അല്ലെങ്കിൽ ബുക്കിംഗ്, പേയ്മെന്റ്, യാത്ര, റദ്ദാക്കൽ, റീഫണ്ട് എന്നിവയെക്കുറിച്ച് എന്തും ചോദിക്കൂ.',
  },
  {
    key: 'punjabi', native: 'ਪੰਜਾਬੀ', english: 'Punjabi', short: 'ਪੰ',
    suggestions: ['ਮੇਰੀਆਂ ਕਿੰਨੀਆਂ ਆਉਣ ਵਾਲੀਆਂ ਬੁਕਿੰਗਾਂ ਹਨ?', 'ਜੈਪੁਰ ਵਿੱਚ ਕੀ ਦੇਖੀਏ?', 'ਚੰਡੀਗੜ੍ਹ ਤੋਂ ਵੀਕਐਂਡ ਟ੍ਰਿਪ ਆਈਡੀਆ', 'ਗੱਡੀ ਕਿਵੇਂ ਬੁੱਕ ਕਰਾਂ?', 'ਬੁਕਿੰਗ ਕਿਵੇਂ ਰੱਦ ਕਰਾਂ?', 'ਰਿਫੰਡ ਕਦੋਂ ਆਵੇਗਾ?'],
    greeting: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ TransRentals ਅਸਿਸਟੈਂਟ ਹਾਂ। ਕਿੱਥੇ ਘੁੰਮਣ ਜਾਣਾ ਹੈ, ਜਾਂ ਬੁਕਿੰਗ, ਪੇਮੈਂਟ, ਟ੍ਰਿਪ, ਰੱਦ ਕਰਨ ਅਤੇ ਰਿਫੰਡ ਬਾਰੇ ਕੁਝ ਵੀ ਪੁੱਛੋ।',
  },
];

export const languageByKey = (key) =>
  ASSISTANT_LANGUAGES.find((l) => l.key === key) || ASSISTANT_LANGUAGES[0];
