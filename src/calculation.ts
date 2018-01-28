import { Iterable, Map } from "immutable";
import { ImmutableMap } from "./interface_helpers";


export type Selector<Input, Output> = (input: Input) => Output;

type Dependencies<Input, CalcInput extends { [prop: string]: any }> = {
    [I in keyof CalcInput]: Selector<Input, CalcInput[I] | Promise<CalcInput[I]> | Calculator<Input, CalcInput[I]>>;
};

export interface ExplicitCalculator<Input, CalcInput extends { [prop: string]: any }, Output> extends ImmutableMap<{
    dependencies: ImmutableMap<Dependencies<Input, CalcInput>>;

    calculate(input: CalcInput): Promise<Output>;
}> {}

export interface Calculator<Input, Output> extends ExplicitCalculator<Input, any, Output> {}

/**
 * Create an immutable calculator object out of plain description
 */
export function calculation<
    Input, CalcInput, Output
>(
    calc: Selector<CalcInput, Promise<Output>>,
    dependencies?: Dependencies<Input, CalcInput>
): ExplicitCalculator<Input, CalcInput, Output> {
    return Map({
        dependencies: Map(dependencies || {}),
        calculate: calc, // TODO: remove any when immutable type annotations are better
    }) as any;
}

const example = calculation(async () => void 0).toJS();
const keys = Object.keys(example);

/**
 * Checks whether given value is a calculator
 */
export function isCalculator<Input, Output>(obj: any): obj is Calculator<Input, Output> {
    return Iterable.isIterable(obj) && keys.every(k => typeof obj.get(k) === typeof example[k]);
}
