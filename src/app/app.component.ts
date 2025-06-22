import { Component } from '@angular/core';
import { AudioRecorderComponent } from './audio-recorder/audio-recorder.component';
import { GalleryComponent } from './gallery/gallery.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  template: `<router-outlet></router-outlet>`,
  imports: [RouterOutlet],
})
export class AppComponent {
  title = 'app';
}
