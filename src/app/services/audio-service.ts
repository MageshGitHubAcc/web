import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AudioService {
    private mediaRecorder!: MediaRecorder;
    private audioContext!: AudioContext;
    private analyser!: AnalyserNode;
    private audioChunks: Blob[] = [];
    private audioBlob!: Blob;
    private recordingTime = new Subject<number>();
    private playbackTime = new Subject<number>();
    private frequencyData = new Subject<Uint8Array>();
    private recordingTimer: any;
    private audioSource!: MediaStreamAudioSourceNode;
    private scriptProcessor!: ScriptProcessorNode;

    constructor() {
        this.initAudioContext();
    }

    private initAudioContext() {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 32; // Smaller FFT size for simpler visualization
    }

    async startRecording(): Promise<void> {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            // Setup audio analysis
            this.audioSource = this.audioContext.createMediaStreamSource(stream);
            this.audioSource.connect(this.analyser);

            // Setup script processor for continuous analysis
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
                this.cleanupRecording();
            };

            this.mediaRecorder.start(100);

            const startTime = Date.now();
            this.recordingTimer = setInterval(() => {
                this.recordingTime.next((Date.now() - startTime) / 1000);
            }, 100);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            throw error;
        }
    }

    stopRecording(): void {
        if (this.mediaRecorder?.state === 'recording') {
            this.mediaRecorder.stop();
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            this.cleanupRecording();
        }
    }

    playRecording(): void {
        if (!this.audioBlob) return;

        const audioUrl = URL.createObjectURL(this.audioBlob);
        const audio = new Audio(audioUrl);

        // Create a new audio context for playback analysis
        const playbackContext = new AudioContext();
        const source = playbackContext.createMediaElementSource(audio);
        const analyser = playbackContext.createAnalyser();
        analyser.fftSize = 32;

        source.connect(analyser);
        analyser.connect(playbackContext.destination);

        const analyzePlayback = () => {
            const array = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(array);
            this.frequencyData.next(array);

            if (!audio.paused) {
                requestAnimationFrame(analyzePlayback);
            }
        };

        audio.play();
        analyzePlayback();

        const startTime = Date.now();
        const playbackTimer = setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000;
            this.playbackTime.next(elapsed);
            if (elapsed >= 30) {
                clearInterval(playbackTimer);
                playbackContext.close();
            }
        }, 100);
    }

    getFrequencyData(): Observable<Uint8Array> {
        return this.frequencyData.asObservable();
    }

    private cleanupRecording() {
        clearInterval(this.recordingTimer);
        if (this.scriptProcessor) {
            this.scriptProcessor.disconnect();
        }
        if (this.audioSource) {
            this.audioSource.disconnect();
        }
    }

    // ... (rest of the methods remain the same)
}