/**
 * @jest-environment jsdom
 */


import React, {useState} from "react";
import { act } from "react-dom/test-utils"
import { screen, render, cleanup, fireEvent } from "@testing-library/react";
import { jest } from '@jest/globals'
import { DestinationSelect } from "../../../../components/injectable/derived_injectables/destination_select";
import { customers } from "../../../test_state/customers";
import { deliveryEndpoints } from "../../../test_state/delivery_endpoints";
import { activityDeliveryTimeSlots } from "../../../test_state/activity_delivery_time_slots";
import { StateContextProvider } from "~/components/tracer_shop_context";
import { testState } from "~/tests/app_state";

let container = null;

beforeEach(() => {
  container = document.createElement("div");
});

afterEach(() => {
  cleanup();
  window.localStorage.clear()
  if(container != null) container.remove();
  container = null;
});
const customerLabel = "customer-select"
const endpointLabel = "endpoint-select"
const timeSlotLabel = "timeslot-select"

const mockSetCustomer = jest.fn((val) => val);
const mockSetEndpoint = jest.fn((val) => val);
const mockSetTimeSlot = jest.fn((val) => val);


function StateHolder({
  customers, mockSetCustomer,
  endpoints, mockSetEndpoint,
  timeSlots, mockSetTimeSlot,
}){
  const [customer, _setCustomer] = useState(1);
  const [endpoint, _setEndpoint] = useState(1);
  const [timeSlot, _setTimeSlot] = useState(1);

  function setCustomer(val) {
    mockSetCustomer(val)
    _setCustomer(val)
  }
  function setEndpoint(val) {
    mockSetEndpoint(val)
    _setEndpoint(val)
  }
  function setTimeSlot(val) {
    mockSetTimeSlot(val)
    _setTimeSlot(val)
  }

  return (
    <StateContextProvider value={testState}>
      <DestinationSelect
        ariaLabelCustomer="customer-select"
        ariaLabelEndpoint="endpoint-select"
        ariaLabelTimeSlot="timeslot-select"
        activeCustomer={customer}
        activeEndpoint={endpoint}
        activeTimeSlot={timeSlot}
        customers={customers}
        endpoints={endpoints}
        timeSlots={timeSlots}
        setCustomer={setCustomer}
        setEndpoint={setEndpoint}
        setTimeSlot={setTimeSlot}
      />
    </StateContextProvider>);
}

