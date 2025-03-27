import { afterAll, describe, jest } from "@jest/globals"
import { ClosedDate } from "~/dataclasses/dataclasses"
import { deserialize_list } from "~/lib/serialization"
import { DATA_BOOKING, DATA_CLOSED_DATE } from "~/lib/shared_constants"

describe("Serialization Error test suites",() => {
  // Mainly just to test that serialzation module screams at you when you fuck
  // up
  afterAll(() => {
    jest.restoreAllMocks()
  })

  it("Serialization yells on error (with normal objects)", () => {
    const errorMock = jest.spyOn(console, 'error')
    errorMock.mockImplementation(() => {})

    deserialize_list(ClosedDate, [{ id : 1, close_date : "2020-05-05"}])

    expect(errorMock).toHaveBeenCalled()
  })

  it("Serialization yells on error (with class objects)", () => {
    const errorMock = jest.spyOn(console, 'error')
    errorMock.mockImplementation(() => {})

    deserialize_list(ClosedDate, [new ClosedDate(1, "2020-05-05")])

    expect(errorMock).toHaveBeenCalled()
  })
})