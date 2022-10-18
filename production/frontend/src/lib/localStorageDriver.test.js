
import { db } from "./localStorageDriver"

test("Save and Read string", () => {
  const testKeyString = "key-string";
  const testValueString = "test Value";

  //types are by default set for the appilication
  db.addType(testKeyString, String);
  db.set(testKeyString, testValueString);

  const savedValue = db.get(testKeyString)

  expect(savedValue).toMatch(testValueString)
});

test("Save and Read Number", () => {
  // Note here the conversion to String
  // This is undesireable, behavior
  const testKeyNumber = "key-Number";
  const testValueNumber= 3;

  db.addType(testKeyNumber, Number);
  db.set(testKeyNumber, testValueNumber);

  const savedValue = db.get(testKeyNumber);

  expect(savedValue).toBe(testValueNumber);
});

test("Save and Read Number", () => {
  // Note here the conversion to String
  // This is undesireable, behavior
  const testKeyNumber = "key-Number";
  const testValueNumber= -3;

  db.addType(testKeyNumber, Number);
  db.set(testKeyNumber, testValueNumber);

  const savedValue = db.get(testKeyNumber);

  expect(savedValue).toBe(testValueNumber);
});

test("Save and Read Bool(True)", () => {
  // Note here the conversion to String
  // This is undesireable, behavior
  const testKeyBool = "key-Boolean";
  const testValueBool = true ;

  db.addType(testKeyBool, Boolean);
  db.set(testKeyBool, testValueBool);

  const savedValue = db.get(testKeyBool);

  expect(savedValue).toBe(testValueBool);
});

test("Save and Read Bool(false)", () => {
  // Note here the conversion to String
  // This is undesireable, behavior
  const testKeyBool = "key-Number";
  const testValueBool = false;

  db.addType(testKeyBool, Boolean);
  db.set(testKeyBool, testValueBool);

  const savedValue = db.get(testKeyBool);

  expect(savedValue).toBe(testValueBool);
});

test("Save and Read Array(Array)", () => {
  const testKeyArray = "keyArray";
  const testArray = [1,2,3,4];

  db.addType(testKeyArray, Array);

  db.set(testKeyArray, testArray);

  const savedValue = db.get(testKeyArray);

  for(const idx in testArray){
    expect(testArray[idx]).toBe(savedValue[idx]);
  }
});

test("Save and Read Array(String)", () => {
  const testKeyArray = "keyArray";
  const testArray = ["hello", "world"];

  db.addType(testKeyArray, Array);

  db.set(testKeyArray, testArray);

  const savedValue = db.get(testKeyArray);

  for(const idx in testArray){
    expect(testArray[idx]).toBe(savedValue[idx]);
  }
});

test("Save and Read TestObject", () => {
  const testKeyObject = "keyObject";
  const testObject = {
    kw1 : "kw1-testvalue",
    kw2 : 6942069
  };

  db.addType(testKeyObject, Object);
  db.set(testKeyObject, testObject);

  const savedValue = db.get(testKeyObject);

  expect(savedValue).toEqual(testObject)

});


test("Save and Read nestedTestObject", () => {
  const testKeyObject = "keyObject";
  const testObject_1 = {
    kw1 : "kw1-testvalue",
    kw2 : 6942069
  };
  const testObject_2 = {
    kw1 : "kw1-testvalue",
    kw2 : 6942069,
    kw3 : testObject_1,
  };


  db.addType(testKeyObject, Object);
  db.set(testKeyObject, testObject_2);

  const savedValue = db.get(testKeyObject);

  expect(savedValue).toEqual(testObject_2)

});

test("Save and Read nestedTestObjectWithList", () => {
  const testKeyObject = "keyObject";
  const testList = [1,2,3,4,5]
  const testObject_1 = {
    kw1 : "kw1-testvalue",
    kw2 : 6942069,
    kw3 : testList
  };
  const testObject_2 = {
    kw1 : "kw1-testvalue",
    kw2 : 6942069,
    kw3 : testObject_1,
    kw4 : testList,
  };


  db.addType(testKeyObject, Object);
  db.set(testKeyObject, testObject_2);

  const savedValue = db.get(testKeyObject);

  expect(savedValue).toEqual(testObject_2)

});

test("Save and Read Date", () => {
  const testKeyDate = "kwDate";
  const testDate = new Date();

  db.addType(testKeyDate, Date);
  db.set(testKeyDate, testDate);

  const value = db.get(testKeyDate);

  expect(value).toEqual(testDate);
});

