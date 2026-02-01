'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gateway, type GatewayError } from '@/lib/gateway';

/**
 * Query keys for React Query
 */
export const queryKeys = {
  sessions: ['sessions'] as const,
  session: (id: string) => ['sessions', id] as const,
  sessionActivities: (id: string) => ['sessions', id, 'activities'] as const,
  activities: ['activities'] as const,
  messages: (channel?: string) => ['messages', channel] as const,
  threads: (channel: string) => ['messages', 'threads', channel] as const,
  cron: ['cron'] as const,
  memory: (file?: string) => ['memory', file] as const,
  memoryFiles: ['memory', 'files'] as const,
  agents: ['agents'] as const,
  agent: (id: string) => ['agents', id] as const,
  costs: ['costs'] as const,
  costHistory: (days?: number) => ['costs', 'history', days] as const,
  health: ['health'] as const,
};

// ============ Sessions ============

export function useSessions(params?: { limit?: number; status?: string }) {
  return useQuery({
    queryKey: [...queryKeys.sessions, params],
    queryFn: () => gateway.sessions.list(params),
  });
}

export function useSession(id: string) {
  return useQuery({
    queryKey: queryKeys.session(id),
    queryFn: () => gateway.sessions.get(id),
    enabled: !!id,
  });
}

export function useSessionActivities(sessionId: string, limit?: number) {
  return useQuery({
    queryKey: [...queryKeys.sessionActivities(sessionId), limit],
    queryFn: () => gateway.sessions.getActivities(sessionId, { limit }),
    enabled: !!sessionId,
  });
}

// ============ Activities ============

export function useActivities(params?: {
  limit?: number;
  type?: string;
  since?: string;
}) {
  return useQuery({
    queryKey: [...queryKeys.activities, params],
    queryFn: () => gateway.activities.list(params),
    refetchInterval: 5000, // Refetch every 5 seconds for near real-time
  });
}

// ============ Messages ============

export function useMessages(params?: {
  channel?: string;
  limit?: number;
  threadId?: string;
}) {
  return useQuery({
    queryKey: [...queryKeys.messages(params?.channel), params],
    queryFn: () => gateway.messages.list(params),
  });
}

export function useThreads(channel: string) {
  return useQuery({
    queryKey: queryKeys.threads(channel),
    queryFn: () => gateway.messages.getThreads(channel),
    enabled: !!channel,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      channel: string;
      content: string;
      threadId?: string;
    }) => gateway.messages.send(data),
    onSuccess: (_data, variables) => {
      // Invalidate messages for this channel
      queryClient.invalidateQueries({
        queryKey: queryKeys.messages(variables.channel),
      });
    },
  });
}

// ============ Cron Jobs ============

export function useCronJobs() {
  return useQuery({
    queryKey: queryKeys.cron,
    queryFn: () => gateway.cron.list(),
  });
}

export function useCreateCronJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: gateway.cron.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cron });
    },
  });
}

export function useUpdateCronJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Parameters<typeof gateway.cron.update>[1];
    }) => gateway.cron.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cron });
    },
  });
}

export function useDeleteCronJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: gateway.cron.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cron });
    },
  });
}

export function useTriggerCronJob() {
  return useMutation({
    mutationFn: gateway.cron.trigger,
  });
}

// ============ Memory ============

export function useMemory(file: string) {
  return useQuery({
    queryKey: queryKeys.memory(file),
    queryFn: () => gateway.memory.get(file),
    enabled: !!file,
  });
}

export function useMemoryFiles() {
  return useQuery({
    queryKey: queryKeys.memoryFiles,
    queryFn: () => gateway.memory.list(),
  });
}

export function useUpdateMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, content }: { file: string; content: string }) =>
      gateway.memory.update(file, content),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.memory(variables.file),
      });
    },
  });
}

export function useSearchMemory() {
  return useMutation({
    mutationFn: gateway.memory.search,
  });
}

// ============ Agents ============

export function useAgents() {
  return useQuery({
    queryKey: queryKeys.agents,
    queryFn: () => gateway.agents.list(),
    refetchInterval: 3000, // Poll for agent status updates
  });
}

export function useAgent(id: string) {
  return useQuery({
    queryKey: queryKeys.agent(id),
    queryFn: () => gateway.agents.get(id),
    enabled: !!id,
    refetchInterval: 2000, // Poll more frequently for individual agent
  });
}

export function useSpawnAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: gateway.agents.spawn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agents });
    },
  });
}

export function useStopAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: gateway.agents.stop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agents });
    },
  });
}

// ============ Costs ============

export function useCostSummary() {
  return useQuery({
    queryKey: queryKeys.costs,
    queryFn: () => gateway.costs.summary(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useCostHistory(days?: number) {
  return useQuery({
    queryKey: queryKeys.costHistory(days),
    queryFn: () => gateway.costs.history({ days }),
  });
}

// ============ Health ============

export function useGatewayHealth() {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: () => gateway.health(),
    refetchInterval: 10000, // Check health every 10 seconds
    retry: false,
  });
}

// ============ Wake ============

export function useWake() {
  return useMutation({
    mutationFn: ({ message, mode }: { message: string; mode?: 'now' | 'queue' }) =>
      gateway.wake(message, mode),
  });
}
