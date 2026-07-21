// @ts-nocheck

export class FirebaseSyncError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FirebaseSyncError';
  }
}

/**
 * Normalises a Firebase Realtime Database URL:
 * - rejects the web console URL (a common user mistake),
 * - prepends https:// when missing,
 * - ensures it ends with `/`.
 * Throws FirebaseSyncError with a user-facing message on invalid input.
 */
export function normalizeFirebaseUrl(rawUrl: string): string {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) {
    throw new FirebaseSyncError('Por favor, informe a URL do seu Firebase Realtime Database.');
  }
  if (trimmed.includes('console.firebase.google.com')) {
    throw new FirebaseSyncError(
      'Erro: Você informou o link do Painel Console do Firebase! Por favor, utilize a URL REST do seu Realtime Database (ex: https://sua-loja-default-rtdb.firebaseio.com).',
    );
  }
  let url = trimmed;
  if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
  if (!url.endsWith('/')) url += '/';
  return url;
}

export function requireWorkspaceCode(code: string): string {
  const trimmed = (code || '').trim();
  if (!trimmed) {
    throw new FirebaseSyncError('Por favor, informe o código do Workspace a ser utilizado.');
  }
  return trimmed;
}

function workspaceEndpoint(url: string, workspace: string): string {
  return `${normalizeFirebaseUrl(url)}workspaces/${requireWorkspaceCode(workspace)}.json`;
}

function readLocalCatalog(): any[] {
  try {
    const raw = localStorage.getItem('bambuzau_local_catalog_production');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('readLocalCatalog failed', e);
    return [];
  }
}

export interface SyncSlices {
  clients?: any[];
  printers?: any[];
  orders?: any[];
  filamentStocks?: any[];
  expenses?: any[];
  shoppingItems?: any[];
  brandConfig?: any;
  tuyaDevices?: any[];
}

export function buildSyncPayload(slices: SyncSlices) {
  return {
    updatedAt: Date.now(),
    clients: slices.clients || [],
    printers: slices.printers || [],
    orders: slices.orders || [],
    filamentStocks: slices.filamentStocks || [],
    expenses: slices.expenses || [],
    shoppingItems: slices.shoppingItems || [],
    catalogItems: readLocalCatalog(),
    brandConfig: slices.brandConfig,
    tuyaDevices: slices.tuyaDevices || [],
    // SECURITY: API keys (Gemini, Groq, SerpApi, Tavily, Jina) are intentionally
    // NOT synced to Firebase. The previous unauthenticated PUT/GET to the
    // Realtime Database exposed plaintext credentials to anyone who could guess
    // the workspace code. Keys now stay local-only.
  };
}

export interface SyncTarget {
  firebaseUrl: string;
  workspaceCode: string;
}

function persistSyncTarget(normalizedUrl: string, normalizedWorkspace: string) {
  try {
    localStorage.setItem('bambuzau_firebase_url', normalizedUrl);
    localStorage.setItem('bambuzau_workspace_code', normalizedWorkspace);
  } catch (e) {
    console.warn('persistSyncTarget failed', e);
  }
}

export function persistSyncTimestamp(): string {
  const nowStr = new Date().toLocaleString('pt-BR');
  try {
    localStorage.setItem('bambuzau_last_sync_time', nowStr);
  } catch (e) {
    console.warn('persistSyncTimestamp failed', e);
  }
  return nowStr;
}

/** Uploads the assembled payload to Firebase. Throws on failure. */
export async function uploadWorkspace(target: SyncTarget, slices: SyncSlices): Promise<string> {
  const url = normalizeFirebaseUrl(target.firebaseUrl);
  const workspace = requireWorkspaceCode(target.workspaceCode);
  const endpoint = `${url}workspaces/${workspace}.json`;
  const payload = buildSyncPayload(slices);

  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new FirebaseSyncError(`Servidor retornou HTTP ${response.status}`);
  }
  persistSyncTarget(url, workspace);
  return persistSyncTimestamp();
}

/**
 * Downloads the workspace payload and restores synced API keys + catalog into
 * localStorage. Returns the parsed payload (caller wires the rest into React
 * state via its existing `onImportAllData` callback).
 */
export async function downloadWorkspace(target: SyncTarget): Promise<{ data: any; syncedAt: string }> {
  const url = normalizeFirebaseUrl(target.firebaseUrl);
  const workspace = requireWorkspaceCode(target.workspaceCode);
  const endpoint = `${url}workspaces/${workspace}.json`;

  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new FirebaseSyncError(`Erro ao buscar dados na Nuvem: HTTP ${response.status}`);
  }
  const data = await response.json();
  if (!data || data === 'null') {
    throw new FirebaseSyncError(`A pasta de nuvem '${workspace}' está vazia ou ainda não possui registros.`);
  }

  persistSyncTarget(url, workspace);
  // SECURITY: Do NOT restore customKeys from Firebase. Legacy payloads may
  // still contain them; ignore so that compromised remote data cannot inject
  // attacker-controlled API keys into the local workspace.
  if (data.catalogItems) {
    try {
      localStorage.setItem('bambuzau_local_catalog_production', JSON.stringify(data.catalogItems));
    } catch (e) {
      console.warn('restore catalogItems failed', e);
    }
  }

  return { data, syncedAt: persistSyncTimestamp() };
}
