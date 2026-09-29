/**
 * Kept separate so synchronous consumers never instantiate a worker.
 *
 * @returns {Worker} A new pivot worker.
 */
export function createPivotWorker(): Worker {
    return new Worker(new URL('./pivot-worker.js', import.meta.url), { type: 'module', name: 'pivot-engine' });
}
