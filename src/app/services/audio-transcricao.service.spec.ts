import { TestBed } from '@angular/core/testing';

import { AudioTranscricaoService } from './audio-transcricao.service';

describe('AudioTranscricaoService', () => {
  let service: AudioTranscricaoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AudioTranscricaoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
