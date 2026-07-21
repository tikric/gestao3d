import { useEffect, useState } from 'react';
import { safeStorage } from '../utils/storage';

const KEY_MAP = {
  gemini: 'bambuzau_custom_gemini_key',
  groq: 'bambuzau_custom_groq_key',
  serp: 'bambuzau_custom_serp_key',
  serp2: 'bambuzau_custom_serp_key_2',
  tavily: 'bambuzau_custom_tavily_key',
  jina: 'bambuzau_custom_jina_key',
} as const;

type KeyName = keyof typeof KEY_MAP;

const read = (k: KeyName): string => safeStorage.getItem(KEY_MAP[k], '');

export const useCustomKeys = () => {
  const [geminiKey, setGeminiKey] = useState<string>(() => read('gemini'));
  const [groqKey, setGroqKey] = useState<string>(() => read('groq'));
  const [serpKey, setSerpKey] = useState<string>(() => read('serp'));
  const [serpKey2, setSerpKey2] = useState<string>(() => read('serp2'));
  const [tavilyKey, setTavilyKey] = useState<string>(() => read('tavily'));
  const [jinaKey, setJinaKey] = useState<string>(() => read('jina'));

  useEffect(() => {
    const sync = () => {
      setGeminiKey(read('gemini'));
      setGroqKey(read('groq'));
      setSerpKey(read('serp'));
      setSerpKey2(read('serp2'));
      setTavilyKey(read('tavily'));
      setJinaKey(read('jina'));
    };
    window.addEventListener('bambuzau_keys_updated', sync);
    return () => window.removeEventListener('bambuzau_keys_updated', sync);
  }, []);

  return {
    geminiKey, setGeminiKey,
    groqKey, setGroqKey,
    serpKey, setSerpKey,
    serpKey2, setSerpKey2,
    tavilyKey, setTavilyKey,
    jinaKey, setJinaKey,
  };
};