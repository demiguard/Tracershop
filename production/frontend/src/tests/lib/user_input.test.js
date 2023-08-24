import { addTimeColons, concatErrors, parseAETitleInput, parseBatchNumberInput, parseDanishNumberInput, parseDanishPositiveNumberInput, parseIPInput, parsePortInput, parseTimeInput } from "../../lib/user_input";

describe("parseDanishNumber Tests", () => {
  it("missing input", () => {
    const [valid, value] = parseDanishNumberInput("", "input");
    expect(valid).toBe(false);
    expect(value).toBe("input er ikke tasted ind");
  })

  it("Valid tal: 1.246", () => {
    const [valid, value] = parseDanishNumberInput("1.246", "input");
    expect(valid).toBe(true);
    expect(value).toBe(1.246)
  })

  it("Valid tal: 1,246", () => {
    const [valid, value] = parseDanishNumberInput("1,246", "input");
    expect(valid).toBe(true);
    expect(value).toBe(1.246)
  })

  it("Valid tal: None Sense", () => {
    const [valid, value] = parseDanishNumberInput("None sense", "input");
    expect(valid).toBe(false);
    expect(value).toBe("input er ikke et tal")
  });

  it("Valid tal: 1.246e10", () => {
    const [valid, value] = parseDanishNumberInput("1.246e10", "input");
    expect(valid).toBe(true);
    expect(value).toBe(1.246e10)
  });

  it("Valid tal: -1.246e10", () => {
    const [valid, value] = parseDanishNumberInput("-1.246e10", "input");
    expect(valid).toBe(true);
    expect(value).toBe(-1.246e10)
  });
});

describe("parseDanishPositiveNumberInput tests", () => {
  it("missing input", () => {
    const [valid, value] = parseDanishPositiveNumberInput("", "input");
    expect(valid).toBe(false);
    expect(value).toBe("input er ikke tasted ind");
  })

  it("Valid tal: 1.246", () => {
    const [valid, value] = parseDanishPositiveNumberInput("1.246", "input");
    expect(valid).toBe(true);
    expect(value).toBe(1.246)
  })

  it("Valid tal: 1,246", () => {
    const [valid, value] = parseDanishPositiveNumberInput("1,246", "input");
    expect(valid).toBe(true);
    expect(value).toBe(1.246)
  })

  it("Valid tal: None Sense", () => {
    const [valid, value] = parseDanishPositiveNumberInput("None sense", "input");
    expect(valid).toBe(false);
    expect(value).toBe("input er ikke et tal")
  });

  it("Valid tal: 1.246e10", () => {
    const [valid, value] = parseDanishPositiveNumberInput("1.246e10", "input");
    expect(valid).toBe(true);
    expect(value).toBe(1.246e10)
  });

  it("Valid tal: -1.246e10", () => {
    const [valid, value] = parseDanishPositiveNumberInput("-1.246e10", "input");
    expect(valid).toBe(false);
    expect(value).toBe("input kan ikke være negativ")
  });
})

describe("parseBatchNumberInput tests", () => {
  it("Batch number Input empty", () => {
    const [valid, value] = parseBatchNumberInput("", "input")
    expect(valid).toBe(false);
    expect(value).toBe("input er ikke tasted ind");
  });

  it("Batch number Input: asæd1230213", () => {
    const [valid, value] = parseBatchNumberInput("asæd1230213", "input")
    expect(valid).toBe(false);
    expect(value).toBe("input er ikke formateret korrekt");
  });

  it("Batch number empty", () => {
    const [valid, value] = parseBatchNumberInput("asæd-123021-3", "input")
    expect(valid).toBe(true);
    expect(value).toBe("asæd-123021-3");
  });
});

describe("parseInputTime tests", () => {
  it("Empty input test", () => {
    const [valid, value] = parseTimeInput("", "input");
    expect(valid).toBe(false);
    expect(value).toBe("input er ikke tasted ind");
  });

  it("input 25:00:11 test", () => {
    const [valid, value] = parseTimeInput("25:00:11", "input");
    expect(valid).toBe(false);
    expect(value).toBe("input er ikke formattet som et tidspunkt");
  });

  it("input 250011 test", () => {
    const [valid, value] = parseTimeInput("250011", "input");
    expect(valid).toBe(false);
    expect(value).toBe("input er ikke formattet som et tidspunkt");
  });

  it("input 230011 test", () => {
    const [valid, value] = parseTimeInput("230011", "input");
    expect(valid).toBe(false);
    expect(value).toBe("input er ikke formattet som et tidspunkt");
  });

  it("input 23:00:11 test", () => {
    const [valid, value] = parseTimeInput("23:00:11", "input");
    expect(valid).toBe(true);
    expect(value).toBe("23:00:11");
  });
})

