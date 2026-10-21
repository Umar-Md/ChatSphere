import { useEffect, useState } from "react";
import { LANGUAGES, usePreferences } from "../context/AppPreferences";

function Settings() {
  const { theme: activeTheme, language: activeLanguage, savePreferences, t } = usePreferences();
  const [theme, setTheme] = useState(activeTheme);
  const [language, setLanguage] = useState(activeLanguage);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setTheme(activeTheme); }, [activeTheme]);
  useEffect(() => { setLanguage(activeLanguage); }, [activeLanguage]);


  const handleSave = async () => {
    setSaving(true);
    try {
      await savePreferences({ theme, preferredLanguage: language });
      alert(t("settingsSaved"));
    } catch (error) {
      console.error(error);
      alert(t("failedSave"));
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-3xl mx-auto surface-card shadow-lg rounded-xl p-4 sm:p-8">
      <h1 className="text-3xl font-bold mb-8">{t("settings")}</h1>
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">{t("theme")}</h2>
        <div className="space-y-3">
          {["light", "dark", "system"].map((value) => <label key={value} className="flex items-center gap-3"><input type="radio" value={value} checked={theme === value} onChange={(e) => setTheme(e.target.value)} />{t(value)}</label>)}
        </div>
      </div>
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">{t("language")}</h2>
        <select value={language} onChange={(e) => setLanguage(e.target.value)} className="border p-3 rounded w-full">
          {Object.entries(LANGUAGES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      <button onClick={handleSave} disabled={saving} className="bg-indigo-600 text-white px-6 py-3 rounded disabled:opacity-50">{saving ? t("working") : t("saveSettings")}</button>
    </div>
  );
}
export default Settings;
