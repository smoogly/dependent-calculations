import { Map } from "immutable";


export interface ImmutableMap<T extends object> extends Map<keyof T, T[keyof T]> {
    get<K extends keyof T>(key: K): T[K];
    set<K extends keyof T>(key: K, val: T[K]): this;
}
