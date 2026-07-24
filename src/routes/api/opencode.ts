import { createFileRoute } from "@tanstack/react-router";
import { assertInternalCaller } from "./_auth";

export interface OpenCodeCalculationRequest {
  weightGrams: number;
  printHours: number;
  filamentPriceKg?: number; // default R$ 110.00
  laborCost?: number; // default R$ 0.00
  marginPercent?: number; // default 100%
  printerWatts?: number; // default 200W
  electricityCostKwh?: number; // default R$ 0.95
  failureRiskPercent?: number; // default 10%
  depreciationPerHour?: number; // default R$ 1.50
}

export function calculate3DPrintCost(params: OpenCodeCalculationRequest) {
  const weight = Math.max(0, Number(params.weightGrams) || 0);
  const hours = Math.max(0, Number(params.printHours) || 0);
  const filamentPriceKg = Math.max(
    0,
    params.filamentPriceKg !== undefined ? Number(params.filamentPriceKg) : 110,
  );
  const laborCost = Math.max(0, params.laborCost !== undefined ? Number(params.laborCost) : 0);
  const marginPercent = Math.max(
    0,
    params.marginPercent !== undefined ? Number(params.marginPercent) : 100,
  );
  const printerWatts = Math.max(
    0,
    params.printerWatts !== undefined ? Number(params.printerWatts) : 200,
  );
  const kwhCost = Math.max(
    0,
    params.electricityCostKwh !== undefined ? Number(params.electricityCostKwh) : 0.95,
  );
  const failureRiskPercent = Math.max(
    0,
    params.failureRiskPercent !== undefined ? Number(params.failureRiskPercent) : 10,
  );
  const depreciationPerHour = Math.max(
    0,
    params.depreciationPerHour !== undefined ? Number(params.depreciationPerHour) : 1.5,
  );

  // Material cost
  const rawMaterialCost = (weight / 1000) * filamentPriceKg;
  const failureCost = rawMaterialCost * (failureRiskPercent / 100);
  const totalMaterialCost = rawMaterialCost + failureCost;

  // Electricity cost (Watts -> kW * hours * kwhCost)
  const electricityCost = (printerWatts / 1000) * hours * kwhCost;

  // Printer wear / depreciation
  const depreciationCost = hours * depreciationPerHour;

  // Direct production cost
  const directProductionCost = totalMaterialCost + electricityCost + depreciationCost + laborCost;

  // Final selling price with profit margin
  const profitAmount = directProductionCost * (marginPercent / 100);
  const suggestedSellingPrice = directProductionCost + profitAmount;

  return {
    input: {
      weightGrams: weight,
      printHours: hours,
      filamentPriceKg,
      laborCost,
      marginPercent,
      printerWatts,
      electricityCostKwh: kwhCost,
      failureRiskPercent,
      depreciationPerHour,
    },
    breakdown: {
      rawMaterialCost: Number(rawMaterialCost.toFixed(2)),
      failureCost: Number(failureCost.toFixed(2)),
      totalMaterialCost: Number(totalMaterialCost.toFixed(2)),
      electricityCost: Number(electricityCost.toFixed(2)),
      depreciationCost: Number(depreciationCost.toFixed(2)),
      laborCost: Number(laborCost.toFixed(2)),
      directProductionCost: Number(directProductionCost.toFixed(2)),
      profitAmount: Number(profitAmount.toFixed(2)),
      suggestedSellingPrice: Number(suggestedSellingPrice.toFixed(2)),
    },
  };
}

