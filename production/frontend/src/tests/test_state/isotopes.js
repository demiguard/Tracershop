export const isotopes = new Map([
  [1, {
      id :  1,
      atomic_number :  56,
      atomic_mass : 139,
      halflife_seconds : 83.06 * 60,
      atomic_letter : "Ba",
  }], [2,{
      id : 2,
      atomic_number : 92,
      atomic_mass : 235,
      halflife_seconds : 703800000 * 31556926, // Nuclear weapons doesn't make for good tracers
      atomic_letter : "U"
  }], [ 3, {
      id : 3,
      atomic_number : 43,
      atomic_mass : 99,
      halflife_seconds : 6.0067 * 3600,
      atomic_letter : "Tc"
  }],
]);
