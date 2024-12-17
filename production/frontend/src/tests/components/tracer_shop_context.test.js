/**
 * @jest-environment jsdom
 */

import React from "react";
import { expect, jest, test } from '@jest/globals'
import WS from "jest-websocket-mock"
import { TracerShopContextInitializer, tracershopReducer, useTracershopState, useWebsocket } from "~/contexts/tracer_shop_context";
import { TracershopState, User } from "~/dataclasses/dataclasses";
import { cleanup, render } from "@testing-library/react";
import { DATA_CLOSED_DATE, WEBSOCKET_MESSAGE_AUTH_WHOAMI, WEBSOCKET_MESSAGE_TYPE } from "~/lib/shared_constants";
import { MessageChannel } from 'node:worker_threads'
import { DATABASE_CURRENT_USER, USER_GROUPS } from "~/lib/constants";
import { db } from "~/lib/local_storage_driver";
import { closed_dates } from "~/tests/test_state/close_dates";
import { compareMaps } from "~/lib/utils";

let server = null

const who_am_i_message = expect.objectContaining({
  [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_AUTH_WHOAMI
});

const websocket_null_fn = jest.fn();
const websocket_not_null_fn = jest.fn();
const stateFunction = jest.fn()


beforeEach(async () => {
  server = new WS('ws://localhost:1234/ws');
  window.MessageChannel = MessageChannel
})

afterEach(async() => {

  server.close();
  WS.clean();
  cleanup();
  jest.clearAllMocks();
  window.localStorage.clear();
})


function WebsocketUser() {
  const websocket = useWebsocket();

  if(websocket) {
    websocket_not_null_fn()
  } else {
    websocket_null_fn()
  }

  return <div></div>
}


function StateUser({stateKeyword}){
  const tracershopState = useTracershopState();
  if(stateKeyword){
    stateFunction(tracershopState[stateKeyword]);
  }

  return <div></div>;
}

describe("Tracershop context test", () => {
  it("Standard no input data", async () => {
    render(<TracerShopContextInitializer websocket_url={'ws://localhost:1234/ws'}>
      <WebsocketUser></WebsocketUser>
    </TracerShopContextInitializer>);

    await server.connected;
    expect(server).toReceiveMessage(who_am_i_message);
    expect(websocket_not_null_fn).toHaveBeenCalledTimes(1);
    expect(websocket_null_fn).toHaveBeenCalledTimes(1);
  });

  it("User set in local storage", () => {
    window.localStorage.setItem(DATABASE_CURRENT_USER, JSON.stringify({
      id : 1,
      username : "blahblah",
      user_group : USER_GROUPS.ADMIN,
      active : true,
    }));

    render(<TracerShopContextInitializer websocket_url={'ws://localhost:1234/ws'}>
      <StateUser stateKeyword={"logged_in_user"}></StateUser>
    </TracerShopContextInitializer>);

    expect(stateFunction).toHaveBeenCalledWith(
      expect.objectContaining({
        id : 1,
        username : "blahblah",
        user_group : USER_GROUPS.ADMIN,
        active : true,
      })
    );
  });

  it("Closed date set in local storage", () => {
    db.set(DATA_CLOSED_DATE, closed_dates);

    render(<TracerShopContextInitializer websocket_url={'ws://localhost:1234/ws'}>
      <StateUser
        stateKeyword={DATA_CLOSED_DATE}
      />
    </TracerShopContextInitializer>);
    expect(stateFunction).toHaveBeenCalled();
    expect(stateFunction.mock.calls[0][0]).toBeInstanceOf(Map);
    expect(compareMaps(stateFunction.mock.calls[0][0], closed_dates));
  });
});
