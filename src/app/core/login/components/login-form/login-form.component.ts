import { Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { LoginService } from '@core/login/services/login.service';
import { CommonModule } from '@angular/common';
import { AlertService } from '@shared/services/alert.service';
import { AlertType } from '@utils/enums/alert-type.enum';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.css',
})
export class LoginFormComponent {
  private readonly loginSrv: LoginService = inject(LoginService);
  private readonly alertSrv: AlertService = inject(AlertService);
  private readonly router: Router = inject(Router);

  protected loginForm: FormGroup = new FormGroup({
    email: new FormControl(null, [Validators.required, Validators.email]),
    password: new FormControl(null, [Validators.required]),
  });

  onSubmit() {
    const { email, password } = this.loginForm.value;

    this.loginSrv.signIn({ email, password }).subscribe({
      next: (res) => {
        this.loginSrv.saveTokenInLocalStorage(res.accessToken);
        this.loginSrv.saveLoggedUserInLocalStorage(res);
        this.alertSrv.showAlert({
          alertType: AlertType.SUCCESS,
          mainMessage: 'Inicio de sesión exitoso',
          subMessage: `Bienvenido de nuevo ${res.user.firstName} ${res.user.lastName}`,
        });
        this.router.navigate(['/inicio']);
      },
      error: (err: any) => {
        this.alertSrv.showAlert({
          alertType: AlertType.ERROR,
          mainMessage: 'Inicio de sesión fallido',
          subMessage: err.error.message,
        });
      },
    });
  }
}
