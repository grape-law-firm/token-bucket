import type { TokenBucketOptions } from "./types";

export class TokenBucket {
  private _tokens: number;
  private readonly _capacity: number;
  private readonly _fillPerWindow: number;
  private readonly _windowInMs: number;
  private _timerId: NodeJS.Timer | null = null;
  private readonly _waitQueue: Array<() => void> = [];
  private readonly verbose: boolean;
  private _nextRefillDate: Date | undefined;
  private _ongoingForcedStop = false;

  constructor (options: TokenBucketOptions, verbose: boolean = false) {
    this.verbose = verbose;
    this.validate(options);
    this._capacity = options.capacity;
    this._tokens = options.initialTokens ?? options.capacity;
    this._fillPerWindow = options.fillPerWindow;
    this._windowInMs = options.windowInMs;
    this._startInternal();
    this.logRemaniningTokensPeriodically();
  }

  private logRemaniningTokensPeriodically () {
    if (this.verbose) {
      setInterval(() => {
        if (this._timerId)
          console.log(`TokenBucket: Remaining tokens: ${this._tokens}`);
      }, 10000);
    }
  }

  /**
   * Force the bucket to wait until the specified amount of seconds have passed
   * @param delayInMs How many miliseconds should be passed before the bucket is refilled
   * @returns
   */
  forceWaitUntilMilisecondsPassed (delayInMs: number) {
    if (this._ongoingForcedStop) return;
    this._nextRefillDate = new Date(Date.now() + delayInMs);
    if (this.verbose)
      console.log(`TokenBucket: Forcing stop. Will start to refill in ${Math.floor(delayInMs / 1000)} seconds`);
    this._ongoingForcedStop = true;
    this._tokens = 0;
    this.stop();
    setTimeout(() => {
      this._tokens = this._capacity;
      this._startInternal();
      this._tryResolveWaiting();
      this._ongoingForcedStop = false;
      if (this.verbose)
        console.log("TokenBucket: Forced stop ended");
    }, delayInMs);
  }

  validate (options: TokenBucketOptions) {
    if (!options)
      throw new Error("Options are required");
    if (options.capacity <= 0)
      throw new Error("Capacity must be greater than 0");
    if (options.fillPerWindow <= 0)
      throw new Error("Fill per window must be greater than 0");
    if (options.windowInMs <= 0)
      throw new Error("Window in ms must be greater than 0");
    if (options.initialTokens !== undefined && (options.initialTokens < 0 || options.initialTokens > options.capacity))
      throw new Error("Initial tokens must be between 0 and capacity");
    if (options.fillPerWindow > options.capacity)
      throw new Error("Fill per window must be less than or equal to capacity");
  }

  /**
   * @returns Return this instance, to allow chaining
   */
  private _startInternal (): TokenBucket {
    this._nextRefillDate = new Date(Date.now() + this._windowInMs);
    if (!this._timerId) {
      this._timerId = setInterval(() => {
        this._nextRefillDate = new Date(Date.now() + this._windowInMs);

        if (this._tokens < this._capacity) {
          this._addToken();
          this._tryResolveWaiting();
        } else {
          // Bucket is full, stop the timer.
          this.stop();
          if (this.verbose)
            console.log("TokenBucket: Bucket is full, stopping the timer");
        }
      }, this._windowInMs);
    }
    return this;
  }

  start (): TokenBucket {
    return this._startInternal();
  }

  stop (): void {
    if (this._timerId) {
      clearInterval(this._timerId as any);
      this._timerId = null;
    }
  }

  get capacity (): number {
    return this._capacity;
  }

  get tokens (): number {
    return this._tokens;
  }

  private _addToken (): void {
    this._tokens = Math.min(this._tokens + this._fillPerWindow, this._capacity);
  }

  consume (amount: number = 1): boolean {
    if (!this._timerId && !this._ongoingForcedStop)
      this._startInternal();
    if (this._tokens >= amount) {
      this._tokens -= amount;
      return true;
    }
    return false;
  }

  async consumeAsync (amount: number = 1): Promise<boolean> {
    if (!this._timerId && !this._ongoingForcedStop)
      this._startInternal();

    if (this._tokens >= amount)
      return await Promise.resolve(this.consume(amount));
    else if (this.verbose) {
      const miliSecondsRemaining = this._nextRefillDate?.getTime()
        ? (this._nextRefillDate.getTime() - Date.now())
        : undefined;
      const nextRefillInSecondsText = miliSecondsRemaining ? Math.floor(miliSecondsRemaining / 1000) : "unknown";
      console.log(`TokenBucket: Not enough tokens now. Will refill in ${nextRefillInSecondsText} seconds.`);
    }

    return await new Promise<boolean>((resolve) => {
      this._waitQueue.push(() => {
        resolve(this.consume(amount));
      });
    });
  }

  private _tryResolveWaiting (): void {
    while (this._tokens > 0 && this._waitQueue.length > 0) {
      const resolver = this._waitQueue.shift();
      if (resolver)
        resolver();
    }
  }
}
