/**
 * @jest-environment jsdom
 */

import React from "react";

import { act, screen, render, cleanup, fireEvent } from "@testing-library/react";
import { jest } from '@jest/globals'
import { AppState } from "../../app_state.js";

import { PROP_SET_USER, PROP_USER, USER_GROUPS  } from "~/lib/constants.js";
import { WEBSOCKET_MESSAGE_AUTH_LOGIN } from "~/lib/shared_constants.js"
import { LoginSite } from "~/components/sites/login_site.js";

import { ANON } from "../../test_state/users.js";
import { DispatchContextProvider, WebsocketContextProvider } from "~/components/tracer_shop_context.js";

const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");


let websocket = null;
let container = null;
let props = null;
const dispatch = jest.fn()

const now = new Date(2020,4, 4, 10, 36, 44)


beforeEach(() => {
  jest.useFakeTimers('modern')
  jest.setSystemTime(now)
  delete window.location
  window.location = { href : "tracershop"}
  container = document.createElement("div");
  websocket = new tracer_websocket.TracerWebSocket();
  props = {...AppState}
  props[PROP_USER] = ANON;
});


afterEach(() => {
  cleanup();
  module.clearAllMocks()
  window.localStorage.clear()
  if(container != null) container.remove();
  container = null;
  websocket = null;
  props = null;
});

describe("Login shop test suite", () => {
  it("standard test", async () => {
    render(
    <WebsocketContextProvider value={websocket}>
      <LoginSite {...props}/>
    </WebsocketContextProvider>);
    expect(await screen.findByLabelText('username')).toBeVisible();
    expect(await screen.findByLabelText('password')).toBeVisible();
  });

  it("Login test success", async () => {
    const getMessageMock = jest.fn((kw) => ({messageType : kw}))
    const sendMock = jest.fn( () => Promise.resolve({
          isAuthenticated : true,
          auth_user : JSON.stringify({ user : [{
            pk : 1,
            fields : {
              username : "username",
              user_group : USER_GROUPS.ADMIN,
              active : true,
            }
          }]})
        })); // There just so many parentheses...

    websocket = {
      getMessage : getMessageMock,
      send : sendMock
    }

    render(
    <DispatchContextProvider value={dispatch}>
      <WebsocketContextProvider value={websocket}>
        <LoginSite {...props}/>
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


    expect(getMessageMock).toBeCalledWith(WEBSOCKET_MESSAGE_AUTH_LOGIN);
    expect(sendMock).toBeCalled();
    expect(dispatch).toBeCalledWith(expect.objectContaining({ newUser : {
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
    props[PROP_SET_USER] = mockSetUser

    render(<WebsocketContextProvider value={websocket}>
      <LoginSite {...props}/>
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

    expect(getMessageMock).toBeCalledWith(WEBSOCKET_MESSAGE_AUTH_LOGIN);
    expect(sendMock).toBeCalled();
    expect(mockSetUser).not.toBeCalled();
  });
})