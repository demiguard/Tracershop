import React from 'react'
import { jest, afterEach, describe } from '@jest/globals'
import { RecoverableError, useErrorState } from '~/lib/error_handling';
import { Button } from 'react-bootstrap';
import { cleanup, render, act, screen } from '@testing-library/react';
import { ERROR_LEVELS } from '~/components/injectable/alert_box';


afterEach(() => {
  cleanup()
  jest.resetAllMocks();
})

const mockFunction = jest.fn()

const ERROR_MESSAGE_1 = "BLAH BLAH BLAH";
const ERROR_MESSAGE_2 = "BLAH BLAH BLAH BLAH";
const ERROR_MESSAGE_3 = "BLAH BLAH BLAH BLAH BLAH";
const ERROR_MESSAGE_4 = "BLAH BLAH BLAH BLAH BLAH BLAH";

function TestComponent(){
  const [error, setError] = useErrorState();

  function function_undefined(){
    setError();
  }

  function function_empty_string(){
    setError("");
  }

  function function_string(){
    setError(ERROR_MESSAGE_1);
  }

  function function_recoverable_error(){
    setError(new RecoverableError(ERROR_MESSAGE_2, ERROR_LEVELS.hint));
  }

  function function_undefined_function(){
    setError(() => {});
  }

  function function_string_function(){
    setError(() => ERROR_MESSAGE_3);
  }

  function function_recoverable_error_function(){
    setError(() => new RecoverableError(ERROR_MESSAGE_4));
  }

  mockFunction(error);

  return <div>
    <Button onClick={function_undefined}>trigger function 1</Button>
    <Button onClick={function_empty_string}>trigger function 2</Button>
    <Button onClick={function_string}>trigger function 3</Button>
    <Button onClick={function_recoverable_error}>trigger function 4</Button>
    <Button onClick={function_undefined_function}>trigger function 5</Button>
    <Button onClick={function_string_function}>trigger function 6</Button>
    <Button onClick={function_recoverable_error_function}>trigger function 7</Button>
  </div>
}


describe("error handling", () => {
  it("Error Handling test undefined", () => {
    render(<TestComponent></TestComponent>);
    expect(mockFunction).toHaveBeenCalledTimes(1);
    act(() => {
      screen.getByRole('button', { name : "trigger function 1"}).click();
    })

    expect(mockFunction).toHaveBeenCalledTimes(2);
    expect(mockFunction.mock.calls[1][0] instanceof RecoverableError).toBe(true);
    expect(mockFunction.mock.calls[1][0].message).toBe("");
    expect(mockFunction.mock.calls[1][0].level).toBe(ERROR_LEVELS.NO_ERROR);
  });

  it("Error Handling test empty string", () => {
    render(<TestComponent></TestComponent>);
    expect(mockFunction).toHaveBeenCalledTimes(1);
    act(() => {
      screen.getByRole('button', { name : "trigger function 2"}).click();
    })

    expect(mockFunction).toHaveBeenCalledTimes(2);
    expect(mockFunction.mock.calls[1][0] instanceof RecoverableError).toBe(true);
    expect(mockFunction.mock.calls[1][0].message).toBe("");
    expect(mockFunction.mock.calls[1][0].level).toBe(ERROR_LEVELS.NO_ERROR);
  });

  it("Error Handling test string", () => {
    render(<TestComponent></TestComponent>);
    expect(mockFunction).toHaveBeenCalledTimes(1);
    act(() => {
      screen.getByRole('button', { name : "trigger function 3"}).click();
    })

    expect(mockFunction).toHaveBeenCalledTimes(2);
    expect(mockFunction.mock.calls[1][0] instanceof RecoverableError).toBe(true);
    expect(mockFunction.mock.calls[1][0].message).toBe(ERROR_MESSAGE_1);
    expect(mockFunction.mock.calls[1][0].level).toBe(ERROR_LEVELS.error);
  });

  it("Error Handling test recoverable errror", () => {
    render(<TestComponent></TestComponent>);
    expect(mockFunction).toHaveBeenCalledTimes(1);
    act(() => {
      screen.getByRole('button', { name : "trigger function 4"}).click();
    })

    expect(mockFunction).toHaveBeenCalledTimes(2);
    expect(mockFunction.mock.calls[1][0] instanceof RecoverableError).toBe(true);
    expect(mockFunction.mock.calls[1][0].message).toBe(ERROR_MESSAGE_2);
    expect(mockFunction.mock.calls[1][0].level).toBe(ERROR_LEVELS.hint);
  });

  it("Error Handling test undefined function", () => {
    render(<TestComponent></TestComponent>);
    expect(mockFunction).toHaveBeenCalledTimes(1);
    act(() => {
      screen.getByRole('button', { name : "trigger function 5"}).click();
    })

    expect(mockFunction).toHaveBeenCalledTimes(2);
    expect(mockFunction.mock.calls[1][0] instanceof RecoverableError).toBe(true);
    expect(mockFunction.mock.calls[1][0].message).toBe("");
    expect(mockFunction.mock.calls[1][0].level).toBe(ERROR_LEVELS.NO_ERROR);
  });

  it("Error Handling test string function", () => {
    render(<TestComponent></TestComponent>);
    expect(mockFunction).toHaveBeenCalledTimes(1);
    act(() => {
      screen.getByRole('button', { name : "trigger function 6"}).click();
    })

    expect(mockFunction).toHaveBeenCalledTimes(2);
    expect(mockFunction.mock.calls[1][0] instanceof RecoverableError).toBe(true);
    expect(mockFunction.mock.calls[1][0].message).toBe(ERROR_MESSAGE_3);
    expect(mockFunction.mock.calls[1][0].level).toBe(ERROR_LEVELS.error);
  });

  it("Error Handling test recoverable error function", () => {
    render(<TestComponent></TestComponent>);
    expect(mockFunction).toHaveBeenCalledTimes(1);
    act(() => {
      screen.getByRole('button', { name : "trigger function 7"}).click();
    })

    expect(mockFunction).toHaveBeenCalledTimes(2);
    expect(mockFunction.mock.calls[1][0] instanceof RecoverableError).toBe(true);
    expect(mockFunction.mock.calls[1][0].message).toBe(ERROR_MESSAGE_4);
    expect(mockFunction.mock.calls[1][0].level).toBe(ERROR_LEVELS.error);
  });

  it("Recoverable error Conversions", () => {
    const no_error = new RecoverableError()
    const error = new RecoverableError(ERROR_MESSAGE_1);

    expect(no_error.is_error()).toBe(false);
    expect(error.is_error()).toBe(true);
  })

});