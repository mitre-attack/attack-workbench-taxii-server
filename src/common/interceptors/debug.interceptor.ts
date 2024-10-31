import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class DebugInterceptor implements NestInterceptor {
    constructor(private readonly name: string) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        console.log(`\n[${this.name}] Before...`);
        const now = Date.now();
        
        return next
            .handle()
            .pipe(
                tap(data => {
                    console.log(`[${this.name}] After...`);
                    console.log(`[${this.name}] Data:`, data);
                    console.log(`[${this.name}] Took ${Date.now() - now}ms\n`);
                }),
            );
    }
}