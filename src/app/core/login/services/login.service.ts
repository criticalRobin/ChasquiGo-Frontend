import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { HttpClient } from '@angular/common/http';
import { ILoginRequest } from '../models/login-request.interface';
import { BehaviorSubject, Observable } from 'rxjs';
import { ILoginResponse } from '../models/login-response.interface';
import { IBaseUser } from '@shared/models/base-user.interface';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private baseUrl: string = environment.API_URL;
  private readonly http: HttpClient = inject(HttpClient);
  private readonly router: Router = inject(Router);

  private loggedInUserSubject: BehaviorSubject<IBaseUser | null> =
    new BehaviorSubject<IBaseUser | null>(this.getLoggedUserFromLocalStorage());
  public loggedInUser$: Observable<IBaseUser | null> =
    this.loggedInUserSubject.asObservable();

  signIn(userCredentials: ILoginRequest): Observable<ILoginResponse> {
    const signInUrl: string = `${this.baseUrl}/auth/login`;
    return this.http.post<ILoginResponse>(signInUrl, userCredentials);
  }

  saveTokenInLocalStorage(token: string): void {
    console.log('Saving token in localStorage:', token);
    localStorage.setItem('token', token);
  }

  getTokenFromLocalStorage(): string {
    return localStorage.getItem('token') || '';
  }

  saveLoggedUserInLocalStorage(loginResponse: ILoginResponse): void {
    localStorage.setItem('loggedUser', JSON.stringify(loginResponse.user));
    this.loggedInUserSubject.next(loginResponse.user);
  }

  getLoggedUserFromLocalStorage(): IBaseUser | null {
    const user: IBaseUser | null = JSON.parse(
      localStorage.getItem('loggedUser') || '{}'
    );

    return user?.id ? user : null;
  }

  updateLoggedUser(user: IBaseUser | null): void {
    this.loggedInUserSubject.next(user);
  }

  logout(): void {
    this.router.navigate(['/']);
    localStorage.removeItem('loggedUser');
    localStorage.removeItem('token');
    this.loggedInUserSubject.next(null);
  }
}
