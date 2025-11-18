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

  // Entra em uma sala existente
  entrarNaSala() {
    const salaId = this.salaParaEntrar.trim();
    if (!salaId) return;

    // Opcional: checar no backend se a sala existe antes de navegar
    this.http.get<any>(`http://localhost:8080/sala/existe/${salaId}`)
      .subscribe(res => {
        if (res.existe) {
          this.router.navigate(['/sala', salaId]);
        } else {
          alert('Sala não encontrada!');
        }
      }, error => {
        console.error('Erro ao verificar sala:', error);
      });
  }
}
