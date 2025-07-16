import { describe, it, expect } from '@jest/globals'
import { presentDateName } from '~/lib/presentation';

describe("getDateName Tests", () => {
  const monday = new Date(2023,12, 22);
  it("is a day of the week", () => {
    expect(presentDateName(monday)).toEqual("Mandag");
    expect(presentDateName(0+1)).toEqual("Tirsdag");
    expect(presentDateName(0+2)).toEqual("Onsdag");
    expect(presentDateName(0+3)).toEqual("Torsdag");
    expect(presentDateName(0+4)).toEqual("Fredag");
    expect(presentDateName(0+5)).toEqual("Lørdag");
    expect(presentDateName(0+6)).toEqual("Søndag");
  });

  it("is unknown", () => {
    expect(() => (presentDateName())).toThrow("Unknown Day");
  });
})