/**
 * @jest-environment jsdom
 */

import React from "react";

import { jest } from '@jest/globals'
import { screen, render, cleanup, fireEvent } from "@testing-library/react";
import { ClickableIcon, StatusIcon } from "../../../components/injectable/icons.js";
import { testState } from "~/tests/app_state.js";

beforeEach(() =>  {});

afterEach(() => {
  cleanup()
});

const dummyClickable = jest.fn(() => {})

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
    const url = "/static/images/clipboard1.svg"
    const altText = "altDummy";
    render(<StatusIcon
      order={testState.activity_orders.get(1)}
      altText={altText}
      onClick={dummyClickable}
      label={"label"}
    />)
    const image = screen.getByAltText(altText);

    expect(image).toHaveAttribute("src", url)
  });

  it("Black Block render click", () => {
    const url = "dummy/url"
    const altText = "altDummy";
    render(<StatusIcon
      order={testState.activity_orders.get(1)}
      altText={altText}
      onClick={dummyClickable}
      label={"label"}
    />)
    const image = screen.getByAltText(altText);

    fireEvent(image, new MouseEvent('click', {bubbles: true, cancelable: true}));

    expect(dummyClickable).toHaveBeenCalled();
  });
});