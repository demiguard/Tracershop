import 'jest'

declare global {
  namespace jest {
    interface Matchers<R,T> {
      toInclude(expectedArg : any) : R;
    }
  }
}
