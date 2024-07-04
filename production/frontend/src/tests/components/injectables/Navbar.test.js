/**
 * @jest-environment jsdom
 */

import React from "react";

import { createRoot } from "react-dom/client";
import { act, screen, render, cleanup, fireEvent } from "@testing-library/react";
import { TracershopNavbar } from "../../../components/injectable/navbar";
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

const NAMES = {
  id_1 : "A name",
  id_2 : "Another Name",
  id_3 : "Final name"
}


describe("Navbar Render Test", () => {
  it("Navbar Rendering Test, no Navbar Elements not authed", async () => {
    const names = ["A_name","Another_Name", "Final_name"]

    render(<TracershopNavbar
      logout={logout}
      Names={NAMES}
      setActivePage={setActivePage}
      isAuthenticated={false}
    />);

    for(const identifier of Object.keys(NAMES)){
      expect(await screen.findByText(NAMES[identifier])).toBeVisible()
    }
    expect(screen.queryByText('logout')).toBeNull();
  });

  it("Navbar Rendering Test, Navbar Elements", async () => {
    const injectName = "Injected"

    render(<TracershopNavbar
      ActiveKey={NAMES[0]}
      logout={logout}
      Names={NAMES}
      NavbarElements={[<div key={999}>{injectName}</div>]} // this should be a button
      setActivePage={setActivePage}
      isAuthenticated={false}
    />);

    expect(await screen.findByText(injectName)).toBeVisible();
  });

  it("Navbar click Name test", async () => {
    render(<TracershopNavbar
      logout={logout}
      Names={NAMES}
      NavbarElements={[]}
      setActivePage={setActivePage}
      isAuthenticated={false}
    />);

    await act(async () => {
      fireEvent(await screen.findByText(NAMES.id_1), new MouseEvent('click', {bubbles: true, cancelable: true}))
    })

    expect(setActivePage).toHaveBeenCalledWith('id_1')
  });

  it("Navbar click logout", async () => {
    render(<TracershopNavbar
      logout={logout}
      Names={NAMES}
      NavbarElements={[]}
      setActivePage={setActivePage}
      isAuthenticated={true}
    />);

    await act(async () => {
      fireEvent(await screen.findByText('Log ud'),
                new MouseEvent('click', {bubbles: true, cancelable:  true}))
    })
    expect(logout).toHaveBeenCalled()
  });
});