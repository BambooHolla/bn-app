import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { SignInAndSignUpPage } from "./sign-in-and-sign-up";
import { ComponentsModule } from "../../components/components.module";

@NgModule({
  declarations: [SignInAndSignUpPage],
  imports: [IonicPageModule.forChild(SignInAndSignUpPage), ComponentsModule],
})
export class SignInAndSignUpPageModule {}
