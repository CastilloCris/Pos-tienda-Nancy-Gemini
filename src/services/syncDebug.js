export const withStepTimeout = async (label, task, ms = 30000, maxRetries = 0) => {
  let attempt = 0;
  
  while (attempt <= maxRetries) {
    const startedAt = Date.now();
    let timeoutId;

    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error(`Timeout: ${label} superó ${Math.round(ms / 1000)}s`));
      }, ms);
    });

    try {
      const taskPromise = task();
      const result = await Promise.race([taskPromise, timeoutPromise]);
      window.clearTimeout(timeoutId);
      console.log(`[SyncStep] OK ${label} (${Date.now() - startedAt}ms)${attempt > 0 ? ` [Reintento ${attempt}]` : ""}`);
      return result;
    } catch (error) {
      window.clearTimeout(timeoutId);
      attempt++;
      
      const isNetworkError = error?.message?.toLowerCase().includes("network") || 
                            error?.message?.toLowerCase().includes("failed to fetch") ||
                            error?.message?.toLowerCase().includes("load failed");
      const isTimeout = error?.message?.toLowerCase().includes("timeout");

      if (attempt <= maxRetries && (isNetworkError || isTimeout)) {
        console.warn(`[SyncStep] RETRY ${label} (Intento ${attempt}/${maxRetries}) tras: ${error.message}. Esperando 3s...`);
        await new Promise(r => setTimeout(r, 3000));
        continue;
      }

      console.error(`[SyncStep] FAIL ${label} (${Date.now() - startedAt}ms)`, {
        message: error?.message,
        attempt
      });
      throw error;
    }
  }
};
