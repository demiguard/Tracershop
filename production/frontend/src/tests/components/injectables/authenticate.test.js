/**
 * @jest-environment jsdom
 */

import React from "react";
import { act, screen, render, cleanup, fireEvent } from "@testing-library/react";
import { jest } from '@jest/globals'
import { Authenticate } from "../../../components/injectable/authenticate"
import { RecoverableError } from "~/lib/error_handling";

beforeEach(() => {});

afterEach(() => {
  cleanup()
  jest.resetAllMocks()
});

const Auth = jest.fn((val1, val2) => Promise.resolve());

describe("Authenticate Test Suite", () => {
  it("Base Test", () => {
    const headerMessage = "header";
    const errorMessage = "error";

    render(<Authenticate
      authenticate={Auth}
      error={new RecoverableError(
        errorMessage
      )}
      headerMessage={headerMessage}
      fit_in={true}
    />);

    expect(screen.getByText(headerMessage)).toBeVisible();
    expect(screen.getByText(errorMessage)).toBeVisible();
    expect((screen.getByLabelText("username")).value).toEqual("");
    expect((screen.getByLabelText("password")).value).toEqual("");
    expect(screen.getByRole('button', {name: /Log in/})).toBeVisible();
  });

  it("Authenticate Test", async () => {
    const Auth = jest.fn(() => Promise.resolve());
    const headerMessage = "header";
    const username = "testUsers"
    const password = "testPassword"

    render(<Authenticate
      authenticate={Auth}
      headerMessage={headerMessage}
      fit_in={true}
    />);

    await act(async () => {
      fireEvent.change(screen.getByLabelText("username"), {target: {value: username}});
      fireEvent.change(screen.getByLabelText("password"), {target: {value: password}});
      fireEvent.click(screen.getByRole('button', {name: /Log in/}))
    })

    expect(Auth).toHaveBeenCalledWith(username, password);
  });

  it("Authenticate no password Test", async () => {
    const headerMessage = "header";
    const username = "testUsers"

    const setErrorMock = jest.fn();

    render(<Authenticate
      authenticate={Auth}
      setError={setErrorMock}
      headerMessage={headerMessage}
      fit_in={true}
    />);

    await act(async () => {
      fireEvent.change(screen.getByLabelText("username"), {target: {value: username}});
      fireEvent.click(screen.getByRole('button', {name: /Log in/}))
    })

    expect(setErrorMock).toHaveBeenCalled()
    expect(Auth).not.toHaveBeenCalled();
  });

  it("Spinner Test", () => {
    const username = "testUsers";
    const password = "testPassword";

    const Auth = jest.fn(() => new Promise(() => {}));

    const headerMessage = "header";
    render(<Authenticate
      authenticate={Auth}
      headerMessage={headerMessage}
      fit_in={false}
    />);

    act(() => {
      fireEvent.change(screen.getByLabelText("username"), {target: {value: username}});
      fireEvent.change(screen.getByLabelText("password"), {target: {value: password}});
    })

    act(() => {
      screen.getByRole('button', {name: /Log in/}).click()
    })

    expect(screen.queryByRole('button', {name: /Log in/})).toBeNull();
  });
})
