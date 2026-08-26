import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { loadApiConfig } from './app/core/api-config';

loadApiConfig()
  .then(() => bootstrapApplication(App, appConfig))
  .catch((err) => console.error(err));
