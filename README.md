# Simple Token Bucket
This package provides a simple and efficient implementation of the token bucket algorithm for rate limiting. It helps you control the frequency of actions (such as API requests) within a specified time frame.

The token bucket algorithm provides a simple mechanism to control how many actions (e.g., API requests) can be performed over a given time window. The bucket accumulates tokens at a steady rate which you can fine-tune and stop it for a duration, and each action consumes a token. If no tokens are available, the action can either fail or wait for tokens to refill.

## Features
- **Asynchronous Consumption:** Supports waiting for tokens asynchronously when they are unavailable.
- **Customizable Refill Rates:** Allows fine-tuning of bucket capacity, refill rate, and time windows.
- **Force Stop and Refill:** Can force a bucket to wait and stop refilling for a specified duration.
- **Verbose Mode:** Logs the state of the token bucket for debugging purposes.

## Getting Started

### Simple Usage

```ts
import { TokenBucket } from 'token-bucket';

const tokenBucket = new TokenBucket({
  capacity: 10,
  fillPerWindow: 1,
  windowInMs: 1000,
});

if (await tokenBucket.consumeAsync()) {
  // Your logic when a token is consumed successfully
}
```

### Usage with Verbose Logging
```ts
import { TokenBucket } from 'token-bucket';

const tokenBucket = new TokenBucket({
  capacity: 20,
  fillPerWindow: 5,
  windowInMs: 2000,
}, true);

if (await tokenBucket.consumeAsync()) {
  // Your async logic when a token is consumed successfully
} else
  console.log("Rate limit exceeded. Waiting for tokens...");
}
```

### Wait for Bucket to Have Enough Tokens
```ts
import { TokenBucket } from 'token-bucket';

const tokenBucket = new TokenBucket({
  capacity: 20,
  fillPerWindow: 5,
  windowInMs: 2000,
}, true);

// This while loop waits for tokenBucket to asynchronously consumes the specified number of tokens, 5 in this case.
let numberOfTokensToBeConsumed = 5;
while (!await tokenBucket.consumeAsync(numberOfTokensToBeConsumed));
```

## Configuration Options

### TokenBucketOptions

- `capacity`: The maximum number of tokens in the bucket.
- `fillPerWindow`: The number of tokens added to the bucket per window.
- `windowInMs`: The size of the window in milliseconds.
- `initialTokens`: The initial number of tokens in the bucket. Defaults to the capacity if not provided.

```ts
import { TokenBucket } from 'token-bucket';

const tokenBucket = new TokenBucket({
  capacity: 20,
  fillPerWindow: 2,
  windowInMs: 1500,
  initialTokens: 40,
});
```

## Methods

```ts
consume(amount: number = 1): boolean
```

Consumes the specified number of tokens from the bucket. Returns true if the tokens were successfully consumed, otherwise false.

```ts
consumeAsync(amount: number = 1): Promise<boolean>
```

Asynchronously consumes the specified number of tokens from the bucket. Returns a promise that resolves to true if the tokens were successfully consumed, otherwise false.

```ts
start(): TokenBucket
```

Starts the internal timer for refilling tokens. Returns the TokenBucket instance to allow chaining.

```ts
stop(): void
```

Stops the internal timer for refilling tokens.

```ts
forceWaitUntilMilisecondsPassed(delayInMs: number): void
```

Forces the bucket to wait until the specified amount of milliseconds have passed before refilling. The intended use of this method is aligning with the rate limit of the API in case your TokenBucket is providing more tokens than it should (i.e: if you are using shared rate limit within different places).