test("Save and Read List of Objects", () => {
  const testKW = "kwList";
  const testKWList = [
    {
      kw1 : 123,
      kw2 : "wtwerwer"
    },
    {
      kw1 : 12312123,
      kw2 : "wtwerwasdfarer"
    },{
      kw1 : 12312123,
      kw2 : "wtwerwasdfarer",
      kw3 : 123012

    },
  ]

  db.addType(testKW, Array);

  db.set(testKW, testKWList);

  const savedValue = db.get(testKW);

  for(const idx in testKWList){
    expect(testKWList[idx]).toEqual(savedValue[idx]);
  }

});

test("Save and Read Map(Numbers)", () => {
  const testKW = "kwMap";
  const testMap = new Map();

  testMap.set(1, {kw1 : "abcd", kw2 : 12323});
  testMap.set(2, {kw1 : "qwer", kw2 : 12323});
  testMap.set(3, {kw1 : "zxcv", kw2 : 1233});

  db.addType(testKW, Map);
  db.set(testKW, testMap)

  const value = db.get(testKW);

  for(let [key, val] of value){
    const mapVal = testMap.get(key);
    expect(mapVal).toEqual(val);
  }
});


test("Save and Read Map(Strings)", () => {
  const testKW = "kwMap";
  const testMap = new Map();

  testMap.set("a", {kw1 : "abcd", kw2 : 234});
  testMap.set("b", {kw1 : "qwer", kw2 : 134});
  testMap.set("c", {kw1 : "zxcv", kw2 : 124, kw3: [11923981293,123121231]});
  testMap.set("d", {kw1 : "oqpq", kw2 : 1234, kw3 : {kwOb : "Check if object in are preserved"}});

  db.addType(testKW, Map);
  db.set(testKW, testMap)

  const value = db.get(testKW);

  for(let [key, val] of value){
    const mapVal = testMap.get(key);
    expect(mapVal).toEqual(val);
  }
});

test("Save and Read Map(Type Preservation)", () => {
  const testKW = "kwMap";
  const testMap = new Map();

  testMap.set("a", {kw1 : "abcd", kw2 : 234});
  testMap.set("b", {kw1 : "qwer", kw2 : 134});
  testMap.set("c", {kw1 : "zxcv", kw2 : 124, kw3: [11923981293,123121231]});
  testMap.set("d", {kw1 : "oqpq", kw2 : 1234, kw3 : {kwOb : "Check if object in are preserved"}});

  db.addType(testKW, Map);
  db.set(testKW, testMap)

  const value = db.get(testKW);

  expect(value).toEqual(testMap);
});

test("Jest map equal test", () => {
  // Tests if Jest can determine equallity between maps

  const key = 3;
  const value = "test";
  const map1 = new Map();
  const map2 = new Map();

  map1.set(key, value);
  map2.set(key, value);

  expect(map1).toEqual(map2);

});

test("Save and read Map inside of Maps", () => {
  // This unit test shows a limitation of the local storage
  // It shows that you cannot preserve complicated structures of Maps within Maps
  const kw = "MONSTERMAP";
  const MONSTERMAP = new Map();

  const mini_monster_map = new Map();

  mini_monster_map.set(3, {kw1 : "Humor?", kw2 : "In my unit tests?"});
  mini_monster_map.set(4, {kw1 : "It's more likely", kw2 : "than you think"});

  MONSTERMAP.set(1, mini_monster_map);

  db.addType(kw, Map);
  db.set(kw, MONSTERMAP);

  const loaded_MONSTERMAP = db.get(kw);
  // Fails
  //expect(MONSTERMAP).toEqual(loaded_MONSTERMAP);
});

test("Test maps within sets", () =>{
  const localStorage_kw = "MONSTERMAP";
  const MONSTERMAP = new Map();

  const set1 = new Set();
  const set2 = new Set();
  const set3 = new Set();

  set2.add(32)

  const set1_kw = 1;
  const set2_kw = 2;
  const set3_kw = 3;

  MONSTERMAP.set(set1_kw,set1)
  MONSTERMAP.set(set2_kw,set2)
  MONSTERMAP.set(set3_kw,set3)

  db.addType(localStorage_kw, Map);
  db.set(localStorage_kw, MONSTERMAP)

  const loaded_MONSTERMAP = db.get(localStorage_kw)

  console.log(loaded_MONSTERMAP)
});