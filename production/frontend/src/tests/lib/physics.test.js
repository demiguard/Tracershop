import { CountMinutes, CalculateProduction } from "../../lib/physics.js"


test("CountMinutes: Counting minutes between 07:00 and 08:30", () => {
  const DT1 = new Date("1993-11-20T07:00:00")
  const DT2 = new Date("1993-11-20T08:30:00")
  expect(CountMinutes(DT1, DT2)).toBe(90)
});

test("CountMinutes: Counting minutes between 07:15 and 08:30", () => {
  const DT1 = new Date("1993-11-20T07:15:00")
  const DT2 = new Date("1993-11-20T08:30:00")
  expect(CountMinutes(DT1, DT2)).toBe(75)
});


test("CountMinutes: Year is irrelevant for this function", () => {
  const DT1 = new Date("2021-11-20T07:00:00")
  const DT2 = new Date("1993-11-20T08:30:00")
  expect(() => CountMinutes(DT1, DT2)).toThrow("Past and Future is not same day")
});

test("CountMinutes: Month is irrelevant for this function", () => {
  const DT1 = new Date("1993-12-20T07:00:00")
  const DT2 = new Date("1993-11-20T08:30:00")
  expect(() => CountMinutes(DT1, DT2)).toThrow("Past and Future is not same day")
});

test("CountMinutes: Day is irrelevant for this function", () => {
  const DT1 = new Date("1993-11-20T07:00:00")
  const DT2 = new Date("1993-11-21T08:30:00")
  expect(() => CountMinutes(DT1, DT2)).toThrow("Past and Future is not same day")
});


// You don't need this much precisions
test("CalculateProduction: 1 hour dosis", () => {
  expect(CalculateProduction(6584, 60, 300)).toBeCloseTo(438.24650136544807)
});

test("CalculateProduction: 0 hour dosis", () => {
  expect(CalculateProduction(6584, 0, 300)).toBeCloseTo(300)
});


test("CalculateProduction: Splitting calls doesn't matter", () => {
  const oneHourDecay     = CalculateProduction(6584, 60, 300)
  const AnotherHourDecay = CalculateProduction(6584, 60, oneHourDecay)
  const TwoHoursDecay    = CalculateProduction(6584, 120, 300)

  expect(AnotherHourDecay).toBeCloseTo(TwoHoursDecay) // Note rounding here is fucking things quite up 
});

// this test was taken from 2021/08/03 production
test("Integration test 1: Real Life example 1", () => {
  const min = CountMinutes(new Date(1993,11,20,8,15), new Date(1993,11,20,11,30))
  const production = CalculateProduction(6584, min, 1319)

  expect(production + 3653).toBeCloseTo(8171,-1)
})



