# Audio Processor — ADSR Envelope Playground

Generate, visualize, post-process, and export audio right in your browser. This project is a front‑end Web Audio playground featuring classic waveforms, additive and FM synthesis, Karplus–Strong plucked strings, and a powerful ADSR envelope editor (with dynamic graph and multistage support).

- Live demo: https://yuuki321.github.io/Comp4431/
- Video demo: 
  - Original: https://yuuki321.github.io/Comp4441/4431 video.mp4
  - URL-encoded (if your browser has trouble with spaces): https://yuuki321.github.io/Comp4441/4431%20video.mp4

---

## Highlights

- Waveform synthesis
  - Time-domain: Sine, Square, Sawtooth
  - Additive: Square, Sawtooth, Triangle
  - Customized Additive Synthesis with 10 harmonics and presets (Sine, Clarinet, Organ)
  - White Noise
  - FM synthesis with optional ADSR on modulation amplitude
  - Karplus–Strong algorithm (plucked string)
  - Repeating Narrow Pulse

- Post-processing effects
  - Reverse
  - Boost (normalize to full scale)
  - ADSR envelope
    - Classic A/H/D/S/R numeric controls
    - Dynamic, draggable curve editor (D3-based)
    - Optional multistage envelope (6–20 points)
  - Tremolo (frequency + wetness)
  - Echo (delay line with feedback)

- Visualization and UX
  - Stereo “position” slider (pan balance between Left and Right channels)
  - Zoom controls (1 cycle, 0.1s, 0.2s, 1s, All) with “Start from” time
  - Play/Stop audio
  - Save to WAV
  - Import MIDI (JSON) and auto-generate music
  - Optional per-note post-processing and whole-track auto-boost

---

## What is “ADSR Envelope”?

The project centers around exploring and hearing envelope shaping on synthesized sounds.

- Attack: time to ramp from 0 to peak
- Hold: optional time to hold at peak
- Decay: time to fade from peak to sustain level
- Sustain: level held while the note lasts
- Release: time to fade from sustain back to 0

This app goes beyond the classic ADSR by including:
- A draggable curve editor to set dynamic envelope timing and levels visually
- A “multistage” mode to craft more complex envelopes (up to 20 points)

You can apply this envelope in post-processing to any generated sound, or to the modulator in FM synthesis.

---

## Try It Online

- Live demo URL: https://yuuki321.github.io/Comp4431/
- Requirements: A modern browser with Web Audio API support (Chrome, Edge, Firefox, Safari). If audio doesn’t start, click anywhere on the page to resume the AudioContext (some browsers require a user gesture).

---

## How To Use

1. Choose a waveform
   - Open the “Waveform” tab and select a type (e.g., Sine, Square, FM, Karplus–Strong, Customized Additive).
   - For “Customized Additive,” drag the 10 harmonic sliders or pick a preset.

2. Set parameters
   - Frequency (Hz)
   - Stereo Position (Left–Right balance)
   - For FM, set carrier/modulation frequencies and amplitudes; optionally enable ADSR for the modulator.

3. Add post-processing
   - Use Postprocessing tabs (1–5) to select and stack effects (Reverse, Boost, ADSR, Tremolo, Echo).
   - ADSR can be numeric or driven by the visual graph (and multistage if desired).

4. Visualize and listen
   - Use Zoom controls to inspect waveform details.
   - Click Play to listen, Stop to stop.

5. Save audio
   - Click Save to download the generated sound as a WAV file.

6. Import MIDI (JSON)
   - Click “Import MIDI,” choose a JSON file containing notes, and generate music.
   - Optional: apply per-note post-processing and auto-boost the final mix.
   - Save the resulting WAV via the “Save Music” button.

Tip: The Save button enables after the waveform has been generated.

---

## MIDI JSON Input Format

Provide an array of note objects. Each note should contain:
- pitch: MIDI pitch number (e.g., 60 = Middle C)
- startTime: when the note starts (seconds)
- duration: how long it lasts (seconds)
- vol: velocity/volume (0–127)

Example:
```json
[
  { "pitch": 60, "startTime": 0.0, "duration": 0.5, "vol": 100 },
  { "pitch": 64, "startTime": 0.5, "duration": 0.5, "vol": 100 },
  { "pitch": 67, "startTime": 1.0, "duration": 0.75, "vol": 110 }
]
```

---

## Run Locally

You can serve the project as a static website.

- Using Node’s serve:
  - npm i -g serve
  - serve .
  - Open http://localhost:3000/audioproc.html

- Using Python:
  - Python 3: python -m http.server 8000
  - Open http://localhost:8000/audioproc.html

- Using VS Code:
  - Install “Live Server” extension
  - Right-click audioproc.html → “Open with Live Server”

Note: Running via a local HTTP server is recommended for best compatibility.

---

## Technical Overview

- Sample rate
  - Read from the browser’s AudioContext (typically 44100 or 48000 Hz)

- Audio pipeline
  - Waveform generation: pure JS arrays of float samples in [-1, 1]
  - Post-processing: in-place operations on arrays per channel
  - Playback: Web Audio ScriptProcessorNode (stereo)
  - Export: Encoded as 16-bit PCM WAV via WaveTrack + BinaryToolkit

- Anti-aliasing in additive synthesis
  - Number of harmonics is limited by the Nyquist frequency (sampleRate/2)

- Echo
  - Circular delay line with feedback-like behavior (current sample += delayed sample × multiplier, and written back into the delay line)

---

## Code Structure

- audioproc.html — App UI (Bootstrap, toggles, tabs, inputs)
- js/main.js — App bootstrap, event wiring, UI logic, ADSR graph init
- js/audioController.js — Manages channels, playback, zoom, export
- js/channel.js — Waveform display, zooming, per-channel generation and music assembly
- js/waveformGenerator.js — All synthesis methods (time-domain, additive, customized additive, white noise, FM, Karplus–Strong, pulse)
- js/postprocessor.js — Reverse, Boost, ADSR (graph or numeric), Tremolo, Echo
- js/graph.js — D3-based ADSR/multistage curve editor with zoom and drag
- js/customizedAdditiveSynth.js — Presets for the 10-harmonic additive synth
- js/audioPlayback.js — Web Audio playback (stereo buffers)
- js/audioSequence.js — Audio sample container and helpers
- js/waveTrack.js — WAV encode/decode
- js/binaryToolkit.js — Binary reader/writer (by Rainer Heynke)
- js/utility.js — lerp helper

External libraries:
- D3 v6 (CDN)
- jQuery (local)
- Bootstrap 4 + Toggle (local)
- Font Awesome (CDN)

---

## Known Tips and Caveats

- If you don’t hear sound, click the page once to resume the AudioContext (browser auto-play policy).
- Extremely high frequencies may alias; additive synthesis caps harmonics at Nyquist.
- WAV export is 16-bit PCM.
- The “Save” button is disabled until a new waveform is generated (to avoid saving stale output).

---

## Acknowledgements

- BinaryToolkit by Rainer Heynke (used for WAV encoding/decoding)
- Web Audio API
- D3.js
- Bootstrap, jQuery, Font Awesome

---

## License

If you add a license, include it here (e.g., MIT).