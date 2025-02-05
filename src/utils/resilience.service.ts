import { Injectable, Logger } from '@nestjs/common';
@Injectable()
export class ResilienceService {
  private readonly logger = new Logger(ResilienceService.name);

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    retries: number = 3,
    delay: number = 1000,
  ): Promise<T> {
    let attempt = 0;
    const retryableErrors = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ECONNREFUSED',
      'LockNotAvailable',
      'ConnectionTimeoutError',
      'DeadlockDetected',
      'SerializationFailure',
    ];
    while (attempt < retries) {
      try {
        return await operation();
      } catch (error: any) {
        attempt++;

        if (
          !retryableErrors.some((errMsg) => error.message?.includes(errMsg)) &&
          !retryableErrors.some((errCode) => error.code === errCode)
        ) {
          throw error;
        }

        if (attempt >= retries) {
          throw error;
        }

        console.warn(
          `Retrying operation due to error (Attempt ${attempt + 1}/${retries}): ${error.message}`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw new Error('Unexpected error in retry logic');
  }
}
