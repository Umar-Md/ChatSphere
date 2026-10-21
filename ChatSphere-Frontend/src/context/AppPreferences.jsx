import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getProfile, updatePreferences } from "../services/profileService";

const PreferencesContext = createContext(null);

export const LANGUAGES = {
  english: "English",
  telugu: "తెలుగు",
  hindi: "हिन्दी",
};

const normalizeLanguage = (value) => {
  const normalized = String(value || "english").toLowerCase();
  return normalized in LANGUAGES ? normalized : "english";
};

const normalizeTheme = (value) =>
  ["light", "dark", "system"].includes(value) ? value : "system";

export const translations = {
  english: {
    chats: "Chats", profile: "Profile", settings: "Settings", logout: "Logout",
    connect: "Connect • Chat • Collaborate", newChat: "New chat", search: "Search",
    searchConversations: "Search conversations...", noConversations: "No conversations yet.",
    startConversation: "Start a conversation", selectConversation: "Select a conversation",
    loading: "Loading...", loadingConversations: "Loading conversations...", loadingMessages: "Loading messages...",
    online: "Online", offline: "Offline", members: "members", typeMessage: "Type a message...",
    poll: "Poll", more: "More", bookmarks: "Bookmarks", scheduled: "Scheduled", cancel: "Cancel",
    aiAssistant: "AI Assistant", poweredByBackend: "Powered by your backend", close: "Close",
    theme: "Theme", language: "Preferred Language", light: "Light", dark: "Dark", system: "System",
    saveSettings: "Save Settings", settingsSaved: "Preferences updated successfully",
    createPoll: "Create Poll", addOption: "Add option", expiration: "Expiration (optional)",
    creating: "Creating...", askQuestion: "Ask a question...", smart: "Smart", summary: "Summary",
    rephrase: "Rephrase", explain: "Explain", translate: "Translate", generate: "Generate",
    working: "Working...", smartReplies: "Smart replies", aiResponse: "AI response", useInMessage: "Use this in message",
    email: "Email", password: "Password", login: "Login", register: "Register", welcomeBack: "Welcome Back",
    createAccount: "Create Account", fullName: "Full Name", confirmPassword: "Confirm Password", gender: "Gender",
    male: "Male", female: "Female", selectGender: "Select Gender", noAccount: "Don't have an account?",
    haveAccount: "Already have an account?", editProfile: "Edit Profile", save: "Save", cancelEdit: "Cancel",
    changePhoto: "Change Photo", unknownUser: "Unknown user", enterEmail: "Enter your email", enterPassword: "Enter your password",
    enterName: "Enter your name", createPassword: "Create password", confirmPasswordPlaceholder: "Confirm password",
    group: "Group", newChatTitle: "Start a new chat", searchUsers: "Search by name or email...", noUsers: "No users found",
    searching: "Searching...", startChat: "Start chat", selfDestruct: "Self-destruct", schedule: "Schedule",
    sendAt: "Send at", someoneTyping: "Someone is typing...", mediaMessage: "Media message",
    failedSave: "Failed to save settings", failedLoadProfile: "Failed to load profile",
  },
  telugu: {
    chats: "చాట్‌లు", profile: "ప్రొఫైల్", settings: "సెట్టింగ్స్", logout: "లాగ్ అవుట్",
    connect: "కనెక్ట్ • చాట్ • సహకరించండి", newChat: "కొత్త చాట్", search: "వెతకండి",
    searchConversations: "చాట్‌లను వెతకండి...", noConversations: "ఇంకా చాట్‌లు లేవు.",
    startConversation: "సంభాషణ ప్రారంభించండి", selectConversation: "సంభాషణను ఎంచుకోండి",
    loading: "లోడ్ అవుతోంది...", loadingConversations: "చాట్‌లు లోడ్ అవుతున్నాయి...", loadingMessages: "సందేశాలు లోడ్ అవుతున్నాయి...",
    online: "ఆన్‌లైన్", offline: "ఆఫ్‌లైన్", members: "సభ్యులు", typeMessage: "సందేశం టైప్ చేయండి...",
    poll: "పోల్", more: "మరిన్ని", bookmarks: "బుక్‌మార్క్‌లు", scheduled: "షెడ్యూల్ చేసినవి", cancel: "రద్దు",
    aiAssistant: "AI సహాయకుడు", poweredByBackend: "మీ బ్యాక్‌ఎండ్ ద్వారా", close: "మూసివేయి",
    theme: "థీమ్", language: "ఇష్టమైన భాష", light: "లైట్", dark: "డార్క్", system: "సిస్టమ్",
    saveSettings: "సెట్టింగ్స్ సేవ్ చేయండి", settingsSaved: "ప్రాధాన్యతలు విజయవంతంగా నవీకరించబడ్డాయి",
    createPoll: "పోల్ సృష్టించండి", addOption: "ఆప్షన్ జోడించండి", expiration: "గడువు (ఐచ్ఛికం)",
    creating: "సృష్టిస్తోంది...", askQuestion: "ప్రశ్న అడగండి...", smart: "స్మార్ట్", summary: "సారాంశం",
    rephrase: "మళ్లీ రాయండి", explain: "వివరించండి", translate: "అనువదించండి", generate: "సృష్టించండి",
    working: "పని చేస్తోంది...", smartReplies: "స్మార్ట్ సమాధానాలు", aiResponse: "AI సమాధానం", useInMessage: "సందేశంలో ఉపయోగించండి",
    email: "ఈమెయిల్", password: "పాస్‌వర్డ్", login: "లాగిన్", register: "రిజిస్టర్", welcomeBack: "మళ్లీ స్వాగతం",
    createAccount: "ఖాతా సృష్టించండి", fullName: "పూర్తి పేరు", confirmPassword: "పాస్‌వర్డ్ నిర్ధారించండి", gender: "లింగం",
    male: "పురుషుడు", female: "స్త్రీ", selectGender: "లింగాన్ని ఎంచుకోండి", noAccount: "ఖాతా లేదా?",
    haveAccount: "ఇప్పటికే ఖాతా ఉందా?", editProfile: "ప్రొఫైల్ మార్చండి", save: "సేవ్", cancelEdit: "రద్దు",
    changePhoto: "ఫోటో మార్చండి", unknownUser: "తెలియని వినియోగదారు", enterEmail: "మీ ఈమెయిల్ నమోదు చేయండి", enterPassword: "మీ పాస్‌వర్డ్ నమోదు చేయండి",
    enterName: "మీ పేరు నమోదు చేయండి", createPassword: "పాస్‌వర్డ్ సృష్టించండి", confirmPasswordPlaceholder: "పాస్‌వర్డ్ నిర్ధారించండి",
    group: "గ్రూప్", newChatTitle: "కొత్త చాట్ ప్రారంభించండి", searchUsers: "పేరు లేదా ఈమెయిల్‌తో వెతకండి...", noUsers: "వినియోగదారులు కనబడలేదు",
    searching: "వెతుకుతోంది...", startChat: "చాట్ ప్రారంభించండి", selfDestruct: "స్వీయ-వినాశనం", schedule: "షెడ్యూల్",
    sendAt: "పంపే సమయం", someoneTyping: "ఎవరైనా టైప్ చేస్తున్నారు...", mediaMessage: "మీడియా సందేశం",
    failedSave: "సెట్టింగ్స్ సేవ్ కాలేదు", failedLoadProfile: "ప్రొఫైల్ లోడ్ కాలేదు",
  },
  hindi: {
    chats: "चैट", profile: "प्रोफ़ाइल", settings: "सेटिंग्स", logout: "लॉग आउट",
    connect: "कनेक्ट • चैट • सहयोग", newChat: "नई चैट", search: "खोजें",
    searchConversations: "चैट खोजें...", noConversations: "अभी कोई चैट नहीं है।",
    startConversation: "बातचीत शुरू करें", selectConversation: "बातचीत चुनें",
    loading: "लोड हो रहा है...", loadingConversations: "चैट लोड हो रही हैं...", loadingMessages: "संदेश लोड हो रहे हैं...",
    online: "ऑनलाइन", offline: "ऑफ़लाइन", members: "सदस्य", typeMessage: "संदेश लिखें...",
    poll: "पोल", more: "और", bookmarks: "बुकमार्क", scheduled: "शेड्यूल", cancel: "रद्द करें",
    aiAssistant: "AI सहायक", poweredByBackend: "आपके बैकएंड द्वारा", close: "बंद करें",
    theme: "थीम", language: "पसंदीदा भाषा", light: "लाइट", dark: "डार्क", system: "सिस्टम",
    saveSettings: "सेटिंग्स सेव करें", settingsSaved: "प्राथमिकताएँ सफलतापूर्वक अपडेट हुईं",
    createPoll: "पोल बनाएँ", addOption: "विकल्प जोड़ें", expiration: "समाप्ति (वैकल्पिक)",
    creating: "बन रहा है...", askQuestion: "प्रश्न पूछें...", smart: "स्मार्ट", summary: "सारांश",
    rephrase: "फिर से लिखें", explain: "समझाएँ", translate: "अनुवाद", generate: "बनाएँ",
    working: "काम हो रहा है...", smartReplies: "स्मार्ट जवाब", aiResponse: "AI जवाब", useInMessage: "संदेश में उपयोग करें",
    email: "ईमेल", password: "पासवर्ड", login: "लॉगिन", register: "रजिस्टर", welcomeBack: "वापसी पर स्वागत है",
    createAccount: "खाता बनाएँ", fullName: "पूरा नाम", confirmPassword: "पासवर्ड की पुष्टि", gender: "लिंग",
    male: "पुरुष", female: "महिला", selectGender: "लिंग चुनें", noAccount: "खाता नहीं है?",
    haveAccount: "पहले से खाता है?", editProfile: "प्रोफ़ाइल संपादित करें", save: "सेव", cancelEdit: "रद्द करें",
    changePhoto: "फोटो बदलें", unknownUser: "अज्ञात उपयोगकर्ता", enterEmail: "अपना ईमेल दर्ज करें", enterPassword: "अपना पासवर्ड दर्ज करें",
    enterName: "अपना नाम दर्ज करें", createPassword: "पासवर्ड बनाएँ", confirmPasswordPlaceholder: "पासवर्ड की पुष्टि करें",
    group: "ग्रुप", newChatTitle: "नई चैट शुरू करें", searchUsers: "नाम या ईमेल से खोजें...", noUsers: "कोई उपयोगकर्ता नहीं मिला",
    searching: "खोज रहे हैं...", startChat: "चैट शुरू करें", selfDestruct: "स्वयं-विनाश", schedule: "शेड्यूल",
    sendAt: "भेजने का समय", someoneTyping: "कोई टाइप कर रहा है...", mediaMessage: "मीडिया संदेश",
    failedSave: "सेटिंग्स सेव नहीं हुईं", failedLoadProfile: "प्रोफ़ाइल लोड नहीं हुई",
  },
};

