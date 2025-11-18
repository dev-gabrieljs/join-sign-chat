import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Client } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';

interface Peer {
  pc: RTCPeerConnection;
  remoteStream: MediaStream;
}

interface RemoteStream {
  userId: string;
  stream: MediaStream;
}

@Injectable({
  providedIn: 'root'
})
export class WebRtcService {

  private localStream?: MediaStream;
  private stompClient?: Client;
  public remoteStreams$ = new Subject<RemoteStream>();

  private salaId!: string;
  private userId!: string;

  private peers: Map<string, Peer> = new Map();

  constructor() {}

  public async init(salaId: string, userId: string, usersInRoom: string[] = []) {
    this.salaId = salaId;
    this.userId = userId;

    try {
      // Acessa a mídia local (vídeo e áudio)
      this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch (err) {
      console.warn('Não foi possível acessar a câmera/microfone:', err);
      this.localStream = new MediaStream();
    }

    // Inicializa o cliente STOMP para comunicação com o servidor
    this.stompClient = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      reconnectDelay: 5000
    });

    // Conecta ao servidor e subscreve ao tópico da sala
    await new Promise<void>((resolve) => {
      this.stompClient!.onConnect = async () => {
        console.log('Conectado ao WebSocket');
        this.stompClient!.subscribe(`/topic/room.${this.salaId}`, (message) => {
          const data = JSON.parse(message.body);
          this.handleMessage(data);
        });

        // Cria PeerConnections para os outros usuários
        for (const otherUserId of usersInRoom) {
          if (otherUserId !== this.userId) {
            await this.createPeerConnection(otherUserId, true);  // Cria a conexão com os outros usuários
          }
        }

        resolve();
      };
      this.stompClient!.activate();
    });
  }

  private async createPeerConnection(otherUserId: string, isOfferer: boolean) {
    if (this.peers.has(otherUserId)) return;  // Evita conexões duplicadas

    const pc = new RTCPeerConnection();
    const remoteStream = new MediaStream();
    this.peers.set(otherUserId, { pc, remoteStream });

    // Adiciona os fluxos locais de áudio e vídeo à conexão
    this.localStream!.getTracks().forEach(track => pc.addTrack(track, this.localStream!));

    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach(track => remoteStream.addTrack(track));
      this.remoteStreams$.next({ userId: otherUserId, stream: remoteStream });  // Envia o fluxo remoto para o componente
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendMessage('ice', JSON.stringify(event.candidate), otherUserId);  // Envia as candidaturas ICE
      }
    };

    // Cria a oferta (se for o primeiro a conectar)
    if (isOfferer) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      this.sendMessage('offer', JSON.stringify(offer), otherUserId);  // Envia a oferta
    }
  }

  private sendMessage(tipo: string, payload: string, targetUserId?: string) {
    if (!this.stompClient?.active) {
      console.error('STOMP não conectado ainda!');
      return;
    }

    this.stompClient.publish({
      destination: '/app/sinalizar',
      body: JSON.stringify({
        salaId: this.salaId,
        userId: this.userId,
        targetUserId,
        tipo,
        payload
      })
    });
  }

  private async handleMessage(data: any) {
  if (data.userId === this.userId) return;  // Ignora mensagens enviadas pelo próprio usuário

  const otherUserId = data.userId;

  // Verifica se a conexão com o outro usuário já existe
  if (!this.peers.has(otherUserId)) {
    await this.createPeerConnection(otherUserId, false);
  }

  const peer = this.peers.get(otherUserId);
  if (!peer) return;

  switch (data.tipo) {
    case 'offer':
      // Recebe a oferta (offer) de outro usuário
      if (peer.pc.signalingState !== 'stable') {
        console.error('Erro: Tentando setar remoteDescription em estado incorreto');
        return;
      }
      await peer.pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(data.payload)));

      // Cria a resposta (answer)
      const answer = await peer.pc.createAnswer();
      await peer.pc.setLocalDescription(answer);

      // Envia a resposta (answer) de volta para o outro peer
      this.sendMessage('answer', JSON.stringify(answer), otherUserId);
      break;

    case 'answer':
      // Recebe a resposta (answer) de outro usuário
      if (peer.pc.signalingState !== 'have-remote-offer') {
        console.error('Erro: Tentando setar remoteDescription sem uma oferta válida');
        return;
      }
      await peer.pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(data.payload)));
      break;

    case 'ice':
      // Recebe o ICE Candidate de outro usuário
      try {
        await peer.pc.addIceCandidate(JSON.parse(data.payload));
      } catch (err) {
        console.error('Erro ao adicionar ICE candidate:', err);
      }
      break;
  }
}


  public getLocalStream(): MediaStream | undefined {
    return this.localStream;
  }

  public close() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = undefined;
    }

    this.peers.forEach(peer => peer.pc.close());
    this.peers.clear();

    if (this.stompClient?.active) {
      this.stompClient.deactivate();
      this.stompClient = undefined;
    }
  }
}
