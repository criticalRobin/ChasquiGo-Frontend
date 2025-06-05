import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LoginService } from '@core/login/services/login.service';
import { IBaseUser } from '@shared/models/base-user.interface';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  protected loginSrv: LoginService = inject(LoginService);

  protected loggedUser: IBaseUser | null;

  constructor() {
    this.loggedUser = this.loginSrv.getLoggedUserFromLocalStorage();
  }
}
