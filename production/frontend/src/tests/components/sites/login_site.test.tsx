/**
 * @jest-environment jsdom
 */

import React from "react";

import { act, screen, render, cleanup, fireEvent } from "@testing-library/react";
import { jest, expect, beforeEach, afterEach, describe, it } from '@jest/globals'

import { PROP_SET_USER, PROP_USER, USER_GROUPS  } from "~/lib/constants";
import { AUTH_IS_AUTHENTICATED, DATA_USER, WEBSOCKET_MESSAGE_AUTH_LOGIN } from "~/lib/shared_constants"
import { LoginSite } from "~/components/sites/login_site";

import { ANON } from "../../test_state/users";
import { DispatchContextProvider, WebsocketContextProvider } from "~/contexts/tracer_shop_context";

const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");


let websocket = new tracer_websocket.TracerWebSocket();
let container = null;
let props = null;
const dispatch = jest.fn()

const now = new Date(2020,4, 4, 10, 36, 44)


beforeEach(() => {
  jest.useFakeTimers('modern')
  jest.setSystemTime(now)
});

afterEach(() => {
  cleanup();
  module.clearAllMocks()
  window.localStorage.clear()
});

describe("Login shop test suite", () => {
  it("standard test", () => {
    render(
    <WebsocketContextProvider value={websocket}>
      <LoginSite/>
    </WebsocketContextProvider>);
    expect(screen.getByLabelText('username')).toBeVisible();
    expect(screen.getByLabelText('password')).toBeVisible();
  });

  it("Login test success", async () => {
    const getMessageMock = jest.fn((kw) => ({messageType : kw}))
    const sendMock = jest.fn( () => Promise.resolve({
          [AUTH_IS_AUTHENTICATED] : true,
          [DATA_USER] : { user : [{
            pk : 1,
            fields : {
              username : "username",
              user_group : USER_GROUPS.ADMIN,
              active : true,
            }
          }]}})
        ); // There just so many parentheses...

    websocket = {
      getMessage : getMessageMock,
      send : sendMock
    }

    render(
    <DispatchContextProvider value={dispatch}>
      <WebsocketContextProvider value={websocket}>
        <LoginSite/>
      </WebsocketContextProvider>
    </DispatchContextProvider>);


    act(() => {
      const usernameInput = screen.getByLabelText('username');
      const passwordInput = screen.getByLabelText('password');

      fireEvent.change(usernameInput, {target: {value: 'username'}});
      fireEvent.change(passwordInput, {target: {value: 'password'}});
      fireEvent.click(screen.getByRole('button', {name: /Log in/}))
    });

    await act(async () => {
      await sendMock()
    })


    expect(getMessageMock).toHaveBeenCalledWith(WEBSOCKET_MESSAGE_AUTH_LOGIN);
    expect(sendMock).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ newUser : {
      id : 1,
      username : "username",
      user_group : USER_GROUPS.ADMIN,
      active : true,
    }}));
  });

  it("Login test failed", async () => {
    const getMessageMock = jest.fn((kw) => ({messageType : kw}))
    const sendMock = jest.fn( () => Promise.resolve({
          isAuthenticated : false,

        })); // There just so many parentheses...
    const mockSetUser = jest.fn(() => {})

    websocket = {
      getMessage : getMessageMock,
      send : sendMock
    }

    render(<WebsocketContextProvider value={websocket}>
      <LoginSite/>
    </WebsocketContextProvider>);

    act(() => {
      const usernameInput = screen.getByLabelText('username');
      const passwordInput = screen.getByLabelText('password');

      fireEvent.change(usernameInput, {target: {value: 'username'}});
      fireEvent.change(passwordInput, {target: {value: 'password'}});
      fireEvent.click(screen.getByRole('button', {name: /Log in/}))
    });

    await act(async () => {
      await sendMock()
    })

    expect(getMessageMock).toHaveBeenCalledWith(WEBSOCKET_MESSAGE_AUTH_LOGIN);
    expect(sendMock).toHaveBeenCalled();
    expect(mockSetUser).not.toHaveBeenCalled();
  });
});
