/**
 * API Route: /api/live/cron
 * Returns cron jobs from OpenClaw Gateway WebSocket RPC
 * Falls back to file-based reading if Gateway is unavailable
 */

import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import * as path from 'path';
import { getGatewayClient } from '@/lib/gateway-client';

export const dynamic = 'force-dynamic';

const OPENCLAW_DIR = process.env.OPENCLAW_DIR || path.join(process.env.HOME || '', '.openclaw');
const CRON_STATE_FILE = path.join(OPENCLAW_DIR, 'workspace', 'cron-state.json');

export async function GET() {
  try {
    // Try Gateway WebSocket RPC first
    try {
      const client = getGatewayClient();
      const jobs = await client.cronList();

      return NextResponse.json({
        ok: true,
        jobs,
        source: 'gateway',
        connected: true,
        timestamp: new Date().toISOString(),
      });
    } catch (gatewayError) {
      console.log('[cron] Gateway unavailable, falling back to file:', (gatewayError as Error).message);
    }

    // Fallback: Read from cron-state.json file
    try {
      const content = await fs.readFile(CRON_STATE_FILE, 'utf-8');
      const data = JSON.parse(content);

      return NextResponse.json({
        ok: true,
        jobs: data.jobs || [],
        exportedAt: data.exportedAt,
        source: 'file',
        connected: false,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // File doesn't exist or is invalid
      return NextResponse.json({
        ok: true,
        jobs: [],
        source: 'empty',
        connected: false,
        message: 'Gateway offline and no cron state file found.',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error fetching cron jobs:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch cron jobs' },
      { status: 500 }
    );
  }
}
