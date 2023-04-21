import { USER_GROUPS } from "../lib/constants"

export { User}

class User {
  constructor(username='Anon', user_group=USER_GROUPS.ANON, customer=[]) {
    this.username = username
    this.user_group = user_group
    this.customer = customer
  }
}