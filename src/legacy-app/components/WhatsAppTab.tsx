// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react';
import {
  MessageCircle, Users, Send, Settings as SettingsIcon, LayoutDashboard,
  Search, Wifi, WifiOff, Loader2, CheckCircle2, XCircle, RefreshCw, Phone,
  QrCode, PlugZap, Copy,
} from 'lucide-react';

/* ---------- Config storage ---------- */
type WppConfig = { url: string; apiKey: string; instance: string; useProxy?: boolean };
const CFG_KEY = 'wpp_evo_cfg_v1';
const loadCfg = (): WppConfig => {
  try { const v = JSON.parse(localStorage.getItem(CFG_KEY) || ''); if (v?.url) return v; } catch {}
  return { url: '', apiKey: '', instance: '', useProxy: true };
};
const saveCfg = (c: WppConfig) => localStorage.setItem(CFG_KEY, JSON.stringify(c));

/* ---------- Fetch helper ---------- */
async function evo(cfg: WppConfig, path: string, opts: RequestInit = {}) {
  if (!cfg.url) throw new Error('Configure a URL da API em Configurações');
  const method = (opts.method || 'GET').toUpperCase();
  let r: Response;
  if (cfg.useProxy !== false) {
    // Encaminha via server proxy (contorna CORS)
    r = await fetch('/api/whatsapp-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        baseUrl: cfg.url,
        path: path.replace(/^\//, ''),
        method,
        apiKey: cfg.apiKey,
        body: opts.body ? JSON.parse(opts.body as string) : undefined,
      }),
    });
  } else {
    const url = cfg.url.replace(/\/$/, '') + path;
    r = await fetch(url, {
      ...opts,
      headers: { 'Content-Type': 'application/json', apikey: cfg.apiKey, ...(opts.headers || {}) },
    });
  }
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text().catch(() => r.statusText)}`);
  return r.json();
}

// Evolution API v2 usa /chat/findChats (POST); v1 usa /chat/fetchChats (GET).
// Tenta v2 primeiro; se 404, cai pro v1.
async function evoTry(cfg: WppConfig, v2: { path: string; body?: any }, v1: { path: string }) {
  try {
    return await evo(cfg, v2.path, { method: 'POST', body: JSON.stringify(v2.body || {}) });
  } catch (e: any) {
    if (/HTTP 40[04]/.test(String(e?.message))) {
      return await evo(cfg, v1.path);
    }
    throw e;
  }
}

function getConnectionState(r: any): string {
  if (Array.isArray(r)) {
    const item = r[0] || {};
    return item.instance?.state || item.instance?.connectionStatus || item.connectionStatus || item.state || 'ok';
  }
  return r?.instance?.state || r?.instance?.connectionStatus || r?.connectionStatus || r?.state || r?.status || 'ok';
}

function getQrImage(r: any): string {
  const raw = r?.base64 || r?.qrcode?.base64 || r?.qr?.base64 || r?.data?.base64 || '';
  if (!raw) return '';
  return raw.startsWith('data:image') ? raw : `data:image/png;base64,${raw}`;
}

function getPairingCode(r: any): string {
  return r?.pairingCode || r?.code || r?.qrcode?.code || r?.qr?.code || r?.data?.pairingCode || r?.data?.code || '';
}

// Evolution retorna às vezes array puro, às vezes { records:[] } ou { chats:[] } etc.
function unwrapList(r: any): any[] {
  if (Array.isArray(r)) return r;
  if (!r || typeof r !== 'object') return [];
  const candidates = [
    r.records, r.chats, r.contacts,
    r.messages?.records, r.messages,
    r.data?.records, r.data?.messages?.records, r.data?.messages, r.data,
    r.result?.records, r.result,
  ];
  for (const c of candidates) if (Array.isArray(c)) return c;
  return [];
}

/* ---------- UI primitives ---------- */
const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', ...p }) => (
  <div {...p} className={`rounded-2xl border border-white/[0.08] bg-[#0a0d0c]/95 backdrop-blur-xl ${className}`} />
);
const Btn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'primary' | 'ghost' }> = ({ tone = 'primary', className = '', ...p }) => (
  <button {...p} className={`px-3 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-40 ${
    tone === 'primary' ? 'bg-emerald-500 text-black hover:bg-emerald-400' : 'text-white/70 hover:text-white hover:bg-white/5'
  } ${className}`} />
);
const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...p }) => (
  <input {...p} className={`w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50 ${className}`} />
);

