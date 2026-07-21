// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { Camera, Video, Lightbulb, Zap, AlertTriangle, Eye, RefreshCw, X, Play, Pause, Settings, HelpCircle, Download, Check } from 'lucide-react';
import { Printer } from '../types';

const getPrinterLogo = (model: string = '', customUrl?: string) => {
  if (customUrl && customUrl.trim()) return customUrl.trim();
  const m = model.toLowerCase();
  if (m.includes('bambu') || m.includes('p1') || m.includes('x1') || m.includes('a1'))
    return 'https://images.unsplash.com/photo-1701073837941-f76a5bf98505?auto=format&fit=crop&w=200&q=80';
  if (m.includes('k1') || m.includes('creality') || m.includes('ender') || m.includes('v3') || m.includes('sermoon'))
    return 'https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?auto=format&fit=crop&w=200&q=80';
  if (m.includes('prusa') || m.includes('mk3') || m.includes('mk4') || m.includes('mini'))
    return 'https://images.unsplash.com/photo-1544993130-9df2492f2549?auto=format&fit=crop&w=200&q=80';
  if (m.includes('resina') || m.includes('resin') || m.includes('sla') || m.includes('elegoo') || m.includes('photon') || m.includes('halot'))
    return 'https://images.unsplash.com/photo-1614853316476-de00d14cb1fc?auto=format&fit=crop&w=200&q=80';
  if (m.includes('artillery') || m.includes('genius') || m.includes('sidewinder'))
    return 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=200&q=80';
  return 'https://images.unsplash.com/photo-1563206767-5b18f218e8de?auto=format&fit=crop&w=200&q=80';
};

interface PrinterCameraModalProps {
  printer: Printer;
  onClose: () => void;
  onUpdatePrinter: (id: number, updated: Partial<Printer>) => void;
}

