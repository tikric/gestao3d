// @ts-nocheck
import { Client, Printer, PrintOrder, CatalogItem, FilamentStock, Expense, ShoppingItem, MaterialProfile, ExternalPlatformOrder } from '../types';

export const initialClients: Client[] = [];

export const initialPrinters: Printer[] = [];

export const initialOrders: PrintOrder[] = [];

export const initialCatalogItems: CatalogItem[] = [];

export const initialFilamentStock: FilamentStock[] = [];

export const initialExpenses: Expense[] = [];

export const initialShoppingItems: ShoppingItem[] = [];

export const initialMaterialProfiles: MaterialProfile[] = [
  { type: 'PLA', filamentPriceRoll: 120.0, printerPowerW: 350, electricityCostKwh: 0.85, laborCostHour: 15.0, miscCostPercent: 15.0, defaultProfitMarginPercent: 50.0 },
  { type: 'PETG', filamentPriceRoll: 140.0, printerPowerW: 350, electricityCostKwh: 0.85, laborCostHour: 15.0, miscCostPercent: 15.0, defaultProfitMarginPercent: 50.0 },
  { type: 'ABS', filamentPriceRoll: 130.0, printerPowerW: 380, electricityCostKwh: 0.85, laborCostHour: 15.0, miscCostPercent: 15.0, defaultProfitMarginPercent: 50.0 },
  { type: 'TPU', filamentPriceRoll: 160.0, printerPowerW: 320, electricityCostKwh: 0.85, laborCostHour: 15.0, miscCostPercent: 15.0, defaultProfitMarginPercent: 50.0 }
];

export const staticFilamentOffers = {
  PLA: [
    { storeName: 'Compre 3D', filamentName: 'Filamento PLA Econômico 1kg Nacional', price: 69.90, link: 'https://shopee.com.br', materialType: 'PLA', rating: 4.7 },
    { storeName: 'Shopee', filamentName: 'Filamento PLA Impressão 3D 1kg Premium', price: 72.50, link: 'https://shopee.com.br', materialType: 'PLA', rating: 4.6 },
    { storeName: 'Voolt3D', filamentName: 'Filamento PLA Premium 1kg - Original', price: 75.90, link: 'https://www.voolt3d.com.br', materialType: 'PLA', rating: 4.8 },
    { storeName: 'Mercado Livre', filamentName: 'Filamento PLA HT 1kg Alta Fluidez', price: 79.90, link: 'https://mercadolivre.com.br', materialType: 'PLA', rating: 4.9 },
    { storeName: 'Slim3D', filamentName: 'Filamento PLA Pro 1kg - Slim3D', price: 82.50, link: 'https://www.slim3d.com.br', materialType: 'PLA', rating: 4.7 }
  ],
  PETG: [
    { storeName: 'Shopee', filamentName: 'Filamento PETG Premium 1kg - 3D Prime', price: 73.90, link: 'https://shopee.com.br', materialType: 'PETG', rating: 4.6 },
    { storeName: 'Voolt3D', filamentName: 'Filamento PETG High Gloss 1kg - Voolt3D', price: 76.00, link: 'https://www.voolt3d.com.br', materialType: 'PETG', rating: 4.8 },
    { storeName: 'Mercado Livre', filamentName: 'Filamento PETG XT Resistente 1kg Master', price: 79.10, link: 'https://mercadolivre.com.br', materialType: 'PETG', rating: 4.7 },
    { storeName: '3D Lab', filamentName: 'Filamento PETG Profissional 1kg - 3D Lab', price: 82.50, link: 'https://www.3dlab.com.br', materialType: 'PETG', rating: 4.6 },
    { storeName: 'Slim3D', filamentName: 'Filamento PETG Pro 1kg Alta Precisão', price: 84.90, link: 'https://www.slim3d.com.br', materialType: 'PETG', rating: 4.7 }
  ],
  TPU: [
    { storeName: 'Compre 3D', filamentName: 'Filamento TPU Soft 1kg Promoção', price: 119.00, link: 'https://shopee.com.br', materialType: 'TPU', rating: 4.7 },
    { storeName: 'Clona3D', filamentName: 'Filamento TPU Flexível 1kg Premium', price: 125.00, link: 'https://www.clona3d.com.br', materialType: 'TPU', rating: 4.9 },
    { storeName: 'Mercado Livre', filamentName: 'Filamento TPU Flexível Importado 1kg', price: 129.50, link: 'https://mercadolivre.com.br', materialType: 'TPU', rating: 4.7 },
    { storeName: 'Voolt3D', filamentName: 'Filamento TPU Soft 1kg Flex - Voolt3D', price: 134.90, link: 'https://www.voolt3d.com.br', materialType: 'TPU', rating: 4.8 },
    { storeName: '3D Lab', filamentName: 'Filamento Flexível TPU Premium 1kg - 3D Lab', price: 139.00, link: 'https://www.3dlab.com.br', materialType: 'TPU', rating: 4.8 }
  ]
};

