import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { SignInAndSignUpPage } from "./sign-in-and-sign-up";

@NgModule({
  declarations: [SignInAndSignUpPage],
  imports: [IonicPageModule.forChild(SignInAndSignUpPage)],
})
export class SignInAndSignUpPageModule {}
