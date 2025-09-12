import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import tracer from 'dd-trace';

@Injectable()
export class DatadogTraceInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const span = tracer.startSpan('nest.request', {
            tags: {
                'service.name': 'multimodal-bot',
                'resource.name': context.getHandler().name,
            },
        });

        return next.handle().pipe(
            tap({
                next: () => span.finish(),
                error: (err) => {
                    span.addTags({ 'error.message': err.message });
                    span.finish();
                },
            }),
        );
    }
}
