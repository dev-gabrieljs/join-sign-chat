import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { ChatButtonsComponent } from './chat-buttons/chat-buttons.component';
import { FormsModule } from '@angular/forms';
import { CriarSalaComponent } from './criar-sala/criar-sala.component';
import { SalaComponent } from './sala/sala.component';


@NgModule({
  declarations: [
    AppComponent,
    ChatButtonsComponent,
    CriarSalaComponent,
    SalaComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
