import {Injectable} from '@angular/core';
import {Register} from '../models/Register';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Login} from '../models/Login';
import {JwtToken} from '../models/JwtToken';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private httpClient: HttpClient) {
  }

  register(user: Register): Observable<String> {
    return this.httpClient.post<String>('/api/register', user);
  }

  login(login: Login): Observable<JwtToken> {
    return this.httpClient.post<JwtToken>('/api/login', login);
  }
}
