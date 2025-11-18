import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatButtonsComponent } from './chat-buttons.component';

describe('ChatButtonsComponent', () => {
  let component: ChatButtonsComponent;
  let fixture: ComponentFixture<ChatButtonsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ChatButtonsComponent],
    });
    fixture = TestBed.createComponent(ChatButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
