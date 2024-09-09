import { Location } from "~/dataclasses/dataclasses";

export const locations = new Map([
  // Customer 1 - Endpoint 1
  [1, new Location(1, "ROOM_CODE_1", 1, "ROOM_1" )],
  [2, new Location(2, "ROOM_CODE_2", 1, "ROOM_2" )],
  [3, new Location(3, "ROOM_CODE_3", 1, "ROOM_3" )],
  [4, new Location(4, "ROOM_CODE_4", 1, "ROOM_4" )],
  [5, new Location(5, "ROOM_CODE_5", 1, "ROOM_5" )],
  [6, new Location(6, "ROOM_CODE_6", 1, "ROOM_6" )],
  [7, new Location(7, "ROOM_CODE_7", 1, "ROOM_7" )],
  [8, new Location(8, "ROOM_CODE_8", 1, "ROOM_8" )],
  [9, new Location(9, "ROOM_CODE_9", 1, "ROOM_9" )],
  // Customer 1 - Endpoint 2
  [11, new Location(11, "ROOM_CODE_11", 2, "ROOM_11" )],
  [12, new Location(12, "ROOM_CODE_12", 2, "ROOM_12" )],
  [13, new Location(13, "ROOM_CODE_13", 2, "ROOM_13" )],
  [14, new Location(14, "ROOM_CODE_14", 2, "ROOM_14" )],
  [15, new Location(15, "ROOM_CODE_15", 2, "ROOM_15" )],
  // Customer 2 - Endpoint 3
  [16, new Location(16, "ROOM_CODE_16", 3, "ROOM_16" )],
  [17, new Location(17, "ROOM_CODE_17", 3, "ROOM_17" )],
  [18, new Location(18, "ROOM_CODE_18", 3, "ROOM_18" )],
  [19, new Location(19, "ROOM_CODE_19", 3, "ROOM_19" )],
  [20, new Location(20, "ROOM_CODE_20", 3, "ROOM_20" )],
  // Missing rooms
  [21, new Location(21, "ROOM_CODE_21", 1, null )],
  [22, new Location(22, "ROOM_CODE_22", 1, null )],

])