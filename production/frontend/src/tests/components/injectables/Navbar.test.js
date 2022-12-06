/**
 * @jest-environment jsdom
 */

import React from "react";
import { act } from "react-dom/test-utils"
import { createRoot } from "react-dom/client";
import { screen, render, cleanup, fireEvent } from "@testing-library/react";
import Navbar from "../../../components/injectables/Navbar";
import { jest } from '@jest/globals'

let container = null;
let root = null
beforeEach(() => {
  container = document.createElement("div");
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    if(root != null) root.unmount()
  })

  cleanup()

  if(container != null) container.remove();

  container = null;
  root = null;
});

const setActivePage = jest.fn(arg => arg);
const logout = jest.fn();


describe("Navbar Render Test", () => {
  it("Navbar Rendering Test, no Navbar Elements not authed", async () => {
    const names = ["A_name","Another_Name", "Final_name"]

    render(<Navbar
      logout={logout}
      Names={names}
      setActivePage={setActivePage}
      isAuthenticated={false}
    />);

    expect(await screen.findByText(names[0])).toBeVisible();
    expect(await screen.findByText(names[1])).toBeVisible();
    expect(await screen.findByText(names[2])).toBeVisible();
    expect(await screen.queryByText('logout')).toBeNull();
  });

  it("Navbar Rendering Test, Navbar Elements", async () => {
    const names = ["A_name","Another_Name", "Final_name"]

    const injectName = "Injected"

    render(<Navbar
      ActiveKey={names[0]}
      logout={logout}
      Names={names}
      NavbarElements={[<div key={999}>{injectName}</div>]}
      setActivePage={setActivePage}
      isAuthenticated={false}
    />);

    expect(await screen.findByText(injectName)).toBeVisible();
  });

  it("Navbar click Name test", async () => {
    const names = ["A_name","Another_Name", "Final_name"]

    render(<Navbar
      logout={logout}
      Names={names}
      NavbarElements={[]}
      setActivePage={setActivePage}
      isAuthenticated={false}
    />);

    await fireEvent(await screen.findByText(names[0]), new MouseEvent('click', {bubbles: true, cancelable:  true}))

    expect(setActivePage).toHaveBeenCalledWith(names[0])
  });

  it("Navbar click logout", async () => {
    const names = ["A_name","Another_Name", "Final_name"]

    render(<Navbar
      logout={logout}
      Names={names}
      NavbarElements={[]}
      setActivePage={setActivePage}
      isAuthenticated={true}
    />);

    await fireEvent(await screen.findByText('Log ud'), new MouseEvent('click', {bubbles: true, cancelable:  true}))
    expect(logout).toHaveBeenCalled()
  });
});