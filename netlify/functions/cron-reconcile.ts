// Netlify Scheduled Function — fires daily at 06:00 UTC (configured in netlify.toml).
// Wraps the existing Next.js cron route /api/cron/reconcile so business logic stays in one place.

import type { Handler } from "@netlify/functions";

export const handler: Handler = async () => {
  const baseUrl = process.env.URL || process.env.DEPLOY_URL;
  const cronSecret = process.env.CRON_SECRET;

  if (!baseUrl || !cronSecret) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "URL or CRON_SECRET env var missing" }),
    };
  }

  const res = await fetch(`${baseUrl}/api/cron/reconcile`, {
    headers: { Authorization: `Bearer ${cronSecret}` },
  });

  const body = await res.text();
  return { statusCode: res.status, body };
};
