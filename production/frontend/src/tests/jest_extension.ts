export const MATCH_EXTENSIONS = {
  toEqualSet<T>(received: Set<T> , expected: any) {
    const receivedIsSet = received instanceof Set;
    const expectedIsSet = expected instanceof Set;

    if(!expectedIsSet){
      try {
        expected = new Set(expected);
      } catch {
        return {
          pass: false,
          message : () => "Unable to convert expected to a set"
        }
      };
    }

    if(!receivedIsSet){
      return {
        pass : false,
        message : () => `Expected input is not a Set!`
      }
    }

    const missing_elements_in_expected = [];
    const missing_elements_in_received = [];

    for(const item of received){
      if(!expected.has(item)){
        missing_elements_in_expected.push(item);
      }
    }

    for(const item of expected){
      if(!received.has(item)){
        missing_elements_in_received.push(item);
      }
    }

    const error_messages = [];

    if(missing_elements_in_expected.length){
      error_messages.push(`Received contains: ${missing_elements_in_expected.join(', ')} that is not in Expected`);
    }

    if(missing_elements_in_received.length){
      error_messages.push(`expected contains: ${missing_elements_in_received.join(', ')} that is not in Received`);
    }


    if (!error_messages.length) {

      return {
        message: () =>
          `expected ${received} not to equal Set ${expected}`,
        pass: true,
      };
    } else {
      const error_message = error_messages.join("\n");
      return {
        message: () => error_message,
        pass: false,
      };
    }
  },
};