import type { PivotErrorEvent } from '../types/pivot.interfaces';
import type { PivotTransfer } from './pivot-transfer';
import type { PivotPage, PivotWindow } from './pivot-session';

export type PivotWorkerCommand = { revision: number; request: number; window: PivotWindow } &
({ action: 'initialize'; payload: PivotTransfer; locale?: string } | { action: 'page' });
export interface PivotWorkerResponse { revision: number; request: number; result?: PivotPage; error?: PivotErrorEvent; }

/** A client owns exactly one worker. Disposing it cancels pending calculations and releases the dataset. */
export class PivotWorkerClient {
    private worker: Worker;
    private revision: number;
    private request: number = 0;
    private pending: Map<number, {
        resolve: (page: PivotPage) => void;
        reject: (error: Error) => void;
    }> = new Map<number, { resolve: (page: PivotPage) => void; reject: (error: Error) => void }>();
    private disposed: boolean = false;
    constructor(worker: Worker, revision: number) {
        this.worker = worker;
        this.revision = revision;
        worker.onmessage = (event: MessageEvent<PivotWorkerResponse>) => {
            const message: PivotWorkerResponse = event.data;
            if (this.disposed || message.revision !== this.revision) { return; }
            const pending: {
                resolve: (page: PivotPage) => void;
                reject: (error: Error) => void;
            } = this.pending.get(message.request);
            if (!pending) { return; }
            this.pending.delete(message.request);
            if (message.error) { pending.reject(Object.assign(new Error(message.error.message), message.error)); }
            else { pending.resolve(message.result); }
        };
        worker.onerror = (event: ErrorEvent) => { this.fail(new Error(event.message || 'Pivot worker failed.')); };
        worker.onmessageerror = () => { this.fail(new Error('Pivot worker response could not be read.')); };
    }
    private fail(error: Error): void {
        for (const pending of this.pending.values()) { pending.reject(error); }
        this.pending.clear();
        this.disposed = true;
        this.worker.terminate();
    }
    send(window: PivotWindow, initial?: { payload: PivotTransfer; transfer: ArrayBuffer[]; locale?: string }): Promise<PivotPage> {
        if (this.disposed) { return Promise.reject(new Error('Pivot worker session is closed.')); }
        const request: number = ++this.request;
        return new Promise((resolve: (value: PivotPage | PromiseLike<PivotPage>) => void, reject: (reason?: unknown) => void) => {
            this.pending.set(request, { resolve, reject });
            const command: PivotWorkerCommand = initial ? { action: 'initialize', payload: initial.payload,
                locale: initial.locale, window, request, revision: this.revision } : { action: 'page', window, request, revision: this.revision };
            try { this.worker.postMessage(command, initial?.transfer || []); }
            catch (error) { this.fail(error as Error); }
        });
    }
    dispose(): void {
        this.worker.onmessage = null;
        this.worker.onerror = null;
        this.worker.onmessageerror = null;
        this.fail(new Error('Pivot calculation cancelled.'));
    }
}
