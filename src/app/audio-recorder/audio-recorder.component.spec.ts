import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AudioRecorderComponent } from './audio-recorder.component';
import { AudioService } from '../services/audio-service';

describe('AudioRecorderComponent', () => {
  let component: AudioRecorderComponent;
  let fixture: ComponentFixture<AudioRecorderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AudioRecorderComponent],
      providers: [AudioService]
    }).compileComponents();

    fixture = TestBed.createComponent(AudioRecorderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
