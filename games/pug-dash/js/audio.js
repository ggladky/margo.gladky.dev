// Pug Dash - Procedural Web Audio Engine
// Generates catchy upbeat cartoon music and playful sound effects without any external files!

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.volume = 0.5;
        this.sfxVolume = 0.7;
        this.musicVolume = 0.45;
        this.isPlayingMusic = false;
        this.currentTrack = null;
        this.beatTimer = null;
        this.beatCallback = null;
        this.currentBpm = 132;
        this.step = 0;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = this.isMuted ? 0 : this.volume;
            this.masterGain.connect(this.ctx.destination);

            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.value = this.sfxVolume;
            this.sfxGain.connect(this.masterGain);

            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.value = this.musicVolume;
            this.musicGain.connect(this.masterGain);

            this.initialized = true;
        } catch (e) {
            console.warn("AudioContext init error:", e);
        }
    }

    ensureContext() {
        if (!this.initialized) this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setMuted(muted) {
        this.isMuted = muted;
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(muted ? 0 : this.volume, this.ctx.currentTime);
        }
    }

    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
        if (this.masterGain && this.ctx && !this.isMuted) {
            this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        }
    }

    onBeat(cb) {
        this.beatCallback = cb;
    }

    // ==================== SOUND EFFECTS ====================

    playJump() {
        this.ensureContext();
        if (!this.ctx || this.isMuted) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Cartoon bouncy slide
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(560, now + 0.12);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.15);
    }

    playSpring() {
        this.ensureContext();
        if (!this.ctx || this.isMuted) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // High boing with vibrato
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(800, now + 0.1);
        osc.frequency.linearRampToValueAtTime(550, now + 0.18);
        osc.frequency.linearRampToValueAtTime(950, now + 0.28);

        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.32);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.33);
    }

    playRing() {
        this.ensureContext();
        if (!this.ctx || this.isMuted) return;

        const now = this.ctx.currentTime;

        // Sweet chime + nom chew
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.035);

            gain.gain.setValueAtTime(0.25, now + i * 0.035);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.035 + 0.22);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(now + i * 0.035);
            osc.stop(now + i * 0.035 + 0.25);
        });

        // Little cute bark on ring nom
        this.playBark(0.2, 0.05);
    }

    playBark(vol = 0.3, delay = 0) {
        this.ensureContext();
        if (!this.ctx || this.isMuted) return;

        const now = this.ctx.currentTime + delay;
        const osc = this.ctx.createOscillator();
        const biquad = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(380, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);

        // Formant filter for pug 'woof'
        biquad.type = 'bandpass';
        biquad.frequency.setValueAtTime(900, now);
        biquad.frequency.linearRampToValueAtTime(450, now + 0.09);
        biquad.Q.value = 4.0;

        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        osc.connect(biquad);
        biquad.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.11);
    }

    playCrash() {
        this.ensureContext();
        if (!this.ctx || this.isMuted) return;

        const now = this.ctx.currentTime;

        // 1. Comic squeak toy deflation
        const squeak = this.ctx.createOscillator();
        const squeakGain = this.ctx.createGain();
        squeak.type = 'sawtooth';
        squeak.frequency.setValueAtTime(1100, now);
        squeak.frequency.exponentialRampToValueAtTime(240, now + 0.25);
        squeakGain.gain.setValueAtTime(0.4, now);
        squeakGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        squeak.connect(squeakGain);
        squeakGain.connect(this.sfxGain);
        squeak.start(now);
        squeak.stop(now + 0.3);

        // 2. Comic thud/splat noise
        const bufferSize = this.ctx.sampleRate * 0.2;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
        }
        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.5, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

        whiteNoise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.sfxGain);

        whiteNoise.start(now);
    }

    playCheckpoint() {
        this.ensureContext();
        if (!this.ctx || this.isMuted) return;

        const now = this.ctx.currentTime;
        [659.25, 880, 1318.51].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.06);

            gain.gain.setValueAtTime(0.2, now + i * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.25);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(now + i * 0.06);
            osc.stop(now + i * 0.06 + 0.27);
        });
    }

    playWin() {
        this.ensureContext();
        if (!this.ctx || this.isMuted) return;

        const now = this.ctx.currentTime;
        const fanfare = [
            { note: 523.25, time: 0, dur: 0.14 },    // C5
            { note: 659.25, time: 0.15, dur: 0.14 }, // E5
            { note: 783.99, time: 0.30, dur: 0.14 }, // G5
            { note: 1046.5, time: 0.45, dur: 0.45 }  // C6
        ];

        fanfare.forEach(item => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(item.note, now + item.time);

            gain.gain.setValueAtTime(0.4, now + item.time);
            gain.gain.exponentialRampToValueAtTime(0.001, now + item.time + item.dur);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(now + item.time);
            osc.stop(now + item.time + item.dur + 0.05);
        });
    }

    // ==================== PROCEDURAL MUSIC ====================

    startMusic(trackType = 'park') {
        this.ensureContext();
        if (!this.ctx) return;
        this.stopMusic();

        this.isPlayingMusic = true;
        this.currentTrack = trackType;

        if (trackType === 'city') {
            this.currentBpm = 138;
        } else if (trackType === 'night') {
            this.currentBpm = 150;
        } else {
            this.currentBpm = 128; // cheerful park
        }

        const interval = (60 / this.currentBpm) / 4; // 16th notes
        this.step = 0;

        this.beatTimer = setInterval(() => {
            if (!this.isPlayingMusic) return;
            this.playMusicStep(this.step, trackType);

            // Emit beat callback on every 4th 16th note (quarter note = beat)
            if (this.step % 4 === 0 && this.beatCallback) {
                this.beatCallback(Math.floor(this.step / 4));
            }

            this.step = (this.step + 1) % 64; // 4-bar loop
        }, interval * 1000);
    }

    stopMusic() {
        if (this.beatTimer) {
            clearInterval(this.beatTimer);
            this.beatTimer = null;
        }
        this.isPlayingMusic = false;
    }

    playMusicStep(step, trackType) {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;

        // Drum Track
        // Kick on 0, 4, 8, 12... (four on the floor for that punchy Geometry Dash drive!)
        if (step % 4 === 0) {
            this.synthKick(now);
        }
        // Snare/Clap on 4, 12, 20... (beats 2 and 4)
        if (step % 8 === 4) {
            this.synthSnare(now);
        }
        // Hi-hat on every offbeat 2, 6, 10, 14...
        if (step % 2 === 1) {
            this.synthHiHat(now, step % 4 === 2 ? 0.12 : 0.07);
        }

        // Basslines & Melodies based on track
        if (trackType === 'park') {
            this.playParkMelody(step, now);
        } else if (trackType === 'city') {
            this.playCityMelody(step, now);
        } else {
            this.playNightMelody(step, now);
        }
    }

    // Drum synth helpers
    synthKick(time) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(140, time);
        osc.frequency.exponentialRampToValueAtTime(38, time + 0.1);
        gain.gain.setValueAtTime(0.4, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.13);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(time);
        osc.stop(time + 0.14);
    }

    synthSnare(time) {
        // Noise + tone
        const bufferSize = this.ctx.sampleRate * 0.09;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 1000;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.28, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);
        noise.start(time);
    }

    synthHiHat(time, vol = 0.08) {
        const bufferSize = this.ctx.sampleRate * 0.035;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1);
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 7500;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.035);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);
        noise.start(time);
    }

    synthBass(freq, time, dur = 0.14) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(650, time);
        filter.frequency.exponentialRampToValueAtTime(180, time + dur);

        gain.gain.setValueAtTime(0.25, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        osc.start(time);
        osc.stop(time + dur + 0.02);
    }

    synthLead(freq, time, dur = 0.12, type = 'square') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0.12, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

        osc.connect(gain);
        gain.connect(this.musicGain);

        osc.start(time);
        osc.stop(time + dur + 0.02);
    }

    // Level 1: "Утренний Парк" (Joyful C Major bouncy pop)
    playParkMelody(step, time) {
        // Bass notes (C, G, A, F)
        const bassNotes = [
            130.81, 130.81, 130.81, 130.81, // C3
            98.00,  98.00,  98.00,  98.00,  // G2
            110.00, 110.00, 110.00, 110.00, // A2
            87.31,  87.31,  87.31,  87.31   // F2
        ];
        if (step % 2 === 0) {
            const barIndex = Math.floor(step / 4) % 16;
            this.synthBass(bassNotes[barIndex % bassNotes.length], time, 0.13);
        }

        // Cartoon lead melody
        const melody = {
            0: 523.25, 2: 587.33, 4: 659.25, 6: 783.99,
            8: 659.25, 12: 523.25, 16: 392.00, 18: 440.00,
            20: 523.25, 24: 659.25, 28: 587.33,
            32: 523.25, 34: 659.25, 36: 783.99, 38: 880.00,
            40: 1046.5, 44: 783.99, 48: 880.00, 52: 783.99,
            56: 659.25, 60: 587.33
        };
        if (melody[step]) {
            this.synthLead(melody[step], time, 0.16, 'triangle');
        }
    }

    // Level 2: "Городской Двор" (Upbeat funk/bounce)
    playCityMelody(step, time) {
        // D Minor funk bass
        const dMinorBass = [146.83, 146.83, 174.61, 196.00, 146.83, 220.00, 196.00, 164.81];
        if (step % 2 === 0) {
            this.synthBass(dMinorBass[(Math.floor(step / 2)) % dMinorBass.length], time, 0.11);
        }

        const melody = {
            0: 587.33, 3: 698.46, 6: 880.00, 8: 783.99,
            12: 698.46, 14: 659.25, 16: 587.33, 20: 523.25,
            24: 587.33, 27: 698.46, 30: 880.00, 32: 1046.5,
            36: 880.00, 40: 783.99, 44: 880.00, 48: 698.46,
            52: 659.25, 56: 587.33, 60: 659.25
        };
        if (melody[step]) {
            this.synthLead(melody[step], time, 0.14, 'square');
        }
    }

    // Level 3: "Кошачий Район: Зумис!" (Fast energetic synth-wave / 150 BPM)
    playNightMelody(step, time) {
        // A Minor fast arpeggio
        const arp = [220, 261.63, 329.63, 440, 523.25, 440, 329.63, 261.63];
        this.synthLead(arp[step % arp.length], time, 0.08, 'sawtooth');

        if (step % 4 === 0) {
            const root = (Math.floor(step / 16) % 2 === 0) ? 110 : 87.31;
            this.synthBass(root, time, 0.18);
        }
    }
}

// Global audio singleton
window.soundEngine = new SoundEngine();
