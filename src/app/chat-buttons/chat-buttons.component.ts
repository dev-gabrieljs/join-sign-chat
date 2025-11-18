import { Component, EventEmitter, Output } from '@angular/core';

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

  isMuted = false;
  isVideoOff = false;
  isVolumeOff = false;
  isVoiceSelectionActive = false;
  isVoiceOverActive = false;

    private stream: MediaStream | null = null;
  
  constructor() {
    this.startVideo();
  }

    async startVideo() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      const videoElem = document.querySelector('video') as HTMLVideoElement;
      if (videoElem) videoElem.srcObject = this.stream;
    } catch (err) {
      console.error("Erro ao acessar câmera:", err);
    }
  }


  // Alterna microfone
  toggleMute() {
    this.isMuted = !this.isMuted;
    this.muteChanged.emit(this.isMuted);
  }

  // Alterna câmera
  toggleVideo() {
    if (!this.stream) return;

    this.isVideoOff = !this.isVideoOff;

    this.stream.getVideoTracks().forEach(track => track.enabled = !this.isVideoOff);

    this.videoChanged.emit(this.isVideoOff);
    console.log("Video is now:", this.isVideoOff ? "Off" : "On");
  }

  // Alterna volume
  toggleVolume() {
    this.isVolumeOff = !this.isVolumeOff;
    this.volumeChanged.emit(this.isVolumeOff);
  }

  // Encerra chamada
  endCall() {
    this.endCallClicked.emit();
  }

  // Alterna voice selection
  toggleVoiceSelection() {
    this.isVoiceSelectionActive = !this.isVoiceSelectionActive;
    this.voiceSelectionChanged.emit(this.isVoiceSelectionActive);
  }

  // Alterna voice over
  toggleVoiceOver() {
    this.isVoiceOverActive = !this.isVoiceOverActive;
    this.voiceOverChanged.emit(this.isVoiceOverActive);
  }
}
