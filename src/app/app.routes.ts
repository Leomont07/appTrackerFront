import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { AdminPanelComponent } from './admin-panel/admin-panel.component';
import { DeliveryPanelComponent } from './delivery-panel/delivery-panel.component';
import { AuthGuard } from './auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'admin', component: AdminPanelComponent, canActivate: [AuthGuard], data: { role: 'admin' } },
  { path: 'delivery', component: DeliveryPanelComponent, canActivate: [AuthGuard], data: { role: 'delivery' } }
];