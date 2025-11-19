import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SalaService {
  constructor(private http: HttpClient) {}
  private apiUrl = 'http://localhost:8080';
  criarSala(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/sala/criar`, {});
  }

  entrarNaSala(salaId: string, userId: string): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/sala/entrar/${salaId}/${userId}`,
      {}
    );
  }

listarDispositivosAudio(): Promise<any> {
  return new Promise((resolve, reject) => {
    navigator.mediaDevices
      .getUserMedia({ audio: true})
      .then(() => {
        navigator.mediaDevices
          .enumerateDevices()
          .then((devices) => {
            const microphones = devices.filter(device => device.kind === 'audioinput');
            const speakers = devices.filter(device => device.kind === 'audiooutput');
            resolve({ microphones, speakers });
          })
          .catch(reject);
      })
      .catch(reject);
  });
}
}
