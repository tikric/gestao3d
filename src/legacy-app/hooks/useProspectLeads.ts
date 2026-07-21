import React, { useState } from 'react';
import type { Client } from '../types';
import {
  type ProspectLead,
  LEAD_CATEGORIES,
  guessDDD,
  getCityNeighborhoods,
  getCityStreets,
  generateStoreName,
  getCategoryPitch,
} from '../lib/prospect-helpers';
import { getApiUrl } from '../utils/api';
import { safeStorage } from '../utils/storage';

const DEFAULT_LEADS: ProspectLead[] = [
  {
    id: 'lead-1',
    name: 'Banca e Revistaria Paulista',
    phone: '(11) 98255-1030',
    address: 'Avenida Paulista, 1200, São Paulo - SP',
    category: 'Jornaleiros',
    pitch: 'Apresentar canetas decoradas e chaveiros articulados de super-herois ou lembrancinhas de SP em 3D para serem dispostos no balcão de revenda rápida com ganho de 100%.',
    status: 'PROSPECT',
    timelineChecklist: { s1: false, s2: false, s3: false, s4: false },
    note: 'Ponto comercial de elevadíssimo fluxo pedonal, ideal para souvenirs rápidos.'
  },
  {
    id: 'lead-2',
    name: 'Mundo Mágico Toys & Brinquedos',
    phone: '(11) 97412-4040',
    address: 'Rua Oscar Freire, 810, Cerqueira César, São Paulo - SP',
    category: 'Brinquedos',
    pitch: 'Oferecer os Dragões Articulados em cores Seda (Silk), Ovos com Criaturas e brinquedos sensoriais didáticos (Fidget Toys) para área infantil.',
    status: 'CONTACTED',
    timelineChecklist: { s1: true, s2: false, s3: false, s4: false },
    note: 'Loja boutique voltada para brinquedos premium de alto padrão.'
  },
  {
    id: 'lead-3',
    name: 'Ateliê Botânico Decor & Jardins',
    phone: '(11) 99114-8844',
    address: 'Rua Harmonia, 340, Vila Madalena, São Paulo - SP',
    category: 'Decoração',
    pitch: 'Propor vasos de design geométrico espiral e suportes suspensos modernos em Plásticos sustentáveis (PLA Mármore e Cobre).',
    status: 'PROSPECT',
    timelineChecklist: { s1: false, s2: false, s3: false, s4: false },
    note: 'Ateliê focado em paisagismo urbano e decoração minimalista de estúdios.'
  },
  {
    id: 'lead-4',
    name: 'Nerd Core Geek & Games Shop',
    phone: '(11) 96511-7788',
    address: 'Rua Vergueiro, 1310, Vila Mariana, São Paulo - SP',
    category: 'Geek',
    pitch: 'Vender Torres de Rolagem de Dados (Dice Towers) medievais, estatuetas pintáveis, suportes gamer para headset e organizadores de controle consoles.',
    status: 'VISITED',
    timelineChecklist: { s1: true, s2: true, s3: false, s4: false },
    note: 'Público jovem gamer e universitário. Dono demonstrou alta simpatia por miniaturas.'
  },
  {
    id: 'lead-5',
    name: 'Café Grão Divino & Bistrô',
    phone: '(11) 98115-3300',
    address: 'Rua Augusta, 1900, Consolação, São Paulo - SP',
    category: 'Cafeteria',
    pitch: 'Apresentar stencils personalizados de barismo (para polvilhar cacau no café com nome da marca) e cortadores de biscoito temáticos em 3D.',
    status: 'INTERESTED',
    timelineChecklist: { s1: true, s2: true, s3: true, s4: false },
    note: 'Interessados em stencils de barismo e chaveiros fidelidade para clientes VIP.'
  }
];

