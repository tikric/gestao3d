import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { ClientProductStock } from '../../types';

interface CatalogItem {
  id: number | string;
  name: string;
  imageUrl?: string;
}

interface Props {
  value: ClientProductStock[];
  onChange: (next: ClientProductStock[]) => void;
  catalog: CatalogItem[];
  pick: string;
  onPickChange: (v: string) => void;
  qty: number;
  onQtyChange: (n: number) => void;
}

export function ClientProductsCatalogPicker({
  value, onChange, catalog, pick, onPickChange, qty, onQtyChange,
}: Props) {
  const handleAdd = () => {
    const found = catalog.find((c) => c.id.toString() === pick);
    if (!found) { alert('Selecione um produto do catálogo.'); return; }
    const exists = value.some(p => p.name.toLowerCase() === found.name.toLowerCase());
    onChange(
      exists
        ? value.map(p => p.name.toLowerCase() === found.name.toLowerCase() ? { ...p, qty: p.qty + qty } : p)
        : [...value, { name: found.name, qty, imageUrl: found.imageUrl }]
    );
    onPickChange('');
    onQtyChange(1);
  };

  return (
    <div className="flex flex-col gap-2 bg-[#0C0E0D] border border-[#232B27] rounded-xl p-3">
      <div className="flex items-center justify-between">
        <label className="text-[10px] uppercase text-[var(--brand-primary)] font-bold font-mono">
          Produtos do Cliente (Catálogo)
        </label>
        <span className="text-[10px] font-mono text-[#8BA58D]">{value.length} item(s)</span>
      </div>

      {value.length > 0 && (
        <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
          {value.map((p, idx) => (
            <div key={`${p.name}-${idx}`} className="flex items-center gap-2 bg-[#151917] border border-[#232B27] rounded-lg p-1.5">
              {p.imageUrl ? (
                <img src={p.imageUrl} alt={p.name} referrerPolicy="no-referrer" className="w-8 h-8 rounded object-cover border border-[#232B27]" />
              ) : (
                <div className="w-8 h-8 rounded bg-[#232B27] flex items-center justify-center text-xs">📦</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#F1F4EE] font-semibold truncate">{p.name}</p>
              </div>
              <input
                type="number"
                min={1}
                value={p.qty}
                onChange={(e) => {
                  const q = Math.max(1, parseInt(e.target.value) || 1);
                  onChange(value.map((it, i) => i === idx ? { ...it, qty: q } : it));
                }}
                className="w-14 bg-[#0C0E0D] border border-[#232B27] rounded px-1.5 py-1 text-xs text-white text-center focus:outline-none focus:border-[#95BBA2]"
              />
              <button
                type="button"
                onClick={() => onChange(value.filter((_, i) => i !== idx))}
                className="w-7 h-7 rounded bg-black/40 hover:bg-red-500/10 text-[#8BA58D] hover:text-red-400 border border-[#232B27] hover:border-red-500/30 flex items-center justify-center"
                title="Remover"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {catalog.length > 0 ? (
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={pick}
            onChange={(e) => onPickChange(e.target.value)}
            className="flex-1 bg-[#151917] border border-[#232B27] rounded-lg px-2 py-1.5 text-xs text-[#F1F4EE] focus:outline-none focus:border-[#95BBA2] font-mono"
          >
            <option value="">— Selecione um produto do catálogo —</option>
            {catalog.map((item) => (
              <option key={item.id} value={item.id.toString()}>{item.name}</option>
            ))}
          </select>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[#8BA58D]">Qtd:</span>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => onQtyChange(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-14 bg-[#151917] border border-[#232B27] rounded px-2 py-1.5 text-xs text-white text-center focus:outline-none focus:border-[#95BBA2]"
            />
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className="px-3 py-1.5 bg-[var(--brand-primary)] text-[#0C0E0D] text-xs font-black rounded-lg hover:opacity-90 transition flex items-center gap-1"
          >
            <Plus className="h-3.5 w-3.5" /> Adicionar
          </button>
        </div>
      ) : (
        <p className="text-[10px] text-[#8BA58D] italic">
          Nenhum produto no catálogo. Cadastre produtos em Catálogo Inova para vinculá-los aqui.
        </p>
      )}
    </div>
  );
}