export const Route = createFileRoute("/api/opencode")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const blocked = assertInternalCaller(request);
        if (blocked) return blocked;

        const url = new URL(request.url);
        const action = url.searchParams.get("action") || "status";

        if (action === "calculate") {
          const weightGrams = Number(
            url.searchParams.get("weight") || url.searchParams.get("weightGrams") || 100,
          );
          const printHours = Number(
            url.searchParams.get("hours") || url.searchParams.get("printHours") || 4,
          );
          const filamentPriceKg = Number(url.searchParams.get("filament_price") || 110);
          const marginPercent = Number(url.searchParams.get("margin") || 100);

          const result = calculate3DPrintCost({
            weightGrams,
            printHours,
            filamentPriceKg,
            marginPercent,
          });

          return Response.json({
            success: true,
            service: "Gestão3D OpenCode API — Calculadora de Custos de Impressão 3D",
            data: result,
          });
        }

        if (action === "context" || action === "prompt") {
          return Response.json({
            success: true,
            system_prompt: `Você é uma IA assistente conectada à plataforma Gestão3D (PrintFlow 3D / Market3D).
Sua função é auxiliar o usuário na gestão de orçamentos, cálculo de custos de impressão 3D (peso do filamento em gramas, tempo em horas, custo de energia e depreciação), cotação de filamentos (PLA, PETG, TPU, ABS, SILK), prospecção de clientes B2B e análise do mercado 3D brasileiro.

Métricas de referência da oficina:
- Filamento Padrão: R$ 110,00 / kg
- Custo de Energia Elétrica: R$ 0.95 / kWh (Potência média da impressora: 200W)
- Margem de Lucro Recomendada: 100% a 150%
- Depreciação por hora de máquina: R$ 1.50/h

Ao gerar orçamentos para clientes:
1. Sempre detalhe o custo de material + energia + depreciação + mão de obra.
2. Apresente o valor final sugerido de forma clara e profissional.
3. Sugira acabamentos e recomendações de fatiamento quando pertinente.`,
          });
        }

        // Default: status and capabilities documentation
        return Response.json({
          status: "online",
          version: "1.0.0",
          platform: "Gestão3D / PrintFlow 3D & Market3D",
          description:
            "API de Integração oficial para OpenCode e IAs Locais (Ollama, LM Studio, Cursor, Claude Code)",
          auth: {
            method: "Header x-api-key ou query param ?api_key=",
            status: "authenticated",
          },
          endpoints: [
            {
              path: "/api/opencode?action=calculate&weight=150&hours=5",
              method: "GET | POST",
              description:
                "Calcula o custo exato de produção e preço de venda sugerido para impressão 3D.",
            },
            {
              path: "/api/opencode?action=context",
              method: "GET",
              description: "Retorna o prompt de contexto do sistema para injetar na IA Local.",
            },
            {
              path: "/api/quotations?q=filamento+pla+1kg",
              method: "GET",
              description:
                "Pesquisa menor preço de filamentos e insumos de impressão 3D no Brasil (suporta SerpApi e Firecrawl AI).",
            },
            {
              path: "/api/opencode?action=firecrawl&q=filamento+pla+1kg",
              method: "GET | POST",
              description:
                "Extrai dados e preços de produtos reais em e-commerces via Firecrawl AI Web Scraper.",
            },
            {
              path: "/api/3d-trends?q=articulated",
              method: "GET",
              description: "Busca modelos 3D em alta no MakerWorld.",
            },
            {
              path: "/api/local-leads?query=clinica+odontologica&city=Sao+Paulo",
              method: "GET",
              description: "Pesquisa potenciais clientes B2B para serviços de impressão 3D.",
            },
          ],
        });
      },

      POST: async ({ request }) => {
        const blocked = assertInternalCaller(request);
        if (blocked) return blocked;

        try {
          const body = await request.json();
          const action = body.action || "calculate";

          if (action === "calculate") {
            const calculation = calculate3DPrintCost({
              weightGrams: body.weightGrams ?? body.weight ?? 0,
              printHours: body.printHours ?? body.hours ?? 0,
              filamentPriceKg: body.filamentPriceKg,
              laborCost: body.laborCost,
              marginPercent: body.marginPercent,
              printerWatts: body.printerWatts,
              electricityCostKwh: body.electricityCostKwh,
              failureRiskPercent: body.failureRiskPercent,
              depreciationPerHour: body.depreciationPerHour,
            });

            return Response.json({
              success: true,
              data: calculation,
            });
          }

          return Response.json(
            { error: "Ação não reconhecida. Use action: 'calculate'" },
            { status: 400 },
          );
        } catch (err: any) {
          return Response.json(
            {
              error: "Erro ao processar requisição JSON",
              details: String(err?.message || err),
            },
            { status: 400 },
          );
        }
      },
    },
  },
});
