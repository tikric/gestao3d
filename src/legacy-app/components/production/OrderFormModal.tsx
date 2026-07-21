// @ts-nocheck
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Tag, X, Clock } from 'lucide-react';
import { PrintOrder, Printer } from '../../types';

export interface OrderFormState {
  formClientId: string; setFormClientId: (v: string) => void;
  customClientName: string; setCustomClientName: (v: string) => void;
  formItemName: string; setFormItemName: (v: string) => void;
  formQuantity: number; setFormQuantity: (v: number) => void;
  formFilamentType: string; setFormFilamentType: (v: string) => void;
  formFilamentColor: string; setFormFilamentColor: (v: string) => void;
  formWeightGrams: number; setFormWeightGrams: (v: number) => void;
  formPrintTime: number; setFormPrintTime: (v: number) => void;
  formPriceCharged: number; setFormPriceCharged: (v: number) => void;
  formPlatform: string; setFormPlatform: (v: string) => void;
  formStatus: string; setFormStatus: (v: string) => void;
  formPrinterId: string; setFormPrinterId: (v: string) => void;
  deadlineDays: number; setDeadlineDays: (v: number) => void;
  formCreatedAt: string; setFormCreatedAt: (v: string) => void;
  formPaymentMethod: any; setFormPaymentMethod: (v: any) => void;
  formPaymentStatus: any; setFormPaymentStatus: (v: any) => void;
  formImageUrl: string; setFormImageUrl: (v: string) => void;
}

interface Props extends OrderFormState {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  editingOrder: PrintOrder | null;
  clients: Array<{ id: number; name: string; code?: string }>;
  printers: Printer[];
  catalogItems: any[];
  availableColors: string[];
}

