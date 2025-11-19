import { Component, EventEmitter, Output } from '@angular/core';
import { AudioTranscricaoService } from '../services/audio-transcricao.service';

@Component({
  selector: 'app-chat-buttons',
  templateUrl: './chat-buttons.component.html',
  styleUrls: ['./chat-buttons.component.scss'],
})
export class ChatButtonsComponent {
  @Output() muteChanged = new EventEmitter<boolean>();
  @Output() videoChanged = new EventEmitter<boolean>();
  @Output() volumeChanged = new EventEmitter<boolean>();
  @Output() endCallClicked = new EventEmitter<void>();
  @Output() voiceSelectionChanged = new EventEmitter<boolean>();
  @Output() voiceOverChanged = new EventEmitter<boolean>();
  @Output() transcricaoCompleted = new EventEmitter<string>();

  isMuted = false;
  isVideoOff = false;
  isVolumeOff = false;
  isVoiceSelectionActive = false;
  isVoiceOverActive = false;

  private stream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  constructor(private audioTranscricaoService: AudioTranscricaoService) {
    this.startAudio();
  }

  // Inicializando a captura de vídeo e áudio
  // async startVideo() {
  //   try {
  //     // Acessa a câmera e o microfone
  //     this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

  //     // Verifica se há uma pista de áudio
  //     if (!this.stream || this.stream.getAudioTracks().length === 0) {
  //       console.error('Nenhuma pista de áudio encontrada.');
  //       return;
  //     }

  //     const videoElem = document.querySelector('video') as HTMLVideoElement;
  //     if (videoElem) videoElem.srcObject = this.stream;
  //   } catch (err) {
  //     console.error('Erro ao acessar câmera e microfone:', err);
  //     alert('Erro ao acessar o microfone ou câmera. Verifique as permissões.');
  //   }
  // }

  async startAudio() {
  try {
    // Captura apenas o áudio, sem vídeo
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Verifica se há uma pista de áudio
    if (!this.stream || this.stream.getAudioTracks().length === 0) {
      console.error('Nenhuma pista de áudio encontrada.');
      return;
    }

    // Aqui você pode fazer o que for necessário com o áudio, se precisar
    // Exemplo: Exibir áudio em um elemento de <audio> (se precisar)
    // const audioElem = document.querySelector('audio') as HTMLAudioElement;
    // if (audioElem) audioElem.srcObject = this.stream;

  } catch (err) {
    console.error('Erro ao acessar o microfone:', err);
    alert('Erro ao acessar o microfone. Verifique as permissões.');
  }
}


  toggleMute() {
    this.isMuted = !this.isMuted;
    this.muteChanged.emit(this.isMuted);
  }

  toggleVideo() {
    if (!this.stream) return;

    this.isVideoOff = !this.isVideoOff;
    this.stream
      .getVideoTracks()
      .forEach((track) => (track.enabled = !this.isVideoOff));

    this.videoChanged.emit(this.isVideoOff);
    console.log('Vídeo agora está:', this.isVideoOff ? 'Desligado' : 'Ligado');
  }

  toggleVolume() {
    this.isVolumeOff = !this.isVolumeOff;
    this.volumeChanged.emit(this.isVolumeOff);
  }

  endCall() {
    this.endCallClicked.emit();
  }

  toggleVoiceSelection() {
    this.isVoiceSelectionActive = !this.isVoiceSelectionActive;
    this.voiceSelectionChanged.emit(this.isVoiceSelectionActive);

    if (this.isVoiceSelectionActive) {
      this.startRecording();
    } else {
      this.stopRecording();
    }
  }

  toggleVoiceOver() {
    this.isVoiceOverActive = !this.isVoiceOverActive;
    this.voiceOverChanged.emit(this.isVoiceOverActive);
  }

  private startRecording() {
  if (!this.stream) return;

  const audioTrack = this.stream.getAudioTracks()[0];
  if (!audioTrack) return;

  let mimeType = '';

  if (MediaRecorder.isTypeSupported('audio/webm')) {
    mimeType = 'audio/webm';
  } else {
    console.error('Tipo de mídia audio/webm não suportado.');
    return;
  }

  this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });

  this.mediaRecorder.ondataavailable = (event: any) => {
    this.audioChunks.push(event.data);
  };

  this.mediaRecorder.onstop = () => {
    const audioBlob = new Blob(this.audioChunks, { type: mimeType });
    this.sendAudioForTranscription(audioBlob);
  };

  // Inicia a gravação
  this.mediaRecorder.start();
  console.log('Gravação de áudio iniciada...');
}


  private stopRecording() {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      console.log('Gravação de áudio parada...');
    }
  }

  private sendAudioForTranscription(audioBlob: Blob) {

    const file = new File([audioBlob], 'audio.wav', { type: 'audio.wav' });

    this.audioTranscricaoService.transcreverAudio(file).subscribe({
      next: (textoTranscrito: string) => {
        console.log('Texto transcrito:', textoTranscrito);
        this.transcricaoCompleted.emit(textoTranscrito);
      },
      error: (err) => {
        console.error('Erro ao transcrever áudio:', err);
      },
    });
  }
}
