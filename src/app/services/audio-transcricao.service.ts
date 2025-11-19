import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AudioTranscricaoService {


  private apiUrl = 'http://localhost:8080';

  constructor(private http: HttpClient) {}

  transcreverAudio(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    const headers = new HttpHeaders();
    return this.http.post<string>(`${this.apiUrl}/api/audio/transcrever`, formData, { headers });
  }
}
