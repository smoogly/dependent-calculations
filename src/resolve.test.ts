import { expect } from "chai";
import { stub } from "sinon";
import { calculation, Calculator } from "./calculation";
import { getResolver } from "./resolve";


describe("Calculation resolver", () => {
    let resolve: (input: any, calculator: Calculator<any, any>) => any;
    beforeEach(() => {
        resolve = getResolver();
    });

    it("should run the calculation", async () => {
        const calc = stub();
        await resolve({}, calculation(calc));

        expect(calc.calledOnce).to.eql(true);
    });

    it("should return the result of calculation", async () => {
        const expectedResult = { resulting: "value" };
        const calc = stub().returns(expectedResult);
        const res = await resolve({}, calculation(calc));

        expect(res).to.eql(expectedResult);
    });

    it("should resolve other calculations if they are calculations", async () => {
        const calc = stub();

        const depCalcRes = { iam: "a result of calculation" };
        const depCalc = stub().returns(depCalcRes);

        await resolve({}, calculation(calc, {
            dep: () => calculation(depCalc),
        }));

        expect(depCalc.calledOnce, "Dependency calculation not executed").to.eql(true);
        expect(calc.calledOnce, "Target calculation not executed").to.eql(true);
        expect(calc.firstCall.args[0]).to.have.property("dep", depCalcRes);
    });

    it("should recalculate if dependencies change and not recalculate when they don't", async () => {
        const dependency = stub().returns("three");
        dependency.onFirstCall().returns("one");
        dependency.onSecondCall().returns("two");

        const calcFn = stub();
        const calc = calculation(calcFn, {
            dep: dependency,
        });

        const numCalls = 10;
        for (let i = 0; i < numCalls; i++) {
            await resolve({}, calc);
        }

        const expectedCallCount = 3;
        expect(calcFn.callCount).to.eql(expectedCallCount);
    });

    it("should recalculate if dependencies of dependency calculation change and cache otherwise", async () => {
        const dependency = stub().returns("three");
        dependency.onFirstCall().returns("one");
        dependency.onSecondCall().returns("two");

        const dependencyCalculation = calculation(stub().returnsArg(0), {
            whatever: dependency,
        });

        const calcFn = stub();
        const calc = calculation(calcFn, {
            dep: () => dependencyCalculation,
        });

        const numCalls = 10;
        for (let i = 0; i < numCalls; i++) {
            await resolve({}, calc);
        }

        const expectedCallCount = 3;
        expect(calcFn.callCount).to.eql(expectedCallCount);
    });

    it("should pass values from dependency to calculation", async () => {
        const calc = stub();
        const arg = { iam: "a result of dependency" };
        await resolve({}, calculation(calc, { dep: stub().returns(Promise.resolve(arg)) }));

        expect(calc.firstCall.args[0]).to.have.property("dep", arg);
    });

    it("should pass results of dependency calculation to calculation", async () => {
        const calculationResult = { iam: "calculation result" };
        const dependencyCalculation = calculation(stub().returns(Promise.resolve(calculationResult)));

        const calc = stub();
        await resolve({}, calculation(calc, {
            dep: () => dependencyCalculation,
        }));

        expect(calc.firstCall.args[0]).to.have.property("dep", calculationResult);
    });

    it("should not run calculation twice if it is a dependency of two other calculations", async () => {
        /*
        A┬B┐
         └C┴D
         Where A is one being resolved and D is expected to run once
         */

        const calc = stub();
        const D = calculation(calc);

        const B = calculation(stub(), { D: () => D });

        const C = calculation(stub(), { D: () => D });

        const A = calculation(stub(), {
            B: () => B,
            C: () => C,
        });

        await resolve({}, A);
        expect(calc.calledOnce).to.eql(true);
    });
});
