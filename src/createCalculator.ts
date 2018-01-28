import { createSelector } from "reselect";
import { Selector } from "./calculation";


/**
 * Create a function that extracts calculation arguments from input and caches results
 */
export function createCalculator<
    Input,
    CalcInput extends { [prop: string]: any },
    Output
>(
    dependencies: {
        [I in keyof CalcInput]: Selector<Input, CalcInput[I] | Promise<CalcInput[I]>>;
    },
    calculation: (input: CalcInput) => Promise<Output>
): Selector<Input, Promise<Output>> {
    const keys = Object.keys(dependencies);
    return createSelector(
        // TODO: remove any when createSelector typedef would support arrays
        keys.map(key => dependencies[key]) as any,
        async (...values: any[]) => {
            const resolved = await Promise.all(values);
            return calculation(resolved.reduce((composition, value, index) => {
                composition[keys[index]] = value;
                return composition;
            }, {}));
        }
    );
}
