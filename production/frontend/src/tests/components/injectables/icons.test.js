/**
 * @jest-environment jsdom
 */

import React from "react";

import { jest } from '@jest/globals'
import { screen, render, cleanup, fireEvent } from "@testing-library/react";
import { ClickableIcon, StatusIcon } from "../../../components/injectable/icons";
import { testState } from "~/tests/app_state";
import { ActivityOrder } from "~/dataclasses/dataclasses";
import { ORDER_STATUS } from "~/lib/constants";

beforeEach(() => {});

afterEach(() => {
  cleanup()
});

const dummyClickable = jest.fn(() => {})

const testOrder = new ActivityOrder(123, 1000, "irrelvant", ORDER_STATUS.ACCEPTED);

describe("Clickable icon tests", () => {
  it("Black Block render test", () => {
    const url = "dummy/url"
    const altText = "altDummy";
    render(<ClickableIcon
      src={url}
      altText={altText}
      onClick={dummyClickable}
      label={"label"}
    />)
    const image = screen.getByAltText(altText);

    expect(image).toHaveAttribute("src", url)
  })

  it("Black Block render click", () => {
    const url = "dummy/url"
    const altText = "altDummy";
    render(<ClickableIcon
      src={url}
      altText={altText}
      onClick={dummyClickable}
      label={"label"}
    />)
    const image = screen.getByAltText(altText);

    fireEvent(image, new MouseEvent('click', {bubbles: true, cancelable: true}));

    expect(dummyClickable).toHaveBeenCalled();
  });
})

describe("Status icon tests", () => {
  it("Black Block render test", () => {
    const url = "/static/images/clipboard2.svg"

    render(<StatusIcon
      order={testOrder}
      onClick={dummyClickable}
      label={"label"}
    />);
    screen.getByLabelText("SVG-/static/images/clipboard2.svg");
  });

  it("Black Block render click", () => {

    render(<StatusIcon
      order={testOrder}
      onClick={dummyClickable}
      label={"label"}
    />)
    const image = screen.getByLabelText("label");

    fireEvent(image, new MouseEvent('click', {bubbles: true, cancelable: true}));

    expect(dummyClickable).toHaveBeenCalled();
  });
});