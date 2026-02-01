/**
 * Analytics Storage
 *
 * IndexedDB-based storage for analytics data.
 * Provides local persistence with configurable retention.
 */

import type {
  UsageMetrics,
  SessionMetrics,
  ToolBreakdown,
  AnalyticsSettings,
} from '@/lib/analytics';
import {
  DEFAULT_ANALYTICS_SETTINGS,
  createEmptyMetrics,
  getTodayISO,
  getDateDaysAgo,
} from '@/lib/analytics';

const DB_NAME = 'openclaw-analytics';
const DB_VERSION = 1;

const STORES = {
  METRICS: 'daily-metrics',
  SESSIONS: 'sessions',
  TOOLS: 'tool-usage',
  SETTINGS: 'settings',
} as const;

let dbInstance: IDBDatabase | null = null;

/**
 * Open IndexedDB connection
 */
async function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Daily metrics store (keyed by date)
      if (!db.objectStoreNames.contains(STORES.METRICS)) {
        const metricsStore = db.createObjectStore(STORES.METRICS, { keyPath: 'date' });
        metricsStore.createIndex('date', 'date', { unique: true });
      }

      // Sessions store
      if (!db.objectStoreNames.contains(STORES.SESSIONS)) {
        const sessionsStore = db.createObjectStore(STORES.SESSIONS, { keyPath: 'id' });
        sessionsStore.createIndex('startTime', 'startTime', { unique: false });
        sessionsStore.createIndex('model', 'model', { unique: false });
        sessionsStore.createIndex('status', 'status', { unique: false });
      }

      // Tool usage store
      if (!db.objectStoreNames.contains(STORES.TOOLS)) {
        const toolsStore = db.createObjectStore(STORES.TOOLS, { keyPath: 'tool' });
        toolsStore.createIndex('count', 'count', { unique: false });
      }

      // Settings store
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
      }
    };
  });
}

/**
 * Get a transaction for a store
 */
async function getStore(
  storeName: string,
  mode: IDBTransactionMode = 'readonly'
): Promise<IDBObjectStore> {
  const db = await openDB();
  const tx = db.transaction(storeName, mode);
  return tx.objectStore(storeName);
}

/**
 * Generic get from store
 */
