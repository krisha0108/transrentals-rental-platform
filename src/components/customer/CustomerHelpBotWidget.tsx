'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageCircle, X, Send, Bot, User, RotateCcw, ArrowUpRight, Languages, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Reply languages; `key` is sent to the server. Keep in step with the app's
// tr-app/screens/customer/support/assistantLanguages.js.
const LANGUAGES = [
  { key: 'auto', native: 'Auto', english: 'Same as my message', short: 'Auto',
    suggestions: ['Meri upcoming bookings dikhao', 'Jaipur me kya kya dekhein?', 'Weekend trip idea from Ahmedabad', 'How do I book a vehicle?', 'Booking cancel kaise karu?', 'Refund kab tak aayega?'],
    greeting: "Hi! I'm the TransRentals Assistant. Ask me where to travel, or anything about booking, quotes, payment, your trip, cancellation, refunds or support — in any language, jis bhi bhasha me aap comfortable ho." },
  { key: 'english', native: 'English', english: 'English', short: 'EN',
    suggestions: ['How many upcoming bookings do I have?', 'Best places to visit in Jaipur?', 'Weekend trip ideas from Ahmedabad', 'How do I book a vehicle?', 'How do I cancel my booking?', 'When will I get my refund?'],
    greeting: "Hi! I'm the TransRentals Assistant. Ask me where to travel, or anything about booking, payment, your trip, cancellation or refunds." },
  { key: 'hindi', native: 'हिंदी', english: 'Hindi', short: 'हिं',
    suggestions: ['मेरी कितनी आने वाली बुकिंग हैं?', 'जयपुर में क्या-क्या देखें?', 'अहमदाबाद से वीकेंड ट्रिप के आइडिया', 'गाड़ी कैसे बुक करूँ?', 'बुकिंग कैसे कैंसल करूँ?', 'रिफंड कब तक आएगा?'],
    greeting: 'नमस्ते! मैं TransRentals असिस्टेंट हूँ। मुझसे पूछिए कहाँ घूमने जाएँ, या बुकिंग, पेमेंट, ट्रिप, कैंसलेशन और रिफंड से जुड़ा कोई भी सवाल।' },
  { key: 'hinglish', native: 'Hinglish', english: 'Hindi in English letters', short: 'Hing',
    suggestions: ['Meri kitni upcoming bookings hain?', 'Jaipur me kya kya dekhein?', 'Ahmedabad se weekend trip idea', 'Gaadi kaise book karu?', 'Booking cancel kaise karu?', 'Refund kab tak aayega?'],
    greeting: 'Namaste! Main TransRentals Assistant hoon. Mujhse poochiye kahan ghoomne jaayein, ya booking, payment, trip, cancellation aur refund se juda koi bhi sawaal.' },
  { key: 'gujarati', native: 'ગુજરાતી', english: 'Gujarati', short: 'ગુ',
    suggestions: ['મારી કેટલી આગામી બુકિંગ છે?', 'જયપુરમાં શું જોવું?', 'અમદાવાદથી વીકએન્ડ ટ્રિપ આઇડિયા', 'વાહન કેવી રીતે બુક કરું?', 'બુકિંગ કેવી રીતે રદ કરું?', 'રિફંડ ક્યારે આવશે?'],
    greeting: 'નમસ્તે! હું TransRentals આસિસ્ટન્ટ છું. ક્યાં ફરવા જવું, અથવા બુકિંગ, પેમેન્ટ, ટ્રિપ, કેન્સલેશન અને રિફંડ વિશે કંઈ પણ પૂછો.' },
  { key: 'marathi', native: 'मराठी', english: 'Marathi', short: 'म',
    suggestions: ['माझ्या किती आगामी बुकिंग आहेत?', 'जयपूरमध्ये काय पाहावे?', 'पुण्याहून वीकेंड ट्रिप आयडिया', 'गाडी कशी बुक करू?', 'बुकिंग कशी रद्द करू?', 'रिफंड कधी मिळेल?'],
    greeting: 'नमस्कार! मी TransRentals असिस्टंट आहे. कुठे फिरायला जायचे, किंवा बुकिंग, पेमेंट, ट्रिप, रद्द करणे आणि रिफंडबद्दल काहीही विचारा.' },
  { key: 'bengali', native: 'বাংলা', english: 'Bengali', short: 'বা',
    suggestions: ['আমার কতগুলো আসন্ন বুকিং আছে?', 'জয়পুরে কী কী দেখব?', 'কলকাতা থেকে উইকেন্ড ট্রিপের আইডিয়া', 'কীভাবে গাড়ি বুক করব?', 'কীভাবে বুকিং বাতিল করব?', 'রিফান্ড কবে পাব?'],
    greeting: 'নমস্কার! আমি TransRentals অ্যাসিস্ট্যান্ট। কোথায় বেড়াতে যাবেন, বা বুকিং, পেমেন্ট, ট্রিপ, বাতিল ও রিফান্ড নিয়ে যেকোনো প্রশ্ন করুন।' },
  { key: 'tamil', native: 'தமிழ்', english: 'Tamil', short: 'த',
    suggestions: ['எனக்கு எத்தனை வரவிருக்கும் முன்பதிவுகள் உள்ளன?', 'ஜெய்ப்பூரில் என்ன பார்க்கலாம்?', 'சென்னையிலிருந்து வார இறுதி பயண யோசனைகள்', 'வாகனத்தை எப்படி முன்பதிவு செய்வது?', 'முன்பதிவை எப்படி ரத்து செய்வது?', 'பணம் எப்போது திரும்ப வரும்?'],
    greeting: 'வணக்கம்! நான் TransRentals உதவியாளர். எங்கே சுற்றுலா செல்லலாம், அல்லது முன்பதிவு, கட்டணம், பயணம், ரத்து மற்றும் பணத்திருப்பம் பற்றி எதையும் கேளுங்கள்.' },
  { key: 'telugu', native: 'తెలుగు', english: 'Telugu', short: 'తె',
    suggestions: ['నాకు ఎన్ని రాబోయే బుకింగ్‌లు ఉన్నాయి?', 'జైపూర్‌లో ఏమి చూడాలి?', 'హైదరాబాద్ నుండి వీకెండ్ ట్రిప్ ఐడియాలు', 'వాహనాన్ని ఎలా బుక్ చేయాలి?', 'బుకింగ్‌ను ఎలా రద్దు చేయాలి?', 'రీఫండ్ ఎప్పుడు వస్తుంది?'],
    greeting: 'నమస్కారం! నేను TransRentals అసిస్టెంట్. ఎక్కడికి వెళ్లాలి, లేదా బుకింగ్, పేమెంట్, ట్రిప్, రద్దు మరియు రీఫండ్ గురించి ఏదైనా అడగండి.' },
  { key: 'kannada', native: 'ಕನ್ನಡ', english: 'Kannada', short: 'ಕ',
    suggestions: ['ನನ್ನ ಎಷ್ಟು ಮುಂಬರುವ ಬುಕಿಂಗ್‌ಗಳಿವೆ?', 'ಜೈಪುರದಲ್ಲಿ ಏನು ನೋಡಬೇಕು?', 'ಬೆಂಗಳೂರಿನಿಂದ ವೀಕೆಂಡ್ ಟ್ರಿಪ್ ಐಡಿಯಾಗಳು', 'ವಾಹನವನ್ನು ಹೇಗೆ ಬುಕ್ ಮಾಡುವುದು?', 'ಬುಕಿಂಗ್ ಅನ್ನು ಹೇಗೆ ರದ್ದು ಮಾಡುವುದು?', 'ಮರುಪಾವತಿ ಯಾವಾಗ ಬರುತ್ತದೆ?'],
    greeting: 'ನಮಸ್ಕಾರ! ನಾನು TransRentals ಸಹಾಯಕ. ಎಲ್ಲಿಗೆ ಪ್ರವಾಸ ಹೋಗಬೇಕು, ಅಥವಾ ಬುಕಿಂಗ್, ಪಾವತಿ, ಪ್ರವಾಸ, ರದ್ದತಿ ಮತ್ತು ಮರುಪಾವತಿ ಬಗ್ಗೆ ಏನು ಬೇಕಾದರೂ ಕೇಳಿ.' },
  { key: 'malayalam', native: 'മലയാളം', english: 'Malayalam', short: 'മ',
    suggestions: ['എനിക്ക് എത്ര വരാനിരിക്കുന്ന ബുക്കിംഗുകൾ ഉണ്ട്?', 'ജയ്പൂരിൽ എന്തൊക്കെ കാണണം?', 'കൊച്ചിയിൽ നിന്ന് വീക്കെൻഡ് ട്രിപ്പ് ഐഡിയകൾ', 'വാഹനം എങ്ങനെ ബുക്ക് ചെയ്യാം?', 'ബുക്കിംഗ് എങ്ങനെ റദ്ദാക്കാം?', 'റീഫണ്ട് എപ്പോൾ ലഭിക്കും?'],
    greeting: 'നമസ്കാരം! ഞാൻ TransRentals അസിസ്റ്റന്റ് ആണ്. എവിടെ യാത്ര പോകണം, അല്ലെങ്കിൽ ബുക്കിംഗ്, പേയ്മെന്റ്, യാത്ര, റദ്ദാക്കൽ, റീഫണ്ട് എന്നിവയെക്കുറിച്ച് എന്തും ചോദിക്കൂ.' },
  { key: 'punjabi', native: 'ਪੰਜਾਬੀ', english: 'Punjabi', short: 'ਪੰ',
    suggestions: ['ਮੇਰੀਆਂ ਕਿੰਨੀਆਂ ਆਉਣ ਵਾਲੀਆਂ ਬੁਕਿੰਗਾਂ ਹਨ?', 'ਜੈਪੁਰ ਵਿੱਚ ਕੀ ਦੇਖੀਏ?', 'ਚੰਡੀਗੜ੍ਹ ਤੋਂ ਵੀਕਐਂਡ ਟ੍ਰਿਪ ਆਈਡੀਆ', 'ਗੱਡੀ ਕਿਵੇਂ ਬੁੱਕ ਕਰਾਂ?', 'ਬੁਕਿੰਗ ਕਿਵੇਂ ਰੱਦ ਕਰਾਂ?', 'ਰਿਫੰਡ ਕਦੋਂ ਆਵੇਗਾ?'],
    greeting: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ TransRentals ਅਸਿਸਟੈਂਟ ਹਾਂ। ਕਿੱਥੇ ਘੁੰਮਣ ਜਾਣਾ ਹੈ, ਜਾਂ ਬੁਕਿੰਗ, ਪੇਮੈਂਟ, ਟ੍ਰਿਪ, ਰੱਦ ਕਰਨ ਅਤੇ ਰਿਫੰਡ ਬਾਰੇ ਕੁਝ ਵੀ ਪੁੱਛੋ।' },
];
const LANGUAGE_STORAGE_KEY = 'tr_assistant_language';

// Pages that already have their own button or bar at the bottom right, so
// the launcher sits higher there instead of covering it.
const RAISED_ON = ['/customer/booking/', '/customer/car-bookings/', '/customer/truck-quotes/'];

// Floating help assistant for customers, backed by /api/customer/help-chat.
// Mounted for every /customer/* page by LayoutWrapper, so it works on the
// login page as well as inside the customer area.
export function CustomerHelpBotWidget() {
  const pathname = usePathname() || '';
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('auto');
  const [showLanguages, setShowLanguages] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const raised = RAISED_ON.some((prefix) => pathname.startsWith(prefix));
  const current = LANGUAGES.find((l) => l.key === language) || LANGUAGES[0];

  // Remember the reply language in this browser.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved && LANGUAGES.some((l) => l.key === saved)) setLanguage(saved);
    } catch {}
  }, []);

  const chooseLanguage = (key: string) => {
    setLanguage(key);
    setShowLanguages(false);
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, key);
    } catch {}
  };

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }, [messages, loading, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const nextMessages: Message[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    let reply: string;
    try {
      // Signed-in customers send their token so the assistant can answer
      // about their own bookings.
      let token: string | null = null;
      try {
        token = window.localStorage.getItem('auth_token') || window.localStorage.getItem('token');
      } catch {}
      const res = await fetch('/api/customer/help-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ messages: nextMessages, platform: 'web', language }),
      });
      const data = await res.json().catch(() => ({}));
      reply = res.ok && data.reply ? data.reply : data.error || 'Something went wrong. Please try again.';
    } catch {
      reply = 'Connection error. Please check your internet and try again.';
    }
    setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <>
      {open && (
        <div
          className={`fixed z-[70] left-3 right-3 sm:left-auto sm:right-6 sm:w-[380px] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden ${
            raised ? 'bottom-44' : 'bottom-24'
          }`}
          style={{ maxHeight: raised ? 'min(560px, calc(100dvh - 13rem))' : 'min(560px, calc(100dvh - 8rem))' }}
          role="dialog"
          aria-label="TransRentals Assistant"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-700 to-primary text-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="leading-tight">
                <p className="font-semibold text-sm">TransRentals Assistant</p>
                <p className="text-[11px] text-white/80">Booking, payment & trip help</p>
              </div>
            </div>
            <div className="relative flex items-center gap-1">
              <button
                onClick={() => setShowLanguages((v) => !v)}
                className="flex items-center gap-1 hover:bg-white/20 rounded-lg px-2 py-1.5 transition text-xs font-semibold"
                title="Reply language"
                aria-label={`Reply language: ${current.english}`}
                aria-expanded={showLanguages}
              >
                <Languages className="w-4 h-4" />
                {current.short}
              </button>
              {showLanguages && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white text-gray-800 rounded-xl shadow-xl border border-gray-200 py-1 z-20 max-h-72 overflow-y-auto">
                  <p className="px-3 pt-1.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Reply language</p>
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.key}
                      onClick={() => chooseLanguage(l.key)}
                      className={`w-full flex items-center gap-2 text-left px-3 py-2 transition ${
                        l.key === language ? 'bg-primary-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <span className="flex-1">
                        <span className={`block text-sm font-semibold ${l.key === language ? 'text-emerald-700' : ''}`}>{l.native}</span>
                        <span className="block text-[11px] text-gray-500">{l.english}</span>
                      </span>
                      {l.key === language && <Check className="w-4 h-4 text-emerald-700" />}
                    </button>
                  ))}
                </div>
              )}
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  className="hover:bg-white/20 rounded-lg p-1.5 transition"
                  title="Start a new chat"
                  aria-label="Start a new chat"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="hover:bg-white/20 rounded-lg p-1.5 transition"
                aria-label="Close assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            <div className="flex items-start gap-2">
              <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-3 py-2.5 text-sm text-gray-700 leading-relaxed">
                {current.greeting}
              </div>
            </div>
            {messages.length === 0 && (
              <div className="pl-9 flex flex-wrap gap-1.5">
                {current.suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-xs bg-white text-emerald-700 border border-primary-200 px-2.5 py-1 rounded-full hover:bg-primary-50 transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex items-start gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    m.role === 'user' ? 'bg-emerald-700' : 'bg-primary-100'
                  }`}
                >
                  {m.role === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed break-words ${
                    m.role === 'user'
                      ? 'bg-emerald-700 text-white rounded-tr-sm whitespace-pre-wrap'
                      : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
                  }`}
                >
                  {m.role === 'user' ? (
                    m.content
                  ) : (
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        ul: ({ children }) => <ul className="list-disc pl-4 mb-1.5 space-y-0.5">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 mb-1.5 space-y-0.5">{children}</ol>,
                        li: ({ children }) => <li>{children}</li>,
                        code: ({ children }) => <code className="bg-gray-100 px-1 rounded text-xs">{children}</code>,
                        // Page references like [My Bookings](/customer/dashboard)
                        // become buttons that take the customer straight there.
                        a: ({ href, children }) => {
                          const linkCls =
                            'inline-flex items-center gap-1 my-0.5 mr-1 text-xs font-semibold text-emerald-700 bg-primary-50 border border-primary-200 px-2 py-0.5 rounded-full hover:bg-primary-100 transition';
                          if (href?.startsWith('/')) {
                            return (
                              <Link href={href} className={linkCls} onClick={() => setOpen(false)}>
                                {children} <ArrowUpRight className="w-3 h-3" />
                              </Link>
                            );
                          }
                          return <span>{children}</span>;
                        },
                      }}
                    >
                      {m.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 flex items-end gap-2 border-t border-gray-200 bg-white flex-shrink-0">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your question..."
              rows={1}
              maxLength={1000}
              className="flex-1 resize-none text-sm border border-gray-300 rounded-xl px-3 py-2 max-h-28 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              className="bg-primary hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl px-3 py-2.5 transition"
              aria-label="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Launcher */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`fixed right-4 sm:right-6 z-[70] w-14 h-14 bg-gradient-to-br from-primary to-emerald-700 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${
          raised ? 'bottom-28' : 'bottom-6'
        }`}
        title="Ask TransRentals Assistant"
        aria-label={open ? 'Close assistant' : 'Open TransRentals Assistant'}
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </>
  );
}
