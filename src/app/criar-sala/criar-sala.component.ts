import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SalaService } from '../services/sala.service';

@Component({
  selector: 'app-criar-sala',
  templateUrl: './criar-sala.component.html',
  styleUrls: ['./criar-sala.component.scss'],
})
export class CriarSalaComponent implements OnInit {
  salaCriadaId: string | null = null;
  salaParaEntrar: string = '';
  microphones: any[] = [];
  speakers: any[] = [];
  cameras: any[] = [];
  selectedMicrophone: string = '';
  selectedSpeaker: string = '';


  constructor(
    private salaService: SalaService,
    private router: Router
  ) {}

  ngOnInit() {
    this.listarDispositivosAudio();
  }

  criarSala() {
    this.salaService.criarSala().subscribe(
      (response) => {
        this.salaCriadaId = response.salaId;
      },
      (error) => {
        console.error('Erro ao criar sala:', error);
      }
    );
  }

  entrarNaSala() {
    const salaId = this.salaParaEntrar.trim();
    if (!salaId) return;

    const userId =
      localStorage.getItem('userId') ||
      Math.random().toString(36).substring(2, 10);
    localStorage.setItem('userId', userId);

    this.salaService.entrarNaSala(salaId, userId).subscribe(
      (res) => {
        if (res.sucesso) {
          this.router.navigate(['/sala', salaId]);
        } else {
          alert('Sala cheia ou inexistente!');
        }
      },
      (error) => {
        console.error('Erro ao entrar na sala:', error);
      }
    );
  }

  listarDispositivosAudio() {
    this.salaService.listarDispositivosAudio().then(
      ({ microphones, speakers }) => {
        this.microphones = microphones;
        this.speakers = speakers;


        if (this.microphones.length > 0) {
          this.selectedMicrophone = this.microphones[0].deviceId;
        }
        if (this.speakers.length > 0) {
          this.selectedSpeaker = this.speakers[0].deviceId;
        }
      },
      (error) => {
        console.error('Erro ao listar dispositivos de áudio e vídeo:', error);
      }
    );
  }

  updateMicrophone() {
    console.log('Microfone selecionado:', this.selectedMicrophone);
  }

  updateSpeaker() {
    console.log('Alto-falante selecionado:', this.selectedSpeaker);
  }

}
