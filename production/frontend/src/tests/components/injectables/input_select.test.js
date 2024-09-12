/**
 * @jest-environment jsdom
 */

import React from 'react'

import { jest, expect } from '@jest/globals'
import { render, cleanup, screen, fireEvent, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { InputSelect } from '~/components/injectable/input_select'
import { Option } from '~/components/injectable/select'


const externalStateFunction = jest.fn()

const label = "asdf"

const defaultOptions = [
  new Option("value1", "option 1"),
  new Option("value2", "option 2"),
  new Option("value3", "option 3"),
  new Option("value4", "blah blah"),
];

afterEach(() => {
  jest.clearAllMocks();
})

describe("Input select Test suite", () => {
  it('Render Test with 3 options', () => {
    render(<InputSelect
      value={"value2"}
      aria-label={label}
      options={defaultOptions}
    />);

    expect(screen.getByLabelText(label)).toHaveValue("option 2");
  });

  it('Render Test with 3 options disabled', () => {
    render(<InputSelect
      aria-label={label}
      canEdit={false}
      options={defaultOptions}
    />);

    expect(screen.getByLabelText(label)).toBeDisabled();
    expect(screen.queryByLabelText('asdf-options')).toBeNull();
  });

  it('User click on option image', () => {
    render(<InputSelect
      value={"value2"}
      aria-label={label}
      options={defaultOptions}
    />);

    act(() => {
      fireEvent.click(screen.getByLabelText('asdf-options'));
    });

    for(const option of defaultOptions){
      expect(screen.getByText(option.name)).toBeVisible();
    }
  });

  it("User click options and hovers and un-hovers an option", () => {
    render(<InputSelect
      value={"value2"}
      aria-label={label}
      options={defaultOptions}
    />);

    act(() => {fireEvent.click(screen.getByLabelText('asdf-options'));});
    act(() => {fireEvent.mouseEnter(screen.getByText('option 3'))});

    expect(screen.getByText('option 3')).toHaveStyle('background-color: #bdfffd');

    act(() => {fireEvent.mouseLeave(screen.getByText('option 3'))});
    expect(screen.getByText('option 3')).toHaveStyle('background-color: #ffffff');
  });

  it("User click options and hovers and clicks an option", () => {
    render(<InputSelect
      value={"value2"}
      aria-label={label}
      options={defaultOptions}
      onChange={externalStateFunction}
    />);

    act(() => {fireEvent.click(screen.getByLabelText('asdf-options'));});
    act(() => {fireEvent.mouseEnter(screen.getByText('option 3'))});

    expect(screen.getByText('option 3')).toHaveStyle('background-color: #bdfffd');

    act(() => {
      fireEvent.mouseDown(screen.getByText('option 3'))
      // This blur is triggered by a click outside the input
      fireEvent.blur(screen.getByLabelText(label));
    });

    for(const option of defaultOptions){
      expect(screen.queryByText(option.name)).toBeNull();
    }

    expect(externalStateFunction).toHaveBeenCalledWith(
      {target : {value : 'value3'}}
    );
  });

  it("User types into the input getting Blah blah", () => {
    render(<InputSelect
      value={"value2"}
      aria-label={label}
      options={defaultOptions}
      onChange={externalStateFunction}
    />);

    act(() => {
      fireEvent.focus(screen.getByLabelText(label));
    });

    for(const option of defaultOptions){
      expect(screen.getByText(option.name)).toBeVisible();
    }

    act(() => {
      fireEvent.change(screen.getByLabelText(label), {target : {value : ""}});
    });

    expect(externalStateFunction).not.toHaveBeenCalled();
    for(const option of defaultOptions){
      expect(screen.getByText(option.name)).toBeVisible();
    }

    act(() => {
      fireEvent.change(screen.getByLabelText(label), {target : {value : "blah"}});
    });

    expect(externalStateFunction).not.toHaveBeenCalled();
    for(const option of ["option 1", "option 2", "option 3"]){
      expect(screen.queryByText(option)).toBeNull();
    }
    expect(screen.getByText('blah blah')).toBeVisible();

    act(() => {
      fireEvent.change(screen.getByLabelText(label), {target : {value : "blah blah"}});
    });

    expect(externalStateFunction).toHaveBeenCalledWith(
      {target : {value : 'value4'}}
    );
  });


});