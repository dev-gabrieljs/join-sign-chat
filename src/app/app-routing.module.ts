import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CriarSalaComponent } from './criar-sala/criar-sala.component';
import { SalaComponent } from './sala/sala.component';


const routes: Routes = [
  { path: '', component: CriarSalaComponent },
  { path: 'sala/:id', component: SalaComponent }
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
