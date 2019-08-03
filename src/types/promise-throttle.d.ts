// Type definitions for promise-throttle 1.0
// Project: https://github.com/jmperez/promise-throttle
// Definitions by: Jared Dantis <https://github.com/me>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

interface PromiseThrottleOptions {
    requestsPerSecond: number
}

declare class PromiseThrottle {
    constructor(options?: PromiseThrottleOptions)
    public add(promise: any, options?: any): any
    public addAll(promises: any, options: any): any
    public dequeue(): void
}

declare module 'promise-throttle' {
    export = PromiseThrottle
}