async function get<T>(storeName: string, key: string): Promise<T | null> {
  const store = await getStore(storeName);
  return new Promise((resolve, reject) => {
    const request = store.get(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
}

/**
 * Generic put to store
 */
async function put<T>(storeName: string, value: T): Promise<void> {
  const store = await getStore(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.put(value);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Get all records from store
 */
async function getAll<T>(storeName: string): Promise<T[]> {
  const store = await getStore(storeName);
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Get records by index range
 */
async function getByIndexRange<T>(
  storeName: string,
  indexName: string,
  range: IDBKeyRange
): Promise<T[]> {
  const store = await getStore(storeName);
  const index = store.index(indexName);
  return new Promise((resolve, reject) => {
    const request = index.getAll(range);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Delete old records based on retention policy
 */
async function cleanupOldRecords(storeName: string, dateField: string, maxAge: number): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  const cutoffDate = getDateDaysAgo(maxAge);

  return new Promise((resolve, reject) => {
    const request = store.openCursor();
    request.onerror = () => reject(request.error);
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        const record = cursor.value;
        const recordDate = record[dateField];
        if (recordDate && recordDate < cutoffDate) {
          cursor.delete();
        }
        cursor.continue();
      } else {
        resolve();
      }
    };
  });
}

// ==================== Public API ====================

/**
 * Get analytics settings
 */
export async function getAnalyticsSettings(): Promise<AnalyticsSettings> {
  try {
    const settings = await get<{ key: string; value: AnalyticsSettings }>(STORES.SETTINGS, 'analytics');
    return settings?.value || DEFAULT_ANALYTICS_SETTINGS;
  } catch {
    return DEFAULT_ANALYTICS_SETTINGS;
  }
}

/**
 * Save analytics settings
 */
export async function saveAnalyticsSettings(settings: AnalyticsSettings): Promise<void> {
  await put(STORES.SETTINGS, { key: 'analytics', value: settings });
}

/**
 * Get today's metrics
 */
export async function getTodayMetrics(): Promise<UsageMetrics> {
  const today = getTodayISO();
  const metrics = await get<UsageMetrics>(STORES.METRICS, today);
  return metrics || createEmptyMetrics(today);
}

/**
 * Save daily metrics
 */
export async function saveDailyMetrics(metrics: UsageMetrics): Promise<void> {
  await put(STORES.METRICS, metrics);
}

/**
 * Get metrics for a date range
 */
export async function getMetricsRange(startDate: string, endDate: string): Promise<UsageMetrics[]> {
  try {
    const range = IDBKeyRange.bound(startDate, endDate);
    return await getByIndexRange<UsageMetrics>(STORES.METRICS, 'date', range);
  } catch {
    return [];
  }
}

/**
 * Get metrics for the last N days
 */
export async function getMetricsForDays(days: number): Promise<UsageMetrics[]> {
  const endDate = getTodayISO();
  const startDate = getDateDaysAgo(days);
  return getMetricsRange(startDate, endDate);
}

/**
 * Get all stored metrics
 */
export async function getAllMetrics(): Promise<UsageMetrics[]> {
  return getAll<UsageMetrics>(STORES.METRICS);
}

/**
 * Save session metrics
 */
export async function saveSession(session: SessionMetrics): Promise<void> {
  await put(STORES.SESSIONS, session);
}

/**
 * Get session by ID
 */
export async function getSession(id: string): Promise<SessionMetrics | null> {
  return get<SessionMetrics>(STORES.SESSIONS, id);
}

/**
 * Get all sessions
 */
export async function getAllSessions(): Promise<SessionMetrics[]> {
  const sessions = await getAll<SessionMetrics>(STORES.SESSIONS);
  return sessions.sort((a, b) =>
    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );
}

/**
 * Get sessions with pagination
 */
export async function getSessionsPaginated(
  page: number,
  pageSize: number,
  filters?: {
    model?: string;
    channel?: string;
    status?: string;
  }
): Promise<{ sessions: SessionMetrics[]; total: number }> {
  let sessions = await getAllSessions();

  // Apply filters
  if (filters?.model) {
    sessions = sessions.filter(s => s.model === filters.model);
  }
  if (filters?.channel) {
    sessions = sessions.filter(s => s.channel === filters.channel);
  }
  if (filters?.status) {
    sessions = sessions.filter(s => s.status === filters.status);
  }

  const total = sessions.length;
  const start = (page - 1) * pageSize;
  const paginated = sessions.slice(start, start + pageSize);

  return { sessions: paginated, total };
}

/**
 * Save tool breakdown
 */
export async function saveToolBreakdown(tool: ToolBreakdown): Promise<void> {
  await put(STORES.TOOLS, tool);
}

/**
 * Get all tool breakdowns
 */
export async function getAllToolBreakdowns(): Promise<ToolBreakdown[]> {
  const tools = await getAll<ToolBreakdown>(STORES.TOOLS);
  return tools.sort((a, b) => b.count - a.count);
}

/**
 * Update tool breakdown
 */
export async function updateToolBreakdown(
  tool: string,
  update: Partial<ToolBreakdown>
): Promise<void> {
  const existing = await get<ToolBreakdown>(STORES.TOOLS, tool);
  const updated: ToolBreakdown = {
    tool,
    count: update.count ?? existing?.count ?? 0,
    avgDuration: update.avgDuration ?? existing?.avgDuration ?? 0,
    totalTokens: update.totalTokens ?? existing?.totalTokens ?? 0,
    successRate: update.successRate ?? existing?.successRate ?? 100,
    lastUsed: update.lastUsed ?? existing?.lastUsed,
  };
  await saveToolBreakdown(updated);
}

/**
 * Increment tool usage
 */
export async function incrementToolUsage(
  tool: string,
  durationMs: number,
  tokens: number,
  success: boolean
): Promise<void> {
  const existing = await get<ToolBreakdown>(STORES.TOOLS, tool);

  if (existing) {
    const newCount = existing.count + 1;
    const newTotalDuration = existing.avgDuration * existing.count + durationMs;
    const successCount = Math.round((existing.successRate / 100) * existing.count);
    const newSuccessCount = successCount + (success ? 1 : 0);

    await saveToolBreakdown({
      tool,
      count: newCount,
      avgDuration: newTotalDuration / newCount,
      totalTokens: existing.totalTokens + tokens,
      successRate: (newSuccessCount / newCount) * 100,
      lastUsed: new Date().toISOString(),
    });
  } else {
    await saveToolBreakdown({
      tool,
      count: 1,
      avgDuration: durationMs,
      totalTokens: tokens,
      successRate: success ? 100 : 0,
      lastUsed: new Date().toISOString(),
    });
  }
}

/**
 * Run cleanup based on retention settings
 */
export async function runCleanup(): Promise<void> {
  const settings = await getAnalyticsSettings();
  const retentionDays = settings.retentionDays || 90;

  await Promise.all([
    cleanupOldRecords(STORES.METRICS, 'date', retentionDays),
    cleanupOldRecords(STORES.SESSIONS, 'startTime', retentionDays),
  ]);
}

/**
 * Clear all analytics data
 */
export async function clearAllData(): Promise<void> {
  const db = await openDB();

  for (const storeName of [STORES.METRICS, STORES.SESSIONS, STORES.TOOLS]) {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const request = tx.objectStore(storeName).clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

/**
 * Check if IndexedDB is available
 */
export function isStorageAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}

/**
 * Close database connection
 */
export function closeDB(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
