import {
  CallHandler,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, delay } from 'rxjs/operators';

@Injectable()
export class FlakyInterceptor implements NestInterceptor {
  private readonly latencyMs = Number(process.env.FLAKY_LATENCY_MS ?? 500);
  private readonly failureRate = Number(process.env.FLAKY_FAILURE_RATE ?? 0.1);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{ url?: string }>();
    if (request.url?.startsWith('/auth/login')) {
      return next.handle();
    }

    if (Math.random() < this.failureRate) {
      return throwError(
        () =>
          new InternalServerErrorException(
            'Simulated upstream failure — retry may succeed',
          ),
      );
    }

    return next.handle().pipe(
      delay(this.latencyMs),
      catchError((err) => throwError(() => err)),
    );
  }
}
