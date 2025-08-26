import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, PasswordModule],
  template: `
    <div class="p-grid p-fluid">
      <div class="p-col-12 p-md-6 p-lg-4" style="margin: 0 auto;">
        <div class="p-field">
          <label for="username">Username</label>
          <input pInputText id="username" [(ngModel)]="username" placeholder="Username" />
        </div>
        <div class="p-field">
          <label for="password">Password</label>
          <p-password id="password" [(ngModel)]="password" placeholder="Password"></p-password>
        </div>
        <div class="p-field">
          <p-button label="Login" (onClick)="login()"></p-button>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  username: string = '';
  password: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  login() {
    this.authService.login(this.username, this.password).subscribe({
      next: () => {
        const type = this.authService.getUserType();
        this.router.navigate([type === 'admin' ? '/admin' : '/delivery']);
      },
      error: (err) => console.error(err)
    });
  }
}