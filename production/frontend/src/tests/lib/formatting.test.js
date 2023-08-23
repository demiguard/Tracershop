import { parseJSON } from "jquery";
import { parseDate, ParseDanishNumber, parseDateToDanishDate,
  FormatTime, FormatDateStr, ParseJSONstr, ParseDjangoModelJson,
  ParseEmail, isNotNaN, PortValidator,
  IPValidator,
  StringValidator
} from "../../lib/formatting";

describe("ParseDate Tests", () => {
  const target_date_1 = "2011-11-30"
  it("Valid Dateformat YYYY-MM-DD", () => {
    expect(parseDate(target_date_1)).toEqual(target_date_1);
  })
  it("Valid Dateformat YYYY/MM/DD", () => {
    const input = "2011/11/30"
    expect(parseDate(input)).toEqual(target_date_1);
  })
  it("Valid Dateformat DD-MM-YYYY", () => {
    const input = "30-11-2011"
    expect(parseDate(input)).toEqual(target_date_1);
  })
  it("Valid Dateformat DD/MM/YYYY", () => {
    const input = "30/11/2011"
    expect(parseDate(input)).toEqual(target_date_1);
  });
  /*
  it("American format MM/DD/YYYY", () =>{
    const input = "11/30/2011";
    try {
      parseDate(input);
    } catch (e) {
      console.log(e);
    }
  }) */

  it("Not a Date", () =>{
    const input = "FooBar";
    try {
      parseDate(input);
      expect(false).toEqual(true);
    } catch (e) {
      expect(e).toEqual("Date not on known format, Date: " + input);
    }
  });
})

describe("ParseDanishNumber tests", () => {
  it("Numbers test", () => {
    for(let i = 0; i < 100; i++){
      const val = Math.random() * 1000;
      expect(ParseDanishNumber(val)).toEqual(val);
    }
  });

  it("English Numbers", () => {
    expect(ParseDanishNumber("1320512.912")).toEqual(1320512.912);
    expect(ParseDanishNumber("-1322.912")).toEqual(-1322.912);
    expect(ParseDanishNumber("13112.911112")).toEqual(13112.911112);
    expect(ParseDanishNumber("1320512.11912")).toEqual(1320512.11912);
    expect(ParseDanishNumber("13021512.912")).toEqual(13021512.912);
  });

  it("Danish Numbers", () => {
    expect(ParseDanishNumber("1320512,912")).toEqual(1320512.912);
    expect(ParseDanishNumber("-1322,912")).toEqual(-1322.912);
    expect(ParseDanishNumber("13112,911112")).toEqual(13112.911112);
    expect(ParseDanishNumber("1320512,11912")).toEqual(1320512.11912);
    expect(ParseDanishNumber("13021512,912")).toEqual(13021512.912);
  })
})

describe("parseDateToDanishDate Tests", () => {
  it("Valid dates tests", () => {
    expect(parseDateToDanishDate("2011-11-30")).toEqual("30/11/2011");
    expect(parseDateToDanishDate("2011-01-31")).toEqual("31/01/2011");
  });

  it("Missing extra format", () => {
    const input = "2011/11/30";
    try {
      parseDateToDanishDate(input);
      expect(false).toEqual(true);
    } catch (e) {
      expect(e).toEqual("Date not on format, Input: " + input);
    }
  })

  it("Missing Trailing zeroes", () => {
    const input = "2011-1-30"
    try {
      parseDateToDanishDate("2011-1-30");
      expect(false).toEqual(true);
    } catch (e) {
      expect(e).toEqual("Date not on format, Input: " + input);
    }
  })

  it("Not impotent", () => {
    try {
      parseDateToDanishDate(parseDateToDanishDate("2011-11-30"));
      expect(false).toEqual(true);
    } catch (e) {
      expect(e).toEqual("Date not on format, Input: " + "30/11/2011");
    }
  })
});

describe("FormatDateStr tests", () => {
  it("standard usage", () => {
    expect(FormatDateStr("1")).toEqual("01")
    expect(FormatDateStr(1)).toEqual("01")
    expect(FormatDateStr("10")).toEqual("10")
    expect(FormatDateStr(10)).toEqual("10")
  })
}) // Should be named trailed space, also should check on input

