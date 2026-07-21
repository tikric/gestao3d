// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Send, 
  X, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  AlertTriangle, 
  Clock, 
  Wrench, 
  Users, 
  Play, 
  Layers, 
  HelpCircle,
  HelpCircle as QuestionIcon,
  Eye,
  EyeOff,
  Check
} from 'lucide-react';
import { PrintOrder, Printer, Client, FilamentStock } from '../types';
import { getApiUrl, validateApiKeyFormat, checkIsAndroidWebView, callGroq, callGemini } from '../utils/api';
import { safeStorage } from '../utils/storage';

interface OkLojaAssistantProps {
  orders: PrintOrder[];
  printers: Printer[];
  clients: Client[];
  filamentStocks: FilamentStock[];
  brandName?: string;
  brandPrimaryColor?: string;
}

export function OkLojaAssistant({ 
  orders, 
  printers, 
  clients, 
  filamentStocks, 
  brandName = "Gestão 3D",
  brandPrimaryColor = "var(--brand-primary)" 
}: OkLojaAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState('');
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  
  const [aiProvider, setAiProvider] = useState(() => {
    return safeStorage.getItem('bambuzau_ai_provider', 'gemini');
  });

  const [customGeminiKey, setCustomGeminiKey] = useState(() => {
    return safeStorage.getItem('bambuzau_custom_gemini_key', '');
  });

  const [customGroqKey, setCustomGroqKey] = useState(() => {
    return safeStorage.getItem('bambuzau_custom_groq_key', '');
  });

  const [showInlineKey, setShowInlineKey] = useState(false);
  const [inlineKeyInput, setInlineKeyInput] = useState(() => {
    return safeStorage.getItem('bambuzau_custom_gemini_key', '');
  });

  const [inlineGroqKeyInput, setInlineGroqKeyInput] = useState(() => {
    return safeStorage.getItem('bambuzau_custom_groq_key', '');
  });

  const [inlineKeyError, setInlineKeyError] = useState('');
  const [inlineGroqError, setInlineGroqError] = useState('');
  const [voiceSupportError, setVoiceSupportError] = useState('');

  // Re-sync Gemini and Groq API Keys when assistant opens up
  useEffect(() => {
    if (isOpen) {
      const storedKey = safeStorage.getItem('bambuzau_custom_gemini_key', '');
      setCustomGeminiKey(storedKey);
      setInlineKeyInput(storedKey);

      const storedGroqKey = safeStorage.getItem('bambuzau_custom_groq_key', '');
      setCustomGroqKey(storedGroqKey);
      setInlineGroqKeyInput(storedGroqKey);

      const storedProvider = safeStorage.getItem('bambuzau_ai_provider', 'gemini');
      setAiProvider(storedProvider);
    }
  }, [isOpen]);

  // Listen to live keys updates from the settings or other tabs instantly
  useEffect(() => {
    const handleKeysUpdate = () => {
      const storedKey = safeStorage.getItem('bambuzau_custom_gemini_key', '');
      setCustomGeminiKey(storedKey);
      setInlineKeyInput(storedKey);

      const storedGroqKey = safeStorage.getItem('bambuzau_custom_groq_key', '');
      setCustomGroqKey(storedGroqKey);
      setInlineGroqKeyInput(storedGroqKey);

      const storedProvider = safeStorage.getItem('bambuzau_ai_provider', 'gemini');
      setAiProvider(storedProvider);
    };

    window.addEventListener('bambuzau_keys_updated', handleKeysUpdate);
    return () => {
      window.removeEventListener('bambuzau_keys_updated', handleKeysUpdate);
    };
  }, []);
  
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string; timestamp: Date }>>([
    {
      sender: 'assistant',
      text: `Olá! Sou o assistente inteligente por voz **Gestão 3D IA 3.3.0.0** 🎙️⚡.\n\nPergunte-me qualquer detalhe da oficina! Por exemplo:\n- Como estão os pedidos?\n- Quem são os clientes com maior atraso?\n- Quais impressoras precisam de manutenção?\n- Quais filamentos estão com estoque crítico?`,
      timestamp: new Date()
    }
  ]);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(() => {
    try {
      return localStorage.getItem('ok_loja_voice_enabled') !== 'false';
    } catch {
      return true;
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(false);
  const [isBackgroundListening, setIsBackgroundListening] = useState(false);
  const [backgroundWakeWordEnabled, setBackgroundWakeWordEnabled] = useState(() => {
    try {
      return localStorage.getItem('ok_loja_bg_wake_word') !== 'false';
    } catch {
      return true;
    }
  });
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const backgroundRecRef = useRef<any>(null);

  // Play ascending friendly chime (Ok Google vibe) using Web Audio API
  const playChime = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(392, now); // G5 note
      osc.frequency.setValueAtTime(523, now + 0.12); // C6 note
      
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.warn("Chime failed to play", e);
    }
  };

  // Check speech recognition capability & set up foreground listener
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechRecognitionSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'pt-BR';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText(transcript);
          handleSendMessage(transcript);
        }
      };

      rec.onerror = (e: any) => {
        console.error("Erro no reconhecimento de voz:", e);
        setIsListening(false);
        if (e.error === 'not-allowed') {
          setMicPermissionDenied(true);
          setMessages(prev => {
            const hasPermissionAlert = prev.some(m => m.text.includes("Acesso ao Microfone não Autorizado"));
            if (hasPermissionAlert) return prev;
            return [...prev, {
              sender: 'assistant',
              text: `⚠️ **Acesso ao Microfone não Autorizado**\n\nO acesso ao seu microfone foi bloqueado ou recusado do navegador.\n\n👉 **Como resolver:**\n1. Como você está no visualizador do AI Studio (iframe), o Chrome pode bloquear o áudio automaticamente.\n2. Clique no ícone de **Abrir em Nova Aba** ↗️ no topo superior direito da tela do visualizador.\n3. Na nova aba, clique no ícone do microfone no chat para permitir o acesso quando solicitado!`,
              timestamp: new Date()
            }];
          });
        } else if (e.error === 'no-speech') {
          console.log("Nenhuma fala detectada por tempo limite.");
        } else {
          setMessages(prev => [...prev, {
            sender: 'assistant',
            text: `⚠️ **Erro no microfone**: "${e.error || 'Não reconhecido'}". Garanta que o microfone está conectado ou use o campo de texto!`,
            timestamp: new Date()
          }]);
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Auto-start listening when the user opens the assistant manually
  useEffect(() => {
    const hasActiveKey = aiProvider === 'gemini' ? !!customGeminiKey : !!customGroqKey;
    if (isOpen && speechRecognitionSupported && hasActiveKey && !micPermissionDenied) {
      const timer = setTimeout(() => {
        if (!isListening) {
          startListening();
        }
      }, 750);
      return () => clearTimeout(timer);
    }
  }, [isOpen, speechRecognitionSupported, customGeminiKey, customGroqKey, aiProvider, micPermissionDenied]);

  // Continuous background wake-word recognition for "Ok Loja"
  useEffect(() => {
    // If wake word is disabled, or assistant is open, or microphone access is denied, stop background listening
    if (!backgroundWakeWordEnabled || isOpen || micPermissionDenied) {
      if (backgroundRecRef.current) {
        try {
          backgroundRecRef.current.onend = null;
          backgroundRecRef.current.stop();
        } catch (e) {}
      }
      setIsBackgroundListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    let stoppedIntentionally = false;
    const bgRec = new SpeechRecognition();
    bgRec.continuous = true;
    bgRec.interimResults = false;
    bgRec.lang = 'pt-BR';

    bgRec.onstart = () => {
      setIsBackgroundListening(true);
    };

    bgRec.onresult = (event: any) => {
      const resultsLen = event.results.length;
      for (let i = event.resultIndex; i < resultsLen; i++) {
        if (event.results[i].isFinal) {
          const rawTranscript = event.results[i][0].transcript || "";
          const transcript = rawTranscript.toLowerCase().trim();
          console.log("Wake word candidate transcript:", transcript);
          
          const matched = 
            transcript.includes('ok loja') || 
            transcript.includes('okay loja') || 
            transcript.includes('o que loja') || 
            transcript.includes('ok loia') || 
            transcript.includes('oque loja') || 
            transcript.includes('okloja') || 
            transcript.includes('ô que loja') || 
            transcript.includes('loja ok') ||
            transcript.includes('ok loj');

          if (matched) {
            stoppedIntentionally = true;
            try {
              bgRec.stop();
            } catch (e) {}
            
            // Open assistant
            setIsOpen(true);
            playChime();
            
            setTimeout(() => {
              // Add system response and speak it
              const welcomeStr = "Olá! Ativado por comando de voz. O que gostaria de consultar na oficina hoje? 🎙️";
              setMessages(prev => [...prev, {
                sender: 'assistant',
                text: `🎙️ **Olá! Ativado por comando de voz mãos-livres!**\n\nO que deseja consultar no ateliê hoje?`,
                timestamp: new Date()
              }]);
              speakText(welcomeStr);
              
              // Automatically trigger listening in 1.4 seconds
              setTimeout(() => {
                startListening();
              }, 1400);
            }, 500);
            break;
          }
        }
      }
    };

    bgRec.onerror = (e: any) => {
      console.warn("Speech recognition bg error:", e.error);
      if (e.error === 'not-allowed' || e.error === 'audio-capture' || e.error === 'service-not-allowed') {
        console.warn("Background mic unavailable:", e.error);
        setIsBackgroundListening(false);
        setBackgroundWakeWordEnabled(false);
        setMicPermissionDenied(true);
      }
    };

    bgRec.onend = () => {
      setIsBackgroundListening(false);
      // Automatically restart background listening if still closed, allowed, and permission not denied
      if (!stoppedIntentionally && backgroundWakeWordEnabled && !isOpen && !micPermissionDenied) {
        setTimeout(() => {
          try {
            bgRec.start();
          } catch (e) {}
        }, 600);
      }
    };

    backgroundRecRef.current = bgRec;

    try {
      if (!micPermissionDenied) {
        bgRec.start();
      }
    } catch (e) {
      console.warn("Failed starting background wake listener", e);
    }

    return () => {
      stoppedIntentionally = true;
      if (backgroundRecRef.current) {
        try {
          backgroundRecRef.current.onend = null;
          backgroundRecRef.current.stop();
        } catch (e) {}
      }
    };
  }, [backgroundWakeWordEnabled, isOpen, micPermissionDenied]);

  // Persist background wake word preference
  useEffect(() => {
    try {
      localStorage.setItem('ok_loja_bg_wake_word', String(backgroundWakeWordEnabled));
    } catch {}
  }, [backgroundWakeWordEnabled]);

  // Sync scroll to last message
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Persist voice selection
  useEffect(() => {
    try {
      localStorage.setItem('ok_loja_voice_enabled', String(isVoiceEnabled));
    } catch {}
  }, [isVoiceEnabled]);

  const speakText = (text: string) => {
    if (!isVoiceEnabled || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel(); // Stop any pending reading
      
      // Clean markdown structures for clean reading readout
      let cleanText = text
        .replace(/\*\*([^*]+)\*\*/g, '$1') // remove strong markdown
        .replace(/\*([^*]+)\*/g, '$1') // remove emphasis markdown
        .replace(/#+\s+([^\n]+)/g, '$1') // remove titles
        .replace(/- /g, '') // remove dashed lists
        .replace(/`([^`]+)`/g, '$1') // remove code highlights
        .trim();

      // Limit response speech length slightly so it acts as screen readers (brief dynamic highlights)
      if (cleanText.length > 400) {
        cleanText = cleanText.substring(0, 380) + "... E outros detalhes adicionais exibidos no monitor.";
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'pt-BR';
      
      // Try resolving Portuguese native voice speaker explicitly
      const voices = window.speechSynthesis.getVoices();
      const ptVoice = voices.find(v => v.lang === 'pt-BR' || v.lang.startsWith('pt_BR'));
      if (ptVoice) {
        utterance.voice = ptVoice;
      }
      utterance.rate = 1.05; // Slightly faster for agile, professional virtual assistant feel
      
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis fail:", e);
    }
  };

  const startListening = async () => {
    setMicPermissionDenied(false);
    
    if (recognitionRef.current) {
      try {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel(); // stop reading on recording trigger
        }
        recognitionRef.current.start();
        playChime();
      } catch (e) {
        console.warn("Speech recognition already running or errored, forcing stop/start cycle", e);
        try {
          recognitionRef.current.stop();
          setTimeout(() => {
            try {
              recognitionRef.current.start();
              playChime();
            } catch (retryErr) {
              console.error("Failed to restart speech recognition:", retryErr);
            }
          }, 150);
        } catch (stopErr) {}
      }
    } else {
      setVoiceSupportError("A entrada por voz nativa não é suportada neste navegador ou sandbox. Digite sua dúvida no campo de texto!");
      setTimeout(() => setVoiceSupportError(''), 6000);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    setInputText('');
    setMessages(prev => [...prev, { sender: 'user', text: query, timestamp: new Date() }]);
    setIsLoading(true);

    const buildSystemInstruction = () => {
      const localTimeStr = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
      const printersStr = JSON.stringify(printers.map((p: any) => ({
        nome: p.name,
        modelo: p.model,
        status: p.status === 'PRINTING' ? 'Imprimindo' : p.status === 'MAINTENANCE' ? 'Em Manutenção 🛠️' : 'Disponível/Ociosa',
        temperaturaBico: p.nozzleTemp || 'Ambiente',
        temperaturaMesa: p.bedTemp || 'Ambiente',
        progressoPercentual: p.status === 'PRINTING' ? String(((p.printProgress || p.printingProgress || 0) * 100).toFixed(0)) + '%' : 'N/A',
        trabalhoAtual: p.currentJob || 'Nenhum',
        online: p.isOnline ? 'Online 📶' : 'Offline ✕'
      })));

      const ordersStr = JSON.stringify(orders.map((o: any) => {
        const isPastDeadline = o.status !== 'READY' && o.status !== 'DELIVERED' && Date.now() > o.deadline;
        const daysDelayed = isPastDeadline ? Math.max(1, Math.ceil((Date.now() - o.deadline) / (24 * 3600 * 1000))) : 0;
        return {
          id: o.id,
          cliente: o.clientName,
          item: o.itemName,
          quantity: o.quantity,
          material: o.filamentType,
          cor: o.filamentColor,
          pesoTotalGrama: o.weightGrams * o.quantity,
          horasTrabalho: o.printTimeHours,
          valorCobrado: o.priceCharged,
          origem: o.platformSource,
          status: o.status === 'WAITING' ? 'Aguardando Pagamento' : o.status === 'QUEUE' ? 'Na Fila de Produção' : o.status === 'PRINTING' ? 'Imprimindo' : o.status === 'POST_PROCESS' ? 'Pós-Processamento/Acabamento' : o.status === 'READY' ? 'Pronto para Entrega' : 'Entregue / Concluído',
          progressoDeImpressao: String(((o.printingProgress || 0) * 100).toFixed(0)) + '%',
          impressoraDesignada: o.printerName || 'Nenhuma',
          dataCriacao: new Date(o.createdAt).toLocaleDateString('pt-BR'),
          prazoEntrega: new Date(o.deadline).toLocaleDateString('pt-BR'),
          atrasado: isPastDeadline,
          diasDeAtraso: daysDelayed
        };
      }));

      const filamentsStr = JSON.stringify(filamentStocks.map((f: any) => ({
        tipo: f.type,
        cor: f.color,
        pesoDisponivelGrama: f.stockGrams,
        estoqueMinimoGrama: f.minStockGrams,
        statusPreocupacao: f.stockGrams < f.minStockGrams ? 'CRÍTICO - Abaixo do Mínimo! Requer Reposição' : 'Estoque Saudável'
      })));

      const clientsStr = JSON.stringify(clients.map((c: any) => {
        const lastContactStr = c.lastContactDate ? new Date(c.lastContactDate).toLocaleDateString('pt-BR') : 'Nunca contatado';
        const hasNoRecentContact = !c.lastContactDate || (Date.now() - c.lastContactDate > 15 * 24 * 60 * 60 * 1000);
        return {
          nome: c.name,
          telefone: c.phone || 'Sem telefone',
          notas: c.note || 'Sem anotações',
          ultimoContato: lastContactStr,
          semAtendimentoRecente: hasNoRecentContact ? 'SIM (Sem contato há mais de 15 dias ou sem histórico de atendimento)' : 'NÃO'
        };
      }));

      return "Você é o \"Ok Loja\", um ESPECIALISTA SÊNIOR em IMPRESSÃO 3D FDM/FFF e RESINA (SLA/MSLA), além de assistente de gestão do ateliê. Você domina: nivelamento de mesa, calibração de E-steps, flow rate, PA/Linear Advance, pressure advance, retração, temperaturas por material (PLA, PETG, ABS, ASA, TPU, Nylon, PC, PA-CF), entupimento de bico (cold pull/atomic), heat creep, layer shift, ringing/ghosting, warping, elephant foot, stringing, oozing, blobs, zits, under-extrusion, over-extrusion, layer separation, delaminação, fuga térmica, problemas de cooling, bed adhesion (PEI, vidro, BuildTak, garolite), VFA, salmon skin em resina, falhas de cura, FEP perfurado, problemas mecânicos (eixos, polias GT2, rolamentos lineares, belt tension, V-rollers, leadscrew Z wobble), firmware Marlin/Klipper/RRF, input shaper, sensores BLTouch/CR-Touch/indutivos, MMU/AMS, slicers (Bambu Studio, Orca, Prusa, Cura) e acabamento (lixa, primer, alisamento com acetona, pintura). Sua personalidade é amigável, técnica e direta.\n\n" +
        "Você recebeu o status atual completo da oficina para responder perguntas com precisão e clareza.\n" +
        "Sempre se dirija ao usuário de forma cortês e animada. Responda de forma sucinta e direta (ideal para escutar ou ler rapidamente em um painel dinâmico, evitando textos gigantescos, mas sem perder detalhes importantes). Use emojis de maneira profissional.\n\n" +
        "HORA ATUAL DO SISTEMA: " + localTimeStr + "\n\n" +
        "STATUS DAS IMPRESSORAS (PRINTERS):\n" +
        printersStr + "\n\n" +
        "PEDIDOS DA FILA DE PRODUÇÃO (ORDERS):\n" +
        ordersStr + "\n\n" +
        "ESTOQUE DE FILAMENTOS (FILAMENTS):\n" +
        filamentsStr + "\n\n" +
        "CLIENTES DO ATELIÊ (CLIENTS):\n" +
        clientsStr + "\n\n" +
        "DIRETRIZES DE RESPOSTA DO OK LOJA:\n" +
        "1. Se perguntado sobre \"Como estão os pedidos\": Conte a quantidade total de pedidos ativos (não entregues), quantos estão de fato imprimindo, na fila e prontos. Destaque um ou dois que estão em estágio avançado.\n" +
        "2. Se perguntado sobre \"Maiores atrasos\" ou \"Quem está atrasado\": Identifique pedidos onde 'atrasado' é true. Liste em ordem do pior atraso (mais dias atrasados), informando o nome do cliente, o item e há quantos dias já deveria ter sido entregue. Se não houver nenhum pedido atrasado, celebre felizmente!\n" +
        "3. Se perguntado sobre \"Manutenções\" ou \"Problemas\": Indique as impressoras que estão em status 'MAINTENANCE' ou Offline. Mencione cuidados rápidos (como lubrificação dos eixos lineares, conferência de bico entupido ou nivelamento de mesa).\n" +
        "4. Se perguntado sobre \"Clientes sem atendimento\", \"clientes sem atenção\" ou \"com quem falar\": Liste os clientes que estão com 'semAtendimentoRecente' como 'SIM' ou que nunca foram contatados, informando o nome e o telefone deles para que o usuário possa reativar ou cobrar com facilidade.\n" +
        "5. Para outras dúvidas financeiras ou estoques baixos: Use os dados recebidos para somar valores, faturamento, filamentos críticos, etc.\n" +
        "6. Quando o usuário pedir DIAGNÓSTICO de um erro de impressora ou defeito de peça, RESPONDA SEMPRE neste formato Markdown:\n" +
        "   **🔍 Diagnóstico:** explicação técnica curta da causa raiz mais provável (e 1-2 causas secundárias).\n" +
        "   **🛠️ Ação Sugerida (passo a passo):** lista numerada e objetiva do que fazer agora, com valores quando aplicável (ex.: temperatura, retração em mm, velocidade em mm/s, corrente do driver, torque, etc.).\n" +
        "   **🧪 Como Validar:** teste rápido para confirmar que o problema foi resolvido (ex.: temperature tower, retraction test, calibration cube, single wall vase).\n" +
        "   **🛡️ Prevenção:** 2-3 hábitos para que o erro não volte.\n" +
        "   **⚠️ Risco / Urgência:** classifique como Baixo, Médio ou Alto e diga se deve PARAR a impressão imediatamente.\n" +
        "   Adapte recomendações ao material e impressora envolvidos quando o usuário citar.\n\n" +
        "ESCRITA DA RESPOSTA: Escreva de forma empolgante, clara, concisa, no idioma Português (Brasil). Separe os tópicos principais com marcadores (bullet points) limpos e elegantes. Mantenha as respostas objetivas para que o usuário consiga ler em menos de 15 segundos ou ouvir sem cansar.";
    };

    try {
      const customKey = safeStorage.getItem('bambuzau_custom_gemini_key', '') || '';
      const customGroq = safeStorage.getItem('bambuzau_custom_groq_key', '') || '';
      const currentProvider = safeStorage.getItem('bambuzau_ai_provider', 'gemini');
      const isGroundingEnabled = safeStorage.getItem('bambuzau_gemini_search_grounding', 'false') === 'true';

      const isAndroidWebView = checkIsAndroidWebView();
      let answer = "";

      const prevMsgs = messages.slice(1).map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const callClientDirectly = async (): Promise<string> => {
        const sysPrompt = buildSystemInstruction();
        if (currentProvider === 'groq') {
          if (!customGroq) {
            throw new Error("Chave Groq não configurada localmente. Insira sua chave API Groq nas Configurações para realizar a chamada direta do celular!");
          }
          return await callGroq(customGroq, sysPrompt, query, prevMsgs);
        } else {
          if (!customKey) {
            throw new Error("Chave da API do Gemini não configurada localmente. Cadastre-a nas Configurações para realizar a chamada direta!");
          }
          return await callGemini(customKey, sysPrompt, query, prevMsgs);
        }
      };

      if (isAndroidWebView && (customKey || customGroq)) {
        console.log("[Ok Loja Assistant] Android WebView + Chaves customizadas detectadas. Chamando APIs de IA diretamente do cliente...");
        answer = await callClientDirectly();
      } else {
        try {
          const response = await fetch(getApiUrl('/api/ok-loja'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Custom-Gemini-Key': customKey,
              'X-Custom-Groq-Key': customGroq
            },
            body: JSON.stringify({
              orders,
              printers,
              clients,
              filamentStocks,
              question: query,
              provider: currentProvider,
              enableSearchGrounding: currentProvider === 'gemini' && isGroundingEnabled,
              customGeminiKey: customKey,
              customGroqKey: customGroq
            })
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || 'Erro ao realizar consulta no servidor.');
          }

          const data = await response.json();
          answer = data.answer || "";
        } catch (serverErr: any) {
          console.warn("[Ok Loja Assistant] Conexão com o servidor falhou ou rejeitada, tentando chamada direta...", serverErr);
          if (customKey || customGroq) {
            answer = await callClientDirectly();
          } else {
            throw new Error("Não foi possível conectar ao servidor e nenhuma chave de API local foi cadastrada nas Configurações. Cadastre sua própria chave API nas Configurações para utilizar o assistente de forma 100% autônoma e offline no celular!");
          }
        }
      }

      if (!answer) {
        throw new Error("Desculpe, não consegui processar a resposta da IA.");
      }
      
      setMessages(prev => [...prev, { sender: 'assistant', text: answer, timestamp: new Date() }]);
      speakText(answer);
    } catch (error: any) {
      console.error(error);
      const provUpper = aiProvider.toUpperCase();
      let errorMsg = `❌ **Ocorreu um problema ao consultar o assistente (${provUpper})**: \n\n${error.message}\n\nPor favor, garanta que sua chave **${provUpper}_API_KEY** esteja correta ou adicione uma chave própria de contingência nas Configurações!`;
      
      const isLeakedOrAuthError = 
        error.message.includes('403') || 
        error.message.includes('401') || 
        error.message.includes('leaked') || 
        error.message.includes('PERMISSION_DENIED') || 
        error.message.includes('key') || 
        error.message.includes('chave');

      if (provUpper === 'GROQ' && isLeakedOrAuthError) {
        errorMsg += `\n\n💡 **Dica de Recuperação:** Sua chave da Groq foi relatada como vazada ou recusada. **Clique no botão "Gemini"** no topo deste assistente para continuar conversando gratuitamente e de forma imediata com a chave de cortesia oficial do ateliê!`;
      }
      
      setMessages(prev => [...prev, { 
        sender: 'assistant', 
        text: errorMsg, 
        timestamp: new Date() 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper chips: gestão + biblioteca completa de erros de impressão 3D
  const diagnosticCategories: Array<{
    id: string;
    label: string;
    accent: string;
    icon: any;
    items: Array<{ label: string; prompt: string }>;
  }> = [
    {
      id: 'gestao',
      label: 'Gestão',
      accent: 'text-blue-400',
      icon: <Clock className="w-3.5 h-3.5" />,
      items: [
        { label: 'Status geral', prompt: 'Como estão os pedidos do ateliê atualmente?' },
        { label: 'Maiores atrasos', prompt: 'Quais são as peças e clientes com maiores atrasos na produção?' },
        { label: 'Manutenções pendentes', prompt: 'Qual o status das impressoras e se há manutenções pendentes?' },
        { label: 'Clientes sem contato', prompt: 'Quais clientes estão sem atendimento há mais de 15 dias ou sem contato?' },
        { label: 'Estoque crítico', prompt: 'Quais filamentos estão com quantidade crítica ou abaixo do estoque mínimo?' },
      ],
    },
    {
      id: 'impressora',
      label: 'Erros de Impressora',
      accent: 'text-amber-400',
      icon: <Wrench className="w-3.5 h-3.5" />,
      items: [
        { label: 'Bico entupido', prompt: 'Diagnóstico de bico entupido (não extruda ou extruda fino). Liste causas, ação passo a passo (cold pull/atomic pull), validação e prevenção.' },
        { label: 'Heat creep', prompt: 'Suspeito de heat creep no hotend (entupimento após algum tempo). Diagnostique e me dê ação corretiva detalhada.' },
        { label: 'Mesa não nivela', prompt: 'Mesa fora de nível / primeira camada irregular. Faça o diagnóstico completo e me guie no nivelamento manual e auto (BLTouch/CR-Touch).' },
        { label: 'Falha de adesão', prompt: 'Peça soltando da mesa durante a impressão. Diagnostique adesão (PEI, vidro, BuildTak) por material e me dê ações.' },
        { label: 'Layer shift', prompt: 'Camadas deslocadas (layer shift) durante a impressão. Diagnostique mecânica (belt, polia, driver, corrente) e ações corretivas.' },
        { label: 'Z-wobble / banding', prompt: 'Banding vertical / Z-wobble visível nas peças. Diagnostique leadscrew, acoplador, perpendicularidade e ações.' },
        { label: 'Ringing / ghosting', prompt: 'Fantasmas (ringing/ghosting) ao lado de detalhes. Diagnostique e me ensine input shaper passo a passo.' },
        { label: 'Thermal runaway', prompt: 'Erro de THERMAL RUNAWAY na impressora. Diagnostique segurança, termistor, aquecedor, PID tuning e ação imediata.' },
        { label: 'Extrusor click/skip', prompt: 'Extrusor estalando (clicking) / pulando passos. Diagnostique tensão da mola, corrente do driver, temperatura, entupimento.' },
        { label: 'Sensor de filamento', prompt: 'Falsos positivos ou negativos no sensor de filamento. Diagnostique e me dê ação corretiva.' },
        { label: 'Eixos com folga', prompt: 'Folga nos eixos X/Y/Z (rolamentos lineares, V-rollers, polias GT2). Diagnostique e me ensine ajuste correto.' },
        { label: 'Belt frouxa/apertada', prompt: 'Como saber se a correia GT2 está na tensão certa? Diagnostique sintomas e me dê o passo a passo.' },
        { label: 'Mesa fria', prompt: 'Mesa aquecida não atinge a temperatura alvo. Diagnostique MOSFET, cabo, termistor, ambiente.' },
        { label: 'Hotend frio', prompt: 'Hotend não atinge temperatura ou oscila. Diagnostique termistor, cartucho, isolamento, PID.' },
      ],
    },
    {
      id: 'peca',
      label: 'Defeitos de Peça',
      accent: 'text-rose-400',
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
      items: [
        { label: 'Stringing / fios', prompt: 'Peça com stringing (fios finos entre partes). Diagnostique retração, temperatura, secagem do filamento e ações.' },
        { label: 'Warping', prompt: 'Cantos da peça empenando (warping). Diagnostique por material (ABS/ASA/PETG/PLA) e me dê ações de cura.' },
        { label: 'Elephant foot', prompt: 'Base da peça com pé de elefante (elephant foot). Diagnostique mesa, temperatura, z-offset, compensação no slicer.' },
        { label: 'Under-extrusion', prompt: 'Sub-extrusão (paredes com falhas e gaps). Diagnostique flow, E-steps, temperatura, bico parcialmente entupido.' },
        { label: 'Over-extrusion', prompt: 'Sobre-extrusão (peça maior, blobs, paredes infladas). Diagnostique flow e calibração.' },
        { label: 'Delaminação', prompt: 'Camadas separando (delaminação / layer separation). Diagnostique temperatura, cooling, material úmido.' },
        { label: 'Blobs e zits', prompt: 'Blobs e zits no início/fim de cada camada (seams). Diagnostique coasting, wipe, pressure advance, retração.' },
        { label: 'Overhang ruim', prompt: 'Overhangs e pontes ruins. Diagnostique cooling (% do fan), velocidade e orientação da peça.' },
        { label: 'Salmon skin (resina)', prompt: 'Salmon skin / linhas horizontais em peças de resina. Diagnostique LCD, eixo Z, exposição.' },
        { label: 'Falha de cura (resina)', prompt: 'Resina não cura ou descola da FEP. Diagnostique exposição, FEP, ambiente, suportes.' },
        { label: 'Peça quebra fácil', prompt: 'Peça com baixa resistência mecânica. Diagnostique infill, perímetros, material úmido, temperatura.' },
        { label: 'Dimensão fora', prompt: 'Peça fora de medida (XY/Z). Diagnostique steps/mm, shrinkage por material, compensação de horizontal expansion.' },
        { label: 'Vibração / VFA', prompt: 'Padrão de vibração (VFA - Vertical Fine Artifacts). Diagnostique drivers, polia, microstep, input shaper.' },
        { label: 'Spaghetti', prompt: 'Peça virou spaghetti (soltou e continuou imprimindo no ar). Diagnostique adesão e me ensine a detectar antes.' },
      ],
    },
    {
      id: 'material',
      label: 'Filamento / Material',
      accent: 'text-emerald-400',
      icon: <Layers className="w-3.5 h-3.5" />,
      items: [
        { label: 'Filamento úmido', prompt: 'Como saber se meu filamento está úmido? Liste sintomas, teste e processo de secagem por material (PLA, PETG, ABS, Nylon, TPU).' },
        { label: 'Temperaturas por material', prompt: 'Me dê tabela de temperaturas ideais de bico e mesa, velocidade e cooling para PLA, PETG, ABS, ASA, TPU, Nylon e PC.' },
        { label: 'Retração ideal', prompt: 'Valores iniciais de retração (distância em mm e velocidade) para Bowden e Direct Drive por material.' },
        { label: 'Trocar de cor/material', prompt: 'Procedimento correto para trocar de cor ou material sem contaminar a próxima impressão.' },
        { label: 'Filamento quebradiço', prompt: 'Filamento quebrando no extrusor. Diagnostique umidade, idade, tensão da bobina e ações.' },
      ],
    },
  ];

  const [activeCategory, setActiveCategory] = useState<string>('gestao');
  const activeCat = diagnosticCategories.find(c => c.id === activeCategory) || diagnosticCategories[0];

  return (
    <>
      {/* FLOATING ACTION TRIGGER ORB — placed in the sidebar next to the "Navegação" label */}
      <div className="fixed top-3 left-[108px] z-50 select-none">
        <button
          onClick={() => {
            setIsOpen(true);
            if ('speechSynthesis' in window) {
              window.speechSynthesis.cancel();
            }
          }}
          className={`relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500/90 to-amber-400 text-black shadow-md shadow-amber-950/40 hover:scale-110 active:scale-95 transition-all duration-200 border border-white/20 cursor-pointer outline-none group focus:ring-2 focus:ring-amber-400 ${
            isBackgroundListening ? 'ring-[3px] ring-emerald-400/80 shadow-[0_0_18px_rgba(52,211,153,0.4)]' : ''
          }`}
          id="ok-loja-floating-orb"
          title={isBackgroundListening ? "Ok Loja ouvindo em background! Diga 'Ok Loja' para falar 🎙️" : "Falar com o assistente Ok Loja 🎙️"}
        >
          {/* Wave ripple decorative glow */}
          {isBackgroundListening ? (
            <span className="absolute animate-ping inline-flex h-full w-full rounded-full bg-emerald-400/20 opacity-75"></span>
          ) : (
            <span className="absolute animate-ping inline-flex h-full w-full rounded-full bg-amber-400/30 opacity-75"></span>
          )}
          
          <Mic className={`w-3.5 h-3.5 ${isBackgroundListening ? 'text-zinc-950 animate-pulse' : 'text-zinc-900'}`} />
          
          <div className="absolute left-10 top-1 bg-black/85 border border-zinc-700 text-[10px] font-extrabold text-[#F1F4EE] px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden sm:block pointer-events-none">
            {isBackgroundListening ? "🎙️ Detecção por Voz 'Ok Loja' Ativa" : "Perguntar por Voz 'Ok Loja' 🎙️"}
          </div>
        </button>
      </div>

      {/* ASSISTANT SHELF/MODAL */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fade-in" id="ok-loja-assistant-overlay">
          <div className="relative w-full max-w-xl h-[85vh] sm:h-[78vh] animate-scale-in">
            <div className="absolute -top-20 -left-10 w-[360px] h-[360px] rounded-full bg-amber-500/15 blur-[120px] pointer-events-none" />
            <div className="absolute -bottom-16 -right-10 w-[320px] h-[320px] rounded-full bg-sky-500/10 blur-[120px] pointer-events-none" />
          <div className="relative bg-white/[0.03] border border-white/10 backdrop-blur-2xl rounded-3xl w-full h-full flex flex-col overflow-hidden shadow-[0_40px_120px_-30px_rgba(245,158,11,0.35)]">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/50 to-transparent pointer-events-none" />

            {/* SHELF HEADER */}
            <div className="relative px-5 py-4 border-b border-white/[0.06] flex items-center justify-between bg-gradient-to-b from-white/[0.04] to-transparent">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-400/50 to-amber-600/30 blur-lg" />
                  <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-black shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
                    <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: '10s' }} />
                  </div>
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-white flex items-center gap-2 tracking-tight" style={{ fontFamily: 'Sora, system-ui, sans-serif' }}>
                    Ok Loja AI
                    <span className="text-[9px] font-bold uppercase font-mono bg-amber-500/15 text-amber-300 px-1.5 py-0.5 rounded-md border border-amber-400/25 tracking-widest">
                      v3.3.0.0
                    </span>
                  </h3>
                  <div className="flex gap-1.5 mt-1.5">
                    <button
                      onClick={() => {
                        safeStorage.setItem('bambuzau_ai_provider', 'gemini');
                        setAiProvider('gemini');
                      }}
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] cursor-pointer ${
                        aiProvider === 'gemini'
                          ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-[0_4px_14px_-2px_rgba(245,158,11,0.55)]'
                          : 'bg-white/[0.04] border border-white/10 text-white/55 hover:text-white hover:border-white/20'
                      }`}
                    >
                      Gemini
                    </button>
                    <button
                      onClick={() => {
                        safeStorage.setItem('bambuzau_ai_provider', 'groq');
                        setAiProvider('groq');
                      }}
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] cursor-pointer ${
                        aiProvider === 'groq'
                          ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-[0_4px_14px_-2px_rgba(139,92,246,0.55)]'
                          : 'bg-white/[0.04] border border-white/10 text-white/55 hover:text-white hover:border-white/20'
                      }`}
                    >
                      Groq ⚡
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Background wake-word continuous trigger toggle */}
                <button
                  onClick={() => setBackgroundWakeWordEnabled(!backgroundWakeWordEnabled)}
                  className={`p-2 rounded-xl border backdrop-blur-xl transition-all duration-300 cursor-pointer hover:-translate-y-0.5 ${
                    backgroundWakeWordEnabled
                      ? 'bg-emerald-400/15 border-emerald-300/35 text-emerald-300 shadow-[0_0_18px_-4px_rgba(16,185,129,0.6)]'
                      : 'bg-white/[0.04] border-white/10 text-white/50 hover:text-white hover:border-white/20'
                  }`}
                  title={backgroundWakeWordEnabled ? "Mão-livres ativo: diga 'Ok Loja' para abrir" : "Ativar comandos mãos-livres 'Ok Loja'"}
                >
                  <Mic className="w-4 h-4" />
                </button>

                {/* Voice synthesizer toggle */}
                <button
                  onClick={() => {
                    setIsVoiceEnabled(!isVoiceEnabled);
                    if (isVoiceEnabled && 'speechSynthesis' in window) {
                      window.speechSynthesis.cancel();
                    }
                  }}
                  className={`p-2 rounded-xl border backdrop-blur-xl transition-all duration-300 cursor-pointer hover:-translate-y-0.5 ${
                    isVoiceEnabled
                      ? 'bg-amber-400/15 border-amber-300/35 text-amber-300 shadow-[0_0_18px_-4px_rgba(245,158,11,0.6)]'
                      : 'bg-white/[0.04] border-white/10 text-white/50 hover:text-white hover:border-white/20'
                  }`}
                  title={isVoiceEnabled ? "Mutar feedback de voz" : "Ativar respostas por voz"}
                >
                  {isVoiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>

                {/* Close Button */}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    if ('speechSynthesis' in window) {
                      window.speechSynthesis.cancel();
                    }
                  }}
                  className="p-2 bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:border-white/20 text-white/55 hover:text-white rounded-xl transition-all duration-300 cursor-pointer hover:-translate-y-0.5"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            {/* MESSAGE HISTORY CONTAINER */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-950/70" id="ok-loja-chat-history">
              {/* INLINE GEMINI KEY INFO CARD IF USING SERVER KEY */}
              {aiProvider === 'gemini' && !customGeminiKey && (
                <div className="p-4 bg-sky-500/10 border border-sky-500/20 rounded-2xl space-y-2.5 animate-fade-in text-sans">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sky-400 font-bold text-xs">
                      <Sparkles className="w-4 h-4 animate-pulse text-sky-400" />
                      Usando Servidor do Ateliê (Gemini Pronto) 🌐
                    </div>
                    <span className="text-[8px] font-mono tracking-widest font-black uppercase text-sky-450 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                      servidor ativo
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed font-sans font-medium">
                    Excelente! O assistente inteligente **Ok Loja** já está pronto para uso de forma totalmente gratuita e ilimitada através da chave de cortesia oficial configurada no servidor.
                  </p>
                  <p className="text-[10px] text-zinc-450 leading-relaxed font-sans">
                    💡 Opcional: Se preferir utilizar sua cota privada ou sua chave pessoal do Google AI Studio, cole-a no campo abaixo:
                  </p>
                  
                  <div className="flex gap-2 relative mt-1">
                    <input
                      type={showInlineKey ? "text" : "password"}
                      placeholder="Cole sua GEMINI_API_KEY pessoal aqui..."
                      value={inlineKeyInput}
                      onChange={(e) => setInlineKeyInput(e.target.value)}
                      className="flex-1 bg-zinc-950 border border-zinc-500/20 pl-3.5 pr-10 py-2.5 rounded-xl text-xs text-white lg:text-[11px] font-mono placeholder-zinc-750 outline-none focus:border-sky-550 transition"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = inlineKeyInput.trim();
                          const check = validateApiKeyFormat(val);
                          if (!check.isValid) {
                            setInlineKeyError(check.reason || 'Chave do Gemini inválida!');
                            return;
                          }
                          setInlineKeyError('');
                          safeStorage.setItem('bambuzau_custom_gemini_key', val);
                          setCustomGeminiKey(val);
                          window.dispatchEvent(new Event('bambuzau_keys_updated'));
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowInlineKey(!showInlineKey)}
                      className="absolute right-20 top-3 text-[#8BA58D] hover:text-white transition p-0.5 rounded cursor-pointer"
                      title={showInlineKey ? "Ocultar Chave" : "Mostrar Chave"}
                    >
                      {showInlineKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    
                    <button
                      onClick={() => {
                        const val = inlineKeyInput.trim();
                        const check = validateApiKeyFormat(val);
                        if (!check.isValid) {
                          setInlineKeyError(check.reason || 'Chave do Gemini inválida!');
                          return;
                        }
                        setInlineKeyError('');
                        safeStorage.setItem('bambuzau_custom_gemini_key', val);
                        setCustomGeminiKey(val);
                        window.dispatchEvent(new Event('bambuzau_keys_updated'));
                      }}
                      className="px-4 py-2 bg-sky-500 hover:bg-sky-450 text-black font-extrabold text-xs rounded-xl cursor-pointer hover:scale-[1.02] active:scale-95 transition"
                    >
                      Ativar
                    </button>
                  </div>
                  {inlineKeyError && (
                    <p className="text-[10px] text-red-400 font-bold font-sans mt-1 animate-pulse">
                      ⚠️ {inlineKeyError}
                    </p>
                  )}
                  <div className="text-[9px] text-zinc-500 leading-normal">
                    💡 Para criar uma chave gratuitamente em segundos, acesse o <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-sky-400 underline font-semibold hover:text-sky-300">Google AI Studio</a>.
                  </div>
                </div>
              )}

              {/* INLINE GROQ KEY WARNING CARD IF MISSING */}
              {aiProvider === 'groq' && !customGroqKey && (
                <div className="p-4 bg-purple-950/25 border border-purple-800/30 rounded-2xl space-y-2.5 animate-fade-in text-sans">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                      <Sparkles className="w-4 h-4 animate-pulse text-purple-400" />
                      Chave API Groq do Usuário Pendente
                    </div>
                    <span className="text-[8px] font-mono tracking-widest font-black uppercase text-purple-400/75 bg-purple-400/5 px-2 py-0.5 rounded border border-purple-400/10">
                      super speed ociosa
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed font-sans">
                    A **Groq** é o motor de inferência de IA mais rápido do planeta! Ela responde sua voz em milissegundos. Insira sua chave API da Groq abaixo para habilitar o modo ultra rápido no seu navegador de forma segura.
                  </p>
                  
                  <div className="flex gap-2 relative mt-1">
                    <input
                      type={showInlineKey ? "text" : "password"}
                      placeholder="Cole sua GROQ_API_KEY aqui (ex: gsk_...)..."
                      value={inlineGroqKeyInput}
                      onChange={(e) => setInlineGroqKeyInput(e.target.value)}
                      className="flex-1 bg-zinc-950 border border-zinc-850 pl-3.5 pr-10 py-2.5 rounded-xl text-xs text-white lg:text-[11px] font-mono placeholder-zinc-700 outline-none focus:border-purple-500 transition"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = inlineGroqKeyInput.trim();
                          const check = validateApiKeyFormat(val);
                          if (!check.isValid) {
                            setInlineGroqError(check.reason || 'Chave da Groq inválida!');
                            return;
                          }
                          setInlineGroqError('');
                          safeStorage.setItem('bambuzau_custom_groq_key', val);
                          setCustomGroqKey(val);
                          window.dispatchEvent(new Event('bambuzau_keys_updated'));
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowInlineKey(!showInlineKey)}
                      className="absolute right-20 top-3 text-[#8BA58D] hover:text-white transition p-0.5 rounded cursor-pointer"
                      title={showInlineKey ? "Ocultar Chave" : "Mostrar Chave"}
                    >
                      {showInlineKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    
                    <button
                      onClick={() => {
                        const val = inlineGroqKeyInput.trim();
                        const check = validateApiKeyFormat(val);
                        if (!check.isValid) {
                          setInlineGroqError(check.reason || 'Chave da Groq inválida!');
                          return;
                        }
                        setInlineGroqError('');
                        safeStorage.setItem('bambuzau_custom_groq_key', val);
                        setCustomGroqKey(val);
                        window.dispatchEvent(new Event('bambuzau_keys_updated'));
                      }}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs rounded-xl cursor-pointer hover:scale-[1.02] active:scale-95 transition"
                    >
                      Ativar
                    </button>
                  </div>
                  {inlineGroqError && (
                    <p className="text-[10px] text-purple-400 font-bold font-sans mt-1 animate-pulse">
                      ⚠️ {inlineGroqError}
                    </p>
                  )}
                  <div className="text-[9px] text-zinc-500 leading-normal">
                    💡 Crie sua chave gratuita em segundos acessando o <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="text-purple-400 underline font-semibold hover:text-purple-300">Console da Groq</a>.
                  </div>
                </div>
              )}

              {/* Status badge showing active key if present */}
              {aiProvider === 'gemini' && !customGeminiKey && (
                <div className="flex justify-center select-none animate-fade-in font-sans animate-pulse">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-sky-500/10 border border-sky-500/15 hover:border-sky-500/25 rounded-full text-sky-400 font-bold text-[8px] sm:text-[9px] font-mono tracking-wider transition">
                    <Sparkles className="w-3 text-sky-400 shrink-0" />
                    CONECTADO AO GEMINI ATRAVÉS DO SERVIDOR DO ATELIÊ (CORTESIA)
                  </div>
                </div>
              )}

              {aiProvider === 'gemini' && customGeminiKey && (
                <div className="flex justify-center select-none animate-fade-in font-sans">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/15 hover:border-emerald-500/25 rounded-full text-emerald-400 font-bold text-[9px] font-mono tracking-wider transition">
                    <Check className="w-3" />
                    CHAVE DE API DO GEMINI CONFIGURADA E ATIVA COFRE LOCAL
                    <button 
                      onClick={() => {
                        if (confirm("Deseja apagar a chave de API do Gemini salva neste navegador?")) {
                          safeStorage.removeItem('bambuzau_custom_gemini_key');
                          setCustomGeminiKey('');
                          setInlineKeyInput('');
                          window.dispatchEvent(new Event('bambuzau_keys_updated'));
                        }
                      }}
                      className="text-zinc-550 hover:text-red-400 underline lowercase font-semibold ml-1 text-[8.5px] cursor-pointer font-sans"
                    >
                      (remover)
                    </button>
                  </div>
                </div>
              )}

              {aiProvider === 'groq' && customGroqKey && (
                <div className="flex justify-center select-none animate-fade-in font-sans">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/15 hover:border-purple-500/25 rounded-full text-purple-400 font-bold text-[9px] font-mono tracking-wider transition">
                    <Check className="w-3" />
                    CHAVE DE API DA GROQ CONFIGURADA E ATIVA COFRE LOCAL
                    <button 
                      onClick={() => {
                        if (confirm("Deseja apagar a chave de API da Groq salva neste navegador?")) {
                          safeStorage.removeItem('bambuzau_custom_groq_key');
                          setCustomGroqKey('');
                          setInlineGroqKeyInput('');
                          window.dispatchEvent(new Event('bambuzau_keys_updated'));
                        }
                      }}
                      className="text-zinc-550 hover:text-red-400 underline lowercase font-semibold ml-1 text-[8.5px] cursor-pointer font-sans"
                    >
                      (remover)
                    </button>
                  </div>
                </div>
              )}

              {messages.map((m, idx) => (
                <div 
                  key={idx} 
                  className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                    m.sender === 'user' 
                      ? 'bg-amber-500 text-black font-extrabold rounded-tr-none shadow shadow-amber-950/10' 
                      : 'bg-zinc-900 border border-zinc-850 text-zinc-200 rounded-tl-none font-sans font-normal'
                  }`}>
                    {/* Render message formatting manually to protect against outer dependencies */}
                    <div className="whitespace-pre-line">
                      {m.text.split('\n').map((line, lIdx) => {
                        // Render strong highlights
                        let formattedLine = line;
                        // Bold parsing **test**
                        if (line.includes('**')) {
                          const parts = line.split('**');
                          return (
                            <p key={lIdx} className="mb-1">
                              {parts.map((part, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className={m.sender === 'user' ? 'text-black font-black' : 'text-amber-400 font-bold'}>{part}</strong> : part)}
                            </p>
                          );
                        }
                        // Bullet parsing
                        if (line.startsWith('- ')) {
                          return (
                            <li key={lIdx} className="ml-3 list-disc text-[11.5px] mt-0.5">
                              {line.substring(2)}
                            </li>
                          );
                        }
                        return <p key={lIdx} className="mb-0.5">{formattedLine}</p>;
                      })}
                    </div>
                    
                    <div className={`text-[8px] mt-1.5 select-none text-right font-mono opacity-65 ${
                      m.sender === 'user' ? 'text-black' : 'text-zinc-500'
                    }`}>
                      {m.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}

              {/* Bot typing simulation loader */}
              {isLoading && (
                <div className="flex justify-start animate-pulse">
                  <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-4 flex items-center gap-2.5">
                    <div className="flex space-x-1.5 items-center">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-[10.5px] text-zinc-400 italic font-mono">
                      Ok Loja consultando status da oficina...
                    </span>
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>

            {/* DIAGNOSTIC QUICK TRIGGER — Categorias de especialista 3D */}
            <div className="bg-zinc-900/60 border-t border-zinc-900 select-none">
              {/* Category tabs */}
              <div className="px-3 pt-3 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mr-1 shrink-0">
                  Especialista 3D:
                </span>
                {diagnosticCategories.map(cat => {
                  const active = cat.id === activeCategory;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10.5px] font-bold border transition ${
                        active
                          ? 'bg-amber-500/15 border-amber-400/50 text-amber-200'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                      }`}
                    >
                      <span className={active ? 'text-amber-300' : cat.accent}>{cat.icon}</span>
                      {cat.label}
                    </button>
                  );
                })}
              </div>
              {/* Items grid */}
              <div className="p-3 flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {activeCat.items.map((it, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(it.prompt)}
                    disabled={isLoading}
                    title={it.prompt}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 hover:border-amber-500/40 hover:bg-zinc-900 rounded-lg text-[10.5px] font-semibold text-zinc-300 hover:text-zinc-100 cursor-pointer active:scale-95 disabled:opacity-50 transition"
                  >
                    <span className={activeCat.accent}>•</span>
                    {it.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Error notifications safe banner */}
            {voiceSupportError && (
              <div className="mx-4 mb-2 p-2.5 bg-amber-500/10 border border-amber-500/25 rounded-xl text-[10px] font-bold text-amber-400 flex items-center gap-1.5 animate-pulse text-sans">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{voiceSupportError}</span>
              </div>
            )}

            {/* INPUT CONTROLS ROW */}
            <div className="p-4 bg-[var(--brand-card)] border-t border-zinc-850 flex gap-2.5 items-center">
              
              {/* Mic action button */}
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={isLoading}
                className={`py-3 px-3.5 rounded-2xl flex items-center justify-center cursor-pointer transition active:scale-95 disabled:opacity-50 border ${
                  isListening 
                    ? 'bg-red-500 border-red-400 text-white animate-pulse' 
                    : 'bg-zinc-900 border-zinc-800 text-amber-400 hover:text-amber-300'
                }`}
                title={isListening ? "Parar de ouvir" : "Iniciar escuta por voz (Ok Loja)"}
              >
                {isListening ? (
                  <div className="relative w-5 h-5 flex items-center justify-center">
                    <span className="absolute animate-ping w-4 h-4 bg-white rounded-full opacity-60"></span>
                    <Mic className="w-4.5 h-4.5" />
                  </div>
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>

              {/* Text Input field */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isLoading) {
                      handleSendMessage();
                    }
                  }}
                  disabled={isLoading}
                  className="w-full bg-zinc-950 border border-zinc-850 px-4 py-3 pb-3 rounded-2xl text-xs font-semibold text-zinc-100 placeholder-zinc-500 outline-none focus:border-amber-500 transition disabled:opacity-50"
                  placeholder={
                    isListening 
                      ? "Ouvindo... Fale agora! 🎙️" 
                      : speechRecognitionSupported 
                      ? "Digite ou use o microfone..." 
                      : "Digite sua dúvida sobre a oficina..."
                  }
                />
                
                {isListening && (
                  <span className="absolute right-3 top-3.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF4B4B] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF4B4B]"></span>
                  </span>
                )}
              </div>

              {/* Submit Button */}
              <button
                onClick={() => handleSendMessage()}
                disabled={isLoading || !inputText.trim()}
                className="py-3 px-4.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-2xl transition-transform active:scale-98 cursor-pointer disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5"
                title="Enviar pergunta"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Perguntar</span>
              </button>
            </div>

            {/* METRIC FOOTER BAR */}
            <div className="bg-zinc-950 px-4 py-1.5 text-[8.5px] text-zinc-650 flex items-center justify-between border-t border-zinc-900 select-none">
              <span className="font-mono">
                OK LOJA AI • STATUS INTEGRADO COM SUCESSO
              </span>
              <span className="flex items-center gap-1 font-mono hover:text-zinc-500 cursor-help" title="Privacidade e dados locais">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                DADOS CÉLULA LOCAL PROTEGIDOS
              </span>
            </div>

          </div>
          </div>
        </div>
      )}
    </>
  );
}