import { Calculator, isCalculator, Selector } from "./calculation";
import { createCalculator } from "./createCalculator";

/**
 * Get an answer given the current input and a description of calculation
 */
export function getResolver<Input>() {
    const calculators = new Map<Calculator<Input, any>, Selector<Input, any>>();
    const getCalculator = <T>(dep: Calculator<Input, T>): Selector<Input, Promise<T>> => {
        const existing = calculators.get(dep);
        if (existing) {
            return existing;
        }

        const deps = dep.get("dependencies");
        const keys = Array.from({[Symbol.iterator]: () => deps.keys()});
        const processedDeps = keys.reduce<{[prop: string]: Selector<Input, any>}>((acc, key) => {
            acc[key] = (input: Input) => {
                const res = deps.get(key)(input);
                if (isCalculator(res)) {
                    return getCalculator(res)(input);
                }

                return res;
            };
            return acc;
        }, {});

        const calc = createCalculator(processedDeps, dep.get("calculate"));
        calculators.set(dep, calc);
        return calc;
    };

    return async function resolve<Output>(
        input: Input,
        calculator: Calculator<Input, Output>
    ): Promise<Output> {
        return getCalculator(calculator)(input);
    };
}

