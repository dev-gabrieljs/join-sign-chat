import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Client } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';

interface Peer {
  pc: RTCPeerConnection;
}

interface SignalMessage {
  salaId: string;
  userId: string;
  targetUserId?: string;
  tipo: 'offer' | 'answer' | 'ice' | 'join' | 'leave';
  payload: string;
}

interface RemoteStream {
  userId: string;
  stream: MediaStream;
}

@Injectable({ providedIn: 'root' })
export class WebRtcService {
  private localStream?: MediaStream;
  private stompClient?: Client;

  public remoteStreams$ = new Subject<RemoteStream>();

  private salaId!: string;
  private userId!: string;

  private peers = new Map<string, Peer>();

  constructor() {}

  public async init(
    salaId: string,
    userId: string,
    usersInRoom: string[] = []
  ) {
    this.salaId = salaId;

    const stableId = localStorage.getItem('userId') || userId;
    localStorage.setItem('userId', stableId);
    this.userId = stableId;

    // local stream
    this.localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    // websocket
    this.stompClient = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      reconnectDelay: 3000,
    });

    await new Promise<void>((resolve) => {
      this.stompClient!.onConnect = async () => {

        // escuta minhas mensagens
        this.stompClient!.subscribe(
          `/topic/room.${this.salaId}.${this.userId}`,
          (message) => {
            const data: SignalMessage = JSON.parse(message.body);
            this.handleMessage(data);
          }
        );

        // notifico meu join
        this.sendMessage('join', '', undefined);

        /**
         * ⚠️ AQUI A REGRA CORRETA:
         * Se eu entrei agora, eu devo ser OFFERER para TODOS que estavam na sala.
         */
        for (const otherUserId of usersInRoom) {
          if (otherUserId !== this.userId) {
            await this.createPeerConnection(otherUserId, true); // sempre offer
          }
        }

        resolve();
      };

      this.stompClient!.activate();
    });
  }

  private async createPeerConnection(otherUserId: string, isOfferer: boolean) {
    if (this.peers.has(otherUserId)) return;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }],
    });

    this.peers.set(otherUserId, { pc });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendMessage('ice', JSON.stringify(event.candidate), otherUserId);
      }
    };

    pc.ontrack = (event) => {
      const stream = event.streams[0];
      this.remoteStreams$.next({ userId: otherUserId, stream });
    };

    // envia tracks locais
    this.localStream!.getTracks().forEach((track) =>
      pc.addTrack(track, this.localStream!)
    );

    // offer apenas se pedido
    if (isOfferer) {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      await pc.setLocalDescription(offer);

      this.sendMessage('offer', JSON.stringify(offer), otherUserId);
    }
  }

  private sendMessage(
    tipo: SignalMessage['tipo'],
    payload: string,
    targetUserId?: string
  ) {
    if (!this.stompClient?.active) return;

    const msg: SignalMessage = {
      salaId: this.salaId,
      userId: this.userId,
      targetUserId,
      tipo,
      payload,
    };

    this.stompClient.publish({
      destination: '/app/sinalizar',
      body: JSON.stringify(msg),
    });
  }

  private async handleMessage(data: SignalMessage) {
    const otherUserId = data.userId;

    switch (data.tipo) {
      case 'join':
        if (otherUserId !== this.userId) {
          /**
           * ⚠️ CORREÇÃO AQUI:
           * Se outro usuário entra DEPOIS de mim,
           * ELE é quem enviaOffer... não eu.
           * Então eu crio o peer sem offer.
           */
          await this.createPeerConnection(otherUserId, false);
        }
        return;

      case 'offer': {
        if (!this.peers.has(otherUserId)) {
          await this.createPeerConnection(otherUserId, false);
        }

        const peer = this.peers.get(otherUserId)!.pc;
        await peer.setRemoteDescription(JSON.parse(data.payload));

        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);

        this.sendMessage('answer', JSON.stringify(answer), otherUserId);
        return;
      }

      case 'answer': {
        const peer = this.peers.get(otherUserId)?.pc;
        if (!peer) return;

        await peer.setRemoteDescription(new RTCSessionDescription(JSON.parse(data.payload)));
        return;
      }

      case 'ice': {
        const peer = this.peers.get(otherUserId)?.pc;
        if (!peer) return;

        try {
          await peer.addIceCandidate(JSON.parse(data.payload));
        } catch (err) {
          console.error('Erro ICE:', err);
        }
        return;
      }
    }
  }

  public getLocalStream() {
    return this.localStream;
  }

  public close() {
    for (const peer of this.peers.values()) {
      peer.pc.close();
    }

    this.peers.clear();

    if (this.stompClient?.active) this.stompClient.deactivate();

    if (this.localStream)
      this.localStream.getTracks().forEach((t) => t.stop());
  }
}
