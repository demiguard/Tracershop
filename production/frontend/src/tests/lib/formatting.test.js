import { parseJSON } from "jquery";
import { parseDate, ParseDanishNumber, parseDateToDanishDate,
  FormatTime, FormatDateStr, ParseJSONstr, ParseDjangoModelJson,
  ParseEmail, isNotNaN, PortValidator, formatTimeStamp,
  IPValidator, escapeInputString, batchNumberValidator,
  StringValidator, dateToDateString, getDateName,
  nullParser, makePassword, Capitalize, renderDateTime,
  formatUsername
} from "../../lib/formatting";
import { DATA_ISOTOPE } from "~/lib/shared_constants";
import { Isotope } from "~/dataclasses/dataclasses";

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
  it("Valid Dateformat DD/MM/YYYY", () => {
    const input = "15/10/2023"
    expect(parseDate(input)).toEqual("2023-10-15");
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
    expect(parseDate(input)).toBeNull;
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

describe("formatTimeStamp Tests", () => {
  const testDate = new Date(2020, 10, 11, 8, 30);
  it("is Valid", () => {
    expect(formatTimeStamp(testDate)).toEqual("08.30");
    expect(formatTimeStamp("2020-10-11T08:30")).toEqual("08.30");
  });

  it("is unknown", () =>{
    expect(formatTimeStamp(null)).toEqual("Ukendt");
  });
})

describe("FormatTime Tests", () => {
  const targetTime = "02:01:00"
  it("Formats", () => {
    expect(FormatTime(targetTime)).toEqual(targetTime);
    expect(FormatTime("2:01:00")).toEqual(targetTime);
    expect(FormatTime("2:01")).toEqual(targetTime);
    expect(FormatTime("02:01")).toEqual(targetTime)
    expect(FormatTime("2:01:")).toEqual(targetTime)
    expect(FormatTime("02:01:")).toEqual(targetTime)
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
        atomic_number : 123,
        atomic_mass : 456,
        halflife_seconds : 789,
        atomic_letter : "L",
        metastable : true,
      }
    }, {
      pk : 2,
      fields : {
        atomic_number : 987,
        atomic_mass : 654,
        halflife_seconds : 321,
        atomic_letter : "W" ,
        metastable : false,
      }
   }
  ])
  it("Standard Test", () => {
    const res = ParseDjangoModelJson(input, new Map([]), DATA_ISOTOPE);
    const res2 = ParseDjangoModelJson(input, undefined, DATA_ISOTOPE);
    expect(res.size).toEqual(2);
    expect(res2.size).toEqual(2);
    const isotope_1 = res.get(1);
    const isotope_2 = res.get(2);
    expect(isotope_1).toBeDefined();
    expect(isotope_2).toBeDefined();
    expect(isotope_1).toBeInstanceOf(Isotope);
    expect(isotope_2).toBeInstanceOf(Isotope);
    expect(isotope_1.atomic_number).toBe(123);
    expect(isotope_2.atomic_number).toBe(987);
    expect(isotope_1.atomic_mass).toBe(456);
    expect(isotope_2.atomic_mass).toBe(654);
    expect(isotope_1.halflife_seconds).toBe(789);
    expect(isotope_2.halflife_seconds).toBe(321);
    expect(isotope_1.atomic_letter).toBe("L");
    expect(isotope_2.atomic_letter).toBe("W");
    expect(isotope_1.metastable).toBe(true);
    expect(isotope_2.metastable).toBe(false);
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

describe("batchNumberValidator Tests", () => {
  it("is Valid", () => {
    expect(batchNumberValidator("abcdef-123234-9")).toBeTruthy();
    expect(batchNumberValidator("a-937232-123456")).toBeTruthy();
    expect(batchNumberValidator("abcdef-999999-123456")).toBeTruthy();
    expect(batchNumberValidator("a-999999-9")).toBeTruthy();
  });
  
  it("is Invalid", () => {
    expect(batchNumberValidator("not Even close")).toBeFalsy();
    expect(batchNumberValidator("a-99999-9")).toBeFalsy();
    expect(batchNumberValidator("a-999999")).toBeFalsy();
    expect(batchNumberValidator("999999-9")).toBeFalsy();
  });
})

describe("dateToDateString Tests", () => {
  const testDate = new Date(2000,4,3);
  it("returns Date as String", () =>{
    expect(dateToDateString(testDate)).toEqual("2000-05-03");
  });
})

describe("getDateName Tests", () => {
  const monday = new Date(2023,12, 22);
  it("is a day of the week", () => {
    expect(getDateName(monday)).toEqual("Mandag");
    expect(getDateName(0+1)).toEqual("Tirsdag");
    expect(getDateName(0+2)).toEqual("Onsdag");
    expect(getDateName(0+3)).toEqual("Torsdag");
    expect(getDateName(0+4)).toEqual("Fredag");
    expect(getDateName(0+5)).toEqual("Lørdag");
    expect(getDateName(0+6)).toEqual("Søndag");
  });

  it("is unknown", () => {
    expect(getDateName).toThrow("Unknown Day");
  });
})

describe("nullParser Tests", () => {
  it("returns an empty string", () =>{
    expect(nullParser(null)).toEqual("");
  });
  it("returns parameter", () =>{
    expect(nullParser("Real value")).toEqual("Real value");
  })
})

describe("makePassword", () => {
  it("creates passwords", () =>{
    expect(/[a-zA-Z0-9]{5}/g.test(makePassword(5))).toBeTruthy();
    expect(/[a-zA-Z0-9]{1}/g.test(makePassword(1))).toBeTruthy();
    expect(/[a-zA-Z0-9]{20}/g.test(makePassword(20))).toBeTruthy();
    expect(/[a-zA-Z0-9]{0}/g.test(makePassword(0))).toBeTruthy();
  });
})

describe("Capitalize Tests", () =>{
  it("capitalizes", () => {
    expect(Capitalize("UPpeRCase")).toEqual("Uppercase");
    expect(Capitalize("lOWERCASE WORD")).toEqual("Lowercase word");
  });
})

describe("renderDateTime Tests", () => {
  it("reformats to danish clock", () => {
    expect(renderDateTime("2006-05-04T11:24")).toEqual("11:24 04/05/2006");
  })
})

describe("formatUsername Tests", () => {
  const user = { //mock user object for test of username formatting
    username: 'user1'
  }
  it("returns user capitalized", () => {
    expect(formatUsername(user)).toEqual("USER1");
  });

  it("returns empty on null", () => {
    expect(formatUsername(null)).toEqual("");
  });
})

describe("escapeInputString Tests", () => {
  it("adds backslash", () =>  {
    expect(escapeInputString("question?")).toEqual("question\\?");
    expect(escapeInputString("period.")).toEqual("period\\.");
    expect(escapeInputString("{brackets}")).toEqual("\\{brackets\\}");
  });

  it("doesn't adds backslash", () =>{
    expect(escapeInputString("No sepecial characters")).toEqual("No sepecial characters");
    expect(escapeInputString("Permitted Special characters!-,")).toEqual("Permitted Special characters!-,")
  })
})
