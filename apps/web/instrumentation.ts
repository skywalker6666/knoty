/**
 * Next.js Instrumentation Hook
 * Runs once at server startup — sets undici ProxyAgent so all server-side
 * fetch() calls (including Supabase) go through the corporate proxy.
 *
 * Reads HTTPS_PROXY or https_proxy from the environment.
 * No-op if neither is set.
 */
export async function register() {
  const proxy =
    process.env.HTTPS_PROXY ||
    process.env.https_proxy ||
    process.env.HTTP_PROXY ||
    process.env.http_proxy;

  if (!proxy) {
    console.log('[instrumentation] no proxy env var found, skipping');
    return;
  }

  console.log('[instrumentation] setting proxy dispatcher:', proxy);

  // Use setGlobalDispatcher so undici (which backs globalThis.fetch in Node.js 22) routes
  // all server-side fetch through the corporate proxy.
  // rejectUnauthorized: false handles SSL-inspecting proxies that present a corporate cert.
  const { ProxyAgent, setGlobalDispatcher } = await import('undici');
  const agent = new ProxyAgent({
    uri: proxy,
    requestTls:  { rejectUnauthorized: false },
    connect:     { rejectUnauthorized: false },
  });
  setGlobalDispatcher(agent);

  console.log('[instrumentation] proxy dispatcher set');
}