describe("FormatTime Tests", () => {
  const targetTime = "02:01:00"
  it("Formats", () => {
    expect(FormatTime(targetTime)).toEqual(targetTime);
    expect(FormatTime("2:01:00")).toEqual(targetTime);
    expect(FormatTime("2:01")).toEqual(targetTime);
    expect(FormatTime("02:01")).toEqual(targetTime)
    expect(FormatTime("00:00:00")).toEqual("00:00:00");
    expect(FormatTime("23:59:59")).toEqual("23:59:59");
  });

  it("Invalid Times", () => {
    expect(FormatTime("30:00:00")).toEqual(null)
    expect(FormatTime("10:70:00")).toEqual(null)
    expect(FormatTime("24:00:00")).toEqual(null)
    expect(FormatTime("12:60:00")).toEqual(null)
    expect(FormatTime("12:00:60")).toEqual(null)
  });
});

describe("ParseEmail Tests", () => {
  it("Valid tests", () => {
    expect(ParseEmail("")).toEqual(true);
    expect(ParseEmail("hello@world.com")).toEqual(true);
    expect(ParseEmail("hello.lonesome@world.com")).toEqual(true);
    expect(ParseEmail("hello.lonesome@lomesome.world.com")).toEqual(true);
  });
  it("Invalid tests", () => {
    expect(ParseEmail("hello world")).toEqual(false);
    expect(ParseEmail("hello@.world")).toEqual(false);
    expect(ParseEmail("hello@world.")).toEqual(false);
  });
})

describe("Json Parsing Tests", () => {
  const input_Object = {
    num : 1,
    str : "asd",
    list : [1,2,3,4],
    obj : {
      num : 12,
      str : "was",
      list : [2,3,4,5]
    }
  }
  it("Object test", () => {
    const inputString = JSON.stringify(input_Object)
    expect(ParseJSONstr(inputString)).toEqual(input_Object);
  })

  it("DOUBLE THE STRINGS!", () => {
    const inputString = JSON.stringify(JSON.stringify(input_Object))
    expect(ParseJSONstr(inputString)).toEqual(input_Object);
  });
  it("TRIPLE THE STRINGS!", () => {
    const inputString = JSON.stringify(JSON.stringify(JSON.stringify(input_Object)))
    expect(ParseJSONstr(inputString)).toEqual(input_Object);
  });
});

describe("JSON parse Django Models",() => {
  const input = JSON.stringify([{
      pk : 1,
      fields : {
        f : 1
      }
    }, {
      pk : 2,
      fields : {
        f : 2
      }
   }
  ])
  it("Standard Test", () => {
    const res = ParseDjangoModelJson(input);
    expect(res.size).toEqual(2);
    const m1 = res.get(1);
    const m2 = res.get(2);
    expect(m1).toBeDefined();
    expect(m2).toBeDefined();
    expect(m1.f).toEqual(1);
    expect(m2.f).toEqual(2);
  });
});

describe("isNotNaN Tests", () => {
  it("Basic function - NaN", () => {
    expect(isNotNaN(NaN)).toEqual(false)
  });

  it("Basic function - notNaN", () => {
    expect(isNotNaN(1)).toEqual(true);
    expect(isNotNaN(-1)).toEqual(true);
    expect(isNotNaN(0)).toEqual(true);
    expect(isNotNaN(Infinity)).toEqual(true);
    expect(isNotNaN(-Infinity)).toEqual(true);
  });
});

