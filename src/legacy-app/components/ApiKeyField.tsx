import React, { useState, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { safeStorage } from '../utils/storage';
import { validateApiKeyFormat } from '../utils/api';

export interface ApiKeyFieldProps {
  icon: ReactNode;
  label: string;
  description: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  storageKey: string;
  inputId: string;
  buttonId: string;
  saveLabel: string;
  buttonClass: string;
  validateFormat?: boolean;
  invalidMsg?: string;
  successMsg: string;
  errorPrefix: string;
  link?: { href: string; text: string; className: string };
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
  children?: ReactNode;
}

export const ApiKeyField: React.FC<ApiKeyFieldProps> = ({
  icon, label, description, placeholder, value, onChange,
  storageKey, inputId, buttonId, saveLabel, buttonClass,
  validateFormat = false, invalidMsg, successMsg, errorPrefix,
  link, showSuccess, showError, children,
}) => {
  const [show, setShow] = useState(false);

  const handleSave = () => {
    try {
      const trimmed = (value || '').trim();
      onChange(trimmed);
      if (validateFormat) {
        const check = validateApiKeyFormat(trimmed);
        if (!check.isValid) {
          showError(check.reason || invalidMsg || 'Chave inválida!');
          return;
        }
      }
      safeStorage.setItem(storageKey, trimmed);
      window.dispatchEvent(new Event('bambuzau_keys_updated'));
      showSuccess(successMsg);
    } catch (e: any) {
      showError(`${errorPrefix}: ${e.message}`);
    }
  };

  return (
    <div className="p-4 bg-[#0A0D0B] border border-[#232B27] rounded-2xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <label className="text-xs font-bold text-gray-200 flex items-center gap-1 font-sans">
            {icon}
            {label}
          </label>
          <p className="text-[10px] text-[#8BA58D]">{description}</p>
        </div>
        {link && (
          <a href={link.href} target="_blank" rel="noreferrer" className={link.className}>
            {link.text}
          </a>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-grow flex">
          <input
            type={show ? 'text' : 'password'}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-grow bg-[#151917] border border-[#232B27] pl-3.5 pr-10 py-2.5 rounded-xl text-xs text-white placeholder-zinc-800 hover:border-[#38463F] focus:border-[#52b788] outline-none font-mono"
            id={inputId}
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-3 text-[#8BA58D] hover:text-white transition p-0.5 rounded cursor-pointer"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <button
          type="button"
          onClick={handleSave}
          className={`px-5 py-2.5 font-black text-xs rounded-xl transition cursor-pointer select-none shrink-0 ${buttonClass}`}
          id={buttonId}
        >
          {saveLabel}
        </button>
      </div>

      {children}
    </div>
  );
};