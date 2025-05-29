import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { HttpClient } from '@angular/common/http';
import { ILoginRequest } from '@shared/models/login-request.interface';
import { BehaviorSubject, Observable } from 'rxjs';
import { ILoginResponse } from '@shared/models/login-response.interface';
import { IBaseUser } from '@shared/models/base-user.interface';
import { Router } from '@angular/router';
import { ISuccessSingleResponse } from '@shared/models/success-single-response.interface';

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

  signIn(
    userCredentials: ILoginRequest
  ): Observable<ISuccessSingleResponse<ILoginResponse>> {
    const signInUrl: string = `${this.baseUrl}/auth/login`;
    return this.http.post<ISuccessSingleResponse<ILoginResponse>>(
      signInUrl,
      userCredentials
    );
  }

  saveTokenInLocalStorage(token: string): void {
    localStorage.setItem('token', token);
  }

  getTokenFromLocalStorage(): string {
    return localStorage.getItem('token') || '';
  }

  saveLoggedUserInLocalStorage(
    loginResponse: ISuccessSingleResponse<ILoginResponse>
  ): void {
    localStorage.setItem('loggedUser', JSON.stringify(loginResponse.data.user));
    this.loggedInUserSubject.next(loginResponse.data.user);
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