import { Routes } from '@angular/router';
import { GalleryComponent } from './gallery/gallery.component';
import { AudioRecorderComponent } from './audio-recorder/audio-recorder.component';

export const routes: Routes = [
    { path: '', component: GalleryComponent },
    { path: 'gallery', component: GalleryComponent },
    { path: 'audio', component: AudioRecorderComponent }
];
