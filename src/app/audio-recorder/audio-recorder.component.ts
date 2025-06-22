import { Component, OnDestroy, OnInit } from '@angular/core';
import { interval, Subject, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { WaveformComponent } from '../wave-format/wave-format.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-audio-recorder',
  templateUrl: './audio-recorder.component.html',
  styleUrls: ['./audio-recorder.component.css'],
  standalone: true,
  imports: [CommonModule, WaveformComponent]
})
export class AudioRecorderComponent implements OnInit, OnDestroy {

  isRecording = false;
  isPlaying = false;
  currentTime = '0:00/0:30';
  playAudioTime = '0:00/0:00';
  maxDuration = 30;
  showWaveform = false;
  recordingComplete = false;
  btnText: string = 'Tap to start recording';

  private mediaRecorder!: MediaRecorder;
  private audioContext!: AudioContext;
  private analyser!: AnalyserNode;
  private audioChunks: Blob[] = [];
  private audioBlob!: Blob;
  private audio!: HTMLAudioElement;


  private recordingTime = 0;
  private playingTime = 0;
  private recordingTimer: any;
  private playbackTimer: any;
  private subs = new Subscription();


  waveformBars: number[] = Array(8).fill(10);
  staticWaveformBars: number[] = [15, 25, 20, 30, 18, 22, 16, 28];


  private audioSource!: MediaStreamAudioSourceNode;
  private scriptProcessor!: ScriptProcessorNode;
  private updateSubscription: Subscription;


  private frequencyData = new Subject<Uint8Array>();

  constructor(private router: Router) {
    this.initAudioContext();
    this.updateSubscription = interval(50).subscribe(() => {
      this.updateWaveform();
    });
  }

  ngOnInit() { }

  ngOnDestroy() {

    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }


