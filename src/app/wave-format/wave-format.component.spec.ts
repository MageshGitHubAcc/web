import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaveFormatComponent } from './wave-format.component';

describe('WaveFormatComponent', () => {
  let component: WaveFormatComponent;
  let fixture: ComponentFixture<WaveFormatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WaveFormatComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WaveFormatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
