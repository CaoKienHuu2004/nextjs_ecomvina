declare module 'counterup2' {
    export interface CounterUpOptions {
        duration?: number;
        delay?: number;
    }

    export default function counterUp(
        el: HTMLElement,
        options?: CounterUpOptions
    ): void;
}
