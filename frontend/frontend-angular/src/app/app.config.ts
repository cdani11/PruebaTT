import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { rutas } from './app.routes';
import { tokenInterceptor } from './core/interceptors/token.interceptor';
import { erroresInterceptor } from './core/interceptors/errores.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(rutas),
    provideHttpClient(withInterceptors([tokenInterceptor, erroresInterceptor])),
  ]
};
