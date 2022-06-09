export interface PaginationBundleInterface<N> {

    //* properties *//
    readonly pages: N[];
    readonly id: string;
    readonly meta: any;

    //* methods *//
    findOne(id: string): N;
    findAll(): N[];
    push(T): void;
    // pop(): N;
    toString(): void;
}