/**
 * @jest-environment jsdom
 */

import React from "react";
import { act, screen, render, cleanup, fireEvent, getByTestId } from "@testing-library/react";
import { describe, jest } from '@jest/globals'
import { MarginButton, CloseButton, IdempotentButton } from "~/components/injectable/buttons";

beforeEach(() => {});

afterEach(() => {
  cleanup()
});

describe("Margin Button Test", () => {
  it("Render Base test", () =>{
    render(<MarginButton data-testid="test">HelloWorld</MarginButton>)
    const button = screen.getByTestId("test")
    expect(screen.queryByText("HelloWorld")).toBeVisible();
    const style = getComputedStyle(button);
    expect(style.marginRight).toBe("10px");
    expect(style.marginLeft).toBe("10px");
  })

  it("Extending of Class Name", () =>{
    render(<MarginButton className="testClass" data-testid="test">HelloWorld</MarginButton>)
    const button = screen.getByTestId("test")
    expect(screen.queryByText("HelloWorld")).toBeVisible();
    const style = getComputedStyle(button);
    expect(style.marginRight).toBe("10px");
    expect(style.marginLeft).toBe("10px");
  })

  it("Click function", () => {
    const mock = jest.fn();
    render(<MarginButton data-testid="test" onClick={mock}>asd</MarginButton>)
    const button = screen.getByTestId("test")
    fireEvent.click(button)
    expect(mock).toHaveBeenCalled()
  })
})

describe("Close Button Test", () => {
  it("Render Base test", () =>{
    const mockf = jest.fn(() => {})
    render(<CloseButton onClick={mockf} data-testid="test"/>)
    const button = screen.getByTestId("test")
    expect(screen.queryByText("Luk")).toBeVisible();
    const style = getComputedStyle(button);
    expect(style.marginRight).toBe("10px");
    expect(style.marginLeft).toBe("10px");

    act(() => {
      screen.getByRole('button', {"name" : "Luk"}).click()
    });

    expect(mockf).toHaveBeenCalledTimes(1);
  })
})

describe("IdempotentButton test suite", () => {
  it("Double clicks - single call", async () => {
    const onClickFunction = jest.fn(() => new Promise(() => {}));

    render(
      <IdempotentButton onClick={onClickFunction}>
        Test button
      </IdempotentButton>
    );

    expect(screen.getByRole('button', {name : "Test button"})).toBeVisible();

    await act(async () => {
      screen.getByRole('button', {name : "Test button"}).click();
      screen.getByRole('button', {name : "Test button"}).click();
    })

    expect(onClickFunction).toHaveBeenCalledTimes(1)
  });

  it("Resolving Promises should reset the button", async () => {
    let promiseResolver;
    const mockOnClick = jest.fn(() => new Promise(
      resolve => {promiseResolver = resolve;}
    ));

    render(
      <IdempotentButton onClick={mockOnClick}>
        Test button
      </IdempotentButton>
    );

    await act(async () => {
      screen.getByRole('button', {name : "Test button"}).click();
    });

    expect(screen.queryByRole('button', {name : "Test button"})).toBeNull();
    expect(screen.getByTestId('idempotent-spinner')).toBeVisible();

    await act(async () => {
      promiseResolver();
    });

    expect(screen.getByRole('button', {name : "Test button"})).toBeVisible();
    expect(screen.queryByTestId('idempotent-spinner')).toBeNull();
  })


  it('handles non-promise onClick and shows error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const mockOnClick = jest.fn(() => { return "Not a promise"; });
    render(
      <IdempotentButton onClick={mockOnClick}>
        Test button
      </IdempotentButton>
    );

    await act( async () => {
      screen.getByRole('button', {name : "Test button"}).click();
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      "Idempotent Button didn't return a Promise as it should!"
    );

    consoleSpy.mockRestore();
  });

});