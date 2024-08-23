# token-bucket
This project implements a *Token Bucket algorithm for rate-limiting. The token bucket is a simple mechanism to control how many actions (e.g., API requests) can be performed over a given time window. The bucket accumulates tokens at a steady rate which you can fine-tune and stop it for a duration, and each action consumes a token. If no tokens are available, the action can either fail or wait for tokens to refill.

## Features
- Asynchronous Consumption: Supports waiting for tokens asynchronously when they are unavailable.
- Customizable Refill Rates: Allows fine-tuning of bucket capacity, refill rate, and time windows.
- Force Stop and Refill: Can force a bucket to wait and stop refilling for a specified duration.
- Verbose Mode: Logs the state of the token bucket for debugging purposes.


## Getting Started

### Prerequisites
- Node.js: Ensure that you have Node.js installed on your machine.
- TypeScript: This project uses TypeScript for type safety. You should have tsc installed, or use the provided compiled JavaScript if applicable.

## Usage

### Get Started

typescript
import { TokenBucket } from 'token-bucket';

const tokenBucket = new TokenBucket({
  capacity: 10,
  fillPerWindow: 1,
  windowInMs: 1000,
});

if (tokenBucket.consume()) {
  // Your logic when a token is consumed successfully
}

### Usage with Verbose Logging

typescript
import { TokenBucket } from 'token-bucket';

const tokenBucket = new TokenBucket({
  capacity: 20,
  fillPerWindow: 5,
  windowInMs: 2000,
}, true);

async function makeRequest() {
  if (await tokenBucket.consumeAsync()) {
    // Your async logic when a token is consumed successfully
  } else {
    console.log("Rate limit exceeded. Waiting for tokens...");
  }
}

makeRequest();

### Wait for enough Tokens to be in a Tokenbucket

typescript
import { TokenBucket } from 'token-bucket';

const tokenBucket = new TokenBucket({
  capacity: 20,
  fillPerWindow: 5,
  windowInMs: 2000,
}, true);

// This while loop waits for tokenBucket to asynchronously consumes the specified number of tokens, 5 in this case.
let numberOfTokensToBeConsumed = 5;
while (!await tokenBucket.consumeAsync(numberOfTokensToBeConsumed));


## Configuration Options

### TokenBucketOptions

- capacity: The maximum number of tokens in the bucket.
- fillPerWindow: The number of tokens added to the bucket per window.
- windowInMs: The size of the window in milliseconds.
- initialTokens: The initial number of tokens in the bucket. Defaults to the capacity if not provided.
typescript
/*
capacity is set to 20, so bucket can hold maximum 20 tokens in a given moment.
fillPerWindow is set to 2, so at each window 2 tokens will be put into the bucket.
windowInMs is set to 1500.
initialTokens is set to 40, so initial number of tokens in the bucket is no longer defaul value (i.e. capacity which is set to 20).
*/
import { TokenBucket } from 'token-bucket';

const tokenBucket = new TokenBucket({
  capacity: 20,
  fillPerWindow: 2,
  windowInMs: 1500,
  initialTokens: 40,
});


## Methods

### consume(amount: number = 1): boolean

Consumes the specified number of tokens from the bucket. Returns true if the tokens were successfully consumed, otherwise false.

### consumeAsync(amount: number = 1): Promise<boolean>

Asynchronously consumes the specified number of tokens from the bucket. Returns a promise that resolves to true if the tokens were successfully consumed, otherwise false.

### start(): TokenBucket

Starts the internal timer for refilling tokens. Returns the TokenBucket instance to allow chaining.

### stop(): void

Stops the internal timer for refilling tokens.

### forceWaitUntilMilisecondsPassed(delayInMs: number): void

Forces the bucket to wait until the specified amount of milliseconds have passed before refilling.
The intented use of this method is the when the an AsyncCaller object which is explained below receives an 429 Too Many Requests error. 
The related methods of the AsyncCaller class are implemented accordingly. We advice not to use this method anywhere else
unless it is absolutely necessary.
