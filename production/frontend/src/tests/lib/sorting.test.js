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
      new Procedure(2, 1, 20, 0, null, null),
      new Procedure(3, 2, 500, 0, 2, null),
      new Procedure(4, 3, 200, 0, 1, null),
      new Procedure(5, 1, 10, 0, 1, null),
      new Procedure(6, null, 0, null, null, null),
      new Procedure(7, 1, 10, 0, 1, null),
    ]

    const sorted_procedures = [...procedures].sort(sort_procedures(state, PROCEDURE_SORTING.UNITS))
    expect(sorted_procedures[0]).toBe(procedures[5])

    const sorted_tracer_procedure = [...procedures].sort(sort_procedures(state, PROCEDURE_SORTING.TRACER))
    expect(sorted_tracer_procedure[4]).toBe(procedures[2]);
    expect(sorted_tracer_procedure[5]).toBe(procedures[1]);
    expect(sorted_tracer_procedure[6]).toBe(procedures[5]);

    const sorted_procedure_procedures = [...procedures].sort(sort_procedures(state, PROCEDURE_SORTING.PROCEDURE_CODE));
    expect(sorted_procedure_procedures[6]).toBe(procedures[5])
    expect(sorted_procedure_procedures[5]).toBe(procedures[3])
    expect(sorted_procedure_procedures[4]).toBe(procedures[2])

    expect(() => {[...procedures].sort(sort_procedures(state, 12342352))}).toThrow("UNDEFINED SORTING METHOD!")
  });


});