describe("DestinationSelect", () => {
  it("Standard Render Test", () => {
    render(
    <StateHolder
      customers={customers}
      endpoints={deliveryEndpoints}
      timeSlots={activityDeliveryTimeSlots}
      mockSetCustomer={mockSetCustomer}
      mockSetEndpoint={mockSetEndpoint}
      mockSetTimeSlot={mockSetTimeSlot}
      />
    );

    expect(screen.getByLabelText(customerLabel)).toBeVisible();
    expect(screen.getByLabelText(endpointLabel)).toBeVisible();
    expect(screen.getByLabelText(timeSlotLabel)).toBeVisible();

    expect(screen.getByText(customers.get(1).short_name))
    expect(screen.getByText(`${customers.get(1).short_name} - ${deliveryEndpoints.get(1).name}`))
    expect(screen.getByText(activityDeliveryTimeSlots.get(1).delivery_time))
  });

  it("Change TimeSlot",  () => {
    render(<StateHolder
      customers={customers}
      endpoints={deliveryEndpoints}
      timeSlots={activityDeliveryTimeSlots}
      mockSetCustomer={mockSetCustomer}
      mockSetEndpoint={mockSetEndpoint}
      mockSetTimeSlot={mockSetTimeSlot}
    />)

    act(() => {
      const timeSlotSelect = screen.getByLabelText(timeSlotLabel);
      fireEvent.change(timeSlotSelect, {target : {value : "2"}});
    });

    expect(screen.getAllByText(activityDeliveryTimeSlots.get(2).delivery_time).length).toBeGreaterThanOrEqual(1);
    expect(mockSetTimeSlot).toHaveBeenCalledWith(2);
  });

  it("Change endpoint", () => {
    render(<StateHolder
      customers={customers}
      endpoints={deliveryEndpoints}
      timeSlots={activityDeliveryTimeSlots}
      mockSetCustomer={mockSetCustomer}
      mockSetEndpoint={mockSetEndpoint}
      mockSetTimeSlot={mockSetTimeSlot}
    />)

    act(() => {
      const endpointSelect = screen.getByLabelText(endpointLabel);
      fireEvent.change(endpointSelect, {target : {value : "2"}});
    });

    expect(screen.getByText(`${customers.get(1).short_name} - ${deliveryEndpoints.get(2).name}`))
    expect(mockSetEndpoint).toHaveBeenCalledWith(2);
  });

  it("Change customer with Cascades", () => {
    render(<StateHolder
      customers={customers}
      endpoints={deliveryEndpoints}
      timeSlots={activityDeliveryTimeSlots}
      mockSetCustomer={mockSetCustomer}
      mockSetEndpoint={mockSetEndpoint}
      mockSetTimeSlot={mockSetTimeSlot}
    />);

    act(() => {
      const customerSelect = screen.getByLabelText(customerLabel);
      fireEvent.change(customerSelect, {target : {value : "3"}});
    });

    expect(screen.getByText(customers.get(3).short_name));
    expect(screen.getByText(`${customers.get(3).short_name} - ${deliveryEndpoints.get(4).name}`));
    expect(screen.getByText(activityDeliveryTimeSlots.get(3).delivery_time));

    expect(mockSetCustomer).toHaveBeenCalledWith(3);
    expect(mockSetEndpoint).toHaveBeenCalledWith(4);
    expect(mockSetTimeSlot).toHaveBeenCalledWith(4);
  });

  it("Minimal Standard Render Test", () => {
    render(<StateHolder
      customers={customers}
      endpoints={deliveryEndpoints}
      mockSetTimeSlot={mockSetTimeSlot}
      mockSetCustomer={mockSetCustomer}
      mockSetEndpoint={mockSetEndpoint}
    />);

    expect(screen.getByLabelText(customerLabel)).toBeVisible();
    expect(screen.getByLabelText(endpointLabel)).toBeVisible();
    expect(screen.getByText(customers.get(1).short_name));
    expect(screen.getByText(`${customers.get(1).short_name} - ${deliveryEndpoints.get(1).name}`));
  });


  it("Minimal Change endpoint", () => {
    render(<StateHolder
      customers={customers}
      endpoints={deliveryEndpoints}
      mockSetCustomer={mockSetCustomer}
      mockSetEndpoint={mockSetEndpoint}
      mockSetTimeSlot={mockSetTimeSlot}
    />);

    act( () => {
      const endpointSelect = screen.getByLabelText(endpointLabel);
      fireEvent.change(endpointSelect, {target : {value : "2"}});
    });

    expect(screen.getByText(`${customers.get(1).short_name} - ${deliveryEndpoints.get(2).name}`)).toBeVisible();
    expect(mockSetEndpoint).toHaveBeenCalledWith(2);
  });

  it("Minimal Change customer with Cascades", () => {
    render(<StateHolder
      customers={customers}
      endpoints={deliveryEndpoints}
      mockSetCustomer={mockSetCustomer}
      mockSetEndpoint={mockSetEndpoint}
      mockSetTimeSlot={mockSetTimeSlot}
    />)

    act(() => {
      const customerSelect = screen.getByLabelText(customerLabel);
      fireEvent.change(customerSelect, {target : {value : "3"}});
    });

    expect(screen.getByText(customers.get(3).short_name)).toBeVisible();
    expect(screen.getByText(`${customers.get(3).short_name} - ${deliveryEndpoints.get(4).name}`)).toBeVisible();

    expect(mockSetCustomer).toHaveBeenCalledWith(3);
    expect(mockSetEndpoint).toHaveBeenCalledWith(4);
  });
})