export function PreferencesProvider({ children }) {
  const [theme, setTheme] = useState("system");
  const [language, setLanguage] = useState("english");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!sessionStorage.getItem("token")) {
      setLoaded(true);
      return undefined;
    }
    getProfile()
      .then(({ user }) => {
        if (cancelled) return;
        setTheme(normalizeTheme(user?.theme));
        setLanguage(normalizeLanguage(user?.preferredLanguage));
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoaded(true));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-light", "theme-dark");
    const resolved = theme === "system"
      ? (window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light")
      : theme;
    root.classList.add(`theme-${resolved}`);
    root.dataset.language = language;
  }, [theme, language]);

  const savePreferences = async (next) => {
    const nextTheme = normalizeTheme(next.theme ?? theme);
    const nextLanguage = normalizeLanguage(next.preferredLanguage ?? language);
    const response = await updatePreferences({ theme: nextTheme, preferredLanguage: nextLanguage });
    setTheme(nextTheme);
    setLanguage(nextLanguage);
    return response;
  };

  const value = useMemo(() => ({
    theme, language, loaded, setTheme, setLanguage, savePreferences,
    t: (key) => translations[language]?.[key] ?? translations.english[key] ?? key,
  }), [theme, language, loaded]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export const usePreferences = () => useContext(PreferencesContext);
