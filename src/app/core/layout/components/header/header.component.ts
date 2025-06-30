import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LoginService } from '@core/login/services/login.service';
import { IBaseUser } from '@shared/models/base-user.interface';
import { ICooperative } from '@features/coops/models/cooperative.interface';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit, OnDestroy {
  protected loginSrv: LoginService = inject(LoginService);

  protected loggedUser: any | null;
  protected cooperative: ICooperative | null = null;
  private cooperativeSubscription: Subscription | null = null;

  constructor() {
    this.loggedUser = this.loginSrv.getLoggedUserFromLocalStorage();
  }

  ngOnInit(): void {
    // Subscribe to cooperative changes
    this.cooperativeSubscription = this.loginSrv.cooperative$.subscribe({
      next: (cooperative) => {
        this.cooperative = cooperative;
      }
    });

    // Load cooperative from localStorage if available
    this.cooperative = this.loginSrv.getCooperativeFromLocalStorage();
  }

  ngOnDestroy(): void {
    if (this.cooperativeSubscription) {
      this.cooperativeSubscription.unsubscribe();
    }
  }

  protected getLogoUrl(): string {
    if (this.cooperative?.logo && this.cooperative.logo.trim() !== '') {
      return this.cooperative.logo;
    }
    return 'assets/chasqui-go/logo-black.jpeg';
  }

  protected onImageError(event: any): void {
    // Fallback to default logo if cooperative logo fails to load
    event.target.src = 'assets/chasqui-go/logo-black.jpeg';
    event.target.alt = 'ChasquiGo';
  }

  protected isWorker(): boolean {
    return this.loggedUser?.role === 'WORKER';
  }
}
