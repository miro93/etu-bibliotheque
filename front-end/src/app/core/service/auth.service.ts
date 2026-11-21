import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  login(token: string): void {
    sessionStorage.setItem('token', token);
  }

  logout() {
    sessionStorage.removeItem('token');
  }

  getToken() {
    return sessionStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
