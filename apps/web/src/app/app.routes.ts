import { Routes } from '@angular/router';
import { Record } from './features/record/record';
import { Confirm } from './features/confirm/confirm';
import { History } from './features/history/history';

export const routes: Routes = [
  { path: '', component: Record },
  { path: 'confirm/:id', component: Confirm },
  { path: 'history', component: History },
];
