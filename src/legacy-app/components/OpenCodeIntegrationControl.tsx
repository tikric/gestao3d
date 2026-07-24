import React, { useState } from 'react';
import { Bot, Copy, Check, Terminal, Zap, Shield, HelpCircle, ExternalLink } from 'lucide-react';

export function OpenCodeIntegrationControl() {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const apiKey = 'gestao3d-opencode-2026';
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://seu-dominio.com';
  const endpointUrl = `${baseUrl}/api/opencode`;

  const curlExample = `curl -X POST "${endpointUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKey}" \\
  -d '{
    "action": "calculate",
    "weightGrams": 180,
    "printHours": 6,
    "filamentPriceKg": 110,
    "marginPercent": 100
  }'`;

  const copyToClipboard = (text: string, setFn: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setFn(true);
    setTimeout(() => setFn(false), 2000);
  };

  const handleTestConnection = async () => {
    setLoading(true);
    setTestResult(null);
    try {
      const res = await fetch(`${endpointUrl}?action=calculate&weight=100&hours=4`, {
        headers: {
          'x-api-key': apiKey,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult(`✅ Conexão bem-sucedida! Preço calculado: R$ ${data.data.breakdown.suggestedSellingPrice.toFixed(2)} (Custo direto: R$ ${data.data.breakdown.directProductionCost.toFixed(2)})`);
      } else {
        setTestResult(`❌ Falha no teste: ${data.message || data.error || 'Erro desconhecido'}`);
      }
    } catch (err: any) {
      setTestResult(`❌ Erro ao conectar: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 p-4 rounded-xl bg-[#0C0E0D] border border-[#B7FF00]/30 space-y-3">
      <div className="flex items-center gap-2">
        <Bot className="w-4 h-4 text-[#B7FF00]" />
        <div className="text-[12px] font-bold text-[#B7FF00] uppercase tracking-wide">
          Integração OpenCode &amp; IAs Locais (Ollama / Cursor / LM Studio)
        </div>
      </div>

      <p className="text-[11px] text-[#8BA58D] leading-relaxed">
        Sua IA local (como <b>OpenCode</b>, <b>Ollama</b>, <b>Cursor</b> ou <b>Claude Code</b>) pode consultar a API do Gestão3D para calcular custos de impressão 3D, consultar cotações de filamentos e pesquisar tendências de modelos 3D.
      </p>

      {/* API KEY & ENDPOINT INPUTS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-[#8BA58D]">Chave API (x-api-key):</label>
          <div className="flex items-center gap-1.5 bg-[#111613] border border-[#2F3D35] rounded-lg px-2.5 py-1.5">
            <code className="text-[11px] text-[#F1F4EE] flex-1 font-mono">{apiKey}</code>
            <button
              type="button"
              onClick={() => copyToClipboard(apiKey, setCopiedKey)}
              className="p-1 hover:bg-[#1C2420] text-[#B7FF00] rounded transition-colors"
              title="Copiar Chave API"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-[#8BA58D]">Endpoint REST URL:</label>
          <div className="flex items-center gap-1.5 bg-[#111613] border border-[#2F3D35] rounded-lg px-2.5 py-1.5">
            <code className="text-[11px] text-[#F1F4EE] flex-1 font-mono truncate">{endpointUrl}</code>
            <button
              type="button"
              onClick={() => copyToClipboard(endpointUrl, setCopiedUrl)}
              className="p-1 hover:bg-[#1C2420] text-[#B7FF00] rounded transition-colors"
              title="Copiar URL"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* TEST BUTTON */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          disabled={loading}
          onClick={handleTestConnection}
          className="px-3.5 py-1.5 rounded-lg bg-[#B7FF00] hover:bg-[#a2e600] text-black text-[11px] font-bold flex items-center gap-1.5 disabled:opacity-50 transition-colors"
        >
          <Zap className="w-3.5 h-3.5" />
          {loading ? 'Testando API...' : 'Testar Conexão da API'}
        </button>
      </div>

      {testResult && (
        <div className={`p-2.5 rounded-lg text-[11px] font-mono border ${testResult.startsWith('✅') ? 'bg-[#0E2014] border-green-500/40 text-green-300' : 'bg-[#2A1010] border-red-500/40 text-red-300'}`}>
          {testResult}
        </div>
      )}

      {/* CODE EXAMPLE ACCORDION */}
      <details className="text-[11px] text-[#8BA58D] mt-2">
        <summary className="cursor-pointer text-[#B7FF00] font-semibold flex items-center gap-1">
          <Terminal className="w-3.5 h-3.5" /> Exemplo de chamada Curl / Python para OpenCode
        </summary>
        <div className="mt-2 space-y-2">
          <div className="relative bg-[#080908] p-3 rounded-lg border border-[#2F3D35] font-mono text-[10px] text-[#A2C2A8] overflow-x-auto">
            <pre className="whitespace-pre-wrap">{curlExample}</pre>
            <button
              type="button"
              onClick={() => copyToClipboard(curlExample, setCopiedCurl)}
              className="absolute top-2 right-2 p-1 bg-[#111613] hover:bg-[#1C2420] text-[#B7FF00] rounded border border-[#2F3D35]"
              title="Copiar código"
            >
              {copiedCurl ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>

          <div className="p-2.5 rounded-lg bg-[#111613] border border-[#2F3D35] space-y-1 text-[10px] text-[#8BA58D]">
            <div className="font-bold text-[#F1F4EE] flex items-center gap-1">
              <HelpCircle className="w-3 h-3 text-[#B7FF00]" /> Como usar no OpenCode:
            </div>
            <ol className="list-decimal pl-4 space-y-1">
              <li>No OpenCode / Cursor / local LLM, cadastre esta URL base ou envie a requisição HTTP com o cabeçalho <code className="text-[#B7FF00]">x-api-key: {apiKey}</code>.</li>
              <li>Envie requisições GET ou POST para <code className="text-[#B7FF00]">{endpointUrl}</code> para calcular peças, consultar filamentos ou solicitar contexto.</li>
              <li>A API responde em JSON padronizado com os valores em Reais (R$).</li>
            </ol>
          </div>
        </div>
      </details>
    </div>
  );
}
