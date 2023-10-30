import { ReleaseRight } from "~/dataclasses/dataclasses";

export const release_rights = new Map([
  [1, new ReleaseRight(1, null, 2, 1)],
  [2, new ReleaseRight(2, "2020-10-15", 2, 2)],
]);