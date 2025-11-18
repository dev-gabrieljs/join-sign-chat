import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WebRtcService } from '../services/web-rtc.service';
import { HttpClient } from '@angular/common/http';

interface RemoteStream {
  userId: string;
  stream: MediaStream;
}

@Component({
  selector: 'app-sala',
  templateUrl: './sala.component.html',
  styleUrls: ['./sala.component.scss'],
})
export class SalaComponent implements OnInit, OnDestroy {
  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;

  remoteStreams: { userId: string, stream: MediaStream }[] = [];
  streamLocal!: MediaStream;
  salaId!: string;
  userId!: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private webRtc: WebRtcService,
    private http: HttpClient
  ) {}

  async ngOnInit() {
    this.salaId = this.route.snapshot.params['id'];
    this.userId = Math.random().toString(36).substring(2, 10);  // ID único para o usuário

    try {
      // Entra na sala no backend
      const res: any = await this.http.post(
        `http://localhost:8080/sala/entrar/${this.salaId}/${this.userId}`, {}
      ).toPromise();

      const usuarios: string[] = Array.from(res.usuarios);
      await this.webRtc.init(this.salaId, this.userId, usuarios);

      // Atribui o fluxo local ao elemento de vídeo
      this.streamLocal = this.webRtc.getLocalStream()!;
      this.localVideo.nativeElement.srcObject = this.streamLocal;

      // Subscrição para fluxos remotos
      this.webRtc.remoteStreams$.subscribe(({ userId, stream }) => {
        const existing = this.remoteStreams.find(r => r.userId === userId);
        if (existing) {
          existing.stream = stream;
        } else {
          this.remoteStreams.push({ userId, stream });
        }
      });

    } catch (err) {
      console.error('Erro ao entrar na sala:', err);
      alert('Não foi possível entrar na sala.');
      this.router.navigate(['/']);
    }
  }

  onMuteChange(isMuted: boolean) {
    this.streamLocal
      .getAudioTracks()
      .forEach((track) => (track.enabled = !isMuted));
  }

  onVideoChange(isVideoOff: boolean) {
    this.streamLocal
      .getVideoTracks()
      .forEach((track) => (track.enabled = !isVideoOff));
  }

  trackByUserId(index: number, item: { userId: string; stream: MediaStream }) {
    return item.userId;
  }

  onVolumeChange(isVolumeOff: boolean) {
    this.remoteStreams.forEach((r) => {
      const videos = document.querySelectorAll('video');
      videos.forEach((video) => {
        if ((video as HTMLVideoElement).srcObject === r.stream) {
          (video as HTMLVideoElement).muted = isVolumeOff;
        }
      });
    });
  }

  onEndCall() {
    this.webRtc.close();
    this.router.navigate(['/']);
  }

  ngOnDestroy() {
    this.webRtc.close();
    this.remoteStreams = []; // Limpar fluxos remotos
  }
}
