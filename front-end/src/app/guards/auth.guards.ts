import {inject} from "@angular/core";
import {Router} from "@angular/router";
import {AuthService} from '../core/service/auth.service';

export const AuthGuard = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    await router.navigateByUrl('/login')
    return false
  }
  return true
}