export const externalPlatformOrdersMock: Record<string, ExternalPlatformOrder[]> = {
  'Mercado Livre': [
    {
      id: 'ML-998127391',
      platform: 'MERCADO_LIVRE',
      itemName: 'Suporte de Parede Alexa [VASO01]',
      clientName: 'Bruno Menezes',
      clientPhone: '(11) 96123-4567',
      clientAddress: 'Av. Paulista, 1500 - São Paulo, SP',
      weightGrams: 65,
      printTimeHours: 2.0,
      priceCharged: 45.90,
      statusText: 'Pagamento Aprovado'
    },
    {
      id: 'ML-998127402',
      platform: 'MERCADO_LIVRE',
      itemName: 'Estatueta Yoda Star Wars 15cm [BATMAN30]',
      clientName: 'Carolina Toledo',
      clientPhone: '(19) 98822-1100',
      clientAddress: 'Rua das Flores, 88 - Campinas, SP',
      weightGrams: 210,
      printTimeHours: 7.5,
      priceCharged: 119.00,
      statusText: 'Pagamento Aprovado'
    }
  ],
  'Shopee': [
    {
      id: 'SHP-2026A8F9',
      platform: 'SHOPEE',
      itemName: 'Protetor Cabo Organizador [PS5CTRL]',
      clientName: 'Renato Oliveira',
      clientPhone: '(21) 97412-8899',
      clientAddress: 'Rua do Catete, 120 - Rio de Janeiro, RJ',
      weightGrams: 35,
      printTimeHours: 1.2,
      priceCharged: 25.00,
      statusText: 'Aguardando Envio'
    },
    {
      id: 'SHP-2026A9G0',
      platform: 'SHOPEE',
      itemName: 'Luminária de Mesa Nuvem LED [VASO01]',
      clientName: 'Juliana Fraga',
      clientPhone: '(31) 98111-2233',
      clientAddress: 'Av. do Contorno, 8000 - Belo Horizonte, MG',
      weightGrams: 320,
      printTimeHours: 12.0,
      priceCharged: 159.90,
      statusText: 'Aguardando Envio'
    }
  ],
  'Amazon': [
    {
      id: 'AMZ-91823712',
      platform: 'AMAZON',
      itemName: 'Engrenagem Redutora [HEAD02]',
      clientName: 'Fernanda Souza',
      clientPhone: '(11) 97722-3344',
      clientAddress: 'Alameda Lorena, 1200 - São Paulo, SP',
      weightGrams: 45,
      printTimeHours: 1.8,
      priceCharged: 35.50,
      statusText: 'Pronto para Envio'
    },
    {
      id: 'AMZ-91823815',
      platform: 'AMAZON',
      itemName: 'Vaso Espiral Decorativo Geométrico [VASO01]',
      clientName: 'Marcelo Alencar',
      clientPhone: '(21) 98822-4455',
      clientAddress: 'Av. Atlântica, 4500 - Rio de Janeiro, RJ',
      weightGrams: 180,
      printTimeHours: 6.0,
      priceCharged: 89.00,
      statusText: 'Pronto para Envio'
    }
  ],
  'Nuvemshop': [
    {
      id: 'NUV-4401',
      platform: 'NUVEMSHOP',
      itemName: 'Engrenagem Dupla Reposição Delrin (PETG) [HEAD02]',
      clientName: 'Eng. Rodolfo Castro',
      clientPhone: '(12) 99182-3746',
      clientAddress: 'Avenida Brasil, 32 - São José dos Campos, SP',
      weightGrams: 90,
      printTimeHours: 3.5,
      priceCharged: 80.00,
      statusText: 'Pago'
    }
  ],
  'TikTok Shop': [
    {
      id: 'TT-773199',
      platform: 'TIKTOK_SHOP',
      itemName: 'Suporte Articulado Polvo Flexível [VASO01]',
      clientName: 'Leticia Alencar (TikTok Creator)',
      clientPhone: '(11) 99341-2323',
      clientAddress: 'Rua Augusta, 120 - São Paulo, SP',
      weightGrams: 140,
      printTimeHours: 4.8,
      priceCharged: 69.90,
      statusText: 'Aguardando Liberação'
    },
    {
      id: 'TT-773250',
      platform: 'TIKTOK_SHOP',
      itemName: 'Vaso Auto-Irrigável Elegante [VASO01]',
      clientName: 'Cleber Pinheiro',
      clientPhone: '(31) 98123-5566',
      clientAddress: 'Av. Afonso Pena, 1500 - Belo Horizonte, MG',
      weightGrams: 280,
      printTimeHours: 8.5,
      priceCharged: 125.00,
      statusText: 'Aguardando Liberação'
    }
  ]
};