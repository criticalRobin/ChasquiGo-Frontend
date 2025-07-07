import { inject, Injectable } from '@angular/core';

import { CanActivate, Router } from '@angular/router';
import { LoginService } from '@core/login/services/login.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  private readonly router: Router = inject(Router);
  private readonly loginSrv: LoginService = inject(LoginService);

  private readonly token: string = this.loginSrv.getTokenFromLocalStorage();

  canActivate(): boolean {
    if (this.token) {
      return true;
    } else {
      this.router.navigate(['/']);
      return false;
    }
  }
}
