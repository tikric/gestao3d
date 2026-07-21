export type CalibrationProfile = {
  printerId: string;
  esteps?: number;
  flow?: number;
  hotendPID?: { Kp: number; Ki: number; Kd: number; temp: number };
  bedPID?: { Kp: number; Ki: number; Kd: number; temp: number };
  retraction?: { distance: number; speed: number };
  bestTemps?: Record<string, number>; // filament -> temp
  skipped: string[]; // step IDs marked "não se aplica"
  notes: Record<string, string>; // stepId -> notes
  updatedAt: number;
};

export type CalibrationRun = {
  id: string;
  printerId: string;
  printerName: string;
  completedSteps: string[];
  changes: Record<string, any>;
  at: number;
};

const PROF_KEY = "calibration-profiles-v1";
const RUN_KEY = "calibration-runs-v1";
const PROGRESS_KEY = "calibration-progress-v1";

const safe = () => typeof window !== "undefined";

export function loadProfiles(): Record<string, CalibrationProfile> {
  if (!safe()) return {};
  try {
    return JSON.parse(localStorage.getItem(PROF_KEY) || "{}");
  } catch {
    return {};
  }
}

export function getProfile(printerId: string): CalibrationProfile {
  const all = loadProfiles();
  return all[printerId] ?? { printerId, skipped: [], notes: {}, updatedAt: Date.now() };
}

export function saveProfile(p: CalibrationProfile) {
  if (!safe()) return;
  const all = loadProfiles();
  all[p.printerId] = { ...p, updatedAt: Date.now() };
  localStorage.setItem(PROF_KEY, JSON.stringify(all));
}

export function listRuns(): CalibrationRun[] {
  if (!safe()) return [];
  try {
    return JSON.parse(localStorage.getItem(RUN_KEY) || "[]");
  } catch {
    return [];
  }
}

export function pushRun(r: CalibrationRun) {
  if (!safe()) return;
  const all = listRuns();
  all.unshift(r);
  localStorage.setItem(RUN_KEY, JSON.stringify(all.slice(0, 100)));
}

export function loadProgress(printerId: string): Record<string, boolean> {
  if (!safe()) return {};
  try {
    const all = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
    return all[printerId] || {};
  } catch {
    return {};
  }
}

export function saveProgress(printerId: string, progress: Record<string, boolean>) {
  if (!safe()) return;
  try {
    const all = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
    all[printerId] = progress;
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
  } catch {}
}
