// ─── ProjectHive — Supabase Query Timeout & Resilience Shield ─────────────────

/**
 * Wraps a Supabase query promise with a strict timeout.
 * Prevents PostgREST 504 Gateway hangs from blocking the Express event loop.
 *
 * @param {Promise} queryPromise - The Supabase query chain (e.g., supabaseAdmin.from(...).select(...))
 * @param {number} timeoutMs - Max execution time before aborting (default: 8000ms)
 * @returns {Promise<any>}
 */
export async function withTimeout(queryPromise, timeoutMs = 8000) {
  let timeoutHandle;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutHandle = setTimeout(() => {
      const error = new Error(`[DB Timeout] Supabase query exceeded ${timeoutMs}ms limit`);
      error.code = 'DB_TIMEOUT';
      reject(error);
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([queryPromise, timeoutPromise]);
    clearTimeout(timeoutHandle);
    return result;
  } catch (err) {
    clearTimeout(timeoutHandle);
    throw err;
  }
}
