import { Component, inject, OnInit } from '@angular/core';
import { LoginFormComponent } from './components/login-form/login-form.component';
import { LoginService } from './services/login.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [LoginFormComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  private readonly loginSrv: LoginService = inject(LoginService);
  private readonly router: Router = inject(Router);

  ngOnInit(): void {
    this.loginSrv.loggedInUser$.subscribe((user) => {
      if (user) {
        this.router.navigate(['/inicio']);
      }
    });
  }
}
