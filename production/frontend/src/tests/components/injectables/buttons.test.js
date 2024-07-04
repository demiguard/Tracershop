/**
 * @jest-environment jsdom
 */

import React from "react";
import { act, screen, render, cleanup, fireEvent, getByTestId } from "@testing-library/react";
import { jest } from '@jest/globals'
import { MarginButton, CloseButton } from "../../../components/injectable/buttons.js";

import styles from '../../../css/Site.module.css'

let container = null;
beforeEach(() => {
  container = document.createElement("div");
});

afterEach(() => {
  cleanup()

  if(container != null) container.remove();

  container = null;
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
    render(<CloseButton data-testid="test"/>)
    const button = screen.getByTestId("test")
    expect(screen.queryByText("Luk")).toBeVisible();
    const style = getComputedStyle(button);
    expect(style.marginRight).toBe("10px");
    expect(style.marginLeft).toBe("10px");
  })
})