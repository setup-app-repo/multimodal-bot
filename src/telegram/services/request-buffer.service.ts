import { Injectable } from '@nestjs/common';
import type { BotContext } from 'src/telegram/interfaces';

type FlushCallback = (ctx: BotContext, combinedText: string) => Promise<void> | void;

interface BufferState {
    texts: string[];
    timer: NodeJS.Timeout | null;
    ctx: BotContext;
    onFlush: FlushCallback;
}

@Injectable()
export class RequestBufferService {
    private readonly buffers: Map<string, BufferState> = new Map();
    private readonly debounceMs = 3000;

    enqueue(userId: string, ctx: BotContext, text: string, onFlush: FlushCallback): void {
        const existing = this.buffers.get(userId);
        if (existing) {
            existing.texts.push(text);
            if (existing.timer) {
                clearTimeout(existing.timer);
            }
            existing.timer = setTimeout(() => this.flush(userId), this.debounceMs);
            return;
        }

        const state: BufferState = {
            texts: [text],
            ctx,
            onFlush,
            timer: setTimeout(() => this.flush(userId), this.debounceMs),
        };
        this.buffers.set(userId, state);
    }

    flush(userId: string): void {
        const state = this.buffers.get(userId);
        if (!state) return;
        if (state.timer) {
            clearTimeout(state.timer);
            state.timer = null;
        }
        this.buffers.delete(userId);

        const combined = state.texts.join('\n');
        try {
            void Promise.resolve(state.onFlush(state.ctx, combined));
        } catch {
            // ignore
        }
    }

    cancel(userId: string): void {
        const state = this.buffers.get(userId);
        if (!state) return;
        if (state.timer) clearTimeout(state.timer);
        this.buffers.delete(userId);
    }
}


