import { AccountModel } from "../account-service/account.types";

export type UserTokenModel = AccountModel & {
  remember: boolean
  password: string
  lastest_login_time: number
}