export const PrinterCameraModal: React.FC<PrinterCameraModalProps> = ({
  printer,
  onClose,
  onUpdatePrinter
}) => {
  const [useRealCamera, setUseRealCamera] = useState(!!printer.cameraUrl);
  const [cameraUrl, setCameraUrl] = useState(printer.cameraUrl || '');
  const [isEditingIp, setIsEditingIp] = useState(false);
  const [lightOn, setLightOn] = useState(printer.lightOn ?? true);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [showSpaghettiFail, setShowSpaghettiFail] = useState(false);
  const [snapshotTaken, setSnapshotTaken] = useState(false);
  const [timestamp, setTimestamp] = useState(new Date().toLocaleTimeString());

  // Live telemetry mock fluctuation states
  const [nozzleTemp, setNozzleTemp] = useState(printer.nozzleTemp || 220);
  const [bedTemp, setBedTemp] = useState(printer.bedTemp || 60);
  const [fanSpeed, setFanSpeed] = useState(100);

  // Simulation animation states
  const [drawProgress, setDrawProgress] = useState(printer.printProgress || 45);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Update clock/telemetry fluctuation
  useEffect(() => {
    const timer = setInterval(() => {
      setTimestamp(new Date().toLocaleTimeString());
      if (printer.status === 'PRINTING') {
        setNozzleTemp(prev => {
          const delta = (Math.random() - 0.5) * 1.2;
          const target = printer.nozzleTemp || 220;
          const val = prev + delta;
          return Math.abs(val - target) > 4 ? target : parseFloat(val.toFixed(1));
        });
        setBedTemp(prev => {
          const delta = (Math.random() - 0.5) * 0.4;
          const target = printer.bedTemp || 60;
          const val = prev + delta;
          return Math.abs(val - target) > 2 ? target : parseFloat(val.toFixed(1));
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [printer]);

  // Canvas-based real-time 3D print progress visualizer!
  // It simulates a print nozzle moving in paths on a grid drawing a 3D flower vase or cube layer-by-layer!
  useEffect(() => {
    let animId: number;
    let angle = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      
      // Background Grid or Bed
      const gridSpacing = 20;
      ctx.strokeStyle = '#1e2522';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < width; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Check current model printing to define drawing shapes
      const isBambu = printer.model.toLowerCase().includes('bambu');
      
      // Base center
      const cx = width / 2;
      const cy = height / 2 + 30;
      const maxRadius = 55;

      // Draw printer chamber lights background
      if (lightOn) {
        // Bright gradient representing chambers light LEDs at top
        const chamberLight = ctx.createLinearGradient(0, 0, 0, 100);
        chamberLight.addColorStop(0, 'rgba(254, 240, 138, 0.12)');
        chamberLight.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = chamberLight;
        ctx.fillRect(0, 0, width, height);
      } else {
        // Night vision greenish overlay
        ctx.fillStyle = 'rgba(16, 185, 129, 0.05)';
        ctx.fillRect(0, 0, width, height);
      }

      if (printer.status === 'PRINTING') {
        const progressFrac = drawProgress / 100;
        const currentHeight = progressFrac * 90;

        // Draw already printed part of the model (Vase low poly style)
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let yOffset = 0; yOffset < currentHeight; yOffset += 3) {
          const ratio = yOffset / 90;
          // Vase curve shape
          const radius = maxRadius * (1.1 - 0.4 * Math.sin(ratio * Math.PI));
          const numSlices = 10;
          
          ctx.strokeStyle = showSpaghettiFail 
            ? 'rgba(239, 68, 68, 0.7)' 
            : `rgba(245, 158, 11, ${0.4 + 0.6 * (yOffset / currentHeight)})`; // Silk gold color

          for (let i = 0; i <= numSlices; i++) {
            const rot = (i / numSlices) * Math.PI * 2 + (yOffset * 0.05);
            const px = cx + Math.cos(rot) * radius;
            const py = cy - yOffset - (Math.sin(rot) * 5); // isometric look
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
        }
        ctx.stroke();

        if (showSpaghettiFail) {
          // Simulate messy strings (Spaghetti failure mode!)
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          const failCy = cy - currentHeight;
          for (let s = 0; s < 50; s++) {
            const rx = cx + (Math.sin(s * 8.5) * 70) + (Math.cos(angle + s) * 15);
            const ry = failCy - 20 + (Math.cos(s * 7.5) * 30) + (Math.sin(angle * 1.5 + s) * 10);
            if (s === 0) ctx.moveTo(rx, ry);
            else ctx.bezierCurveTo(rx - 10, ry, rx + 10, ry, rx, ry);
          }
          ctx.stroke();
          
          // AI diagnostic text in canvas
          if (aiEnabled) {
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 9px monospace';
            ctx.fillText('WARNING: ADHESION_FAILURE DETECTED', 15, height - 35);
          }
        }

        // Active nozzle extruder tool position moving in circles
        angle += 0.08;
        const currentRadius = maxRadius * (1.1 - 0.4 * Math.sin((currentHeight / 90) * Math.PI));
        const nozzleX = cx + Math.cos(angle) * currentRadius;
        const nozzleY = cy - currentHeight - (Math.sin(angle) * 5);

        // Draw hot extruder head nozzle shadow
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(nozzleX, 0);
        ctx.lineTo(nozzleX, nozzleY - 10);
        ctx.stroke();

        // Extruder body (isometric metallic block & brass tip)
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.moveTo(nozzleX - 12, nozzleY - 30);
        ctx.lineTo(nozzleX + 12, nozzleY - 30);
        ctx.lineTo(nozzleX + 10, nozzleY - 12);
        ctx.lineTo(nozzleX - 10, nozzleY - 12);
        ctx.closePath();
        ctx.fill();

        // Brass heater block
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.moveTo(nozzleX - 6, nozzleY - 12);
        ctx.lineTo(nozzleX + 6, nozzleY - 12);
        ctx.lineTo(nozzleX + 4, nozzleY - 4);
        ctx.lineTo(nozzleX - 4, nozzleY - 4);
        ctx.closePath();
        ctx.fill();

        // Nozzle tip (brass nozzle point)
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(nozzleX - 2.5, nozzleY - 4);
        ctx.lineTo(nozzleX + 2.5, nozzleY - 4);
        ctx.lineTo(nozzleX, nozzleY);
        ctx.closePath();
        ctx.fill();

        // Glowing red heater cartridge bulb
        ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
        ctx.beginPath();
        ctx.arc(nozzleX, nozzleY - 9, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Extruding filament string from nozzle tip
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(nozzleX, nozzleY);
        ctx.lineTo(nozzleX + Math.cos(angle + 0.3) * 3, nozzleY + 2);
        ctx.stroke();

        // Add visual glowing aura to extruder block
        if (lightOn) {
          const aura = ctx.createRadialGradient(nozzleX, nozzleY, 1, nozzleX, nozzleY, 12);
          aura.addColorStop(0, 'rgba(245, 158, 11, 0.35)');
          aura.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = aura;
          ctx.beginPath();
          ctx.arc(nozzleX, nozzleY, 12, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // IDLE or MAINTENANCE state
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          printer.status === 'MAINTENANCE' 
            ? '⚙️ MÁQUINA EM MANUTENÇÃO FÍSICA' 
            : '🔌 EXTRUSORA ONLINE AGUARDANDO ENVIO', 
          width / 2, 
          height / 2
        );
      }

      // Camera interface features
      if (aiEnabled) {
        // Red AI framing rectangle/grids
        ctx.strokeStyle = showSpaghettiFail ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(40, 40, width - 80, height - 80);

        // Bounding box overlay for hotend detection
        if (printer.status === 'PRINTING') {
          const progressFrac = drawProgress / 100;
          const currentHeight = progressFrac * 90;
          const nozzleX = cx + Math.cos(angle) * (maxRadius * (1.1 - 0.4 * Math.sin((currentHeight / 90) * Math.PI)));
          const nozzleY = cy - currentHeight - (Math.sin(angle) * 5);

          ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)';
          ctx.strokeRect(nozzleX - 16, nozzleY - 32, 32, 36);
          ctx.fillStyle = 'rgba(59, 130, 246, 0.9)';
          ctx.font = '9px monospace';
          ctx.fillText('HOTEND', nozzleX - 15, nozzleY - 35);
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [printer, lightOn, drawProgress, showSpaghettiFail, aiEnabled]);

  const handleSaveIp = () => {
    onUpdatePrinter(printer.id, { cameraUrl: cameraUrl.trim() });
    setUseRealCamera(!!cameraUrl.trim());
    setIsEditingIp(false);
  };

  const handleToggleLight = () => {
    const nextLight = !lightOn;
    setLightOn(nextLight);
    onUpdatePrinter(printer.id, { lightOn: nextLight });
  };

  const handleTakeSnapshot = () => {
    setSnapshotTaken(true);
    setTimeout(() => setSnapshotTaken(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4" id="printer-camera-modal-backdrop">
      <div 
        className="modal-panel w-full max-w-2xl overflow-hidden relative flex flex-col animate-in fade-in zoom-in-95 duration-200"
        style={showSpaghettiFail ? { borderColor: 'var(--cat-red)' } : undefined}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl overflow-hidden bg-[#0E1210] border border-white/10 shrink-0">
              <img
                src={getPrinterLogo(printer.model, printer.customUrl)}
                alt={printer.name}
                className="h-full w-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <div className="min-w-0">
              <div className="eyebrow mb-0.5">Monitoramento</div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2 truncate">
                {printer.name}
                <span className={`chip ${printer.status === 'PRINTING' ? 'chip-lime' : ''}`}>
                  {printer.status === 'PRINTING' ? 'LIVE' : printer.status === 'MAINTENANCE' ? 'Manut.' : 'Ociosa'}
                </span>
              </h3>
              <p className="text-[11px] text-[var(--brand-text-subtle)] font-mono mt-0.5">IP: {printer.ipAddress}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn-icon shrink-0" aria-label="Fechar">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Camera screen box */}
        <div className="aspect-video w-full bg-[#080B09] relative overflow-hidden flex items-center justify-center min-h-[300px]">
          {useRealCamera && cameraUrl ? (
            // REAL USER WEBCAM preview loading directly in browser
            <div className="relative w-full h-full flex items-center justify-center">
              <img 
                src={cameraUrl} 
                alt="Stream da Câmera Real da Impressora"
                className="w-full h-full object-contain"
                onError={(e) => {
                  console.error("Failed to fetch camera url. Showing info.");
                  setUseRealCamera(false);
                }}
                referrerPolicy="no-referrer"
              />
              {/* Overlay telemetry on real camera stream if printing */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-black/40" />
            </div>
          ) : (
            // SIMULATED webcam monitor using HTML Canvas with layers drawing
            <canvas 
              ref={canvasRef} 
              width={640} 
              height={360} 
              className="w-full h-full object-cover select-none cursor-crosshair"
            />
          )}

          {/* Video Scanning Grid effect decoration */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_45%,rgba(0,0,0,0.5)_95%)]" />
          <div className="absolute inset-0 pointer-events-none select-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,6px_100%]" />

          {/* OSD (On Screen Display OVERLAYS) */}
          <div className="absolute top-3 left-3 flex flex-col gap-1 text-[9px] font-mono text-white/90 bg-black/70 px-2 py-1.5 rounded-lg border border-white/10 select-none">
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${printer.status === 'PRINTING' ? 'bg-red-500 animate-ping' : 'bg-zinc-500'}`} />
              <span className="font-bold">{printer.status === 'PRINTING' ? 'REC LIVE' : 'STBY'}</span>
            </div>
            <div>ISO 800 - F2.0</div>
            <div>1080P 30FPS</div>
            <div>{timestamp}</div>
          </div>

          <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
            {aiEnabled && (
              <span className={`p-1.5 px-2.5 text-[8.5px] uppercase font-bold rounded-lg border flex items-center gap-1.5 select-none ${
                showSpaghettiFail 
                  ? 'bg-red-950/90 text-red-400 border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.5)] animate-bounce' 
                  : 'bg-emerald-950/90 text-emerald-400 border-emerald-500/30'
              }`}>
                <Zap className="h-3 w-3" />
                Deteção Spaghetti IA: {showSpaghettiFail ? 'FALHA DE ADERÊNCIA ⚠️' : 'OK ✓'}
              </span>
            )}

            {/* Chamber light status indicator */}
            <span className="text-[8px] bg-black/85 text-zinc-300 border border-zinc-700/50 px-2 py-1 rounded">
              Luz Interna: {lightOn ? '💡 LIGADA' : '🌑 DESLIGADA'}
            </span>
          </div>

          {/* Bottom Diagnostics Overlay strip */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[9.5px] font-mono text-zinc-300 bg-black/85 p-2 px-3 rounded-xl border border-white/5 backdrop-blur-sm select-none">
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <div>BOCAL: <strong className={printer.status === 'PRINTING' ? 'text-amber-400 font-bold' : 'text-zinc-400'}>{printer.status === 'PRINTING' ? `${nozzleTemp}°C` : 'S/D'}</strong></div>
              <div>MESA: <strong className={printer.status === 'PRINTING' ? 'text-amber-400 font-bold' : 'text-zinc-400'}>{printer.status === 'PRINTING' ? `${bedTemp}°C` : 'S/D'}</strong></div>
              <div>VENTOINHA: <strong className="text-zinc-400">{printer.status === 'PRINTING' ? `${fanSpeed}%` : '0%'}</strong></div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[8.5px] text-zinc-400">PROG:</span>
              <span className="font-extrabold text-[#95BBA2] bg-[#95BBA2]/10 px-1.5 py-0.25 rounded text-[10px]">{printer.status === 'PRINTING' ? `${drawProgress}%` : 'OCIOSA'}</span>
            </div>
          </div>

          {/* Flash animation on take snapshot */}
          {snapshotTaken && (
            <div className="absolute inset-0 bg-white/90 z-20 flex items-center justify-center animate-fade-out">
              <div className="bg-black/95 text-emerald-400 border border-emerald-500/20 rounded-xl px-5 py-3 flex items-center gap-2 font-bold text-xs tracking-widest uppercase">
                <Check className="h-4 w-4 text-emerald-400 animate-scale-in" />
                Snapshot Salvo com Sucesso! ✓
              </div>
            </div>
          )}
        </div>

        {/* Settings & Configuration Controls panel */}
        <div className="p-5 bg-[#0C0F0D] border-t border-[#232B27]/60 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Control 1: LEDs chamber lights switch */}
            <button
              type="button"
              onClick={handleToggleLight}
              className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                lightOn 
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25' 
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800'
              }`}
            >
              <Lightbulb className="h-4 w-4" />
              Luz Câmara: {lightOn ? 'Desligar' : 'Ligar'}
            </button>

            {/* Control 2: Spaghetti Computer Vision AI Safety toggler */}
            <button
              type="button"
              onClick={() => setAiEnabled(!aiEnabled)}
              className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                aiEnabled 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800'
              }`}
            >
              <Eye className="h-4 w-4" />
              IA Antifalha: {aiEnabled ? 'Ativa' : 'Desligada'}
            </button>

            {/* Control 3: Take Snapshot Photo */}
            <button
              type="button"
              onClick={handleTakeSnapshot}
              className="py-2 px-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800/80 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              Tirar Foto HD
            </button>

            {/* Control 4: Simulate Spaghetti printing error button for testing warnings! */}
            {printer.status === 'PRINTING' && (
              <button
                type="button"
                onClick={() => setShowSpaghettiFail(!showSpaghettiFail)}
                className={`py-2 px-3 rounded-xl border text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
                  showSpaghettiFail 
                    ? 'bg-red-500 text-white border-red-650' 
                    : 'bg-zinc-950/80 border-red-500/10 hover:border-red-500/30 text-red-400'
                }`}
              >
                <AlertTriangle className="h-4 w-4" />
                Simular Falha!
              </button>
            )}
          </div>

          <div className="border-t border-[#232B27]/40 pt-4" id="camera-stream-address-setting">
            {isEditingIp ? (
              <div className="space-y-2.5">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-[#8BA58D] font-mono uppercase font-bold">Configurar URL Real da Câmera IP (MJPEG / RTSP Stream)</span>
                  <p className="text-[9.5px] text-zinc-500 font-sans">Mainsail/Octoprint/Klipper streams geralmente utilizam: <code>http://[IP_IMPRESSORA]/webcam/?action=stream</code> ou porta <code>:8080/stream</code></p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Cole seu endereço de stream..."
                    value={cameraUrl}
                    onChange={(e) => setCameraUrl(e.target.value)}
                    className="bg-[#151917] border border-[#232B27] rounded-xl px-3 py-2 text-xs text-white outline-none flex-1 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleSaveIp}
                    className="px-4 bg-gradient-to-r from-amber-600 to-amber-500 text-black text-xs font-extrabold rounded-xl hover:opacity-95 cursor-pointer"
                  >
                    Salvar Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingIp(false)}
                    className="px-3 bg-zinc-900 text-zinc-400 text-xs font-semibold rounded-xl"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-black/40 p-3 rounded-2xl border border-[#232B27]/40 select-none">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-[#8BA58D] font-mono tracking-wide uppercase font-bold">Conectar Câmera Real da Impressora 🎥</span>
                  <p className="text-[10px] text-zinc-400 font-sans">
                    {printer.cameraUrl 
                      ? `Registrada: ${printer.cameraUrl}` 
                      : 'Nenhuma webcam física configurada. Exibindo simulador dinâmico de fatiamento 3D.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingIp(true)}
                  className="px-3 py-1.5 bg-[var(--brand-primary)]/10 hover:bg-[var(--brand-primary)]/20 border border-[var(--brand-primary)]/20 text-[var(--brand-primary)] text-xs font-extrabold rounded-lg transition shrink-0 cursor-pointer"
                >
                  {printer.cameraUrl ? 'Editar Stream URL' : 'Configurar Webcam Real'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};