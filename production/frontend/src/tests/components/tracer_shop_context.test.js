/**
 * @jest-environment jsdom
 */

import { tracershopReducer } from "~/components/tracer_shop_context";
import { TracershopState, User } from "~/dataclasses/dataclasses";
import { ReducerAction, UpdateCurrentUser } from "~/lib/state_actions";

const defaultUser = new User(undefined, 1);

const defaultState = new TracershopState(
  defaultUser
);

describe("Reducer test actions", () => {
  it("Test Unknown action throws", () => {
    expect(() => {
      tracershopReducer(defaultState, new ReducerAction())
    }).toThrow("Unknown action");
  });

  it("Update logged in user", () => {
    const newUser =new User(undefined, 2)

    const newState = tracershopReducer(defaultState, new UpdateCurrentUser(
      newUser
    ));

    expect(newState.logged_in_user).toBe(newUser);
  });

});