describe("parsePortInput Tests", () => {
  it("Valid ports", () => {
    const numStr = "1024";
    const [valid, value] = parsePortInput(numStr);

    expect(valid).toEqual(true);
    expect(value).toEqual(1024);
  });

  it("Max Valid ports", () => {
    const numStr = "49151";
    const [valid, value] = parsePortInput(numStr);

    expect(valid).toEqual(true);
    expect(value).toEqual(49151);
  });

  it("Min Valid ports", () => {
    const numStr = "1";
    const [valid, value] = parsePortInput(numStr);
    expect(valid).toEqual(true);
    expect(value).toEqual(1);
  });

  it("Invalid port Valid reserved", () => {
    const numStr = "0";
    const [valid, value] = parsePortInput(numStr, "test");

    expect(valid).toEqual(false);
    expect(value).toEqual("test skal være postivt tal mindre end 49151.");
  });

  it("Dynamic port are not valid ports", () => {
    const numStr = "65535";
    const [valid, value] = parsePortInput(numStr, "test");

    expect(valid).toEqual(false);
    expect(value).toEqual("test må ikke være en dynamisk port.");
  });

  it("Invalid port Valid too large", () => {
    const numStr = "65536";
    const [valid, value] = parsePortInput(numStr, "test");

    expect(valid).toEqual(false);
    expect(value).toEqual("test skal være en normal port (<49151).");
  });
  it("Invalid port Valid really too large", () => {
    const numStr = "655366";
    const [valid, value] = parsePortInput(numStr);

    expect(valid).toEqual(false);
    expect(value).toEqual(" skal være en normal port (<49151).");
  });
  it("Invalid port Valid Nan", () => {
    const numStr = "Foobar";
    const [valid, value] = parsePortInput(numStr);
    expect(valid).toEqual(false);
    expect(value).toEqual(" er ikke et helt positivt tal.");
  });

  it("Invalid port Valid floating port is not valid", () => {
    const numStr = "1024.00";
    const [valid, value] = parsePortInput(numStr);

    expect(valid).toEqual(false);
    expect(value).toEqual(" er ikke et helt positivt tal.");
  });

  it("Negative port are not valid", () => {
    const numStr = "-1024";
    const [valid, value] = parsePortInput(numStr);

    expect(valid).toEqual(false);
    expect(value).toEqual(" er ikke et helt positivt tal.");
  });
});


describe("Ip Validator Tests", () =>{
  it("Valid Ip standard", () => {
    const ip = "255.255.255.255";
    const [valid, value] = parseIPInput(ip)

    expect(valid).toEqual(true);
    expect(value).toEqual(ip);
  });
  it("Trailing zeroes", () => {
    const ip = "255.255.255.001";
    const [valid, value] = parseIPInput(ip)

    expect(valid).toEqual(true);
    expect(value).toEqual(ip);
  });
  it("minimal ip", () => {
    const ip = "0.0.0.0";
    const [valid, value] = parseIPInput(ip)
    expect(valid).toEqual(true);
    expect(value).toEqual(ip);
  });
  it("invalid IP - missing dots", () => {
    const ip = "255255255255";
    const [valid, value] = parseIPInput(ip)
    expect(valid).toEqual(false);
    expect(value).toEqual(" er ikke formatteret som en IP addresse");
  });
  it("invalid IP - Big numbers", () => {
    const ip = "256.256.256.256";
    const [valid, value] = parseIPInput(ip)
    expect(valid).toEqual(false);
    expect(value).toEqual(" er ikke formatteret som en IP addresse");
  });
  it("invalid IP - Hex encoding", () => {
    const ip = "FF.FF.FF.FF";
    const [valid, value] = parseIPInput(ip)
    expect(valid).toEqual(false);
    expect(value).toEqual(" er ikke formatteret som en IP addresse");
  });
});

describe("parseAETitleInput tests", () => {
  it("parseAETitleInput test: Empty", () => {
    const [valid, value] = parseAETitleInput("", "input");
    expect(valid).toBe(false);
    expect(value).toBe("input er ikke tasted ind");
  });

  it("parseAETitleInput test: Long A", () => {
    const [valid, value] = parseAETitleInput("AAAAAAAAAAAAAAAAAAAAAAAAA", "input");
    expect(valid).toBe(false);
    expect(value).toBe("input kan ikke være længere end 16 karaktere.");
  });

  it("parseAETitleInput test: Long A", () => {
    const [valid, value] = parseAETitleInput("AAAAAAAAAAAA", "input");
    expect(valid).toBe(true);
    expect(value).toBe("AAAAAAAAAAAA");
  });
});

describe("concatError tests", () => {
  it("concat errors valid true", () => {
    const errorList = []
    const valid = concatErrors(errorList, true, "Ikke en fejl");
    expect(valid).toBe(true);
    expect(errorList.length).toBe(0)
  })

  it("concat errors valid false", () => {
    const errorList = []
    const valid = concatErrors(errorList, false, "En fejl");
    expect(valid).toBe(false);
    expect(errorList.length).toBe(1);
    expect(errorList[0]).toBe("En fejl");
  })
});

describe("addTimeColons Tests", () => {
  it("inputs", () => {
    expect(addTimeColons({target : {value : "11"}}, "1")).toBe("11:")
    expect(addTimeColons({target : {value : "11"}}, "11:")).toBe("11")
    expect(addTimeColons({target : {value : "11:11"}}, "11:1")).toBe("11:11:")
    expect(addTimeColons({target : {value : "11:11"}}, "11:11:")).toBe("11:11")
  })
})
