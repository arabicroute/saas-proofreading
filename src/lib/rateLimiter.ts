// Sliding-window token-bucket rate limiter.
// Used in Testing tier to stay within Cohere's 20 req/min trial cap.

export class RateLimiter {
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private timestamps: number[] = [];

  constructor(requestsPerMinute: number) {
    this.windowMs    = 60_000;
    this.maxRequests = requestsPerMinute;
  }

  /**
   * Returns the number of milliseconds to wait before the next request
   * can be made without exceeding the rate limit. 0 = proceed immediately.
   */
  msUntilNextSlot(): number {
    const now    = Date.now();
    const window = now - this.windowMs;

    // Drop timestamps outside the sliding window
    this.timestamps = this.timestamps.filter(t => t > window);

    if (this.timestamps.length < this.maxRequests) return 0;

    // Oldest timestamp in the window; wait until it falls out
    const oldest = this.timestamps[0];
    return oldest + this.windowMs - now + 50; // +50ms buffer
  }

  /**
   * Call this immediately after a request is dispatched.
   */
  record(): void {
    this.timestamps.push(Date.now());
  }

  /**
   * Waits the appropriate time then records the slot.
   * Wraps msUntilNextSlot + record() for convenience.
   */
  async acquireSlot(): Promise<void> {
    const wait = this.msUntilNextSlot();
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    this.record();
  }
}
