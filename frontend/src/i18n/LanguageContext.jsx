import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from './translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('icanscan_lang') || 'es';
  });

  useEffect(() => {
    localStorage.setItem('icanscan_lang', lang);
  }, [lang]);

  const toggleLang = () => {
    setLang((prev) => (prev === 'es' ? 'en' : 'es'));
  };

  const t = (path, replacements = {}) => {
    const keys = path.split('.');
    let current = translations[lang] || translations.es;
    for (const key of keys) {
      if (current && current[key] !== undefined) {
        current = current[key];
      } else {
        // Fallback to Spanish if not found
        let fallback = translations.es;
        for (const fKey of keys) {
          if (fallback && fallback[fKey] !== undefined) {
            fallback = fallback[fKey];
          } else {
            return path;
          }
        }
        current = fallback;
        break;
      }
    }

    if (typeof current !== 'string') return path;

    // Replace dynamic variables like {count} or {current}
    let result = current;
    Object.keys(replacements).forEach((key) => {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), replacements[key]);
    });

    return result;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
