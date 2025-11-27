/**
 * @jest-environment jsdom
 */

import React from "react";

import { jest, expect } from '@jest/globals'
import { screen, render, cleanup, fireEvent } from "@testing-library/react";
import { CalculatorIcon, ClickableIcon, StatusIcon } from "../../../components/injectable/icons";
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
    const url = "dummy/url";
    const alt = "altDummy";
    render(<ClickableIcon
      src={url}
      alt={alt}
      onClick={dummyClickable}
      aria-label={"label"}
    />)
    const image = screen.getByAltText(alt);

    expect(image).toHaveAttribute("src", url)
  })

  it("Black Block render click", () => {
    const url = "dummy/url";
    const altText = "altDummy";
    render(<ClickableIcon
      src={url}
      alt={altText}
      onClick={dummyClickable}
      aria-label={"label"}
    />)
    const image = screen.getByAltText(altText);

    fireEvent(image, new MouseEvent('click', {bubbles: true, cancelable: true}));

    expect(dummyClickable).toHaveBeenCalled();
  });

  it("We can find an icon with test_id", () => {
    render(<ClickableIcon src="dummy" data-testid="HelloWorld"/>)
    expect(screen.queryByTestId("HelloWorld")).not.toBeNull();
  });

  it("We can find Calculator Icon with test_id", () => {
    render(<CalculatorIcon data-testid="HelloWorld"/>)
    expect(screen.queryByTestId("HelloWorld")).not.toBeNull();
  });
})

describe("Status icon tests", () => {
  it("Black Block render test", () => {
    render(<StatusIcon
      order={testOrder}
      onClick={dummyClickable}
      aria-label={"label"}
    />);
    screen.getByLabelText("SVG-/static/images/clipboard2.svg");
  });

  it("Black Block render click", () => {
    render(<StatusIcon
      order={testOrder}
      onClick={dummyClickable}
      aria-label={"label"}
    />);
    const image = screen.getByLabelText("label");

    fireEvent(image, new MouseEvent('click', {bubbles: true, cancelable: true}));

    expect(dummyClickable).toHaveBeenCalled();
  });
});