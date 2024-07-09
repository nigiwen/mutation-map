declare class MutationMap<T extends HTMLElement, Data extends {
    position: number;
    text: string;
    isDRM: boolean;
    isUnusual: boolean;
}> {
    #private;
    scaleX?: {
        (num: number): number;
        invert: (x: number) => number;
    };
    constructor(el: T);
    setDomain(val: [number, number]): this;
    setShorten(overallWidth: number, width: number, x: number): this;
    setTickValues(val: number[]): this;
    setText(text: string, config: {
        background: string;
        color: string;
    }): this;
    setData(val: Data[]): this;
    setInterval(val: number): this;
    render(): void;
}
declare const createMutationMap: <T extends HTMLElement, Data extends {
    position: number;
    text: string;
    isDRM: boolean;
    isUnusual: boolean;
}>(el: T) => MutationMap<T, Data>;

export { createMutationMap };
