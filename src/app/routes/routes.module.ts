import { NgModule, Type } from '@angular/core';
import { SharedModule } from '@shared';

// single pages
import { CallbackComponent } from './passport/callback.component';
import { UserLockComponent } from './passport/lock/lock.component';
// passport pages
import { UserLoginComponent } from './passport/login/login.component';
import { UserRegisterResultComponent } from './passport/register-result/register-result.component';
import { UserRegisterComponent } from './passport/register/register.component';
import { RobotStatusComponent } from './robot-status/robot-status.component';
import { RouteRoutingModule } from './routes-routing.module';
import { WorkPathComponent } from './work-path/work-path.component';

const COMPONENTS: Array<Type<void>> = [
  WorkPathComponent,
  RobotStatusComponent,
  // passport pages
  UserLoginComponent,
  UserRegisterComponent,
  UserRegisterResultComponent,
  // single pages
  CallbackComponent,
  UserLockComponent
];

@NgModule({
  imports: [SharedModule, RouteRoutingModule],
  declarations: COMPONENTS
})
export class RoutesModule {}
