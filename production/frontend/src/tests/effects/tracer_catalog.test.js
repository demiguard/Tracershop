/**
 * @jest-environment jsdom
 */
import React, { useMemo, createContext, useContext } from 'react';
import { jest, describe, afterAll } from '@jest/globals';
import { render, cleanup } from '@testing-library/react';

afterAll(() => {
  cleanup();
})

describe("Tracer Catalog and Context test cases", () => {
  /** This test case is more to show case how react behaves */
  it("Concept Just memorization testCase", () => {
    const memo_function = jest.fn();

    function useMemoValue(){
      return useMemo(() => {return memo_function()}, []);
    }

    function UsingComponent(){
      const value = useMemoValue();

      return <div></div>;
    }

    render(
      <div>
        <UsingComponent/>
        <UsingComponent/>
        <UsingComponent/>
      </div>
    );
    // We wanted this to be 1, but this how react behaves!
    expect(memo_function).toHaveBeenCalledTimes(3);
  });

  it("Concept contexts testcase", () => {
    const context = createContext()

    const memo_function = jest.fn();

    function ContextDispatcher({children}){
      const value = useMemo(
        () => {return memo_function()}, []
      );

      return(
        <context.Provider value={value}>
          {children}
        </context.Provider>
      );
    }

    function useTheContext(){
      return useContext(context);
    }

    function UsingComponent(){
      const value = useTheContext();

      return <div></div>;
    }

    render(
      <ContextDispatcher>
        <UsingComponent/>
        <UsingComponent/>
        <UsingComponent/>
      </ContextDispatcher>
    );

    expect(memo_function).toHaveBeenCalledTimes(1);
  });
});