import { User } from "../../dataclasses/dataclasses";
import { USER_GROUPS } from "../../lib/constants";

export const ANON = new User();

export const users = new Map([
  [1, new User(undefined, 1, 'Admin', USER_GROUPS.ADMIN, true, undefined)],
  [2, new User(undefined, 2, 'prodAdmin', USER_GROUPS.PRODUCTION_ADMIN, true, undefined)],
  [3, new User(undefined, 3, 'prodUser', USER_GROUPS.PRODUCTION_USER, true, undefined)],
  [4, new User(undefined, 4, 'shopAdmin', USER_GROUPS.SHOP_ADMIN, true, undefined)],
  [5, new User(undefined, 5, 'shopUser', USER_GROUPS.SHOP_USER, true, undefined)],
  [6, new User(undefined, 6, 'shopExtern', USER_GROUPS.SHOP_EXTERNAL, true, undefined)],
  [7, new User(undefined, 7, 'shopAdminNoAssoc', USER_GROUPS.SHOP_ADMIN, true, undefined)],
  [8, new User(undefined, 8, 'shopUserNoAssoc', USER_GROUPS.SHOP_USER, true, undefined)],
  [9, new User(undefined, 9, 'shopExternNoAssoc', USER_GROUPS.SHOP_EXTERNAL, true, undefined)],
])