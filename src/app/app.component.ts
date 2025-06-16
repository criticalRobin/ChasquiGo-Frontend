import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { SpinnerComponent } from '@shared/components/spinner/spinner.component';
import { LoginService } from '@core/login/services/login.service';
import { LoadingService } from '@shared/services/loading.service';
import { CommonModule } from '@angular/common';
import { AlertComponent } from './shared/components/alert/alert.component';
import { BaseLayoutComponent } from './core/layout/components/base-layout/base-layout.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SpinnerComponent,
    AlertComponent,
    BaseLayoutComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  private readonly loginSrv: LoginService = inject(LoginService);
  protected readonly loadingSrv: LoadingService = inject(LoadingService);
  private readonly router: Router = inject(Router);

  protected isLogged: boolean = !!this.loginSrv.getTokenFromLocalStorage();
  protected currentRoute: string = '';

  ngOnInit(): void {
    this.loginSrv.loggedInUser$.subscribe((user) => {
      this.isLogged = user !== null;
      
      if (this.isLogged && this.router.url === '/login') {
        this.router.navigate(['/inicio']);
      } else if (!this.isLogged && this.router.url !== '/login') {
        this.router.navigate(['/login']);
      }
    });

    this.router.events.subscribe(() => {
      this.currentRoute = this.router.url;
    });
  }
}
