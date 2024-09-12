/**
 * @jest-environment jsdom
 */

import React from "react";

import { act, screen, render, cleanup, fireEvent } from "@testing-library/react";
import { TracershopNavbar } from "../../../components/injectable/navbar";
import { jest } from '@jest/globals'

beforeEach(() => {

});

afterEach(() => {
  jest.resetAllMocks();
  cleanup()
});

const setActivePage = jest.fn(arg => arg);
const logout = jest.fn();

const NAMES = {
  id_1 : "A name",
  id_2 : "Another Name",
  id_3 : "Final name"
}

describe("Navbar Render Test", () => {
  it("Navbar Rendering Test, no Navbar Elements not authed", () => {
    render(<TracershopNavbar
      logout={logout}
      Names={NAMES}
      setActivePage={setActivePage}
      isAuthenticated={false}
    />);

    for(const identifier of Object.keys(NAMES)){
      expect(screen.getByText(NAMES[identifier])).toBeVisible()
    }
    expect(screen.queryByText('logout')).toBeNull();
  });

  it("Navbar Rendering Test, Navbar Elements", () => {
    const injectName = "Injected";

    render(<TracershopNavbar
      ActiveKey={NAMES[0]}
      logout={logout}
      Names={NAMES}
      NavbarElements={[<div key={999}>{injectName}</div>]} // this should be a button
      setActivePage={setActivePage}
      isAuthenticated={false}
    />);

    expect(screen.getByText(injectName)).toBeVisible();
  });

  it("Navbar click Name test", () => {
    render(<TracershopNavbar
      logout={logout}
      Names={NAMES}
      NavbarElements={[]}
      setActivePage={setActivePage}
      isAuthenticated={false}
    />);

    act(() => {
      fireEvent(screen.getByText(NAMES.id_1), new MouseEvent('click', {bubbles: true, cancelable: true}))
    })

    expect(setActivePage).toHaveBeenCalledWith('id_1')
  });

  it("Navbar click logout", () => {
    render(<TracershopNavbar
      logout={logout}
      Names={NAMES}
      NavbarElements={[]}
      setActivePage={setActivePage}
      isAuthenticated={true}
    />);

    act(() => {
      fireEvent(screen.getByText('Log ud'),
                new MouseEvent('click', {bubbles: true, cancelable:  true}))
    })
    expect(logout).toHaveBeenCalled()
  });
});