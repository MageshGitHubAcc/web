// waveform.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-waveform',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wave-format.component.html',
  styleUrls: ['./wave-format.component.css'],
})
export class WaveformComponent {
  isAnimating = false;
  animationKey = 0;

  // Waveform data representing heights of bars (similar to your image)
  waveformData = [
    15, 25, 35, 20, 45, 30, 55, 40, 65, 35, 75, 45, 85, 55, 95, 65, 80, 50, 70, 40,
    60, 35, 80, 55, 90, 70, 85, 60, 75, 45, 65, 35, 55, 25, 45, 20, 35, 15, 25, 10,
    20, 15, 30, 25, 40, 35, 50, 45, 60, 55, 70, 65, 80, 75, 85, 80, 90, 85, 95, 90
  ];

  toggleAnimation() {
    this.isAnimating = !this.isAnimating;
    this.animationKey++;
  }

  resetWaveform() {
    this.isAnimating = false;
    this.animationKey++;
  }

  getAnimationDelay(index: number): string {
    return this.isAnimating ? `${index * 50}ms` : '0ms';
  }

  trackByIndex(index: number, item: number): number {
    return index;
  }

  getAnimationDuration(index: number): string {
    return this.isAnimating ? `${800 + (index % 5) * 200}ms` : '0ms';
  }


}



