import { Component, inject, input, InputSignal, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoginService } from '@core/login/services/login.service';
import { IBaseUser } from '@shared/models/base-user.interface';

@Component({
  selector: 'app-banner',
  standalone: true,
  imports: [],
  templateUrl: './banner.component.html',
  styleUrl: './banner.component.css',
})
export class BannerComponent implements OnInit {
  private readonly route: ActivatedRoute = inject(ActivatedRoute);
  private readonly loginSrv: LoginService = inject(LoginService);

  public title: InputSignal<string | undefined> = input<string | undefined>();

  protected currentRoute: any;
  protected currentUser: IBaseUser | null;

  ngOnInit(): void {
    this.currentRoute = this.route.snapshot.url[0].path;
    this.currentUser = this.loginSrv.getLoggedUserFromLocalStorage();
  }
}
