import React, { useState } from 'react';
import type { Client, ClientProductStock } from '../../types';
import { ClientProductsCatalogPicker } from './ClientProductsCatalogPicker';

export interface ClientFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  cep: string;
  city: string;
  state: string;
  note: string;
  lastContactDate?: number;
  stockCount: number;
  stockValue: number;
  productsStock: ClientProductStock[];
  source?: 'PROSPECCAO' | 'INSTAGRAM' | 'FACEBOOK' | 'VISITANDO' | 'INDICACAO' | 'OUTROS';
  dealType?: 'CONSIGNADO' | 'COMPROU';
}

interface CatalogItem { id: number | string; name: string; imageUrl?: string }

interface Props {
  initialClient?: Client | null;
  catalog: CatalogItem[];
  onSubmit: (data: ClientFormData) => void;
  onCancel: () => void;
}

export function ClientForm({ initialClient, catalog, onSubmit, onCancel }: Props) {
  const editing = !!initialClient;
  const [cName, setCName] = useState(initialClient?.name ?? '');
  const [cPhone, setCPhone] = useState(initialClient?.phone ?? '');
  const [cEmail, setCEmail] = useState(initialClient?.email ?? '');
  const [cAddress, setCAddress] = useState(initialClient?.address ?? '');
  const [cCep, setCCep] = useState(initialClient?.cep ?? '');
  const [cCity, setCCity] = useState(initialClient?.city ?? '');
  const [cState, setCState] = useState(initialClient?.state ?? '');
  const [cNote, setCNote] = useState(initialClient?.note ?? '');
  const [cLastContactDate, setCLastContactDate] = useState(
    initialClient?.lastContactDate
      ? new Date(initialClient.lastContactDate).toISOString().split('T')[0]
      : ''
  );
  const [cStockCount, setCStockCount] = useState(String(initialClient?.stockCount ?? 0));
  const [cStockValue, setCStockValue] = useState(String(initialClient?.stockValue ?? 0));
  const [cSource, setCSource] = useState<ClientFormData['source']>(initialClient?.source ?? 'PROSPECCAO');
  const [cDealType, setCDealType] = useState<ClientFormData['dealType']>(initialClient?.dealType ?? 'COMPROU');
  const [cProductsStock, setCProductsStock] = useState<ClientProductStock[]>(
    Array.isArray(initialClient?.productsStock) ? initialClient!.productsStock! : []
  );
  const [cCatalogPick, setCCatalogPick] = useState('');
  const [cCatalogQty, setCCatalogQty] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName) return;
    onSubmit({
      name: cName,
      phone: cPhone,
      email: cEmail,
      address: cAddress,
      cep: cCep,
      city: cCity,
      state: cState,
      note: cNote,
      lastContactDate: cLastContactDate ? new Date(cLastContactDate + 'T12:00:00').getTime() : undefined,
      stockCount: parseInt(cStockCount, 10) || 0,
      stockValue: parseFloat(cStockValue) || 0,
      productsStock: cProductsStock,
      source: cSource,
      dealType: cDealType,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-[#0C0E0D] border border-[#232B27] rounded-xl space-y-3" id="client-form">
      <h4 className="text-xs font-bold text-[#E5B242] uppercase">
        {editing ? 'Editar Cadastro' : 'Registrar Novo Cliente'}
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase text-[#8BA58D] font-bold">Nome Completo</label>
          <input
            type="text"
            required
            value={cName}
            onChange={(e) => setCName(e.target.value)}
            placeholder="Ex: Pedro Alvares"
            className="bg-[#151917] border border-[#232B27] px-3 py-1.5 rounded text-xs text-[#F1F4EE] outline-none focus:border-[#95BBA2]"
            id="client_name_form_input"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase text-[#8BA58D] font-bold">Telefone / WhatsApp</label>
          <input
            type="text"
            value={cPhone}
            onChange={(e) => setCPhone(e.target.value)}
            placeholder="Ex: (11) 99999-0000"
            className="bg-[#151917] border border-[#232B27] px-3 py-1.5 rounded text-xs text-[#F1F4EE] outline-none focus:border-[#95BBA2]"
            id="client_phone_form_input"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase text-[#8BA58D] font-bold">E-mail</label>
          <input
            type="email"
            value={cEmail}
            onChange={(e) => setCEmail(e.target.value)}
            placeholder="Ex: pedro@email.com"
            className="bg-[#151917] border border-[#232B27] px-3 py-1.5 rounded text-xs text-[#F1F4EE] outline-none focus:border-[#95BBA2]"
            id="client_email_form_input"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase text-[#8BA58D] font-bold">Endereço de Entrega</label>
          <input
            type="text"
            value={cAddress}
            onChange={(e) => setCAddress(e.target.value)}
            placeholder="Rua, Número, Bairro"
            className="bg-[#151917] border border-[#232B27] px-3 py-1.5 rounded text-xs text-[#F1F4EE] outline-none focus:border-[#95BBA2]"
            id="client_address_form_input"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase text-[#8BA58D] font-bold">CEP</label>
          <input
            type="text"
            value={cCep}
            onChange={(e) => setCCep(e.target.value)}
            onBlur={async (e) => {
              const cep = e.target.value.replace(/\D/g, '');
              if (cep.length !== 8) return;
              try {
                const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                const d = await r.json();
                if (d && !d.erro) {
                  if (!cCity) setCCity(d.localidade || '');
                  if (!cState) setCState(d.uf || '');
                  if (!cAddress) setCAddress(`${d.logradouro || ''}${d.bairro ? ', ' + d.bairro : ''}`.trim());
                }
              } catch {}
            }}
            placeholder="00000-000"
            className="bg-[#151917] border border-[#232B27] px-3 py-1.5 rounded text-xs text-[#F1F4EE] outline-none focus:border-[#95BBA2]"
            id="client_cep_form_input"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase text-[#8BA58D] font-bold">Cidade</label>
          <input
            type="text"
            value={cCity}
            onChange={(e) => setCCity(e.target.value)}
            placeholder="Ex: São Paulo"
            className="bg-[#151917] border border-[#232B27] px-3 py-1.5 rounded text-xs text-[#F1F4EE] outline-none focus:border-[#95BBA2]"
            id="client_city_form_input"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase text-[#8BA58D] font-bold">Estado (UF)</label>
          <input
            type="text"
            maxLength={2}
            value={cState}
            onChange={(e) => setCState(e.target.value.toUpperCase())}
            placeholder="SP"
            className="bg-[#151917] border border-[#232B27] px-3 py-1.5 rounded text-xs text-[#F1F4EE] outline-none focus:border-[#95BBA2]"
            id="client_state_form_input"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] uppercase text-[#8BA58D] font-bold">Observações / Preferências</label>
        <textarea
          value={cNote}
          onChange={(e) => setCNote(e.target.value)}
          placeholder="Ex: Cliente prefere preenchimento fosco, embalagem reforçada."
          rows={2}
          className="bg-[#151917] border border-[#232B27] px-3 py-1.5 rounded text-xs text-[#F1F4EE] outline-none focus:border-[#95BBA2] resize-none"
          id="client_note_form_input"
        />
      </div>

      <ClientProductsCatalogPicker
        value={cProductsStock}
        onChange={setCProductsStock}
        catalog={catalog}
        pick={cCatalogPick}
        onPickChange={setCCatalogPick}
        qty={cCatalogQty}
        onQtyChange={setCCatalogQty}
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase text-[#8BA58D] font-bold font-mono text-[var(--brand-primary)]">Estoque com Cliente (un)</label>
          <input
            type="number"
            min="0"
            value={cStockCount}
            onChange={(e) => setCStockCount(e.target.value)}
            placeholder="0"
            className="bg-[#151917] border border-[#232B27] px-3 py-1.5 rounded text-xs text-[#F1F4EE] outline-none focus:border-[#95BBA2]"
            id="client_stock_count_input"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase text-[#8BA58D] font-bold font-mono text-[var(--brand-primary)]">Valor do Estoque (R$)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={cStockValue}
            onChange={(e) => setCStockValue(e.target.value)}
            placeholder="0.00"
            className="bg-[#151917] border border-[#232B27] px-3 py-1.5 rounded text-xs text-[#F1F4EE] outline-none focus:border-[#95BBA2]"
            id="client_stock_value_input"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] uppercase text-[#8BA58D] font-bold">Data do Último Contato / Visita (Lembrete)</label>
        <input
          type="date"
          value={cLastContactDate}
          onChange={(e) => setCLastContactDate(e.target.value)}
          className="bg-[#151917] border border-[#232B27] px-3 py-1.5 rounded text-xs text-[#F1F4EE] outline-none focus:border-[#95BBA2] max-w-sm"
          id="client_last_contact_form_input"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase text-[#8BA58D] font-bold">Como conheceu (Origem)</label>
          <select
            value={cSource}
            onChange={(e) => setCSource(e.target.value as ClientFormData['source'])}
            className="bg-[#151917] border border-[#232B27] px-3 py-1.5 rounded text-xs text-[#F1F4EE] outline-none focus:border-[#95BBA2]"
            id="client_source_form_input"
          >
            <option value="PROSPECCAO">Prospecção</option>
            <option value="INSTAGRAM">Instagram</option>
            <option value="FACEBOOK">Facebook</option>
            <option value="VISITANDO">Visitando</option>
            <option value="INDICACAO">Indicação</option>
            <option value="OUTROS">Outros</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase text-[#8BA58D] font-bold">Tipo de Negociação</label>
          <select
            value={cDealType}
            onChange={(e) => setCDealType(e.target.value as ClientFormData['dealType'])}
            className="bg-[#151917] border border-[#232B27] px-3 py-1.5 rounded text-xs text-[#F1F4EE] outline-none focus:border-[#95BBA2]"
            id="client_dealtype_form_input"
          >
            <option value="COMPROU">Comprou (Venda Direta)</option>
            <option value="CONSIGNADO">Consignado</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-2 text-xs pt-1">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 text-[#8BA58D] hover:text-[#F1F4EE] transition">
          Cancelar
        </button>
        <button type="submit" className="px-4 py-1.5 bg-[var(--brand-primary)] text-[#0C0E0D] hover:opacity-90 font-bold rounded-lg transition">
          Salvar Cadastro
        </button>
      </div>
    </form>
  );
}