/* ---------- Config screen ---------- */
function ConfigScreen({ cfg, setCfg }: { cfg: WppConfig; setCfg: (c: WppConfig) => void }) {
  const [draft, setDraft] = useState(cfg);
  const [status, setStatus] = useState<{ ok: boolean | null; msg: string; loading: boolean }>({ ok: null, msg: '', loading: false });
  const [qr, setQr] = useState<{ img: string; code: string; raw?: any } | null>(null);
  useEffect(() => setDraft(cfg), [cfg]);

  const persistDraft = () => {
    saveCfg(draft);
    setCfg(draft);
  };

  const test = async () => {
    setStatus({ ok: null, msg: 'Testando...', loading: true });
    setQr(null);
    try {
      const state = await evo(draft, `/instance/connectionState/${encodeURIComponent(draft.instance)}`)
        .then(getConnectionState)
        .catch(async () => getConnectionState(await evo(draft, `/instance/fetchInstances?instanceName=${encodeURIComponent(draft.instance)}`)));
      const connected = /open|connected|connect/i.test(state);
      setStatus({ ok: connected, msg: connected ? `WhatsApp conectado (${state})` : `API ok, WhatsApp ainda não conectado (${state})`, loading: false });
    } catch (e: any) {
      setStatus({ ok: false, msg: e.message || 'Falha', loading: false });
    }
  };

  const connect = async () => {
    persistDraft();
    setStatus({ ok: null, msg: 'Gerando QR Code...', loading: true });
    setQr(null);
    try {
      let r = await evo(draft, `/instance/connect/${encodeURIComponent(draft.instance)}`);
      let img = getQrImage(r);
      let code = getPairingCode(r);

      // Se veio sem QR, provavelmente a instância ainda não existe: cria e tenta de novo.
      if (!img && !code) {
        try {
          setStatus({ ok: null, msg: 'Instância não encontrada. Criando...', loading: true });
          const created = await evo(draft, `/instance/create`, {
            method: 'POST',
            body: JSON.stringify({
              instanceName: draft.instance,
              integration: 'WHATSAPP-BAILEYS',
              qrcode: true,
            }),
          });
          img = getQrImage(created) || getQrImage(created?.qrcode);
          code = getPairingCode(created) || getPairingCode(created?.qrcode);
          if (!img && !code) {
            // Aguarda a Evolution montar o QR e chama connect novamente.
            await new Promise(res => setTimeout(res, 1500));
            r = await evo(draft, `/instance/connect/${encodeURIComponent(draft.instance)}`);
            img = getQrImage(r);
            code = getPairingCode(r);
          }
        } catch (createErr: any) {
          // Se já existe (409), só reporta o erro original abaixo.
          if (!/HTTP 409/.test(String(createErr?.message))) throw createErr;
        }
      }

      setQr({ img, code, raw: r });
      setStatus({
        ok: !!(img || code),
        msg: img || code
          ? 'Escaneie o QR Code no WhatsApp para conectar'
          : 'Resposta recebida, mas sem QR Code. A instância pode já estar conectada — teste em "Testar conexão".',
        loading: false,
      });
    } catch (e: any) {
      setStatus({ ok: false, msg: e.message || 'Falha ao conectar', loading: false });
    }
  };

  return (
    <Card className="p-5 max-w-2xl space-y-4">
      <div>
        <h3 className="text-lg font-bold text-white">Configuração da Evolution API</h3>
        <p className="text-xs text-white/50">Os dados são salvos apenas neste navegador. Nada vai para o código.</p>
      </div>
      <div className="space-y-3">
        <label className="block text-xs text-white/60">URL da API<Input placeholder="https://evolution.exemplo.com" value={draft.url} onChange={e => setDraft({ ...draft, url: e.target.value })} /></label>
        <label className="block text-xs text-white/60">API Key<Input type="password" placeholder="sua-api-key" value={draft.apiKey} onChange={e => setDraft({ ...draft, apiKey: e.target.value })} /></label>
        <label className="block text-xs text-white/60">Instância<Input placeholder="zap" value={draft.instance} onChange={e => setDraft({ ...draft, instance: e.target.value })} /></label>
      </div>
      <label className="flex items-center gap-2 text-xs text-white/70 cursor-pointer">
        <input
          type="checkbox"
          checked={draft.useProxy !== false}
          onChange={e => setDraft({ ...draft, useProxy: e.target.checked })}
          className="accent-emerald-500"
        />
        Usar proxy do servidor (recomendado — evita erros de CORS)
      </label>
      <div className="flex items-center gap-2">
        <Btn onClick={persistDraft}>Salvar</Btn>
        <Btn tone="ghost" onClick={test} disabled={status.loading}>
          {status.loading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Testar conexão'}
        </Btn>
        <Btn tone="ghost" onClick={connect} disabled={status.loading || !draft.url || !draft.apiKey || !draft.instance}>
          {status.loading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : <><PlugZap className="w-4 h-4 inline mr-1" />Conectar WhatsApp</>}
        </Btn>
        {status.ok === true && <span className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" />{status.msg}</span>}
        {status.ok === false && <span className="text-xs text-red-400 flex items-center gap-1"><XCircle className="w-4 h-4" />{status.msg}</span>}
      </div>
      {qr && (qr.img || qr.code) && (
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4 flex flex-col sm:flex-row gap-4 items-start">
          <div className="w-44 h-44 rounded-xl bg-white p-2 grid place-items-center shrink-0">
            {qr.img ? <img src={qr.img} alt="QR Code para conectar WhatsApp" className="w-full h-full object-contain" /> : <QrCode className="w-20 h-20 text-black" />}
          </div>
          <div className="space-y-2 min-w-0">
            <div className="text-sm font-bold text-white">Conectar instância {draft.instance}</div>
            <p className="text-xs text-white/55">No celular: WhatsApp → aparelhos conectados → conectar aparelho → escaneie este QR Code.</p>
            {qr.code && (
              <button
                onClick={() => navigator.clipboard?.writeText(qr.code)}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-white/5"
              >
                <Copy className="w-3.5 h-3.5" /> Código: {qr.code}
              </button>
            )}
          </div>
        </div>
      )}
      <div className="text-[11px] text-amber-400/80 bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
        Se a Evolution API estiver rodando num IP local (ex: 172.x.x.x), só funciona quando você abrir o site na mesma rede. Para uso em qualquer lugar, exponha via HTTPS (Cloudflare Tunnel, ngrok ou domínio próprio).
      </div>
    </Card>
  );
}

/* ---------- Dashboard ---------- */
function Dashboard({ cfg }: { cfg: WppConfig }) {
  const [data, setData] = useState<{ chats: any[]; contacts: any[]; loading: boolean; error?: string }>({ chats: [], contacts: [], loading: true });
  const reload = async () => {
    setData(d => ({ ...d, loading: true, error: undefined }));
    try {
      const [chats, contacts] = await Promise.all([
        evoTry(cfg, { path: `/chat/findChats/${cfg.instance}`, body: {} }, { path: `/chat/fetchChats/${cfg.instance}` }).catch(() => []),
        evoTry(cfg, { path: `/chat/findContacts/${cfg.instance}`, body: {} }, { path: `/contacts/fetchContacts/${cfg.instance}` }).catch(() => []),
      ]);
      setData({ chats: unwrapList(chats), contacts: unwrapList(contacts), loading: false });
    } catch (e: any) { setData(d => ({ ...d, loading: false, error: e.message })); }
  };
  useEffect(() => { if (cfg.url && cfg.instance) reload(); }, [cfg.url, cfg.instance]);

  const kpis = [
    { label: 'Conversas', value: data.chats.length, icon: MessageCircle, color: 'text-emerald-400' },
    { label: 'Contatos', value: data.contacts.length, icon: Users, color: 'text-sky-400' },
    { label: 'Não lidas', value: data.chats.filter((c: any) => (c.unreadCount || 0) > 0).length, icon: Phone, color: 'text-amber-400' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Painel WhatsApp</h3>
          <p className="text-xs text-white/50">Instância: <span className="text-emerald-400">{cfg.instance || '—'}</span></p>
        </div>
        <Btn tone="ghost" onClick={reload} disabled={data.loading}>
          <RefreshCw className={`w-4 h-4 ${data.loading ? 'animate-spin' : ''}`} />
        </Btn>
      </div>
      {data.error && <Card className="p-3 text-xs text-red-400 border-red-500/30">Erro: {data.error}</Card>}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {kpis.map(k => (
          <Card key={k.label} className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/50">{k.label}</span>
              <k.icon className={`w-4 h-4 ${k.color}`} />
            </div>
            <div className="mt-2 text-3xl font-bold text-white">{data.loading ? '—' : k.value}</div>
          </Card>
        ))}
      </div>
      <Card className="p-4">
        <h4 className="text-sm font-bold text-white mb-3">Últimas conversas</h4>
        <div className="space-y-1 max-h-[360px] overflow-y-auto">
          {data.chats.slice(0, 20).map((c: any, i: number) => (
            <div key={c.id || c.remoteJid || i} className="flex items-center justify-between px-2 py-2 rounded hover:bg-white/5">
              <div className="text-sm text-white/80 truncate">{c.pushName || c.name || c.id || c.remoteJid}</div>
              {(c.unreadCount || 0) > 0 && <span className="text-[10px] bg-emerald-500 text-black rounded-full px-2">{c.unreadCount}</span>}
            </div>
          ))}
          {!data.loading && data.chats.length === 0 && <div className="text-xs text-white/40 py-6 text-center">Nenhuma conversa encontrada</div>}
        </div>
      </Card>
    </div>
  );
}

/* ---------- Chats view ---------- */
function ChatsView({ cfg }: { cfg: WppConfig }) {
  const [chats, setChats] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<any | null>(null);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [chatsErr, setChatsErr] = useState<string>('');
  const [msgsErr, setMsgsErr] = useState<string>('');
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  useEffect(() => {
    if (!cfg.url) return;
    setLoading(true); setChatsErr('');
    evoTry(cfg, { path: `/chat/findChats/${cfg.instance}`, body: {} }, { path: `/chat/fetchChats/${cfg.instance}` })
      .then(r => {
        const list = unwrapList(r);
        setChats(list);
        if (list.length === 0) setChatsErr('Resposta vazia da Evolution. Verifique se a instância está conectada e possui conversas.');
      })
      .catch((e: any) => setChatsErr(e?.message || 'Falha ao buscar conversas'))
      .finally(() => setLoading(false));
  }, [cfg.url, cfg.instance]);

  const filtered = useMemo(() => {
    const t = q.toLowerCase();
    return chats.filter((c: any) => !t || (c.pushName || c.name || c.id || c.remoteJid || '').toLowerCase().includes(t));
  }, [chats, q]);

  const openChat = async (c: any) => {
    setSelected(c); setMsgs([]); setMsgsErr(''); setLoadingMsgs(true);
    try {
      const chatId = c.id || c.remoteJid;
      // Evolution v2 exige paginação; sem `page`/`offset` alguns builds devolvem vazio.
      const attempts: Array<() => Promise<any>> = [
        () => evo(cfg, `/chat/findMessages/${cfg.instance}`, { method: 'POST', body: JSON.stringify({ where: { key: { remoteJid: chatId } }, page: 1, offset: 100 }) }),
        () => evo(cfg, `/chat/findMessages/${cfg.instance}`, { method: 'POST', body: JSON.stringify({ where: { key: { remoteJid: chatId } } }) }),
        () => evo(cfg, `/chat/findMessages/${cfg.instance}`, { method: 'POST', body: JSON.stringify({ where: { remoteJid: chatId }, page: 1, offset: 100 }) }),
        () => evo(cfg, `/chat/fetchMessages/${cfg.instance}`, { method: 'POST', body: JSON.stringify({ chatId, count: 100 }) }),
      ];
      let list: any[] = [];
      let lastErr = '';
      for (const attempt of attempts) {
        try {
          const r = await attempt();
          const l = unwrapList(r);
          if (l.length) { list = l; break; }
          // guarda como "resposta vazia" mas continua tentando outros formatos
        } catch (e: any) {
          lastErr = e?.message || String(e);
        }
      }
      setMsgs(list);
      if (list.length === 0) setMsgsErr(lastErr ? `Falha: ${lastErr}` : 'Sem mensagens retornadas pela Evolution para este chat (nenhum formato conhecido retornou dados).');
    } catch (e: any) {
      setMsgsErr(e?.message || 'Falha ao buscar mensagens');
    } finally {
      setLoadingMsgs(false);
    }
  };

  const send = async () => {
    if (!selected || !text.trim()) return;
    setSending(true);
    try {
      const number = (selected.id || selected.remoteJid || '').split('@')[0];
      await evo(cfg, `/message/sendText/${cfg.instance}`, { method: 'POST', body: JSON.stringify({ number, text }) });
      setText('');
      openChat(selected);
    } catch (e: any) { alert(e.message); }
    finally { setSending(false); }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 h-[70vh]">
      <Card className="p-3 flex flex-col md:col-span-1">
        <div className="relative mb-2">
          <Search className="w-4 h-4 text-white/40 absolute left-2 top-2.5" />
          <Input className="pl-8" placeholder="Buscar..." value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div className="flex-1 overflow-y-auto space-y-1">
          {loading && <div className="text-xs text-white/40 py-6 text-center"><Loader2 className="w-4 h-4 animate-spin inline" /></div>}
          {!loading && chatsErr && <div className="text-[11px] text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg p-2">{chatsErr}</div>}
          {filtered.map((c: any, i: number) => (
            <button key={c.id || c.remoteJid || i} onClick={() => openChat(c)}
              className={`w-full text-left px-3 py-2 rounded-lg transition ${selected?.id === c.id ? 'bg-emerald-500/10 border border-emerald-500/30' : 'hover:bg-white/5'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white truncate">{c.pushName || c.name || (c.id || c.remoteJid || '').split('@')[0]}</span>
                {(c.unreadCount || 0) > 0 && <span className="text-[10px] bg-emerald-500 text-black rounded-full px-1.5">{c.unreadCount}</span>}
              </div>
              <div className="text-[11px] text-white/40 truncate">{(c.id || c.remoteJid || '').split('@')[0]}</div>
            </button>
          ))}
        </div>
      </Card>
      <Card className="md:col-span-2 flex flex-col">
        {!selected ? (
          <div className="flex-1 grid place-items-center text-white/40 text-sm">Selecione uma conversa</div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-white/10">
              <div className="text-sm font-bold text-white">{selected.pushName || selected.name || (selected.id || '').split('@')[0]}</div>
              <div className="text-[11px] text-white/40">{(selected.id || selected.remoteJid || '').split('@')[0]}</div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {msgs.slice().reverse().map((m: any, i: number) => {
                const fromMe = m.key?.fromMe ?? m.fromMe;
                const body = m.message?.conversation || m.message?.extendedTextMessage?.text || m.body || m.text || '(mídia)';
                return (
                  <div key={i} className={`flex ${fromMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${fromMe ? 'bg-emerald-500 text-black' : 'bg-white/10 text-white'}`}>
                      {body}
                    </div>
                  </div>
                );
              })}
              {loadingMsgs && <div className="text-xs text-white/40 text-center py-6"><Loader2 className="w-4 h-4 animate-spin inline" /></div>}
              {!loadingMsgs && msgs.length === 0 && (
                <div className="text-[11px] text-center py-6">
                  {msgsErr
                    ? <span className="text-rose-300">{msgsErr}</span>
                    : <span className="text-white/40">Sem mensagens</span>}
                </div>
              )}
            </div>
            <div className="p-3 border-t border-white/10 flex gap-2">
              <Input placeholder="Mensagem..." value={text} onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()} />
              <Btn onClick={send} disabled={sending || !text.trim()}>
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Btn>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

/* ---------- Contacts ---------- */
function ContactsView({ cfg }: { cfg: WppConfig }) {
  const [list, setList] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!cfg.url) return;
    setLoading(true);
    evoTry(cfg, { path: `/chat/findContacts/${cfg.instance}`, body: {} }, { path: `/contacts/fetchContacts/${cfg.instance}` })
      .then(r => setList(unwrapList(r))).catch(() => {}).finally(() => setLoading(false));
  }, [cfg.url, cfg.instance]);
  const filtered = useMemo(() => {
    const t = q.toLowerCase();
    return list.filter((c: any) => !t || (c.pushName || c.name || c.id || '').toLowerCase().includes(t));
  }, [list, q]);
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3 gap-3">
        <h3 className="text-lg font-bold text-white">Contatos ({list.length})</h3>
        <div className="relative w-64">
          <Search className="w-4 h-4 text-white/40 absolute left-2 top-2.5" />
          <Input className="pl-8" placeholder="Buscar..." value={q} onChange={e => setQ(e.target.value)} />
        </div>
      </div>
      {loading && <div className="text-center text-white/40 py-8"><Loader2 className="w-5 h-5 animate-spin inline" /></div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[65vh] overflow-y-auto">
        {filtered.slice(0, 300).map((c: any, i: number) => (
          <div key={c.id || i} className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="text-sm text-white truncate">{c.pushName || c.name || 'Sem nome'}</div>
            <div className="text-[11px] text-white/40 truncate">{(c.id || '').split('@')[0]}</div>
          </div>
        ))}
      </div>
      {filtered.length > 300 && <div className="text-[11px] text-white/40 mt-2">Mostrando 300 de {filtered.length}</div>}
    </Card>
  );
}

/* ---------- Send single ---------- */
function SendOne({ cfg }: { cfg: WppConfig }) {
  const [number, setNumber] = useState('');
  const [text, setText] = useState('');
  const [state, setState] = useState<{ ok: boolean | null; msg: string; loading: boolean }>({ ok: null, msg: '', loading: false });
  const send = async () => {
    setState({ ok: null, msg: '', loading: true });
    try {
      await evo(cfg, `/message/sendText/${cfg.instance}`, { method: 'POST', body: JSON.stringify({ number: number.replace(/\D/g, ''), text }) });
      setState({ ok: true, msg: 'Mensagem enviada', loading: false });
      setText('');
    } catch (e: any) { setState({ ok: false, msg: e.message, loading: false }); }
  };
  return (
    <Card className="p-5 max-w-xl space-y-3">
      <h3 className="text-lg font-bold text-white">Enviar mensagem avulsa</h3>
      <label className="block text-xs text-white/60">Número (com DDI/DDD)<Input placeholder="5515999999999" value={number} onChange={e => setNumber(e.target.value)} /></label>
      <label className="block text-xs text-white/60">Mensagem<textarea rows={4} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50" value={text} onChange={e => setText(e.target.value)} /></label>
      <div className="flex items-center gap-2">
        <Btn onClick={send} disabled={state.loading || !number || !text}>
          {state.loading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : <><Send className="w-4 h-4 inline mr-1" />Enviar</>}
        </Btn>
        {state.ok === true && <span className="text-xs text-emerald-400">{state.msg}</span>}
        {state.ok === false && <span className="text-xs text-red-400">{state.msg}</span>}
      </div>
    </Card>
  );
}

/* ---------- Main ---------- */
export function WhatsAppTab() {
  const [cfg, setCfg] = useState<WppConfig>(() => loadCfg());
  const [sub, setSub] = useState<'dash' | 'chat' | 'contacts' | 'send' | 'cfg'>('dash');
  const configured = !!cfg.url && !!cfg.apiKey && !!cfg.instance;

  const tabs = [
    { id: 'dash', label: 'Painel', icon: LayoutDashboard },
    { id: 'chat', label: 'Conversas', icon: MessageCircle },
    { id: 'contacts', label: 'Contatos', icon: Users },
    { id: 'send', label: 'Envio', icon: Send },
    { id: 'cfg', label: 'Configuração', icon: SettingsIcon },
  ] as const;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-emerald-400">WhatsApp CRM</h2>
          <p className="text-xs text-white/50">Integração Evolution API</p>
        </div>
        <div className={`text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full ${configured ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
          {configured ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          {configured ? cfg.instance : 'Não configurado'}
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-white/10 pb-2 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setSub(t.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap ${
              sub === t.id ? 'bg-emerald-500 text-black' : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}>
            <t.icon className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
      </div>

      {!configured && sub !== 'cfg' && (
        <Card className="p-4 border-amber-500/30 bg-amber-500/5 text-sm text-amber-300">
          Configure a URL, API Key e Instância na aba <button onClick={() => setSub('cfg')} className="underline font-semibold">Configuração</button> para começar.
        </Card>
      )}

      {sub === 'dash' && configured && <Dashboard cfg={cfg} />}
      {sub === 'chat' && configured && <ChatsView cfg={cfg} />}
      {sub === 'contacts' && configured && <ContactsView cfg={cfg} />}
      {sub === 'send' && configured && <SendOne cfg={cfg} />}
      {sub === 'cfg' && <ConfigScreen cfg={cfg} setCfg={setCfg} />}
    </div>
  );
}

export default WhatsAppTab;