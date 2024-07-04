/**
 * @jest-environment jsdom
 */

import React from "react";
import { createRoot } from "react-dom/client";
import { act, screen, render, cleanup, fireEvent } from "@testing-library/react";
import { jest } from '@jest/globals'
import { Authenticate } from "../../../components/injectable/authenticate.js"


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

const Auth = jest.fn((val1, val2) => {})

describe("Authenticate Test Suite", () => {
  it("Base Test", async () => {
    const headerMessage = "header";
    const errorMessage = "error";

    render(<Authenticate
      authenticate={Auth}
      errorMessage={errorMessage}
      headerMessage={headerMessage}
      fit_in={true}
      spinner={false}
    />);

    expect(await screen.findByText(headerMessage)).toBeVisible();
    expect(await screen.findByText(errorMessage)).toBeVisible();
    expect((await screen.findByLabelText("username")).value).toEqual("");
    expect((await screen.findByLabelText("password")).value).toEqual("");
    expect(await screen.getByRole('button', {name: /Log in/})).toBeVisible();
  });

  it("Authenticate Test", async () => {
    const headerMessage = "header";
    const errorMessage = "error";
    const username = "testUsers"
    const password = "testPassword"

    render(<Authenticate
      authenticate={Auth}
      errorMessage={""}
      headerMessage={headerMessage}
      fit_in={true}
      spinner={false}
    />);

    fireEvent.change(await screen.findByLabelText("username"), {target: {value: username}});
    fireEvent.change(await screen.findByLabelText("password"), {target: {value: password}});
    fireEvent.click(screen.getByRole('button', {name: /Log in/}))

    expect(Auth).toHaveBeenCalledWith(username, password);
  })
  it("Spinner Test", () => {
    const headerMessage = "header";
    render(<Authenticate
      authenticate={Auth}
      errorMessage={""}
      headerMessage={headerMessage}
      fit_in={false}
      spinner={true}
    />);

    expect(screen.queryByRole('button', {name: /Log in/})).toBeNull();
  });
})
