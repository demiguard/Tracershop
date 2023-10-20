/**
 * @jest-environment jsdom
 */

import React from "react";
import { screen, render, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { jest } from '@jest/globals'
import { CALCULATOR_NEW_ACTIVITY_LABEL, CALCULATOR_NEW_TIME_LABEL, Calculator, ErrorActivityInvalidNumber, ErrorActivityNegative, ErrorActivityZero, ErrorInvalidTimeFormat, ErrorTimeAfterProduction } from "../../../components/injectable/calculator.js"
import { CalculateProduction } from "../../../lib/physics.js"

let container = null;
beforeEach(() => {
  container = document.createElement("div");
});

afterEach(() => {
  cleanup()
  if(container != null) container.remove();


  container = null;
});

const cancel = jest.fn()
const commit = jest.fn((arg) => {return arg} )

const Tracer = {
  isotope : 1,
  short_name : "TestTracer"
};

const defaultMBq = 1337;
const halflife = 6543

const isotopes = new Map([[1, {
  ID: 1,
  halflife_seconds: halflife
}]]);

const productionTime = new Date(2012, 5, 12, 8, 15, 30);

describe("Calculator Test", () =>{
  it("Basic render test", async () => {
    render(<Calculator
      cancel={cancel}
      commit={commit}
      defaultMBq={defaultMBq}
      productionTime={productionTime}
      isotopes={isotopes}
      tracer={Tracer}
    />);

    expect((await screen.findByLabelText(CALCULATOR_NEW_ACTIVITY_LABEL)).value).toEqual(defaultMBq.toString());
    expect((await screen.findByLabelText(CALCULATOR_NEW_TIME_LABEL)).value).toEqual("");
  });

  it("Write Time", async () => {
    render(<Calculator
      cancel={cancel}
      commit={commit}
      defaultMBq={defaultMBq}
      productionTime={productionTime}
      isotopes={isotopes}
      tracer={Tracer}
    />);

    const TimeInput = await screen.findByLabelText(CALCULATOR_NEW_TIME_LABEL)
    fireEvent.change(TimeInput, {target : {value : "0"}})
    expect(TimeInput.value).toEqual("0")
    fireEvent.change(TimeInput, {target : {value : "09"}})
    expect(TimeInput.value).toEqual("09:")
    fireEvent.change(TimeInput, {target : {value : "09:1"}})
    expect(TimeInput.value).toEqual("09:1")
    fireEvent.change(TimeInput, {target : {value : "09:15"}})
    expect(TimeInput.value).toEqual("09:15")
  });

  it("Add Entry - Success", async () => {
    render(<Calculator
      cancel={cancel}
      commit={commit}
      defaultMBq={defaultMBq}
      productionTime={productionTime}
      isotopes={isotopes}
      tracer={Tracer}
    />);

    const TimeInput = await screen.findByLabelText(CALCULATOR_NEW_TIME_LABEL)
    fireEvent.change(TimeInput, {target : {value : "09:15"}})
    const ActivityInput = await screen.findByLabelText(CALCULATOR_NEW_ACTIVITY_LABEL)
    fireEvent.change(ActivityInput, {target : {value : "10000"}});
    fireEvent.click(screen.getByAltText("Tilføj"))

    expect(await screen.findByText("09:15")).toBeVisible()
    expect(await screen.findByText("10000")).toBeVisible()
    expect(await screen.findByLabelText("delete-0")).toBeVisible();

    expect((await screen.findByLabelText(CALCULATOR_NEW_ACTIVITY_LABEL)).value).toEqual(defaultMBq.toString());
    expect((await screen.findByLabelText(CALCULATOR_NEW_TIME_LABEL)).value).toEqual("");
  });

  it("Add Entry - Invalid Time Format", async () => {
    render(<Calculator
      cancel={cancel}
      commit={commit}
      defaultMBq={defaultMBq}
      productionTime={productionTime}
      isotopes={isotopes}
      tracer={Tracer}
    />);
    const TimeInput = await screen.findByLabelText(CALCULATOR_NEW_TIME_LABEL)
    fireEvent.change(TimeInput, {target : {value : ""}})
    const ActivityInput = await screen.findByLabelText(CALCULATOR_NEW_ACTIVITY_LABEL)
    fireEvent.change(ActivityInput, {target : {value : "10000"}});

    fireEvent.click(screen.getByAltText("Tilføj"))

    await waitFor(() =>
      expect(screen.queryByText(ErrorInvalidTimeFormat)).toBeVisible()
    )

  });
  it("Add Entry - Early Ordering", async () => {
    render(<Calculator
      cancel={cancel}
      commit={commit}
      defaultMBq={defaultMBq}
      productionTime={productionTime}
      isotopes={isotopes}
      tracer={Tracer}
    />);
    const TimeInput = await screen.findByLabelText(CALCULATOR_NEW_TIME_LABEL)
    fireEvent.change(TimeInput, {target : {value : "01:15"}})
    const ActivityInput = await screen.findByLabelText(CALCULATOR_NEW_ACTIVITY_LABEL)
    fireEvent.change(ActivityInput, {target : {value : "10000"}});
    fireEvent.click(screen.getByAltText("Tilføj"))

    await waitFor(() => expect(screen.queryByText(ErrorTimeAfterProduction)).toBeVisible());
  });

  it("Add Entry - Empty Activity", async () => {
    render(<Calculator
      cancel={cancel}
      commit={commit}
      defaultMBq={defaultMBq}
      productionTime={productionTime}
      isotopes={isotopes}
      tracer={Tracer}
    />);
    const TimeInput = await screen.findByLabelText(CALCULATOR_NEW_TIME_LABEL)
    fireEvent.change(TimeInput, {target : {value : "09:15"}})
    const ActivityInput = await screen.findByLabelText(CALCULATOR_NEW_ACTIVITY_LABEL)
    fireEvent.change(ActivityInput, {target : {value : ""}});
    fireEvent.click(screen.getByAltText("Tilføj"))

    await waitFor(() => expect(screen.queryByText(ErrorActivityZero)).toBeVisible())
  });

  it("Add Entry - NaN Activity", async () => {
    render(<Calculator
      cancel={cancel}
      commit={commit}
      defaultMBq={defaultMBq}
      productionTime={productionTime}
      isotopes={isotopes}
      tracer={Tracer}
    />);
    const TimeInput = await screen.findByLabelText(CALCULATOR_NEW_TIME_LABEL)
    fireEvent.change(TimeInput, {target : {value : "09:15"}})
    const ActivityInput = await screen.findByLabelText(CALCULATOR_NEW_ACTIVITY_LABEL)
    fireEvent.change(ActivityInput, {target : {value : "helloworld"}});
    fireEvent.click(screen.getByAltText("Tilføj"))

    await waitFor(() => expect(screen.queryByText(ErrorActivityInvalidNumber)).toBeVisible())
  });

  it("Add Entry - 0 Activity", async () => {
    render(<Calculator
      cancel={cancel}
      commit={commit}
      defaultMBq={defaultMBq}
      productionTime={productionTime}
      isotopes={isotopes}
      tracer={Tracer}
    />);
    const TimeInput = await screen.findByLabelText(CALCULATOR_NEW_TIME_LABEL)
    fireEvent.change(TimeInput, {target : {value : "09:15"}})
    const ActivityInput = await screen.findByLabelText(CALCULATOR_NEW_ACTIVITY_LABEL)
    fireEvent.change(ActivityInput, {target : {value : "0"}});
    fireEvent.click(screen.getByAltText("Tilføj"))

    await waitFor(() => expect(screen.queryByText(ErrorActivityZero)).toBeVisible())

  });

  it("Add Entry - Negative Activity", async () => {
    render(<Calculator
      cancel={cancel}
      commit={commit}
      defaultMBq={defaultMBq}
      productionTime={productionTime}
      isotopes={isotopes}
      tracer={Tracer}
    />);
    const TimeInput = await screen.findByLabelText(CALCULATOR_NEW_TIME_LABEL)
    fireEvent.change(TimeInput, {target : {value : "09:15"}})
    const ActivityInput = await screen.findByLabelText(CALCULATOR_NEW_ACTIVITY_LABEL)
    fireEvent.change(ActivityInput, {target : {value : "-10000"}});
    fireEvent.click(screen.getByAltText("Tilføj"))

    await waitFor(() =>
      expect(screen.queryByText(ErrorActivityNegative)).toBeVisible()
    )
  });

  it("Remove Entry", async () => {
    render(<Calculator
      cancel={cancel}
      commit={commit}
      defaultMBq={defaultMBq}
      productionTime={productionTime}
      isotopes={isotopes}
      tracer={Tracer}
    />);

    const TimeInput = screen.getByLabelText(CALCULATOR_NEW_TIME_LABEL)
    fireEvent.change(TimeInput, {target : {value : "09:15"}})
    const ActivityInput = screen.getByLabelText(CALCULATOR_NEW_ACTIVITY_LABEL)
    fireEvent.change(ActivityInput, {target : {value : "10000"}});
    fireEvent.click(screen.getByAltText("Tilføj"))
    fireEvent.click(screen.getByLabelText("delete-0"));

    expect(screen.queryByText("09:15:00")).toBeNull()
    expect(screen.queryByText("10000")).toBeNull()
    expect(screen.queryByLabelText("delete-0")).toBeNull();
  });

  it("Commit Test", async () => {
    render(<Calculator
      cancel={cancel}
      commit={commit}
      defaultMBq={defaultMBq}
      productionTime={productionTime}
      isotopes={isotopes}
      tracer={Tracer}
    />);

    const TimeInput = await screen.findByLabelText(CALCULATOR_NEW_TIME_LABEL)
    const ActivityInput = await screen.findByLabelText(CALCULATOR_NEW_ACTIVITY_LABEL)
    // Sample 1
    fireEvent.change(TimeInput, {target : {value : "09:15"}})
    fireEvent.change(ActivityInput, {target : {value : "10000"}});
    fireEvent.click(screen.getByAltText("Tilføj"));
    // Sample 2
    fireEvent.change(TimeInput, {target : {value : "10:15"}})
    fireEvent.change(ActivityInput, {target : {value : "20000"}});
    fireEvent.click(screen.getByAltText("Tilføj"))

    // Act
    fireEvent.click(screen.queryByRole('button', {name: 'Udregn'}))

    const targetProduction = CalculateProduction(halflife, 60, 10000)
      + CalculateProduction(halflife, 120, 20000);

    expect(commit).toHaveBeenCalledWith(targetProduction);
  })
});