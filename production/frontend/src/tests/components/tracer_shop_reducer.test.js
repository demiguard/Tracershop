/**
 * @jest-environment jsdom
 */

import { jest, expect } from '@jest/globals'
import { tracershopReducer } from "~/contexts/tracer_shop_context";
import { ClosedDate, TracershopState, User } from "~/dataclasses/dataclasses";
import { DeleteState, ReducerAction, UpdateCurrentUser, UpdateState, UpdateToday } from "~/lib/state_actions";
import { DATA_CLOSED_DATE, WEBSOCKET_DATE, WEBSOCKET_MESSAGE_GET_ORDERS, WEBSOCKET_MESSAGE_TYPE } from "~/lib/shared_constants";
import { compareDates } from '~/lib/utils';

const defaultUser = new User(undefined, 1);

const defaultState = new TracershopState(
  defaultUser, new Date(2024,10,6), undefined, undefined, new Map([
    [1, new ClosedDate(1, "2011-11-22")]
  ])
);

const websocketMock = {
  send : jest.fn()
}

describe("Reducer test actions", () => {
  it("Test Unknown action throws", () => {
    expect(() => {
      tracershopReducer(defaultState, new ReducerAction())
    }).toThrow("Unknown action");
  });

  it("Update logged in user", () => {
    const newUser = new User(undefined, 2)

    const newState = tracershopReducer(defaultState, new UpdateCurrentUser(
      newUser
    ));

    expect(newState.logged_in_user).toBe(newUser);
  });

  it("Update default state remove old state", () => {
    const newState = tracershopReducer(defaultState, new UpdateState({
      [DATA_CLOSED_DATE] : JSON.stringify([
        { pk : 2, fields : { closed_date : "2024-11-06"}}])
    }, true));

    expect(newState.closed_date).toBeInstanceOf(Map)
    expect(newState.closed_date.has(1)).toBeFalsy();
    expect(newState.closed_date.has(2)).toBeTruthy();
    expect(newState.closed_date.get(2)).toBeInstanceOf(ClosedDate);
  });

  it("Update default state keep old state", () => {
    const newState = tracershopReducer(defaultState, new UpdateState({
      [DATA_CLOSED_DATE] : JSON.stringify([
        { pk : 2, fields : { closed_date : "2024-11-06"}}])
    }, false));

    expect(newState.closed_date).toBeInstanceOf(Map)
    expect(newState.closed_date.has(1)).toBeTruthy();
    expect(newState.closed_date.get(1)).toBeInstanceOf(ClosedDate);
    expect(newState.closed_date.has(2)).toBeTruthy();
    expect(newState.closed_date.get(2)).toBeInstanceOf(ClosedDate);
  });

  it("Delete a closed date, single element", () => {
    const newState = tracershopReducer(defaultState, new DeleteState(
      DATA_CLOSED_DATE, 1
    ));

    expect(newState.closed_date).toBeInstanceOf(Map)
    expect(newState.closed_date.has(1)).toBeFalsy();
  });

  it("Delete a closed date, iterator", () => {
    const newState = tracershopReducer(defaultState, new DeleteState(
      DATA_CLOSED_DATE, [1]
    ));

    expect(newState.closed_date).toBeInstanceOf(Map)
    expect(newState.closed_date.has(1)).toBeFalsy();
  });

  it("Update Today, with websocket", async () => {
    const newState = tracershopReducer(defaultState, new UpdateToday(
      "2021-01-22", websocketMock
    ));

    expect(compareDates(newState.today, new Date(2021, 0, 22))).toBeTruthy()

    expect(websocketMock.send).toHaveBeenCalledWith(
      expect.objectContaining({
        [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_GET_ORDERS,
        [WEBSOCKET_DATE] : new Date("2021-01-22")
      })
    )
  });

  it("Update Today, without websocket", async () => {

  });
});