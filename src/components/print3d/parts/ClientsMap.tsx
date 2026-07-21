import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import { LIME } from "./constants";
import { digitsOnly, buildClientGeocodeQueries } from "./utils";
import { loadGeocodeCache, saveGeocodeCache, geocodeByCep, geocodeOne, Point } from "./geocode";

export function ClientsMap({ clients = [] }: { clients?: any[] }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [interactive, setInteractive] = useState(false);

  // Init Leaflet once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !ref.current || mapRef.current) return;
      const map = L.map(ref.current, {
        center: [-14.235, -51.9253],
        zoom: 4,
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
        boxZoom: false,
        keyboard: false,
      });
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png",
        { maxZoom: 19, subdomains: "abcd" },
      ).addTo(map);
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png",
        { maxZoom: 19, subdomains: "abcd", pane: "shadowPane" },
      ).addTo(map);
      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      setReady(true);
    })();
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Toggle interaction (zoom/drag) on demand
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const fns = [
      "dragging",
      "scrollWheelZoom",
      "doubleClickZoom",
      "touchZoom",
      "boxZoom",
      "keyboard",
    ] as const;
    fns.forEach((f) => {
      const handler = (map as any)[f];
      if (handler && typeof handler.enable === "function") {
        if (interactive) {
          handler.enable();
        } else {
          handler.disable();
        }
      }
    });
    setTimeout(() => map.invalidateSize(), 30);
  }, [interactive, ready]);

  // Geocode + render markers
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      const cache = loadGeocodeCache();
      const points: Array<Point & { name: string }> = [];
      const clientsToMap = clients.filter((c: any) => c?.address || c?.cep);
      // Geocode missing ones sequentially (public geocoders have low rate limits)
      for (const c of clientsToMap) {
        if (cancelled) return;
        const queries = buildClientGeocodeQueries(c);
        let point: Point | null = null;
        if (digitsOnly(c?.cep).length === 8) {
          const cepKey = `cep:${digitsOnly(c.cep)}`;
          if (!(cepKey in cache)) {
            cache[cepKey] = await geocodeByCep(c.cep);
            saveGeocodeCache(cache);
          }
          point = cache[cepKey];
        }
        for (const q of queries) {
          if (point) break;
          const key = `nom:${q}`;
          if (!(key in cache)) {
            cache[key] = await geocodeOne(q);
            saveGeocodeCache(cache);
            await new Promise((r) => setTimeout(r, 1100));
          }
          if (cache[key]) {
            point = cache[key];
            break;
          }
        }
        if (point) points.push({ ...point, name: c.name || "Cliente" });
      }
      if (cancelled) return;
      layerRef.current.clearLayers();
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:14px;height:14px;border-radius:9999px;background:${LIME};box-shadow:0 0 10px ${LIME}aa;border:2px solid #0a0d0c"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      points.forEach((p) => {
        L.marker([p.lat, p.lng], { icon }).bindTooltip(p.name).addTo(layerRef.current);
      });
      if (points.length === 1) {
        mapRef.current.setView([points[0].lat, points[0].lng], 14);
      } else if (points.length > 1) {
        const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
        mapRef.current.fitBounds(bounds.pad(0.25), { maxZoom: 13 });
      }
      setTimeout(() => mapRef.current?.invalidateSize(), 50);
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, clients]);

  return (
    <div className="relative h-full w-full min-h-[420px]">
      <div
        ref={ref}
        className="relative z-10 h-full w-full min-h-[420px] overflow-hidden"
        style={{ filter: "saturate(0.55) brightness(0.82) contrast(0.92) hue-rotate(-10deg)" }}
      />
      <button
        type="button"
        onClick={() => setInteractive((v) => !v)}
        className={`absolute top-3 right-3 z-[400] px-3 py-1.5 rounded-lg text-[11px] font-semibold border backdrop-blur-sm transition ${
          interactive
            ? "bg-[var(--brand-lime,#c6ff3a)] text-black border-transparent shadow-lg"
            : "bg-black/60 text-white border-white/15 hover:bg-black/80"
        }`}
      >
        {interactive ? "🔓 Mapa Liberado" : "🔒 Habilitar Zoom"}
      </button>
    </div>
  );
}
