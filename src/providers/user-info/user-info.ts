import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { AccountServiceProvider } from "../account-service/account-service";

/*
  Generated class for the UserInfoProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class UserInfoProvider {
  userInfo: any;
	constructor(public accountService: AccountServiceProvider) {}
}
