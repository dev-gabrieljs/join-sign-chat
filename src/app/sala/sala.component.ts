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
import { Subject, firstValueFrom, takeUntil } from 'rxjs';

@Component({
  selector: 'app-sala',
  templateUrl: './sala.component.html',
  styleUrls: ['./sala.component.scss'],
})
export class SalaComponent implements OnInit, OnDestroy {
  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;

  streamLocal!: MediaStream;
  salaId!: string;
  userId!: string;
  hasRemoteUser = false;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private webRtc: WebRtcService,
    private http: HttpClient
  ) {}

  async ngOnInit() {
    this.salaId = this.route.snapshot.params['id'];

    // reaproveita o mesmo userId entre refreshs
    this.userId =
      localStorage.getItem('userId') || crypto.randomUUID().substring(0, 8);
    localStorage.setItem('userId', this.userId);

    try {
      // tenta entrar na sala
      const res: any = await firstValueFrom(
        this.http.post(
          `http://localhost:8080/sala/entrar/${this.salaId}/${this.userId}`,
          {}
        )
      );

      if (!res.sucesso) {
        alert('Sala cheia ou inexistente, não é possível entrar.');
        this.router.navigate(['/']);
        return;
      }

      const usuarios: string[] = Array.from(res.usuarios);
      await this.webRtc.init(this.salaId, this.userId, usuarios);

      // vídeo local
      this.streamLocal = this.webRtc.getLocalStream()!;
      this.localVideo.nativeElement.srcObject = this.streamLocal;

      // vídeo remoto
      this.webRtc.remoteStreams$
        .pipe(takeUntil(this.destroy$))
        .subscribe(({ stream }) => {
          this.hasRemoteUser = true;
          setTimeout(() => {
            if (this.remoteVideo) {
              this.remoteVideo.nativeElement.srcObject = stream;
              this.remoteVideo.nativeElement.play().catch(console.error);
            }
          });
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

  onVolumeChange(isVolumeOff: boolean) {
    this.remoteVideo.nativeElement.muted = isVolumeOff;
  }

  onEndCall() {
    this.webRtc.close();
    this.router.navigate(['/']);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.webRtc.close();
  }
}