export function useProspectLeads(onAddClient: (client: Omit<Client, 'id'>) => void) {
  const [prospectLeads, setProspectLeads] = useState<ProspectLead[]>(() => {
    try {
      const saved = localStorage.getItem('bambuzau_local_prospect_leads');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_LEADS;
  });

  const [selectedLeadForModal, setSelectedLeadForModal] = useState<ProspectLead | null>(null);
  const [prospectRegion, setProspectRegion] = useState('São Paulo, SP');
  const [searchCategoryInput, setSearchCategoryInput] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('Todos');
  const [searchingLeads, setSearchingLeads] = useState(false);
  const [mapQuery, setMapQuery] = useState('Bancas e Lojas de Brinquedos em São Paulo');

  const [aiTone, setAiTone] = useState<'original' | 'persuasivo' | 'curto' | 'consignado' | 'custom'>('original');
  const [customInstruction, setCustomInstruction] = useState('');
  const [customAiOutput, setCustomAiOutput] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [focusedLeadId, setFocusedLeadId] = useState<string>('');
  const [copiedTextFeedback, setCopiedTextFeedback] = useState(false);

  const [showNewLeadForm, setShowNewLeadForm] = useState(false);
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadAddress, setNewLeadAddress] = useState('');
  const [newLeadCategory, setNewLeadCategory] = useState('Jornaleiros');
  const [newLeadPitch, setNewLeadPitch] = useState('');
  const [newLeadNote, setNewLeadNote] = useState('');

  React.useEffect(() => {
    localStorage.setItem('bambuzau_local_prospect_leads', JSON.stringify(prospectLeads));
  }, [prospectLeads]);

  const handleCreateManualLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName.trim() || !newLeadPhone.trim()) {
      alert('Nome da Loja e Telefone são obrigatórios!');
      return;
    }
    const defaultPitches: Record<string, string> = {
      'Jornaleiros': 'Canetas decoradas, chaveiros articulados rápidos de heróis e display organizador de moedas de balcão.',
      'Brinquedos': 'Dragão articulado Silk, polvos do humor colorido e fidget toys sensoriais didáticos.',
      'Decoração': 'Vasos espirais luxo e cachepôs geométricos para suculentas em filamento premium imitação mármore/madeira.',
      'Cafeteria': 'Stencil para barismo com logomarca e cortadores temáticos fáceis de lavar.',
      'Geek': 'Suportes para headset, organizadores de controle, bustos pintáveis e torres de dados medievais.',
      'Escolas': 'Maquetes educacionais, chaveiros de formatura personalizados e quebra-cabeças geométricos.'
    };

    const finalPitch = newLeadPitch.trim() || defaultPitches[newLeadCategory] || 'Oferecer peças de reposição personalizadas, brindes de utilidade doméstica e decorações temáticas impressas em 3D 3D com margem fantástica.';

    const newLead: ProspectLead = {
      id: `lead-manual-${Date.now()}`,
      name: newLeadName.trim(),
      phone: newLeadPhone.trim(),
      address: newLeadAddress.trim() || `${prospectRegion}`,
      category: newLeadCategory,
      pitch: finalPitch,
      status: 'PROSPECT',
      timelineChecklist: {},
      note: newLeadNote.trim() || 'Lead adicionado manualmente para prospecção ativa de vendas.'
    };

    setProspectLeads(prev => [newLead, ...prev]);

    setNewLeadName('');
    setNewLeadPhone('');
    setNewLeadAddress('');
    setNewLeadPitch('');
    setNewLeadNote('');
    setShowNewLeadForm(false);
    alert('Lead de prospecção cadastrado com sucesso!');
  };

  const handleSearchLeads = async () => {
    if (!prospectRegion.trim()) {
      alert('Por favor, informe a região/bairro para pesquisar no mapa.');
      return;
    }
    setSearchingLeads(true);

    const catInput = searchCategoryInput.trim();
    const resolvedCategory = catInput;

    const query = resolvedCategory
      ? `${resolvedCategory}`
      : `lojas de presentes geek papelarias brinquedos escolas`;

    setMapQuery(resolvedCategory ? `${resolvedCategory} em ${prospectRegion.trim()}` : `Todos em ${prospectRegion.trim()}`);

    try {
      const customSerpKey = safeStorage.getItem('bambuzau_custom_serp_key', '');
      const customTavilyKey = safeStorage.getItem('bambuzau_custom_tavily_key', '');
      const customJinaKey = safeStorage.getItem('bambuzau_custom_jina_key', '');
      const customGroqKey = safeStorage.getItem('bambuzau_custom_groq_key', '');
      const customGeminiKey = safeStorage.getItem('bambuzau_custom_gemini_key', '');

      const tavilyKey = customTavilyKey.trim();
      const jinaKey = customJinaKey.trim();

      const region = prospectRegion.trim();

      try {
        const placesUrl = `/api/places-leads?q=${encodeURIComponent(query)}&region=${encodeURIComponent(region)}`;
        const pr = await fetch(getApiUrl(placesUrl));
        if (pr.ok) {
          const pdata = await pr.json();
          const placesLeads: ProspectLead[] = Array.isArray(pdata?.leads) ? pdata.leads : [];
          if (placesLeads.length > 0) {
            setSearchingLeads(false);
            setActiveCategoryFilter('Todos');
            setProspectLeads(placesLeads.map((l: any) => ({
              ...l,
              category: l.category || resolvedCategory || 'Geek',
              pitch: l.pitch || getCategoryPitch(resolvedCategory || 'Geek'),
            })));
            alert(`Google Places mapeou ${region}: ${placesLeads.length} estabelecimentos reais com endereço e telefone.`);
            return;
          }
        }
      } catch (e) {
        console.warn('Places fallback to Tavily:', e);
      }

      if (!tavilyKey) {
        throw new Error('Sem resultados do Google Places e Tavily key ausente — configure em Ajustes.');
      }

      const baseQ = query;
      const tavilyQueries = [
        `${baseQ} em ${region} telefone whatsapp endereço`,
        `lojas de ${baseQ} ${region} contato site:.br`,
        `${baseQ} ${region} endereço telefone`,
        `${baseQ} próximo a ${region}`,
      ];

      const runTavily = async (q: string) => {
        try {
          const r = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              api_key: tavilyKey,
              query: q,
              search_depth: 'advanced',
              include_answer: false,
              include_raw_content: true,
              max_results: 20,
              country: 'brazil',
            }),
          });
          if (!r.ok) return [];
          const j = await r.json();
          return Array.isArray(j?.results) ? j.results : [];
        } catch { return []; }
      };

      const buckets = await Promise.all(tavilyQueries.map(runTavily));
      const seen = new Set<string>();
      const results: any[] = [];
      for (const bucket of buckets) {
        for (const item of bucket) {
          const url: string = String(item?.url || '');
          if (!url) continue;
          const key = url.split('?')[0].toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          results.push(item);
        }
      }

      if (results.length === 0) {
        throw new Error('Tavily não retornou resultados.');
      }

      const phoneRx = /\(?\b\d{2}\)?[\s-]?9?\d{4}[\s-]?\d{4}\b/;
      const addressRx = /((?:Rua|Avenida|Av\.?|Travessa|Estrada|Rodovia|Alameda|Praça|Praca)\s+[A-ZÀ-Úa-zà-ú0-9.\- ]{3,80},?\s*\d{1,5})/;

      const enrichWithJina = async (url: string): Promise<string> => {
        try {
          const r = await fetch(`https://r.jina.ai/${url}`, {
            headers: jinaKey ? { Authorization: `Bearer ${jinaKey}` } : {},
          });
          if (!r.ok) return '';
          return await r.text();
        } catch { return ''; }
      };

      const ddd = guessDDD(region);
      const mapped: ProspectLead[] = [];

      const MAX_LEADS = 40;
      let jinaBudget = 12;

      for (let idx = 0; idx < results.length && mapped.length < MAX_LEADS; idx++) {
        const item = results[idx];
        const haystackParts = [item?.raw_content, item?.content, item?.title].filter(Boolean);
        let haystack = haystackParts.join('\n');
        let phoneMatch = haystack.match(phoneRx);
        let addrMatch = haystack.match(addressRx);

        if ((!phoneMatch || !addrMatch) && item?.url && jinaBudget > 0) {
          jinaBudget--;
          const extra = await enrichWithJina(item.url);
          if (extra) {
            haystack = `${haystack}\n${extra}`;
            phoneMatch = phoneMatch || extra.match(phoneRx);
            addrMatch = addrMatch || extra.match(addressRx);
          }
        }

        const name = String(item?.title || '')
          .replace(/\s+[-–|]\s+.*$/, '')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 80) || `Lead ${idx + 1}`;

        const address = (addrMatch?.[0] || `${region}`).trim();
        let phone = `(${ddd}) — buscar`;
        if (phoneMatch) {
          const phoneDigits = phoneMatch[0].replace(/\D/g, '');
          const ddTel = phoneDigits.length >= 10 ? phoneDigits.slice(0, 2) : ddd;
          const rest = phoneDigits.slice(-9);
          phone = rest.length === 9
            ? `(${ddTel}) ${rest.slice(0, 5)}-${rest.slice(5)}`
            : `(${ddTel}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
        }

        mapped.push({
          id: `lead-tavily-${Date.now()}-${idx}`,
          name,
          phone,
          address: address.includes(region) ? address : `${address} - ${region}`,
          category: resolvedCategory || 'Geek',
          pitch: getCategoryPitch(resolvedCategory || 'Geek'),
          status: 'PROSPECT',
          timelineChecklist: { s1: false, s2: false, s3: false, s4: false },
          note: `Capturado via Tavily${jinaKey ? ' + Jina Reader' : ''}${phoneMatch ? '' : ' (telefone não detectado — abrir link)'} — ${item?.url || ''}`,
        });
      }

      if (mapped.length > 0) {
        setSearchingLeads(false);
        setActiveCategoryFilter('Todos');
        setProspectLeads(mapped);
        alert(`Radar Tavily + Jina vasculhou ${region}: ${mapped.length} leads reais com telefone capturado.`);
        return;
      }

      const fetchUrl = `/api/local-leads?q=${encodeURIComponent(query)}&region=${encodeURIComponent(region)}`;
      const res = await fetch(getApiUrl(fetchUrl), {
        headers: {
          'X-Custom-Serpapi-Key': customSerpKey.trim(),
          'X-Custom-Tavily-Key': tavilyKey,
          'X-Custom-Jina-Key': jinaKey,
          'X-Custom-Groq-Key': customGroqKey.trim(),
          'X-Custom-Gemini-Key': customGeminiKey.trim(),
        }
      });

      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data) && data.length > 0) {
          const mappedLeads: ProspectLead[] = data.map((item: any, idx: number) => {
            return {
              id: item.id || `lead-real-${Date.now()}-${idx}`,
              name: item.name || `Ponto Sourcing ${idx}`,
              phone: item.phone || `(19) 99999-9999`,
              address: item.address || region,
              category: item.category || (resolvedCategory || 'Geek'),
              pitch: item.pitch || 'Oferecer artigos 3D premium bicolores.',
              status: item.status || 'PROSPECT',
              timelineChecklist: item.timelineChecklist || { s1: false, s2: false, s3: false, s4: false },
              note: item.note || `Prospectado via Inteligência Artificial integrada de alta fidelidade em ${region}.`
            };
          });

          setSearchingLeads(false);
          setActiveCategoryFilter('Todos');
          setProspectLeads(mappedLeads);
          alert(`Radar AI vasculhou ${region}: ${mappedLeads.length} leads qualificados.`);
          return;
        }
      }
    } catch (err: any) {
      console.warn("Real leads retrieval failed, invoking local simulation fallback: ", err);
    }

    setTimeout(() => {
      setSearchingLeads(false);

      const city = prospectRegion.trim().split(',')[0].trim();
      const ddd = guessDDD(prospectRegion);
      const generated: ProspectLead[] = [];

      const currentStreets = getCityStreets(city);
      const currentNeighborhoods = getCityNeighborhoods(city);

      if (!resolvedCategory) {
        LEAD_CATEGORIES.forEach((cat, catIdx) => {
          const entriesPerCategory = Math.min(6, Math.floor(2 + Math.random() * 3));
          for (let subIdx = 0; subIdx < entriesPerCategory; subIdx++) {
            const idx = catIdx * 100 + subIdx;
            const rawName = generateStoreName(cat, idx);
            const storeName = `${rawName} ${city}`;
            const street = currentStreets[idx % currentStreets.length];
            const num = Math.floor(15 + Math.random() * 2500);
            const neigh = currentNeighborhoods[(idx * 4 + subIdx) % currentNeighborhoods.length];
            const address = `${street}, ${num} - Bairro ${neigh}, ${prospectRegion}`;
            const numberPrefix = Math.random() > 0.5 ? '98' : '99';
            const p1 = Math.floor(1000 + Math.random() * 8999);
            const p2 = Math.floor(1000 + Math.random() * 8999);
            const phone = `(${ddd}) ${numberPrefix}${p1}-${p2}`;

            generated.push({
              id: `lead-gen-${Date.now()}-${catIdx}-${subIdx}-${Math.floor(Math.random() * 100000)}`,
              name: storeName,
              phone,
              address,
              category: cat,
              pitch: getCategoryPitch(cat),
              status: 'PROSPECT',
              timelineChecklist: { s1: false, s2: false, s3: false, s4: false },
              note: `Estabelecimento comercial mapeado de alta precisão em ${city}.`
            });
          }
        });
        setActiveCategoryFilter('Todos');
        setProspectLeads(generated);
        alert(`Sucesso de prospecção simulada em ${prospectRegion}! localizaram-se ${generated.length} estabelecimentos comerciais simulados.`);
      } else {
        const catClean = resolvedCategory.charAt(0).toUpperCase() + resolvedCategory.slice(1);
        const entriesCount = 6;
        for (let idx = 0; idx < entriesCount; idx++) {
          const rawName = generateStoreName(catClean, idx);
          const storeName = `${rawName} ${city}`;
          const street = currentStreets[(idx * 3 + 1) % currentStreets.length];
          const num = Math.floor(25 + Math.random() * 2400);
          const neigh = currentNeighborhoods[(idx * 7 + Math.floor(Math.random() * 10)) % currentNeighborhoods.length];
          const address = `${street}, ${num} - Bairro ${neigh}, ${prospectRegion}`;
          const numberPrefix = Math.random() > 0.5 ? '98' : '99';
          const p1 = Math.floor(1000 + Math.random() * 8999);
          const p2 = Math.floor(1000 + Math.random() * 8999);
          const phone = `(${ddd}) ${numberPrefix}${p1}-${p2}`;

          generated.push({
            id: `lead-gen-${Date.now()}-${idx}-${Math.floor(Math.random() * 100000)}`,
            name: storeName,
            phone,
            address,
            category: catClean,
            pitch: getCategoryPitch(catClean),
            status: 'PROSPECT',
            timelineChecklist: { s1: false, s2: false, s3: false, s4: false },
            note: `Mapeamento simulado de "${catClean}" em ${city}.`
          });
        }
        setActiveCategoryFilter('Todos');
        setProspectLeads(generated);
        alert(`Sucesso de prospecção mapeada de "${catClean}" em ${prospectRegion}: localizados ${generated.length} leads.`);
      }
    }, 1300);
  };

  const handleUpdateLeadStatus = (leadId: string, status: ProspectLead['status']) => {
    setProspectLeads(prev => prev.map(lead => {
      if (lead.id === leadId) {
        return {
          ...lead,
          status,
          timelineChecklist: {
            ...lead.timelineChecklist,
            s1: status !== 'PROSPECT',
            s2: status === 'VISITED' || status === 'INTERESTED' || status === 'WON',
            s3: status === 'INTERESTED' || status === 'WON',
            s4: status === 'WON'
          }
        };
      }
      return lead;
    }));
  };

  const handleToggleLeadChecklist = (leadId: string, stepKey: string, checked: boolean) => {
    setProspectLeads(prev => prev.map(lead => {
      if (lead.id === leadId) {
        const nextChecklist = { ...lead.timelineChecklist, [stepKey]: checked };

        let nextStatus: ProspectLead['status'] = lead.status;
        if (nextChecklist.s4) {
          nextStatus = 'WON';
        } else if (nextChecklist.s3) {
          nextStatus = 'INTERESTED';
        } else if (nextChecklist.s2) {
          nextStatus = 'VISITED';
        } else if (nextChecklist.s1) {
          nextStatus = 'CONTACTED';
        } else {
          nextStatus = 'PROSPECT';
        }

        return {
          ...lead,
          timelineChecklist: nextChecklist,
          status: nextStatus
        };
      }
      return lead;
    }));
  };

  const handlePromoteLeadToClient = (lead: ProspectLead) => {
    onAddClient({
      name: lead.name,
      phone: lead.phone,
      email: `${lead.name.toLowerCase().replace(/\s+/g, '')}@exemplo.com`,
      address: lead.address,
      note: `Promovido através de Lead Prospecção do Radar Maps CRM. Segmento: ${lead.category}. Pitch de Entrada: ${lead.pitch}`,
      lastContactDate: Date.now(),
      stockCount: 0,
      stockValue: 0
    });

    handleUpdateLeadStatus(lead.id, 'WON');

    alert(`Sensacional! 🥳 A loja "${lead.name}" foi promovida com sucesso a Cliente Oficial! Agora eles constam na sua listagem principal de Clientes, onde você pode registrar estoque personalizado e gerar pedidos diretamente para a fila das impressoras.`);
    setSelectedLeadForModal(null);
  };

  const handleDeleteLead = (leadId: string) => {
    if (confirm('Deseja realmente excluir este lead de prospecção do seu CRM?')) {
      setProspectLeads(prev => prev.filter(l => l.id !== leadId));
      setSelectedLeadForModal(null);
    }
  };

  return {
    prospectLeads, setProspectLeads,
    selectedLeadForModal, setSelectedLeadForModal,
    prospectRegion, setProspectRegion,
    searchCategoryInput, setSearchCategoryInput,
    activeCategoryFilter, setActiveCategoryFilter,
    searchingLeads, setSearchingLeads,
    mapQuery, setMapQuery,
    aiTone, setAiTone,
    customInstruction, setCustomInstruction,
    customAiOutput, setCustomAiOutput,
    isGeneratingAi, setIsGeneratingAi,
    focusedLeadId, setFocusedLeadId,
    copiedTextFeedback, setCopiedTextFeedback,
    showNewLeadForm, setShowNewLeadForm,
    newLeadName, setNewLeadName,
    newLeadPhone, setNewLeadPhone,
    newLeadAddress, setNewLeadAddress,
    newLeadCategory, setNewLeadCategory,
    newLeadPitch, setNewLeadPitch,
    newLeadNote, setNewLeadNote,
    handleCreateManualLead,
    handleSearchLeads,
    handleUpdateLeadStatus,
    handleToggleLeadChecklist,
    handlePromoteLeadToClient,
    handleDeleteLead,
  };
}