    if (this.isRecording) {
      this.stopRecording();
    }
    if (this.isPlaying) {
      this.stopPlayback();
    }


    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
    if (this.playbackTimer) {
      clearInterval(this.playbackTimer);
      this.playbackTimer = null;
    }


    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null as any;
    }
    if (this.audioSource) {
      this.audioSource.disconnect();
      this.audioSource = null as any;
    }


    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }


    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio.load();
    }
  }


  startRecord() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecordingProcess();
    }
  }


  async startRecordingProcess(): Promise<void> {
    try {

      this.resetForNewRecording();

      this.btnText = 'Tap to stop recording...';
      this.isRecording = true;
      this.showWaveform = true;
      this.recordingComplete = false;
      this.recordingTime = 0;


      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.initializeMediaRecorder(stream);
      this.mediaRecorder.start(100);

      const startTime = Date.now();
      this.recordingTimer = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        this.recordingTime = elapsed;
        this.currentTime = `${this.formatTime(this.recordingTime)} / 0:30`;

        if (elapsed >= this.maxDuration) {
          this.stopRecording();
        }
      }, 100);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      this.isRecording = false;
      this.showWaveform = false;
      this.btnText = 'Tap to start recording';
    }
  }


  stopRecording(): void {
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }


    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }

    this.isRecording = false;
    this.showWaveform = false;

  }


  playRecording(): void {
    if (this.isPlaying) {
      this.pauseRecording();
      return;
    }

    if (!this.audioBlob) return;


    if (!this.audio || this.playingTime === 0) {
      this.audio = new Audio(URL.createObjectURL(this.audioBlob));
      this.setupAudioEventListeners();
    }

    this.playAudio();
  }


  private setupAudioEventListeners(): void {
    if (!this.audio) return;

    this.audio.addEventListener('ended', () => {
      this.stopPlayback();
    });

    this.audio.addEventListener('loadedmetadata', () => {
      console.log('Audio duration:', this.audio.duration);
    });
  }


  pauseRecording(): void {
    if (!this.audio) return;

    this.audio.pause();
    this.isPlaying = false;
    this.btnText = 'Tap to play';
    this.showWaveform = false;

    if (this.playbackTimer) {
      clearInterval(this.playbackTimer);
      this.playbackTimer = null;
    }
  }


  resumeAudio(): void {
    if (!this.audio) return;

    this.audio.play();
    this.isPlaying = true;
    this.btnText = 'Pause';
    this.showWaveform = true;
    this.trackPlayback();
  }


  private playAudio(): void {
    this.isPlaying = true;
    this.showWaveform = true;
    this.btnText = 'Pause';


    if (this.audio) {
      this.audio.currentTime = this.playingTime;
    }

    this.audio.play();
    this.trackPlayback();
  }


  private trackPlayback(): void {
    this.playbackTimer = setInterval(() => {
      if (!this.isPlaying || !this.audio) {
        clearInterval(this.playbackTimer);
        return;
      }


      this.playingTime = this.audio.currentTime;


      this.playAudioTime = `${this.formatTime(this.playingTime)}/${this.formatTime(this.recordingTime)}`;


      if (this.playingTime >= this.recordingTime) {
        this.stopPlayback();
      }
    }, 100);
  }

  // Stops playback and resets state
  private stopPlayback(): void {
    this.isPlaying = false;
    this.showWaveform = false;
    this.btnText = 'Tap to play';
    this.playingTime = 0;
    this.playAudioTime = `0:00/${this.formatTime(this.recordingTime)}`;

    if (this.playbackTimer) {
      clearInterval(this.playbackTimer);
      this.playbackTimer = null;
    }

    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
  }

  // NEW METHOD: Reset states specifically for new recording
  private resetForNewRecording(): void {
    // Clear any existing audio
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio.load();
      this.audio = null as any;
    }

    // Clear audio blob
    this.audioBlob = null as any;
    this.audioChunks = [];

    // Reset all state variables
    this.recordingTime = 0;
    this.playingTime = 0;
    this.currentTime = '0:00/0:30';
    this.playAudioTime = '0:00/0:00';
    this.recordingComplete = false;
    this.isPlaying = false;
    this.showWaveform = false;

    // Clear any existing timers
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
    if (this.playbackTimer) {
      clearInterval(this.playbackTimer);
      this.playbackTimer = null;
    }

    // Reinitialize audio context if it was closed
    if (!this.audioContext || this.audioContext.state === 'closed') {
      this.initAudioContext();
    }
  }

  // UPDATED: Resets the UI state after recording or playback is finished
  private resetUIState(): void {
    this.currentTime = '0:00/0:30';
    this.playAudioTime = '0:00/0:00';
    this.showWaveform = false;
    this.isRecording = false;
    this.isPlaying = false;
    this.recordingComplete = false;
    this.btnText = 'Tap to start recording';
    this.recordingTime = 0;
    this.playingTime = 0;

    // Clear audio resources
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio.load();
      this.audio = null as any;
    }
    this.audioBlob = null as any;
    this.audioChunks = [];
  }

  // Initializes the media recorder and sets up the audio processing
  private initializeMediaRecorder(stream: MediaStream) {
    this.audioChunks = [];
    this.mediaRecorder = new MediaRecorder(stream);

    // Ensure audio context is in good state
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    // Clean up any existing audio processing nodes
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null as any;
    }
    if (this.audioSource) {
      this.audioSource.disconnect();
      this.audioSource = null as any;
    }

    // Set up audio context and processor for waveform visualization
    this.audioSource = this.audioContext.createMediaStreamSource(stream);
    this.audioSource.connect(this.analyser);

    this.scriptProcessor = this.audioContext.createScriptProcessor(2048, 1, 1);
    this.analyser.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.audioContext.destination);

    this.scriptProcessor.onaudioprocess = () => {
      const array = new Uint8Array(this.analyser.frequencyBinCount);
      this.analyser.getByteFrequencyData(array);
      this.frequencyData.next(array);
    };

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.audioChunks.push(e.data);
    };

    this.mediaRecorder.onstop = () => {
      this.audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      this.recordingComplete = true;
      this.btnText = 'Tap to play'; // FIXED: Ensure correct button text
      this.playAudioTime = `0:00/${this.formatTime(this.recordingTime)}`;

      // Cleanup recording resources
      if (this.recordingTimer) {
        clearInterval(this.recordingTimer);
        this.recordingTimer = null;
      }

      // Cleanup audio context resources after recording
      if (this.scriptProcessor) {
        this.scriptProcessor.disconnect();
      }
      if (this.audioSource) {
        this.audioSource.disconnect();
      }
    };
  }

  // Initializes the audio context for waveform analysis
  private initAudioContext() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 32;
  }

  // Formats the time into minutes:seconds
  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  // Updates the waveform visualization by updating the heights of the waveform bars
  private updateWaveform() {
    // Only update waveform when it should be visible
    if (this.showWaveform && (this.isRecording || this.isPlaying)) {
      this.waveformBars = this.waveformBars.map(() => {
        // Create more dynamic waveform during recording/playback
        if (this.isRecording) {
          // More active waveform during recording
          const randomVariation = Math.random() * 50;
          const newHeight = 30 + randomVariation + Math.sin(Date.now() / 150) * 25;
          return Math.min(100, Math.max(15, newHeight));
        } else if (this.isPlaying) {
          // Slightly different pattern during playback
          const randomVariation = Math.random() * 40;
          const newHeight = 25 + randomVariation + Math.cos(Date.now() / 180) * 20;
          return Math.min(90, Math.max(12, newHeight));
        }
        return 10; // Default height when not active
      });
    } else {

      this.waveformBars = Array(8).fill(10);
    }
  }


  private cleanup() {
    if (this.isRecording) {
      this.stopRecording();
    }
    if (this.isPlaying) {
      this.stopPlayback();
    }

    // Clear all timers
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
    if (this.playbackTimer) {
      clearInterval(this.playbackTimer);
      this.playbackTimer = null;
    }

    // Clean up subscriptions
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }

    // Cleanup audio context resources
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null as any;
    }
    if (this.audioSource) {
      this.audioSource.disconnect();
      this.audioSource = null as any;
    }

    // Only close audio context on component destroy, not on cancel
    // Audio context will be reused for subsequent recordings

    // Clean up audio element
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio.load();
    }
  }

  // UPDATED: Cancels the recording and resets the UI state completely
  cancelRecording(): void {
    // Stop any ongoing recording or playback
    if (this.isRecording) {
      this.stopRecording();
    }
    if (this.isPlaying) {
      this.stopPlayback();
    }

    // Clear all timers
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
    if (this.playbackTimer) {
      clearInterval(this.playbackTimer);
      this.playbackTimer = null;
    }

    // Cleanup audio processing nodes but keep audio context alive
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null as any;
    }
    if (this.audioSource) {
      this.audioSource.disconnect();
      this.audioSource = null as any;
    }

    // Clean up audio element
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio.load();
      this.audio = null as any;
    }

    // Reset UI state completely
    this.resetUIState();
  }

  routeToGallery(): void {
    this.router.navigate(['gallery']);
  }
}