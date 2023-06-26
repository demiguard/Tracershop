import { USER_GROUPS } from "../lib/constants"


export class User {
  constructor(username='Anon', user_group=USER_GROUPS.ANON, customer=[], id) {
    this.username = username
    this.user_group = user_group
    this.customer = customer
    this.id = id
  }
}