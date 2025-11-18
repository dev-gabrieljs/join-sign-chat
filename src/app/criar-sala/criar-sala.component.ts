import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-criar-sala',
  templateUrl: './criar-sala.component.html',
  styleUrls: ['./criar-sala.component.scss']
})
export class CriarSalaComponent {

  salaCriadaId: string | null = null;
  salaParaEntrar: string = '';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  // Cria uma nova sala e redireciona para ela
  criarSala() {
    this.http.post<any>('http://localhost:8080/sala/criar', {})
      .subscribe(response => {
        this.salaCriadaId = response.salaId;
      }, error => {
        console.error('Erro ao criar sala:', error);
      });
  }

 entrarNaSala() {
  const salaId = this.salaParaEntrar.trim();
  if (!salaId) return;

  const userId = localStorage.getItem('userId') || Math.random().toString(36).substring(2, 10);
  localStorage.setItem('userId', userId);

  this.http.post<any>(`http://localhost:8080/sala/entrar/${salaId}/${userId}`, {})
    .subscribe(res => {
      if (res.sucesso) {
        this.router.navigate(['/sala', salaId]);
      } else {
        alert('Sala cheia ou inexistente!');
      }
    }, error => {
      console.error('Erro ao entrar na sala:', error);
    });
}

}
