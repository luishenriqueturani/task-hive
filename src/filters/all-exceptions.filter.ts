import { ArgumentsHost, Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

/**
 * O filtro padrão do Nest só loga exceções que NÃO são HttpException; como os
 * services capturam o erro original e relançam InternalServerErrorException,
 * os 500 chegavam ao cliente sem deixar rastro no log da API. Este filtro
 * loga todo 5xx com método, URL, stack e a causa original (`{ cause }`).
 */
@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status >= 500) {
      const req = host.switchToHttp().getRequest<{ method?: string; url?: string }>();
      const context = `${req?.method ?? '?'} ${req?.url ?? '?'} -> ${status}`;

      if (exception instanceof Error) {
        this.logger.error(`${context} | ${exception.message}`, exception.stack);
        // `lib` do tsconfig é anterior ao ES2022, que tipou Error.cause
        const cause = (exception as Error & { cause?: unknown }).cause;
        if (cause instanceof Error) {
          this.logger.error(`Causa original: ${cause.message}`, cause.stack);
        } else if (cause !== undefined) {
          this.logger.error(`Causa original: ${JSON.stringify(cause)}`);
        }
      } else {
        this.logger.error(`${context} | ${JSON.stringify(exception)}`);
      }
    }

    super.catch(exception, host);
  }
}
