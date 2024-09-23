import { jest } from '@jest/globals'
import { Procedure, ProcedureIdentifier, Tracer, TracershopState } from '~/dataclasses/dataclasses';
import { TRACER_TYPE } from '~/lib/constants';
import { PROCEDURE_SORTING, sort_procedures } from '~/lib/sorting';
import { toMapping } from '~/lib/utils';

describe("Sorting Test suite", () => {
  it("sort procedure", () => {
    const state = new TracershopState();

    state.procedure_identifier = toMapping([
      new ProcedureIdentifier(1, "Code 1", "Desc 1", false),
      new ProcedureIdentifier(2, "Code 2", "Desc 2", false),
      new ProcedureIdentifier(3, "Code 3", "Desc 3", false),
    ])

    state.tracer = toMapping([
      new Tracer(1, "", "", undefined, TRACER_TYPE.ACTIVITY, undefined, false, true),
      new Tracer(2, "", "", undefined, TRACER_TYPE.ACTIVITY, undefined, false, true),
    ])

    const procedures = [
      new Procedure(1, 1, 1000, 0, 1, null),
      new Procedure(2, 2, 100, 0, 1, null),
      new Procedure(3, 1, 10, 0, 1, null),
    ]

    const sorted_procedures = [...procedures].sort(sort_procedures(state, PROCEDURE_SORTING.UNITS))
    expect(sorted_procedures[0]).toBe(procedures[2])

  });
});