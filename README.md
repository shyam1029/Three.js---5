# Three.js---5
# 🎧 3D Audio Visualizer – Human Face Geometry (Three.js + Tone.js)

A unique, real-time 3D audio visualizer built using **Three.js** and **Tone.js**. This project uses frequency data from an MP3 track to animate a custom human face mesh, creating an artistic and interactive audio-visual experience. 

## 🌟 Features

### 🧠 Custom Face Geometry
- Procedurally generated symmetric human face shape using `THREE.BufferGeometry`.
- Vertex displacement on both sides of the face based on mirrored sinusoidal patterns and frequency data.
- Geometric spikes and nose ridges built in for dynamic visual reactions.

### 🔊 Real-Time Audio Analysis
- Powered by **Tone.js**, which loads and plays an `.mp3` file.
- Uses `FFT` (Fast Fourier Transform) to analyze frequency bands in real time.
- FFT data is mapped to deform the geometry smoothly and rhythmically.


### 📁 Audio Upload Support
- Built-in `<input type="file">` lets users upload their **own MP3 files**.
- Visualizer updates dynamically to match the uploaded track.

### 🎛️ Keyboard Shortcuts
- Press **V** to toggle visualization **modes** (face-only, bars-only, or both).
- Press **M** to **mute/unmute** the audio.
- Press **↑ / ↓** to **increase/decrease volume**.

### 💫 Visual Effects
- Realistic shading with `MeshStandardMaterial` and custom lighting.
- Dynamic lighting setup including:
  - Directional light (warm tone)
  - Ambient light
  - Point light for edge definition
- Uses **UnrealBloomPass** for glowing post-processing effects.
- Includes a custom **shader pass** for additional intensity.

### 🧭 Interactive Controls
- `OrbitControls` for rotating, zooming, and panning the camera view.
- Auto-rotating camera for passive viewing.

### 📦 Tech Stack
- [Three.js](https://threejs.org/) – 3D rendering
- [Tone.js](https://tonejs.github.io/) – Audio analysis
- WebGL + GLSL shaders for post-processing effects
