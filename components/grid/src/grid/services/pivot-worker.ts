import { createReactPivotHost } from './pivot-host';
import { PivotSession } from './pivot-session';
import { unpackPivotInput } from './pivot-transfer';
import type { PivotWorkerCommand, PivotWorkerResponse } from './pivot-worker-client';
import type { PivotErrorEvent } from '../types/pivot.interfaces';

let session: PivotSession<unknown>;
let revision: number;
// This entry is bundled for a Worker; use a narrow contract without requiring DOM + WebWorker lib collisions.
const scope: {
    onmessage: (event: MessageEvent<PivotWorkerCommand>) => void;
    postMessage: (response: PivotWorkerResponse) => void;
} = globalThis as unknown as { onmessage: (event: MessageEvent<PivotWorkerCommand>) => void;
    postMessage: (response: PivotWorkerResponse) => void };
scope.onmessage = (event: MessageEvent<PivotWorkerCommand>) => {
    const command: PivotWorkerCommand = event.data;
    const response: PivotWorkerResponse = { revision: command.revision, request: command.request };
    try {
        if (command.action === 'initialize') {
            session = new PivotSession(unpackPivotInput(command.payload), createReactPivotHost(command.locale));
            revision = command.revision;
        }
        if (!session || revision !== command.revision) { throw new Error('Pivot worker dataset revision is no longer active.'); }
        response.result = session.page(command.window);
    } catch (error) {
        response.error = { code: (error as PivotErrorEvent).code || 'CalculationFailed', message: (error as Error).message };
    }
    scope.postMessage(response);
};
