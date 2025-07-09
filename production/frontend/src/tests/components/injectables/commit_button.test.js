/**
 * @jest-environment jsdom
 */

import React from "react";
import { act, screen, render, cleanup, fireEvent, getByTestId } from "@testing-library/react";
import { afterEach, jest } from "@jest/globals"
import { CommitButton } from "~/components/injectable/commit_button";
import { TracerShopContext } from "~/contexts/tracer_shop_context";
import { testState } from "~/tests/app_state";

const websocket = {
  sendEditModel : jest.fn(() => Promise.resolve()),
  sendCreateModel : jest.fn(() => Promise.resolve()),
}

afterEach(() => {
  cleanup()
  jest.clearAllMocks()
})


describe("Commit button tests", () => {
  it("intuitive programming test", async () => {
    const temp_object = {id : -1};
    const data_type = "Fake_type"

    render(
       <TracerShopContext websocket={websocket} tracershop_state={testState}>
        <CommitButton
          label="test"
          temp_object={temp_object}
          object_type={data_type}
          validate={
            () => true
          }
        />
      </TracerShopContext>
    );

    await act(async() => {
      screen.getByLabelText("test").click()
    });

    expect(websocket.sendCreateModel).toHaveBeenCalledWith(data_type, temp_object);
  });

  it("modified object programming test", async () => {
    const temp_object = {id : -1};
    const data_type = "Fake_type"
    let modified_object;

    render(
       <TracerShopContext websocket={websocket} tracershop_state={testState}>
        <CommitButton
          label="test"
          temp_object={temp_object}
          object_type={data_type}
          validate={
            () => {
              modified_object = { id : 1 };

              return [true, modified_object]}
          }
        />
      </TracerShopContext>
    );

    await act(async() => {
      screen.getByLabelText("test").click()
    });

    expect(websocket.sendCreateModel).toHaveBeenCalledWith(data_type, modified_object);
  });


  it("modified object programming test", async () => {
    const temp_object = {id : -1};
    const data_type = "Fake_type"
    let modified_object;

    render(
       <TracerShopContext websocket={websocket} tracershop_state={testState}>
        <CommitButton
          label="test"
          temp_object={temp_object}
          object_type={data_type}
          validate={
            () => {
              modified_object = {...temp_object}

              return [false, modified_object]}
          }
        />
      </TracerShopContext>
    );

    await act(async() => {
      screen.getByLabelText("test").click()
    });

    expect(websocket.sendCreateModel).not.toHaveBeenCalled();
  })
});
