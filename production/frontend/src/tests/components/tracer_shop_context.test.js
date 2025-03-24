/**
 * @jest-environment jsdom
 */

import React, { createContext, useContext, useMemo, useRef } from "react";
import { expect, jest, test } from '@jest/globals'
import WS from "jest-websocket-mock"
import { TracerShopContextInitializer, tracershopReducer, useTracershopState, useWebsocket } from "~/contexts/tracer_shop_context";
import { TracershopState, User } from "~/dataclasses/dataclasses";
import { cleanup, render } from "@testing-library/react";
import { DATA_CLOSED_DATE, WEBSOCKET_MESSAGE_AUTH_WHOAMI, WEBSOCKET_MESSAGE_TYPE } from "~/lib/shared_constants";
import { MessageChannel } from 'node:worker_threads'
import { DATABASE_CURRENT_USER, USER_GROUPS } from "~/lib/constants";
import { db } from "~/lib/local_storage_driver";
import { closed_dates } from "~/tests/test_state/close_dates";
import { compareMaps } from "~/lib/utils";

let server = null

const who_am_i_message = expect.objectContaining({
  [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_AUTH_WHOAMI
});

const websocket_null_fn = jest.fn();
const websocket_not_null_fn = jest.fn();
const stateFunction = jest.fn()


beforeEach(async () => {
  server = new WS('ws://localhost:1234/ws');
  window.MessageChannel = MessageChannel
})

afterEach(async() => {
  server.close();
  WS.clean();
  cleanup();
  jest.clearAllMocks();
  window.localStorage.clear();
})


function WebsocketUser() {
  const websocket = useWebsocket();

  if(websocket) {
    websocket_not_null_fn()
  } else {
    websocket_null_fn()
  }

  return <div></div>
}


function StateUser({stateKeyword}){
  const tracershopState = useTracershopState();
  if(stateKeyword){
    stateFunction(tracershopState[stateKeyword]);
  }

  return <div></div>;
}

describe("Tracershop context test", () => {
  it("Standard no input data", async () => {
    render(<TracerShopContextInitializer websocket_url={'ws://localhost:1234/ws'}>
      <WebsocketUser></WebsocketUser>
    </TracerShopContextInitializer>);

    await server.connected;
    expect(server).toReceiveMessage(who_am_i_message);
    expect(websocket_not_null_fn).toHaveBeenCalledTimes(1);
    expect(websocket_null_fn).toHaveBeenCalledTimes(1);
  });

  it("User set in local storage", () => {
    window.localStorage.setItem(DATABASE_CURRENT_USER, JSON.stringify({
      id : 1,
      username : "blahblah",
      user_group : USER_GROUPS.ADMIN,
      active : true,
    }));

    render(<TracerShopContextInitializer websocket_url={'ws://localhost:1234/ws'}>
      <StateUser stateKeyword={"logged_in_user"}></StateUser>
    </TracerShopContextInitializer>);

    expect(stateFunction).toHaveBeenCalledWith(
      expect.objectContaining({
        id : 1,
        username : "blahblah",
        user_group : USER_GROUPS.ADMIN,
        active : true,
      })
    );
  });

  it("Closed date set in local storage", () => {
    db.set(DATA_CLOSED_DATE, closed_dates);

    render(<TracerShopContextInitializer websocket_url={'ws://localhost:1234/ws'}>
      <StateUser
        stateKeyword={DATA_CLOSED_DATE}
      />
    </TracerShopContextInitializer>);
    expect(stateFunction).toHaveBeenCalled();
    expect(stateFunction.mock.calls[0][0]).toBeInstanceOf(Map);
    expect(compareMaps(stateFunction.mock.calls[0][0], closed_dates));
  });
});


/**
 * These testcases are not testing tracershop code, instead, they are an
 * exploration of the react rendering engine.
 *
 * The goal is create a memories value, that is created lazily and memorized.
 *
 * Okay so very interestingly I changed the build step to include the react
 * compiler. The primary thing that the react compiler does is makes
 * memoization, so dumb programmers like myself doesn't have to make really
 * really convoluted, solutions, where you use two memorization and a reference
 * in order to get good performance.
 */

describe("Context proof of concept test cases", () => {
  const expensive_object_to_construct = {};
  const expensive_object_to_construct_reconstructed = {};
  const expensive_to_call = jest.fn(() => expensive_object_to_construct);
  const context = createContext(null);
  const derived_context = createContext(null);

  //#region USE Function
  function useExpensive(){
    return useContext(context);
  }

  function useDerived(){
    return useContext(derived_context);
  }

  function useDerivedMemo(){
    const expensive = useExpensive();
    return useMemo(() => {
      return expensive_to_call(expensive);
    }, [expensive]);
  }

  function useDerivedRef(){
    const expensive = useExpensive();
    const ref = useDerived();

    if(ref.current === null){
      // This becomes illegal, because the hook useMemo doesn't get called again
      ref.current = useMemo(() => {
        return expensive_to_call(expensive)
      }, [expensive])
    }

    return ref.current;
  }

  function useDerivedFunction(){
    const ref_func = useDerived();
    return ref_func();
  }

  function useClaude(){
    const { source_data, ref } = useDerived();

    return useMemo(() => {
      if(ref.current === null){
        ref.current = expensive_to_call(source_data)
      }
      return ref.current
    }, [source_data]);
  }


  //#region Provider

  /** The simplest example, recalculated at each rerender, even if the value is
   *  not used.
   *
   */
  function StandardProvider({children}){
    const expensive = expensive_to_call();

    return <context.Provider value={expensive}>
      {children}
    </context.Provider>
  }


  /** The wrapping the value in a 'useMemo' example. The value is always
   * calculated, but is never recalculated
   */
  function MemoProvider({children}){
    const expensive = useMemo(() => { return expensive_to_call();}, [])

    return <context.Provider value={expensive}>
      {children}
    </context.Provider>
  }


  function ValueProvider({children, value}){
    return <context.Provider value={value}>
      {children}
    </context.Provider>
  }

  function DerivedProvider({children}){
    const expensive = useExpensive()

    const value = useMemo(() => { return expensive_to_call(expensive) }, [expensive])

    return <derived_context.Provider value={value}>
      {children}
    </derived_context.Provider>
  }

  function DerivedNoMemoProvider({children}){
    const expensive = useExpensive()

    const value = expensive_to_call(expensive);

    return <derived_context.Provider value={value}>
      {children}
    </derived_context.Provider>
  }

  function DerivedRefProvider({children}){
    const ref = useRef(null);
    return <derived_context.Provider value={ref}>
      {children}
    </derived_context.Provider>
  }

  function DerivedFunctionRefProvider({children}){
    const expensive = useExpensive()

    const ref = () => {return useMemo(() => {return expensive_to_call(expensive) }, [expensive])}

    return <derived_context.Provider value={ref}>
      {children}
    </derived_context.Provider>
  }

  function DerivedFunctionceptionRefProvider({children}){
    const expensive = useExpensive()

    const functionCeption = useMemo(() => () => {return expensive_to_call(expensive)}, [expensive])

    return <derived_context.Provider value={functionCeption}>
      {children}
    </derived_context.Provider>
  }

  function DerivedClaudeProvider({children}){
    const source_data = useExpensive();
    const ref = useRef(null);

    const contextValue = useMemo(() => {
      ref.current = null;

      return {
        source_data, ref
      }
    }, [source_data])

    return <derived_context.Provider value={contextValue}>
      {children}
    </derived_context.Provider>
  }

  //#region Context Using Components
  /** A standard component, that is using the default context
   *
   * @param {Object} param0
   * @param {Object} param0.prop_value - Dummy value, used to trigger a rerender
   * @returns
   */
  function Comp({prop_value, contextFunction}){
    if(typeof contextFunction === "function"){
      const expensive = contextFunction();
      expect(Object.is(expensive, expensive_object_to_construct)).toBe(true);
    }

    return <div key={prop_value}>Hello world</div>
  }

  function ClaudeComp({prop_value, use_context}){
    if(use_context){
      const expensive = useClaude();
      expect(Object.is(expensive, expensive_object_to_construct)).toBe(true);
    }

    return <div>Hello world</div>;
  }



  //#region Composite Components
  /** A render test case, where the provider calls the mock
   *
   * This is doesn't fulfill the requirements
   * @param {Object} param0
   * @param {Object} param0.prop_value - Dummy value, used to trigger a rerender
   * @returns
   */
  function StandardApp({prop_value}){
    return (
      <StandardProvider>
        <Comp prop_value={prop_value} contextFunction={useExpensive}/>
        <Comp prop_value={prop_value} contextFunction={useExpensive}/>
      </StandardProvider>
    )
  }

  function StandardNotUsingApp({prop_value}){
    return (
      <StandardProvider>
        <Comp prop_value={prop_value}/>
        <Comp prop_value={prop_value}/>
      </StandardProvider>
    )
  }

  function MemoApp({prop_value}){
    return (
      <MemoProvider>
        <Comp prop_value={prop_value} contextFunction={useExpensive}/>
        <Comp prop_value={prop_value} contextFunction={useExpensive}/>
      </MemoProvider>
    )
  }

  function MemoNotUsingApp({prop_value}){
    return (
      <MemoProvider>
        <Comp prop_value={prop_value}/>
        <Comp prop_value={prop_value}/>
      </MemoProvider>
    )
  }

  /** The first realistic component */
  function DerivedApp({contextValue, prop_value}){
    return (
      <ValueProvider value={contextValue}>
        <DerivedProvider>
          <Comp prop_value={prop_value} contextFunction={useDerived}/>
          <Comp prop_value={prop_value} contextFunction={useDerived}/>
        </DerivedProvider>
      </ValueProvider>
    );
  }

  /** The realistic component */
  // This is the simplest component that fulfil the requirement and simplest to
  // write. Note that this only works because of the react compiler!!!
  function DerivedNoMemoApp({contextValue, prop_value}){
    return (
      <ValueProvider value={contextValue}>
        <DerivedNoMemoProvider>
          <Comp prop_value={prop_value} contextFunction={useDerived}/>
          <Comp prop_value={prop_value} contextFunction={useDerived}/>
        </DerivedNoMemoProvider>
      </ValueProvider>
    );
  }

  /** The first realistic component - not using the context */
  function DerivedNotUsedApp({contextValue, prop_value}){
    return (
      <ValueProvider value={contextValue}>
        <DerivedProvider>
          <Comp prop_value={prop_value}/>
          <Comp prop_value={prop_value}/>
        </DerivedProvider>
      </ValueProvider>
    );
  }

  /** Context wrapping Component where the calculation is done in the "use"
   * call */
  function DerivedCompMemoApp({contextValue, prop_value}){
    return (
      <ValueProvider value={contextValue}>
        <Comp prop_value={prop_value} contextFunction={useDerivedMemo}/>
        <Comp prop_value={prop_value} contextFunction={useDerivedMemo}/>
      </ValueProvider>
    );
  }

  function DerivedRefApp({contextValue, prop_value}){
    return(
      <ValueProvider value={contextValue}>
        <DerivedRefProvider>
          <Comp prop_value={prop_value} contextFunction={useDerivedRef}/>
          <Comp prop_value={prop_value} contextFunction={useDerivedRef}/>
        </DerivedRefProvider>
      </ValueProvider>
    )
  }

  function DerivedFunctionExperimentApp({contextValue, prop_value}){
    return(
      <ValueProvider value={contextValue}>
        <DerivedFunctionRefProvider>
          <Comp prop_value={prop_value} contextFunction={useDerivedFunction}/>
          <Comp prop_value={prop_value} contextFunction={useDerivedFunction}/>
        </DerivedFunctionRefProvider>
      </ValueProvider>
    )
  }

  function DoubleMemoExperimentApp({contextValue, prop_value}){
    return(
      <ValueProvider value={contextValue}>
        <DerivedFunctionceptionRefProvider>
          <Comp prop_value={prop_value} contextFunction={useDerivedFunction}/>
          <Comp prop_value={prop_value} contextFunction={useDerivedFunction}/>
        </DerivedFunctionceptionRefProvider>
      </ValueProvider>
    )
  }

  function ClaudeApp({contextValue, prop_value, use_context=true}){
    return(
      <ValueProvider value={contextValue}>
        <DerivedClaudeProvider>
          <ClaudeComp prop_value={prop_value} use_context={use_context} contextFunction={useClaude}/>
          <ClaudeComp prop_value={prop_value} use_context={use_context} contextFunction={useClaude}/>
        </DerivedClaudeProvider>
      </ValueProvider>
    )
  }

  //#region Testcases

  it("Can I use jest", () => {
    expect(Object.is(expensive_object_to_construct, expensive_to_call())).toBe(true);
  })

  it("Standard value test, calls twice", () => {
    const {rerender} = render(<StandardApp prop_value={1}/>);
    rerender(<StandardApp prop_value={2}/>);
    expect(expensive_to_call).toHaveBeenCalledTimes(1) // 2 without react compiler!
  })

  it("Standard value test, not using still calls twice", () => {
    const {rerender} = render(<StandardNotUsingApp prop_value={1}/>);
    rerender(<StandardNotUsingApp prop_value={2}/>);
    expect(expensive_to_call).toHaveBeenCalledTimes(1) // 2 without the react compiler
  })

  it("useMemo reduces calls to 1", () => {
    const { rerender } = render(<MemoApp prop_value={1}/>)
    rerender(<MemoApp prop_value={2}/>)
    expect(expensive_to_call).toHaveBeenCalledTimes(1);
  })

  it("useMemo Still calls once even when value is not used", () => {
    const { rerender } = render(<MemoNotUsingApp prop_value={1}/>)
    rerender(<MemoNotUsingApp prop_value={2}/>)
    expect(expensive_to_call).toHaveBeenCalledTimes(1);
  });

  it("Derived Context perform similar to useMemo Context, but can rerender on updated contest", () => {
    // This test case should be updated, the react compiler is too smart there
    const { rerender } = render(<DerivedApp contextValue={1} prop_value={1}/>);
    rerender(<DerivedApp contextValue={1} prop_value={2}/>);

    expect(expensive_to_call).toHaveBeenCalledTimes(1);
    rerender(<DerivedApp contextValue={2} prop_value={3}/>);
    expect(expensive_to_call).toHaveBeenCalledTimes(2);
  });

  it("Derived Context without any use Memo calls, fully relying on the compiler", () => {
    // This test case should be updated, the react compiler is too smart there
    const { rerender } = render(<DerivedNoMemoApp contextValue={1} prop_value={1}/>);
    expect(expensive_to_call).toHaveBeenCalledTimes(1);
    rerender(<DerivedNoMemoApp contextValue={1} prop_value={2}/>);
    expect(expensive_to_call).toHaveBeenCalledTimes(1);
    rerender(<DerivedNoMemoApp contextValue={2} prop_value={3}/>);
    expect(expensive_to_call).toHaveBeenCalledTimes(2);
  });

  it("Not using Derived context, perform identical to using", () => {
    const { rerender } = render(<DerivedNotUsedApp contextValue={1} prop_value={1}/>);
    rerender(<DerivedNotUsedApp contextValue={1} prop_value={2}/>);

    expect(expensive_to_call).toHaveBeenCalledTimes(1);
    rerender(<DerivedNotUsedApp contextValue={2} prop_value={3}/>);
    expect(expensive_to_call).toHaveBeenCalledTimes(2);
  });

  it("Offloading useMemo to the use call causes component duplication", () => {
    const { rerender } = render(<DerivedCompMemoApp contextValue={1} prop_value={1}/>);
    expect(expensive_to_call).toHaveBeenCalledTimes(2);
    rerender(<DerivedCompMemoApp contextValue={1} prop_value={2}/>);
    expect(expensive_to_call).toHaveBeenCalledTimes(2); // No calls
    rerender(<DerivedCompMemoApp contextValue={2} prop_value={2}/>);
    expect(expensive_to_call).toHaveBeenCalledTimes(4);
  });


  // The thing is after the react compiler, this becomes illegal, because on
  // of the useMemo calls is hidden.
  it.skip("Derived Component passes a ref", () => {
    const { rerender } = render(<DerivedRefApp contextValue={1} prop_value={1}/>);
    expect(expensive_to_call).toHaveBeenCalledTimes(1);
    rerender(<DerivedRefApp contextValue={1} prop_value={2}/>);
    expect(expensive_to_call).toHaveBeenCalledTimes(1);
    rerender(<DerivedRefApp contextValue={2} prop_value={2}/>);
    expect(expensive_to_call).toHaveBeenCalledTimes(1);
    // Note that this is a huge problem because it means the useMemo is not updated
  });

  it("Wrapping it in a function doesn't change anything", () => {
    const { rerender } = render(<DerivedFunctionExperimentApp contextValue={1} prop_value={1}/>);
    expect(expensive_to_call).toHaveBeenCalledTimes(2);
    rerender(<DerivedFunctionExperimentApp contextValue={1} prop_value={2}/>);
    expect(expensive_to_call).toHaveBeenCalledTimes(2);
    rerender(<DerivedFunctionExperimentApp contextValue={2} prop_value={2}/>);
    expect(expensive_to_call).toHaveBeenCalledTimes(4);
    // This is unusable because you have 1 call for each use call
  });

  it("Functions in functions attempt", () => {
    const { rerender } = render(<DoubleMemoExperimentApp contextValue={1} prop_value={1}/>);
    expect(expensive_to_call).toHaveBeenCalledTimes(2);
    rerender(<DoubleMemoExperimentApp contextValue={1} prop_value={2}/>);
    expect(expensive_to_call).toHaveBeenCalledTimes(2);
    rerender(<DoubleMemoExperimentApp contextValue={2} prop_value={2}/>);
    expect(expensive_to_call).toHaveBeenCalledTimes(4);
    // Note that this is a huge problem because it means the useMemo is not updated
  });

  it("Claude attempt", () => {
    const { rerender } = render(<ClaudeApp contextValue={1} prop_value={1}/>);
    expect(expensive_to_call).toHaveBeenCalledTimes(1);
    rerender(<ClaudeApp contextValue={1} prop_value={2}/>);
    expect(expensive_to_call).toHaveBeenCalledTimes(1);
    rerender(<ClaudeApp contextValue={2} prop_value={2}/>);
    expect(expensive_to_call).toHaveBeenCalledTimes(2);
    // WELL WELL WELL AI to the rescue.
    // It provided the idea, i fixed it's bugs
  });

  it("Claude attempt without renders", () => {
    const { rerender } = render(<ClaudeApp contextValue={1} prop_value={1} use_context={false}/>);
    expect(expensive_to_call).toHaveBeenCalledTimes(0);
    rerender(<ClaudeApp contextValue={1} prop_value={2} use_context={false}/>);
    expect(expensive_to_call).toHaveBeenCalledTimes(0);
    rerender(<ClaudeApp contextValue={2} prop_value={2} use_context={false}/>);
    expect(expensive_to_call).toHaveBeenCalledTimes(0);
    // WELL WELL WELL AI to the rescue.
    // It provided the idea, i fixed it's bugs
  });


})
