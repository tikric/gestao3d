import { useMemo } from "react";
import { readLocalCatalog } from "./utils";

/**
 * Aggregates all metrics consumed by the dashboard panel from raw domain data.
 * Pure (no side effects) — reads localStorage only via readLocalCatalog.
 */
export function usePanelData(orders: any[], printers: any[], expenses: any[], clients: any[]) {
  return useMemo(() => {
    const today = new Date();
    const isToday = (d: any) => {
      if (!d) return false;
      const dt = new Date(d);
      return (
        dt.getFullYear() === today.getFullYear() &&
        dt.getMonth() === today.getMonth() &&
        dt.getDate() === today.getDate()
      );
    };

    const ordersToday = orders.filter((o: any) => isToday(o.createdAt || o.deliveryDate));
    const revenueToday = ordersToday.reduce((s, o: any) => s + (o.priceCharged || 0), 0);
    const piecesToday = ordersToday.reduce((s, o: any) => s + (o.quantity || 1), 0);
    const hoursToday = ordersToday.reduce((s, o: any) => s + (o.printingTimeHours || 0), 0);
    const hoursLabel = `${Math.floor(hoursToday)}h ${Math.round((hoursToday % 1) * 60)}m`;

    const balcaoClientsCount = clients.filter((c: any) => {
      const stockItems = Array.isArray(c?.productsStock) ? c.productsStock : [];
      const totalQty = stockItems.reduce((s: number, p: any) => s + (Number(p?.qty) || 0), 0);
      return totalQty > 0 || Number(c?.stockCount) > 0;
    }).length;

    const activePrinters = printers.filter((p: any) => p.status === "PRINTING").length;
    const printersTotal = printers.length;

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
    const monthOrders = orders.filter(
      (o: any) => (o.createdAt || 0) >= monthStart && o.status !== "WAITING",
    );
    const monthRevenue = monthOrders.reduce((s, o: any) => s + (o.priceCharged || 0), 0);
    const monthExpenses = expenses
      .filter((e: any) => (e.date || 0) >= monthStart)
      .reduce((s, e: any) => s + (e.amount || 0) * (e.qty || 1), 0);
    const monthProfit = monthRevenue - monthExpenses;
    const monthMargin = monthRevenue > 0 ? (monthProfit / monthRevenue) * 100 : 0;

    // Image lookup by product name (catalog → client stock → orders)
    const catalog = readLocalCatalog();
    const imageByName: Record<string, string | undefined> = {};
    catalog.forEach((c: any) => {
      if (c?.name) imageByName[String(c.name).toUpperCase().trim()] = c.imageUrl;
    });
    clients.forEach((cli: any) => {
      (cli?.productsStock || []).forEach((p: any) => {
        const key = String(p?.name || "")
          .toUpperCase()
          .trim();
        if (key && !imageByName[key] && (p?.imageUrl || p?.image)) {
          imageByName[key] = p.imageUrl || p.image;
        }
      });
    });
    orders.forEach((o: any) => {
      const key = String(o?.itemName || "")
        .toUpperCase()
        .trim();
      if (key && !imageByName[key] && (o?.imageUrl || o?.image)) {
        imageByName[key] = o.imageUrl || o.image;
      }
    });

    // Top products this month vs previous month
    const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1).getTime();
    const salesThis: Record<string, number> = {};
    const salesPrev: Record<string, number> = {};
    orders.forEach((o: any) => {
      if (o.status === "WAITING") return;
      const ts = o.createdAt || 0;
      const k = o.itemName || "Peça Personalizada";
      const q = o.quantity || 1;
      if (ts >= monthStart) salesThis[k] = (salesThis[k] || 0) + q;
      else if (ts >= prevMonthStart) salesPrev[k] = (salesPrev[k] || 0) + q;
    });
    const topProducts = Object.entries(salesThis)
      .map(([name, sales]) => {
        const prev = salesPrev[name] || 0;
        const trend =
          prev === 0 ? (sales > 0 ? 100 : 0) : Math.round(((sales - prev) / prev) * 100);
        return { name, sales, trend, image: imageByName[name.toUpperCase().trim()] };
      })
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    // Revenue per weekday in current month
    const weekdayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const hourly = weekdayLabels.map((h) => ({ h, v: 0 }));
    monthOrders.forEach((o: any) => {
      const ts = o.createdAt || o.deliveryDate;
      if (!ts) return;
      const dow = new Date(ts).getDay();
      hourly[dow].v += o.priceCharged || 0;
    });

    return {
      ordersToday,
      revenueToday,
      piecesToday,
      hoursLabel,
      balcaoClientsCount,
      activePrinters,
      printersTotal,
      monthRevenue,
      monthExpenses,
      monthProfit,
      monthMargin,
      topProducts,
      hourly,
    };
  }, [orders, printers, expenses, clients]);
}
