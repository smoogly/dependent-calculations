import { expect } from "chai";
import { stub } from "sinon";
import { createCalculator } from "./createCalculator";


describe("createCalculator", () => {
    it("should return a function", () => {
        expect(createCalculator({}, async () => 1)).to.be.a("function");
    });

    describe("generated function", () => {
        it("should return a result of calculation", async () => {
            const result = "value";
            const calculation = stub().returns(Promise.resolve(result));
            const dependency = createCalculator({}, calculation);
            expect(await dependency({})).to.eql(result);
        });

        it("should pass return values of dependencies to calculation", async () => {
            const one = { arg: "one" };
            const two = { arg: "two" };

            const calculation = stub();
            const dependencies = {
                a: stub().returns(one),
                b: stub().returns(two),
            };

            const dependency = createCalculator(dependencies, calculation);
            await dependency({});

            expect(calculation.firstCall.args[0]).to.eql({
                a: one,
                b: two,
            });
        });

        it("should resolve promises coming from dependencies before calling calculation", async () => {
            const one = { arg: "one" };
            const two = { arg: "two" };

            const calculation = stub();
            const dependencies = {
                a: stub().returns(Promise.resolve(one)),
                b: stub().returns(Promise.resolve(two)),
            };

            const dependency = createCalculator(dependencies, calculation);
            await dependency({});

            expect(calculation.firstCall.args[0]).to.eql({
                a: one,
                b: two,
            });
        });

        it("should not call calculate twice for same input", async () => {
            const calculation = stub();
            const dependency = createCalculator({}, calculation);

            const input = {};
            const numCalls = 10;
            for (let i = 0; i < numCalls; i++) {
                await dependency(input);
            }

            expect(calculation.calledOnce).to.eql(true);
        });

        it("should not call calculate twice if dependencies return same values", async () => {
            const calculation = stub();
            const dependencies = {
                a: stub().returns("one"),
                b: stub().returns("two"),
            };

            const dependency = createCalculator(dependencies, calculation);
            const numCalls = 10;
            for (let i = 0; i < numCalls; i++) {
                await dependency({}); // Different input all the time
            }

            expect(calculation.calledOnce).to.eql(true);
        });

        it("should return same value for calls where dependencies return same values", async () => {
            const calculation = stub();
            const dependencies = {
                a: stub().returns("one"),
                b: stub().returns("two"),
            };

            const dependency = createCalculator(dependencies, calculation);
            const res1 = dependency({}); // Not resolving promises here, expect the same promise.
            const res2 = dependency({});

            expect(res1, "Promises from different calls aren't equal").to.eql(res2);
        });

        it("should recalculate if one of dependencies returns a different value", async () => {
            const calculation = stub();

            const flaky = stub().returns("three");
            flaky.onFirstCall().returns("one");
            flaky.onSecondCall().returns("two");

            const dependencies = {
                stable: stub().returns("stable"),
                flaky,
            };

            const dependency = createCalculator(dependencies, calculation);
            const numCalls = 10;
            for (let i = 0; i < numCalls; i++) {
                await dependency({});
            }

            expect(calculation.calledThrice).to.eql(true);
        });
    });
});