export const OrderFormModal: React.FC<Props> = (p) => {
  if (!p.isOpen) return null;
  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#151917] border border-[#232B27] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden text-xs text-[#F1F4EE]"
        >
          <form onSubmit={p.onSubmit}>
            <div className="px-6 py-4 border-b border-[#232B27] flex items-center justify-between bg-[#0C0E0D]">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#E5B242]" />
                <h3 className="text-base font-black">
                  {p.editingOrder ? 'Editar Pedido 3D' : 'Novo Pedido de Impressão'}
                </h3>
              </div>
              <button type="button" onClick={p.onClose} className="text-[#8BA58D] hover:text-white p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[68vh] overflow-y-auto scrollbar-thin">
              <div className="space-y-1">
                <label className="block text-[#8BA58D] font-extrabold">Cliente Relacionado</label>
                <div className="flex flex-col gap-2">
                  <select
                    value={p.formClientId}
                    onChange={(e) => p.setFormClientId(e.target.value)}
                    className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg py-2 px-3 text-white focus:border-[#95BBA2] focus:outline-none"
                  >
                    {p.clients.map((c: any) => (
                      <option key={c.id} value={c.id.toString()}>
                        {c.name}{c.code ? ` — ${c.code}` : ''}
                      </option>
                    ))}
                    <option value="CUSTOM">+ Novo Comprador Manual</option>
                  </select>

                  {p.formClientId === 'CUSTOM' && (
                    <div className="p-3 bg-[#0C0E0D] border border-[#b7ff00]/30 rounded-lg space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                      <label className="block text-[10px] text-[#b7ff00] font-bold uppercase tracking-wider">
                        Nome do novo cliente (será cadastrado automaticamente com código)
                      </label>
                      <input
                        type="text"
                        autoFocus
                        placeholder="Digite o nome do cliente..."
                        value={p.customClientName}
                        onChange={(e) => p.setCustomClientName(e.target.value)}
                        className="w-full bg-[#151917] border border-[#232B27] rounded-lg py-2 px-3 text-white placeholder-[#8BA58D]/40 focus:border-[#b7ff00] focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[#8BA58D] font-extrabold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#E5B242]" /> Data e Hora de Abertura do Pedido
                </label>
                <input
                  type="datetime-local"
                  value={p.formCreatedAt}
                  onChange={(e) => p.setFormCreatedAt(e.target.value)}
                  className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg py-2 px-3 text-[#F1F4EE] select-text focus:outline-none focus:border-[#95BBA2] font-mono text-xs"
                  required
                />
                <p className="text-[10px] text-[#8BA58D]/70">Altere o horário acima se o pedido foi realizado no passado. O sistema recalculará o tempo de atraso com base nele.</p>
              </div>

              <div className="space-y-1">
                <label className="block text-[#8BA58D] font-extrabold flex items-center justify-between">
                  <span>Classe do Modelo / Descrição (Do Catálogo)</span>
                </label>
                <select
                  value={p.formItemName}
                  onChange={(e) => {
                    const selectedVal = e.target.value;
                    p.setFormItemName(selectedVal);
                    const matchedItem = (p.catalogItems as any[]).find((c) => c.name === selectedVal);
                    if (matchedItem) {
                      p.setFormFilamentType(matchedItem.filamentType);
                      p.setFormFilamentColor(matchedItem.filamentColorsUsed || 'Preto');
                      p.setFormWeightGrams(matchedItem.weightGrams);
                      p.setFormPrintTime(matchedItem.printTimeHours);
                      p.setFormPriceCharged(matchedItem.defaultPrice);
                      if (matchedItem.imageUrl) p.setFormImageUrl(matchedItem.imageUrl);
                    }
                  }}
                  className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg py-2 px-3 text-white focus:border-[#95BBA2] text-xs font-mono select-text focus:outline-none"
                >
                  <option value="">-- Selecione do catálogo de produtos --</option>
                  {(p.catalogItems as any[]).map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name} ({item.productCode || 'PROD'})
                    </option>
                  ))}
                  {p.formItemName && !(p.catalogItems as any[]).some(item => item.name === p.formItemName) && (
                    <option value={p.formItemName}>{p.formItemName} (Do Banco de Dados)</option>
                  )}
                  <option value="__CUSTOM__">+ Produto não cadastrado (digitar nome)</option>
                </select>
                {(p.catalogItems as any[]).length === 0 && (
                  <p className="text-[10px] text-amber-500 font-mono">
                    ⚠️ Nenhum produto no catálogo. Selecione "+ Produto não cadastrado" para digitar o nome, ou cadastre na aba "Banco de Dados & Catálogo".
                  </p>
                )}
                {(p.formItemName === '__CUSTOM__' || (p.formItemName && !(p.catalogItems as any[]).some(item => item.name === p.formItemName))) && (
                  <input
                    type="text"
                    placeholder="Digite o nome do produto"
                    value={p.formItemName === '__CUSTOM__' ? '' : p.formItemName}
                    onChange={(e) => p.setFormItemName(e.target.value)}
                    className="mt-2 w-full bg-[#0C0E0D] border border-[#E5B242]/40 rounded-lg py-2 px-3 text-white placeholder-[#8BA58D]/40 focus:border-[#E5B242] focus:outline-none"
                    required
                  />
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-[#8BA58D] font-extrabold">Imagem do Produto</label>
                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 rounded-lg overflow-hidden border border-[#232B27] bg-[#0C0E0D] flex items-center justify-center shrink-0">
                    {p.formImageUrl ? (
                      <img src={p.formImageUrl} alt="produto" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-[#8BA58D]/60 font-mono">SEM IMG</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      placeholder="URL da imagem (https://...)"
                      value={p.formImageUrl}
                      onChange={(e) => p.setFormImageUrl(e.target.value)}
                      className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg py-2 px-3 text-white text-xs font-mono focus:outline-none focus:border-[#95BBA2]"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => p.setFormImageUrl(reader.result as string);
                        reader.readAsDataURL(file);
                      }}
                      className="block w-full text-[10px] text-[#8BA58D] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:bg-[#232B27] file:text-[#F1F4EE]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[#8BA58D] font-extrabold">Quantidade</label>
                  <input
                    type="number"
                    min="1"
                    value={p.formQuantity}
                    onChange={(e) => p.setFormQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg py-2 px-3 text-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[#8BA58D] font-extrabold">Prazo (Dias p/ entrega)</label>
                  <input
                    type="number"
                    min="1"
                    value={p.deadlineDays}
                    onChange={(e) => p.setDeadlineDays(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg py-2 px-3 text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[#8BA58D] font-extrabold">Polímero (Material)</label>
                  <select
                    value={p.formFilamentType}
                    onChange={(e) => p.setFormFilamentType(e.target.value)}
                    className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg py-2 px-3 text-white"
                  >
                    <option value="PLA">PLA</option>
                    <option value="PETG">PETG</option>
                    <option value="ABS">ABS</option>
                    <option value="TPU">TPU</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[#8BA58D] font-extrabold">Cor Escolhida</label>
                  {p.availableColors.length > 0 ? (
                    <select
                      value={p.formFilamentColor}
                      onChange={(e) => p.setFormFilamentColor(e.target.value)}
                      className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg py-2 px-3 text-white"
                    >
                      {p.availableColors.map(color => (
                        <option key={color} value={color}>{color}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Especificar cor"
                      value={p.formFilamentColor}
                      onChange={(e) => p.setFormFilamentColor(e.target.value)}
                      className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg py-2 px-3 text-white"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[#8BA58D] font-extrabold">Peso Peça (g)</label>
                  <input
                    type="number" min="1" step="0.1"
                    value={p.formWeightGrams}
                    onChange={(e) => p.setFormWeightGrams(Math.max(1, parseFloat(e.target.value) || 1))}
                    className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg py-2 px-3 text-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[#8BA58D] font-extrabold">Tempo (h)</label>
                  <input
                    type="number" min="0.1" step="0.1"
                    value={p.formPrintTime}
                    onChange={(e) => p.setFormPrintTime(Math.max(0.1, parseFloat(e.target.value) || 1))}
                    className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg py-2 px-3 text-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[#8BA58D] font-extrabold">Preço (R$)</label>
                  <input
                    type="number" min="1" step="1"
                    value={p.formPriceCharged}
                    onChange={(e) => p.setFormPriceCharged(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg py-2 px-3 text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[#8BA58D] font-extrabold">Origem da Venda</label>
                  <select
                    value={p.formPlatform}
                    onChange={(e) => p.setFormPlatform(e.target.value)}
                    className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg py-2 px-3 text-white"
                  >
                    <option value="MANUAL">MANUAL (Balcão)</option>
                    <option value="MERCADO_LIVRE">MERCADO LIVRE</option>
                    <option value="SHOPEE">SHOPEE</option>
                    <option value="NUVEMSHOP">NUVEMSHOP</option>
                    <option value="AMAZON">AMAZON</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[#8BA58D] font-extrabold">Status Atual</label>
                  <select
                    value={p.formStatus}
                    onChange={(e) => p.setFormStatus(e.target.value)}
                    className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg py-2 px-3 text-white"
                  >
                    <option value="WAITING">Ag. Arquivo</option>
                    <option value="QUEUE">NaFila / Pagar</option>
                    <option value="PRINTING">Imprimindo</option>
                    <option value="POST_PROCESS">Pós-Processo / Acabamento</option>
                    <option value="PACKING">Embalando</option>
                    <option value="READY">Pronto p/ Entrega</option>
                    <option value="DELIVERED">Entregue / Concluído</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-[#0C0E0D]/60 p-3 rounded-lg border border-[#232B27]/60">
                <div className="space-y-1">
                  <label className="block text-[#8BA58D] font-extrabold flex items-center gap-1 text-[11px]">
                    <span>💳 Forma de Pgto.</span>
                  </label>
                  <select
                    value={p.formPaymentMethod}
                    onChange={(e) => p.setFormPaymentMethod(e.target.value as any)}
                    className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg py-1.5 px-3 text-white text-xs"
                  >
                    <option value="DINHEIRO">📂 DINHEIRO</option>
                    <option value="CARTÃO">💳 CARTÃO (Déb/Créd)</option>
                    <option value="CONSIGNADO">🤝 CONSIGNADO</option>
                    <option value="OUTROS">🌐 OUTROS / PIX</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[#8BA58D] font-extrabold flex items-center gap-1 text-[11px]">
                    <span>💵 Status Finan.</span>
                  </label>
                  <select
                    value={p.formPaymentStatus}
                    onChange={(e) => p.setFormPaymentStatus(e.target.value as any)}
                    className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg py-1.5 px-3 text-white text-xs font-bold"
                  >
                    <option value="PENDENTE">⏳ PENDENTE / COBRAR</option>
                    <option value="PAGO">✅ PAGO</option>
                  </select>
                </div>
              </div>

              {p.formStatus === 'PRINTING' && (
                <div className="bg-black/25 p-3 rounded-lg border border-[#232B27] space-y-1">
                  <label className="block text-[#8BA58D] font-extrabold">Alocar Impressora</label>
                  <select
                    value={p.formPrinterId}
                    onChange={(e) => p.setFormPrinterId(e.target.value)}
                    className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg py-1.5 px-3 text-white"
                    required
                  >
                    <option value="">-- Selecione uma Impressora --</option>
                    {p.printers.map(pr => (
                      <option key={pr.id} value={pr.id.toString()}>{pr.name} ({pr.status === 'PRINTING' ? 'Ocupada' : 'Idle'})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-[#0C0E0D] border-t border-[#232B27] flex items-center justify-end gap-3 rounded-b-3xl">
              <button
                type="button"
                onClick={p.onClose}
                className="px-4 py-2 border border-[#232B27] hover:border-[#8BA58D] text-[#8BA58D] hover:text-white text-xs font-bold rounded-lg transition cursor-pointer"
              >
                Descartar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#E5B242] text-[#0C0E0D] text-xs font-extrabold rounded-lg hover:bg-[#F5C75A] transition shadow-md cursor-pointer"
              >
                Salvar Pedido 💾
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};