import apiClient from './api-client';

type ServerType = 'local' | 'cloud' | 'offline';

let currentServer: ServerType = 'local';
let currentUrl: string = '';
let listeners: Array<(server: ServerType, url: string) => void> = [];

export function getCurrentServer(): ServerType {
  return currentServer;
}

export function getCurrentUrl(): string {
  return currentUrl;
}

export function onServerChange(cb: (server: ServerType, url: string) => void): () => void {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter(l => l !== cb);
  };
}

async function isHealthy(url: string, timeoutMs: number): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`${url}/api/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

const STORAGE_KEY = 'pino_server_preference';

export function getConfiguredUrls(storeId?: string): { local: string; cloud: string } {
  const cloudUrl = import.meta.env.VITE_API_URL || 'https://rhclaroni.com/api-dev';
  const localUrl = storeId
    ? `http://${storeId}.local:3035`
    : 'http://127.0.0.1:3035';
  return { local: localUrl, cloud: cloudUrl };
}

export async function selectEndpoint(storeId?: string): Promise<{ url: string; server: ServerType }> {
  const { local, cloud } = getConfiguredUrls(storeId);

  if (currentServer === 'offline') {
    return { url: currentUrl, server: 'offline' };
  }

  const localHealthy = await isHealthy(local, 700);
  if (localHealthy) {
    currentServer = 'local';
    currentUrl = local;
    notifyListeners();
    return { url: local, server: 'local' };
  }

  const cloudHealthy = await isHealthy(cloud, 2000);
  if (cloudHealthy) {
    currentServer = 'cloud';
    currentUrl = cloud;
    notifyListeners();
    return { url: cloud, server: 'cloud' };
  }

  currentServer = 'offline';
  currentUrl = local;
  notifyListeners();
  return { url: local, server: 'offline' };
}

function notifyListeners() {
  for (const cb of listeners) {
    try { cb(currentServer, currentUrl); } catch {}
  }
}

export async function ensureEndpoint(storeId?: string): Promise<string> {
  if (!currentUrl) {
    const result = await selectEndpoint(storeId);
    return result.url;
  }
  return currentUrl;
}