describe("PortValidator Tests", () => {
  it("Valid ports", () => {
    const numStr = "1024";
    const res = PortValidator(numStr);
    expect(Object.keys(res).sort()).toEqual(["valid", "value"]);
    expect(res.valid).toEqual(true);
    expect(res.value).toEqual(1024);
  });
  it("Max Valid ports", () => {
    const numStr = "49151";
    const res = PortValidator(numStr);
    expect(Object.keys(res).sort()).toEqual(["valid", "value"]);
    expect(res.valid).toEqual(true);
    expect(res.value).toEqual(49151);
  });

  it("Min Valid ports", () => {
    const numStr = "1";
    const res = PortValidator(numStr);
    expect(Object.keys(res).sort()).toEqual(["valid", "value"]);
    expect(res.valid).toEqual(true);
    expect(res.value).toEqual(1);
  });

  it("Invalid port Valid reserved", () => {
    const numStr = "0";
    const res = PortValidator(numStr);
    expect(Object.keys(res).sort()).toEqual(["valid", "value"]);
    expect(res.valid).toEqual(false);
    expect(res.value).toEqual(null);
  });

  it("Dynamic port are not valid ports", () => {
    const numStr = "65535";
    const res = PortValidator(numStr);
    expect(Object.keys(res).sort()).toEqual(["valid", "value"]);
    expect(res.valid).toEqual(false);
    expect(res.value).toEqual(null);
  });

  it("Invalid port Valid too large", () => {
    const numStr = "65536";
    const res = PortValidator(numStr);
    expect(Object.keys(res).sort()).toEqual(["valid", "value"]);
    expect(res.valid).toEqual(false);
    expect(res.value).toEqual(null);
  });
  it("Invalid port Valid really too large", () => {
    const numStr = "655366";
    const res = PortValidator(numStr);
    expect(Object.keys(res).sort()).toEqual(["valid", "value"]);
    expect(res.valid).toEqual(false);
    expect(res.value).toEqual(null);
  });
  it("Invalid port Valid Nan", () => {
    const numStr = "Foobar";
    const res = PortValidator(numStr);
    expect(Object.keys(res).sort()).toEqual(["valid", "value"]);
    expect(res.valid).toEqual(false);
    expect(res.value).toEqual(null);
  });

  it("Invalid port Valid floating port is not valid", () => {
    const numStr = "1024.00";
    const res = PortValidator(numStr);
    expect(Object.keys(res).sort()).toEqual(["valid", "value"]);
    expect(res.valid).toEqual(false);
    expect(res.value).toEqual(null);
  });

  it("Negative port are not valid", () => {
    const numStr = "-1024";
    const res = PortValidator(numStr);
    expect(Object.keys(res).sort()).toEqual(["valid", "value"]);
    expect(res.valid).toEqual(false);
    expect(res.value).toEqual(null);
  });
});

/* Move this into user 
describe("Ip Validator Tests", () =>{
  it("Valid Ip standard", () => {
    const ip = "255.255.255.255";
    const res = IPValidator(ip)
    expect(Object.keys(res).sort()).toEqual(["valid", "value"]);
    expect(res.valid).toEqual(true);
    expect(res.value).toEqual(ip);
  });
  it("Trailing zeroes", () => {
    const ip = "255.255.255.001";
    const res = IPValidator(ip)
    expect(Object.keys(res).sort()).toEqual(["valid", "value"]);
    expect(res.valid).toEqual(true);
    expect(res.value).toEqual(ip);
  });
  it("minimal ip", () => {
    const ip = "0.0.0.0";
    const res = IPValidator(ip)
    expect(Object.keys(res).sort()).toEqual(["valid", "value"]);
    expect(res.valid).toEqual(true);
    expect(res.value).toEqual(ip);
  });
  it("invalid IP - missing dots", () => {
    const ip = "255255255255";
    const res = IPValidator(ip)
    expect(Object.keys(res).sort()).toEqual(["valid", "value"]);
    expect(res.valid).toEqual(false);
    expect(res.value).toEqual(null);
  });
  it("invalid IP - Big numbers", () => {
    const ip = "256.256.256.256";
    const res = IPValidator(ip)
    expect(Object.keys(res).sort()).toEqual(["valid", "value"]);
    expect(res.valid).toEqual(false);
    expect(res.value).toEqual(null);
  });
  it("invalid IP - Hex encoding", () => {
    const ip = "FF.FF.FF.FF";
    const res = IPValidator(ip)
    expect(Object.keys(res).sort()).toEqual(["valid", "value"]);
    expect(res.valid).toEqual(false);
    expect(res.value).toEqual(null);
  });
});
*/

describe("StringValidator Tests", () => {
  it("Ok string", () => {
    const val = "FOO BAR";
    const res = StringValidator(val, -Infinity, Infinity)
    expect(Object.keys(res).sort()).toEqual(["valid", "value"]);
    expect(res.valid).toEqual(true);
    expect(res.value).toEqual(val);
  });
  it("too short", () => {
    const val = "FOO BAR";
    const res = StringValidator(val, Infinity, Infinity)
    expect(Object.keys(res).sort()).toEqual(["valid", "value"]);
    expect(res.valid).toEqual(false);
    expect(res.value).toEqual(null);
  });

  it("too long", () => {
    const val = "FOO BAR";
    const res = StringValidator(val, -Infinity, -Infinity)
    expect(Object.keys(res).sort()).toEqual(["valid", "value"]);
    expect(res.valid).toEqual(false);
    expect(res.value).toEqual(null);
  });
})
