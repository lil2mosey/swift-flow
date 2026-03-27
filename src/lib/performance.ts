'use client';

/**
 * Utility to measure the performance of asynchronous operations.
 * Logs the duration to the console and warns if it exceeds a threshold.
 */
export async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    
    // Using a simple log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name} took ${duration.toFixed(2)}ms`);
      
      if (duration > 2000) {
        console.warn(`[Performance] ⚠️ Slow operation detected: ${name} (${duration.toFixed(2)}ms)`);
      }
    }
    
    return result;
  } catch (error) {
    console.error(`[Performance] ${name} failed after ${ (performance.now() - start).toFixed(2) }ms:`, error);
    throw error;
  }
}
