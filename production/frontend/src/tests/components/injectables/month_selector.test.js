/**
 * @jest-environment jsdom
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import React, {useState} from 'react'
import { act } from 'react-dom/test-utils';
import { MonthSelector } from '~/components/injectable/month_selector';

const module = jest.mock('~/lib/tracer_websocket.js');


beforeAll(() => {
  jest.useFakeTimers('modern')
  jest.setSystemTime(new Date(2020,4, 4, 10, 36, 44))
})

beforeEach(() => {
});

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  module.clearAllMocks()
});

const callback = jest.fn();

function Dummy({init_day}){
  const init = init_day ? init_day : new Date(2020,4, 4, 10, 36, 44)

  const [date, setDate] = useState(init);

  return <div>
    <MonthSelector
      stateDate={date}
      setDate={setDate}
      callback={callback}
    />
  </div>
}

function DumbDummy({init_day}){
  const init = init_day ? init_day : new Date(2020,4, 4, 10, 36, 44)

  const [date, setDate] = useState(init);

  return <div>
    <MonthSelector
      stateDate={date}
      setDate={setDate}
    />
  </div>
}

describe("Month selector test suite", () => {
  it("Standard test", () => {
    render(<Dummy/>);

    expect(screen.getByLabelText('prev-month')).toBeVisible();
    expect(screen.getByLabelText('next-month')).toBeVisible();
    expect(screen.getByLabelText('toggle-picker')).toBeVisible();
    // all the stuff that is hidden for now
    expect(screen.queryByLabelText('jan')).toBeNull();
    expect(screen.queryByLabelText('feb')).toBeNull();
    expect(screen.queryByLabelText('mar')).toBeNull();
    expect(screen.queryByLabelText('apr')).toBeNull();
    expect(screen.queryByLabelText('may')).toBeNull();
    expect(screen.queryByLabelText('jul')).toBeNull();
    expect(screen.queryByLabelText('jun')).toBeNull();
    expect(screen.queryByLabelText('aug')).toBeNull();
    expect(screen.queryByLabelText('sep')).toBeNull();
    expect(screen.queryByLabelText('oct')).toBeNull();
    expect(screen.queryByLabelText('nov')).toBeNull();
    expect(screen.queryByLabelText('dec')).toBeNull();
  });

  it("dec month", () => {
    render(<Dummy/>);

    act(() => {
      screen.getByLabelText('prev-month').click();
    })

    expect(callback).toHaveBeenCalledWith(new Date(2020, 3, 1, 12))
    // all the stuff remain hidden
    expect(screen.queryByLabelText('jan')).toBeNull();
    expect(screen.queryByLabelText('feb')).toBeNull();
    expect(screen.queryByLabelText('mar')).toBeNull();
    expect(screen.queryByLabelText('apr')).toBeNull();
    expect(screen.queryByLabelText('may')).toBeNull();
    expect(screen.queryByLabelText('jul')).toBeNull();
    expect(screen.queryByLabelText('jun')).toBeNull();
    expect(screen.queryByLabelText('aug')).toBeNull();
    expect(screen.queryByLabelText('sep')).toBeNull();
    expect(screen.queryByLabelText('oct')).toBeNull();
    expect(screen.queryByLabelText('nov')).toBeNull();
    expect(screen.queryByLabelText('dec')).toBeNull();
  });

  it("dec month, yearly overlap", () => {
    render(<Dummy init_day={new Date(2020, 0, 15, 10,0,0)}/>);

    act(() => {
      screen.getByLabelText('prev-month').click();
    })

    expect(callback).toHaveBeenCalledWith(new Date(2019, 11, 1, 12))
    // all the stuff remain hidden
    expect(screen.queryByLabelText('jan')).toBeNull();
    expect(screen.queryByLabelText('feb')).toBeNull();
    expect(screen.queryByLabelText('mar')).toBeNull();
    expect(screen.queryByLabelText('apr')).toBeNull();
    expect(screen.queryByLabelText('may')).toBeNull();
    expect(screen.queryByLabelText('jul')).toBeNull();
    expect(screen.queryByLabelText('jun')).toBeNull();
    expect(screen.queryByLabelText('aug')).toBeNull();
    expect(screen.queryByLabelText('sep')).toBeNull();
    expect(screen.queryByLabelText('oct')).toBeNull();
    expect(screen.queryByLabelText('nov')).toBeNull();
    expect(screen.queryByLabelText('dec')).toBeNull();
  });

  it("inc month", () => {
    render(<Dummy/>);

    act(() => {
      screen.getByLabelText('next-month').click();
    })

    expect(callback).toHaveBeenCalledWith(new Date(2020, 5, 1, 12))
    // all the stuff remain hidden
    expect(screen.queryByLabelText('jan')).toBeNull();
    expect(screen.queryByLabelText('feb')).toBeNull();
    expect(screen.queryByLabelText('mar')).toBeNull();
    expect(screen.queryByLabelText('apr')).toBeNull();
    expect(screen.queryByLabelText('may')).toBeNull();
    expect(screen.queryByLabelText('jul')).toBeNull();
    expect(screen.queryByLabelText('jun')).toBeNull();
    expect(screen.queryByLabelText('aug')).toBeNull();
    expect(screen.queryByLabelText('sep')).toBeNull();
    expect(screen.queryByLabelText('oct')).toBeNull();
    expect(screen.queryByLabelText('nov')).toBeNull();
    expect(screen.queryByLabelText('dec')).toBeNull();
  });

  it("inc month, yearly overlap", () => {
    render(<Dummy init_day={new Date(2020, 11, 15, 10,0,0)}/>);

    act(() => {
      screen.getByLabelText('next-month').click();
    })

    expect(callback).toHaveBeenCalledWith(new Date(2021, 0, 1, 12))
    // all the stuff remain hidden
    expect(screen.queryByLabelText('jan')).toBeNull();
    expect(screen.queryByLabelText('feb')).toBeNull();
    expect(screen.queryByLabelText('mar')).toBeNull();
    expect(screen.queryByLabelText('apr')).toBeNull();
    expect(screen.queryByLabelText('may')).toBeNull();
    expect(screen.queryByLabelText('jul')).toBeNull();
    expect(screen.queryByLabelText('jun')).toBeNull();
    expect(screen.queryByLabelText('aug')).toBeNull();
    expect(screen.queryByLabelText('sep')).toBeNull();
    expect(screen.queryByLabelText('oct')).toBeNull();
    expect(screen.queryByLabelText('nov')).toBeNull();
    expect(screen.queryByLabelText('dec')).toBeNull();
  });

  //#region the picker
  it("open / close the picker", () => {
    render(<Dummy/>);

    act(() => {
      screen.getByLabelText('toggle-picker').click();
    });

    // all the stuff remain hidden
    expect(screen.getByLabelText('jan')).toBeVisible();
    expect(screen.getByLabelText('feb')).toBeVisible();
    expect(screen.getByLabelText('mar')).toBeVisible();
    expect(screen.getByLabelText('apr')).toBeVisible();
    expect(screen.getByLabelText('may')).toBeVisible();
    expect(screen.getByLabelText('jul')).toBeVisible();
    expect(screen.getByLabelText('jun')).toBeVisible();
    expect(screen.getByLabelText('aug')).toBeVisible();
    expect(screen.getByLabelText('sep')).toBeVisible();
    expect(screen.getByLabelText('oct')).toBeVisible();
    expect(screen.getByLabelText('nov')).toBeVisible();
    expect(screen.getByLabelText('dec')).toBeVisible();
    // hide it again
    act(() => {
      screen.getByLabelText('toggle-picker').click();
    });

    expect(screen.queryByLabelText('jan')).toBeNull();
    expect(screen.queryByLabelText('feb')).toBeNull();
    expect(screen.queryByLabelText('mar')).toBeNull();
    expect(screen.queryByLabelText('apr')).toBeNull();
    expect(screen.queryByLabelText('may')).toBeNull();
    expect(screen.queryByLabelText('jul')).toBeNull();
    expect(screen.queryByLabelText('jun')).toBeNull();
    expect(screen.queryByLabelText('aug')).toBeNull();
    expect(screen.queryByLabelText('sep')).toBeNull();
    expect(screen.queryByLabelText('oct')).toBeNull();
    expect(screen.queryByLabelText('nov')).toBeNull();
    expect(screen.queryByLabelText('dec')).toBeNull();
  });

  it("Hovering over month/year", () => {
    render(<Dummy/>);

    act(() => {
      screen.getByLabelText('toggle-picker').click();
    });

    act(() => {
      fireEvent.mouseEnter(screen.getByLabelText('sep'));
    });

    expect(screen.getByLabelText('sep')).toHaveStyle({
      background : "#bdfffd"
    });

    act(() => {
      fireEvent.mouseLeave(screen.getByLabelText('sep'));
    });

    expect(screen.getByLabelText('sep')).toHaveStyle({
      background : "#ffffff"
    });

    act(() => {
      fireEvent.mouseEnter(screen.getByLabelText('year'));
    });

    expect(screen.getByLabelText('year')).toHaveStyle({
      background : "#ffffff"
    });

    act(() => {
      fireEvent.mouseLeave(screen.getByLabelText('year'));
    });
    expect(screen.getByLabelText('year')).toHaveStyle({
      background : "#ffffff"
    });
  })

  it("select a month", () => {
    render(<Dummy/>);

    act(() => {
      screen.getByLabelText('toggle-picker').click();
    });

    act(() => {
      screen.getByLabelText('oct').click();
    });

    expect(callback).toHaveBeenCalledWith(new Date(2020, 9,1,12));

    expect(screen.queryByLabelText('jan')).toBeNull();
    expect(screen.queryByLabelText('feb')).toBeNull();
    expect(screen.queryByLabelText('mar')).toBeNull();
    expect(screen.queryByLabelText('apr')).toBeNull();
    expect(screen.queryByLabelText('may')).toBeNull();
    expect(screen.queryByLabelText('jul')).toBeNull();
    expect(screen.queryByLabelText('jun')).toBeNull();
    expect(screen.queryByLabelText('aug')).toBeNull();
    expect(screen.queryByLabelText('sep')).toBeNull();
    expect(screen.queryByLabelText('oct')).toBeNull();
    expect(screen.queryByLabelText('nov')).toBeNull();
    expect(screen.queryByLabelText('dec')).toBeNull();
  });

  it("dec temporary year", () => {
    render(<Dummy/>);
    act(() => {screen.getByLabelText('toggle-picker').click();});
    act(() => {screen.getByLabelText('prev-year').click();});
    expect(callback).not.toHaveBeenCalled();
  });

  it("dec temporary year and use it", () => {
    render(<Dummy/>);
    act(() => {screen.getByLabelText('toggle-picker').click();});
    act(() => {screen.getByLabelText('next-year').click();});
    act(() => {screen.getByLabelText('jun').click()});
    expect(callback).toHaveBeenCalledWith(new Date(2021, 6, 1, 12));
  });

  it("You can click the year, and nothing explodes", () => {
    render(<Dummy/>);
    act(() => {screen.getByLabelText('toggle-picker').click();});
    act(() => {screen.getByLabelText('year')})

    expect(screen.getByLabelText('jan')).toBeVisible();
    expect(screen.getByLabelText('feb')).toBeVisible();
    expect(screen.getByLabelText('mar')).toBeVisible();
    expect(screen.getByLabelText('apr')).toBeVisible();
    expect(screen.getByLabelText('may')).toBeVisible();
    expect(screen.getByLabelText('jul')).toBeVisible();
    expect(screen.getByLabelText('jun')).toBeVisible();
    expect(screen.getByLabelText('aug')).toBeVisible();
    expect(screen.getByLabelText('sep')).toBeVisible();
    expect(screen.getByLabelText('oct')).toBeVisible();
    expect(screen.getByLabelText('nov')).toBeVisible();
    expect(screen.getByLabelText('dec')).toBeVisible();

    expect(callback).not.toHaveBeenCalled();
  });

  it("test missing Callback on click", () => {
    render(<DumbDummy/>);

    act(() => {
      screen.getByLabelText('toggle-picker').click();
    });

    act(() => {
      screen.getByLabelText('oct').click();
    });

    expect(screen.queryByLabelText('jan')).toBeNull();
    expect(screen.queryByLabelText('feb')).toBeNull();
    expect(screen.queryByLabelText('mar')).toBeNull();
    expect(screen.queryByLabelText('apr')).toBeNull();
    expect(screen.queryByLabelText('may')).toBeNull();
    expect(screen.queryByLabelText('jul')).toBeNull();
    expect(screen.queryByLabelText('jun')).toBeNull();
    expect(screen.queryByLabelText('aug')).toBeNull();
    expect(screen.queryByLabelText('sep')).toBeNull();
    expect(screen.queryByLabelText('oct')).toBeNull();
    expect(screen.queryByLabelText('nov')).toBeNull();
    expect(screen.queryByLabelText('dec')).toBeNull();
  });


  it("test missing Callback, inc month", () => {
    render(<DumbDummy/>);

    act(() => {
      screen.getByLabelText('next-month').click();
    })
  });
});
