//
// IMPORTS
//
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import GUI from 'https://cdn.jsdelivr.net/npm/lil-gui@0.20/+esm';
import fragment from './shaders/fragment.js';
import vertex from './shaders/vertex.js';

const gui = new GUI();
gui.hide();

let audioCtx;
let analyser;
let audioSrc;
let frequencyData = new Uint8Array(1024);
let averageFrequency = 0;
let bassLevel = 0;
let midLevel = 0;
let trebleLevel = 0;

const createAudioController = () => {
    const controller = document.createElement('div');
    controller.className = 'audio-controller';
    
    const songInfo = document.createElement('div');
    songInfo.className = 'song-info';
    songInfo.innerHTML = '<div class="now-playing">Now Playing</div><div class="song-title">Audio Visualizer Demo</div>';
    
    const progressContainer = document.createElement('div');
    progressContainer.className = 'progress-container';
    
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressContainer.appendChild(progressBar);
    
    const timeInfo = document.createElement('div');
    timeInfo.className = 'time-info';
    timeInfo.innerHTML = '<span class="current-time">0:00</span> / <span class="total-time">0:00</span>';
    
    const controls = document.createElement('div');
    controls.className = 'controls';
    
    const playButton = document.createElement('button');
    playButton.className = 'play-button';
    playButton.innerHTML = '<i class="fas fa-play"></i>';
    
    const pauseButton = document.createElement('button');
    pauseButton.className = 'pause-button';
    pauseButton.innerHTML = '<i class="fas fa-pause"></i>';
    pauseButton.style.display = 'none';
    
    const volumeControl = document.createElement('div');
    volumeControl.className = 'volume-control';
    
    const volumeIcon = document.createElement('div');
    volumeIcon.className = 'volume-icon';
    volumeIcon.innerHTML = '<i class="fas fa-volume-up"></i>';
    
    const volumeSlider = document.createElement('input');
    volumeSlider.type = 'range';
    volumeSlider.min = '0';
    volumeSlider.max = '1';
    volumeSlider.step = '0.01';
    volumeSlider.value = '0.7';
    volumeSlider.className = 'volume-slider';
    
    volumeControl.appendChild(volumeIcon);
    volumeControl.appendChild(volumeSlider);
    
    controls.appendChild(playButton);
    controls.appendChild(pauseButton);
    controls.appendChild(volumeControl);
    
    controller.appendChild(songInfo);
    controller.appendChild(progressContainer);
    controller.appendChild(timeInfo);
    controller.appendChild(controls);
    
    document.body.appendChild(controller);
    
    const audioElement = document.getElementById('song');
    
    playButton.addEventListener('click', () => {
        audioElement.play();
        playButton.style.display = 'none';
        pauseButton.style.display = 'inline-block';
    });
    
    pauseButton.addEventListener('click', () => {
        audioElement.pause();
        pauseButton.style.display = 'none';
        playButton.style.display = 'inline-block';
    });
    
    volumeSlider.addEventListener('input', () => {
        audioElement.volume = volumeSlider.value;
    });
    
    progressContainer.addEventListener('click', (e) => {
        const width = progressContainer.clientWidth;
        const clickX = e.offsetX;
        const duration = audioElement.duration;
        
        audioElement.currentTime = (clickX / width) * duration;
    });
    
    audioElement.addEventListener('timeupdate', () => {
        const currentTime = audioElement.currentTime;
        const duration = audioElement.duration;
        const progressPercent = (currentTime / duration) * 100;
        
        progressBar.style.width = `${progressPercent}%`;
        
        const currentMinutes = Math.floor(currentTime / 60);
        const currentSeconds = Math.floor(currentTime % 60).toString().padStart(2, '0');
        const totalMinutes = Math.floor(duration / 60) || 0;
        const totalSeconds = Math.floor(duration % 60).toString().padStart(2, '0') || '00';
        
        document.querySelector('.current-time').textContent = `${currentMinutes}:${currentSeconds}`;
        document.querySelector('.total-time').textContent = `${totalMinutes}:${totalSeconds}`;
    });
    
    audioElement.addEventListener('ended', () => {
        pauseButton.style.display = 'none';
        playButton.style.display = 'inline-block';
        progressBar.style.width = '0%';
    });
    
    return controller;
};

const addControllerStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
        .audio-controller {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            width: 400px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            border-radius: 10px;
            padding: 15px;
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
            z-index: 100;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(0, 255, 255, 0.3);
            transition: all 0.3s ease;
        }
        
        .audio-controller:hover {
            box-shadow: 0 0 30px rgba(0, 255, 255, 0.8);
        }
        
        .song-info {
            margin-bottom: 10px;
            text-align: center;
        }
        
        .now-playing {
            font-size: 12px;
            color: rgba(0, 255, 255, 0.8);
        }
        
        .song-title {
            font-size: 16px;
            font-weight: bold;
        }
        
        .progress-container {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 5px;
            cursor: pointer;
            margin: 10px 0;
            height: 6px;
            width: 100%;
        }
        
        .progress-bar {
            background: linear-gradient(90deg, #00ffff, #ff00ff);
            border-radius: 5px;
            height: 100%;
            width: 0%;
            transition: width 0.1s linear;
        }
        
        .time-info {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 10px;
        }
        
        .controls {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        button {
            background: none;
            border: none;
            color: white;
            font-size: 18px;
            cursor: pointer;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0, 255, 255, 0.2);
            transition: all 0.3s ease;
        }
        
        button:hover {
            background: rgba(0, 255, 255, 0.4);
            transform: scale(1.1);
        }
        
        .volume-control {
            display: flex;
            align-items: center;
        }
        
        .volume-icon {
            margin-right: 10px;
            color: rgba(0, 255, 255, 0.8);
        }
        
        .volume-slider {
            -webkit-appearance: none;
            width: 100px;
            height: 5px;
            border-radius: 5px;
            background: rgba(255, 255, 255, 0.1);
            outline: none;
        }
        
        .volume-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 15px;
            height: 15px;
            border-radius: 50%;
            background: #00ffff;
            cursor: pointer;
        }
        
        .volume-slider::-moz-range-thumb {
            width: 15px;
            height: 15px;
            border-radius: 50%;
            background: #00ffff;
            cursor: pointer;
        }
        
        .eq-bars {
            position: absolute;
            bottom: 100%;
            left: 0;
            width: 100%;
            height: 50px;
            display: flex;
            align-items: flex-end;
            padding: 0 15px;
            box-sizing: border-box;
        }
        
        .eq-bar {
            flex: 1;
            background: linear-gradient(to top, #00ffff, #ff00ff);
            margin: 0 1px;
            height: 5px;
            transition: height 0.1s ease;
        }
        
        /* Add Font Awesome for icons */
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css');
    `;
    document.head.appendChild(style);
};

document.addEventListener('DOMContentLoaded', () => {
    addControllerStyles();
    createAudioController();
});

document.querySelector('.overley').addEventListener('click', () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    if (!audioSrc) {
        const songElement = document.getElementById('song');
        songElement.play();

        audioSrc = audioCtx.createMediaElementSource(songElement);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 2048;
        frequencyData = new Uint8Array(analyser.frequencyBinCount);

        audioSrc.connect(analyser);
        audioSrc.connect(audioCtx.destination);
        
        document.querySelector('.play-button').style.display = 'none';
        document.querySelector('.pause-button').style.display = 'inline-block';
    }
    document.querySelector('.overley').classList.add('hide');
    document.getElementById('song').classList.remove('hide');
});

window.addEventListener('keydown', (e) => {
    if (e.key === 'h') {
        gui._hidden ? gui.show() : gui.hide();
    }
});

//UTILITIES
let canvas = document.querySelector('canvas.webgl');
let sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}
let aspect = sizes.width / sizes.height;

//
// SCENE
//
let scene = new THREE.Scene();

// Background particles
const particleCount = 5000;
const particlesGeometry = new THREE.BufferGeometry();
const particlePositions = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount * 3; i += 3) {
    particlePositions[i] = (Math.random() - 0.5) * 50;
    particlePositions[i + 1] = (Math.random() - 0.5) * 50;
    particlePositions[i + 2] = (Math.random() - 0.5) * 50;
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

const particlesMaterial = new THREE.PointsMaterial({
    color: 0x00ffff,
    size: 0.1,
    transparent: true,
    opacity: 0.6,
    sizeAttenuation: true
});

const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);

const spotlight = new THREE.SpotLight(0x00ffff, 2);
spotlight.position.set(0, 10, 0);
spotlight.angle = Math.PI / 4;
spotlight.penumbra = 0.1;
spotlight.decay = 2;
spotlight.distance = 30;
scene.add(spotlight);

let planeGeo;
let planeMat;
let planeMesh;

let outerGeo;
let outerMat;
let outerMesh;

let innerGeo;
let innerMat;
let innerMesh;

let torusKnotGeo;
let torusKnotMat;
let torusKnotMesh;

let rings = [];
const createRing = (radius, tubeRadius, radialSegments, tubularSegments, position) => {
    const geometry = new THREE.TorusGeometry(radius, tubeRadius, radialSegments, tubularSegments);
    const material = new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        side: THREE.DoubleSide,
        uniforms: {
            uTime: { value: 0 },
            waveFreq: { value: 0.01 }
        },
        wireframe: true
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    scene.add(mesh);
    rings.push({ mesh, material, geometry });
    return mesh;
};

let cubes = [];
const createCubesSpiral = (count, radius, height) => {
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 10;
        const x = Math.cos(angle) * (radius + i * 0.1);
        const z = Math.sin(angle) * (radius + i * 0.1);
        const y = (i / count) * height - height / 2;
        
        const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const material = new THREE.ShaderMaterial({
            vertexShader: vertex,
            fragmentShader: fragment,
            side: THREE.DoubleSide,
            uniforms: {
                uTime: { value: 0 },
                waveFreq: { value: 0.005 }
            },
            wireframe: false
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        cubes.push({ mesh, material, geometry, index: i });
    }
};

let spheres = [];
const createAudioReactiveSpheres = (count, radius) => {
    for (let i = 0; i < count; i++) {
        const phi = Math.acos(-1 + (2 * i) / count);
        const theta = Math.sqrt(count * Math.PI) * phi;
        
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);
        
        const geometry = new THREE.SphereGeometry(0.2, 16, 16);
        const material = new THREE.ShaderMaterial({
            vertexShader: vertex,
            fragmentShader: fragment,
            side: THREE.DoubleSide,
            uniforms: {
                uTime: { value: 0 },
                waveFreq: { value: 0.02 }
            },
            wireframe: false
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        spheres.push({ mesh, material, geometry, basePosition: { x, y, z }, index: i });
    }
};

let addMeshes = async () => {
    planeGeo = new THREE.PlaneGeometry(10, 10, 25, 25);
    planeMat = new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        side: THREE.DoubleSide,
        uniforms: {
            uTime: { value: 0 },
            waveFreq: { value: 0.01 }
        },
        wireframe: true
    });

    planeMesh = new THREE.Mesh(planeGeo, planeMat);
    planeMesh.rotation.x = -Math.PI / 2;
    scene.add(planeMesh);
    
    outerGeo = new THREE.IcosahedronGeometry(1, 1);
    outerMat = planeMat.clone();
    outerMesh = new THREE.Mesh(outerGeo, outerMat);
    outerMesh.position.y = 2;
    scene.add(outerMesh);

    innerGeo = new THREE.IcosahedronGeometry(0.5, 1);
    innerMat = planeMat.clone();
    innerMat.wireframe = false;
    innerMesh = new THREE.Mesh(innerGeo, innerMat);
    innerMesh.position.y = 2;
    scene.add(innerMesh);
    
    torusKnotGeo = new THREE.TorusKnotGeometry(1, 0.3, 64, 8, 2, 3);
    torusKnotMat = planeMat.clone();
    torusKnotMesh = new THREE.Mesh(torusKnotGeo, torusKnotMat);
    torusKnotMesh.position.set(-3, 2, 0);
    // scene.add(torusKnotMesh);
    
    createRing(2, 0.1, 16, 100, new THREE.Vector3(0, 4, 0));
    createRing(2.5, 0.1, 16, 100, new THREE.Vector3(0, 4, 0));
    createRing(3, 0.1, 16, 100, new THREE.Vector3(0, 4, 0));
    
    createCubesSpiral(50, 4, 10);
    
    createAudioReactiveSpheres(80, 8);
    
    gui.add(planeMat.uniforms.waveFreq, 'value')
        .name('Wave Frequency')
        .min(0).max(0.09).step(0.001);
    
    gui.add(planeMat, 'wireframe').name('Wireframe');
    
    const colorFolder = gui.addFolder('Colors');
    const colorParams = { 
        spotlightColor: '#00ffff',
        particleColor: '#00ffff'
    };
    
    colorFolder.addColor(colorParams, 'spotlightColor').onChange((value) => {
        spotlight.color.set(value);
    });
    
    colorFolder.addColor(colorParams, 'particleColor').onChange((value) => {
        particlesMaterial.color.set(value);
    });
    
    const animationFolder = gui.addFolder('Animation');
    const animationParams = {
        rotationSpeed: 0.01,
        pulseSpeed: 0.5
    };
    
    animationFolder.add(animationParams, 'rotationSpeed', 0, 0.1, 0.001).name('Rotation Speed');
    animationFolder.add(animationParams, 'pulseSpeed', 0, 2, 0.1).name('Pulse Speed');
};

addMeshes();

//
// CAMERA
//
let camera = new THREE.PerspectiveCamera(55, aspect, 0.1, 500);
camera.position.set(7, 7, 10);
scene.add(camera);

//
// RENDERER
//
let renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setClearColor(0x000011);
renderer.render(scene, camera);

//
// POST-PROCESSING
//
let composer;
let addPostProcessing = async () => {
    const { EffectComposer } = await import('three/addons/postprocessing/EffectComposer.js');
    const { RenderPass } = await import('three/addons/postprocessing/RenderPass.js');
    const { UnrealBloomPass } = await import('three/addons/postprocessing/UnrealBloomPass.js');
    
    composer = new EffectComposer(renderer);
    
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
    
    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(sizes.width, sizes.height),
        0.8,
        0.3,
        0.9  
    );
    composer.addPass(bloomPass);
    
    const bloomFolder = gui.addFolder('Bloom Effect');
    bloomFolder.add(bloomPass, 'strength', 0, 3, 0.01).name('Bloom Strength');
    bloomFolder.add(bloomPass, 'radius', 0, 1, 0.01).name('Bloom Radius');
    bloomFolder.add(bloomPass, 'threshold', 0, 1, 0.01).name('Bloom Threshold');
};

// Initialize post-processing
addPostProcessing();

//
// CONTROLS
//
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.01;

//
// RESIZE
//
window.addEventListener('resize', () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    renderer.setSize(sizes.width, sizes.height);
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    
    if (composer) {
        composer.setSize(sizes.width, sizes.height);
    }
});

const analyzeFrequencyData = () => {
    if (!analyser) return;
    
    analyser.getByteFrequencyData(frequencyData);
    
    let sum = 0;
    for (let i = 0; i < frequencyData.length; i++) {
        sum += frequencyData[i];
    }
    averageFrequency = sum / frequencyData.length;
    
    
    let bassSum = 0;
    let midSum = 0;
    let trebleSum = 0;
    
    for (let i = 0; i < 6; i++) {
        bassSum += frequencyData[i];
    }
    
    for (let i = 6; i < 91; i++) {
        midSum += frequencyData[i];
    }
    
    for (let i = 91; i < frequencyData.length; i++) {
        trebleSum += frequencyData[i];
    }
    
    bassLevel = bassSum / 6;
    midLevel = midSum / 85;
    trebleLevel = trebleSum / (frequencyData.length - 91);
    
    const eqContainer = document.querySelector('.eq-bars');
    if (!eqContainer) {
        const container = document.createElement('div');
        container.className = 'eq-bars';
        
        for (let i = 0; i < 20; i++) {
            const bar = document.createElement('div');
            bar.className = 'eq-bar';
            container.appendChild(bar);
        }
        
        document.querySelector('.audio-controller').appendChild(container);
    } else {
        const bars = document.querySelectorAll('.eq-bar');
        const step = Math.floor(frequencyData.length / bars.length);
        
        bars.forEach((bar, index) => {
            const value = frequencyData[index * step];
            const height = (value / 255) * 50;
            bar.style.height = `${height}px`;
        });
    }
    
    return {
        average: averageFrequency,
        bass: bassLevel,
        mid: midLevel,
        treble: trebleLevel
    };
};

//
// ANIMATION LOOP
//
let clock = new THREE.Clock();

let animation = () => {
    let time = clock.getElapsedTime();
    
    const audioLevels = analyzeFrequencyData();
    
    if (analyser) {
        planeGeo.setAttribute('songFrequency',
            new THREE.BufferAttribute(frequencyData, 1)
        );

        outerGeo.setAttribute('songFrequency',
            new THREE.BufferAttribute(frequencyData, 1)
        );

        innerGeo.setAttribute('songFrequency',
            new THREE.BufferAttribute(frequencyData, 1)
        );
        
        if (torusKnotGeo) {
            torusKnotGeo.setAttribute('songFrequency',
                new THREE.BufferAttribute(frequencyData, 1)
            );
        }
        
        planeMesh.geometry.verticesNeedsUpdates = true;
        planeMesh.geometry.normalNeedsUpdates = true;
        planeMesh.geometry.computeVertexNormals();

        outerMesh.geometry.verticesNeedsUpdates = true;
        outerMesh.geometry.normalNeedsUpdates = true;
        outerMesh.geometry.computeVertexNormals();

        innerMesh.geometry.verticesNeedsUpdates = true;
        innerMesh.geometry.normalNeedsUpdates = true;
        innerMesh.geometry.computeVertexNormals();
        
        if (torusKnotMesh) {
            torusKnotMesh.geometry.verticesNeedsUpdates = true;
            torusKnotMesh.geometry.normalNeedsUpdates = true;
            torusKnotMesh.geometry.computeVertexNormals();
        }
        
        rings.forEach((ring, index) => {
            ring.geometry.setAttribute('songFrequency',
                new THREE.BufferAttribute(frequencyData, 1)
            );
            ring.geometry.verticesNeedsUpdates = true;
            ring.geometry.normalNeedsUpdates = true;
            ring.geometry.computeVertexNormals();
            
            ring.mesh.rotation.z = time * (0.1 + index * 0.05);
            ring.mesh.rotation.x = time * (0.05 + index * 0.05);
            
            const bandIndex = 50 + index * 100;
            const scale = 1 + (frequencyData[bandIndex] / 255) * 0.5;
            ring.mesh.scale.set(scale, scale, scale);
        });
        
        cubes.forEach((cube, i) => {
            const freqIndex = Math.floor((i / cubes.length) * frequencyData.length);
            const freqValue = frequencyData[freqIndex] / 255;
            
            const scale = 0.5 + freqValue;
            cube.mesh.scale.set(scale, scale, scale);
            
            cube.mesh.rotation.x += 0.01;
            cube.mesh.rotation.y += 0.01;
            
            cube.geometry.setAttribute('songFrequency',
                new THREE.BufferAttribute(frequencyData, 1)
            );
        });
        
        spheres.forEach((sphere, i) => {
            const freqIndex = Math.floor((i / spheres.length) * frequencyData.length);
            const freqValue = frequencyData[freqIndex] / 255;
            
            const scale = 0.2 + freqValue * 0.8;
            sphere.mesh.scale.set(scale, scale, scale);
            
            const { x, y, z } = sphere.basePosition;
            const pulseAmount = 1 + freqValue * 2;
            sphere.mesh.position.set(
                x * pulseAmount,
                y * pulseAmount,
                z * pulseAmount
            );
            
            sphere.geometry.setAttribute('songFrequency',
                new THREE.BufferAttribute(frequencyData, 1)
            );
        });
        
        particles.rotation.y = time * 0.05;
        
        const particleScale = 0.1 + (audioLevels.bass / 255) * 0.2;
        particlesMaterial.size = particleScale;
        
const r = Math.sin(time) * 0.5 + 0.5;
const g = Math.sin(time + Math.PI / 3) * 0.5 + 0.5;
const b = Math.sin(time + Math.PI * 2/3) * 0.5 + 0.5;

const bassColor = new THREE.Color(r, 0, b);
const midColor = new THREE.Color(0, g, b);
const trebleColor = new THREE.Color(r, g, 0);

const bassNorm = audioLevels.bass / 255;
const midNorm = audioLevels.mid / 255;
const trebleNorm = audioLevels.treble / 255;

const color = new THREE.Color(
    bassNorm * bassColor.r + midNorm * midColor.r + trebleNorm * trebleColor.r,
    bassNorm * bassColor.g + midNorm * midColor.g + trebleNorm * trebleColor.g,
    bassNorm * bassColor.b + midNorm * midColor.b + trebleNorm * trebleColor.b
);

spotlight.color.copy(color);
spotlight.intensity = 1 + (audioLevels.average / 255) * 3;

spotlight.position.x = Math.sin(time) * 5;
spotlight.position.z = Math.cos(time) * 5;
spotlight.lookAt(0, 0, 0);
}

if (planeMat && outerMat && innerMat) {
planeMat.uniforms.uTime.value = time;
innerMat.uniforms.uTime.value = time;
outerMat.uniforms.uTime.value = time;

outerMesh.rotation.y = time;

if (torusKnotMat) {
    torusKnotMat.uniforms.uTime.value = time;
    torusKnotMesh.rotation.y = time * 0.5;
    torusKnotMesh.rotation.x = time * 0.3;
}

// Update all other materials
rings.forEach(ring => {
    ring.material.uniforms.uTime.value = time;
});

cubes.forEach(cube => {
    cube.material.uniforms.uTime.value = time;
});

spheres.forEach(sphere => {
    sphere.material.uniforms.uTime.value = time;
});
}

particles.rotation.y = time * 0.1;

controls.update();
if (composer) {
composer.render();
} else {
renderer.render(scene, camera);
}

requestAnimationFrame(animation);
}

animation();

let currentVisualMode = 0;
const visualModes = [
'Default', 'Neon', 'Psychedelic', 'Minimalist'
];

const addVisualModeButton = () => {
const controller = document.querySelector('.audio-controller');
if (!controller) return;

const modeButton = document.createElement('button');
modeButton.className = 'mode-button';
modeButton.innerHTML = ` ${visualModes[currentVisualMode]}`;
modeButton.style.position = 'absolute';
modeButton.style.top = '-30px';
modeButton.style.right = '0';
modeButton.style.background = 'rgba(0, 0, 0, 0.7)';
modeButton.style.padding = '5px 10px';
modeButton.style.borderRadius = '5px';

modeButton.addEventListener('click', () => {
currentVisualMode = (currentVisualMode + 1) % visualModes.length;
modeButton.innerHTML = ` ${visualModes[currentVisualMode]}`;

switch(currentVisualMode) {
    case 0: // Default
        renderer.setClearColor(0x000011);
        spotlight.color.set(0x00ffff);
        particlesMaterial.color.set(0x00ffff);
        break;
    case 1: // Neon
        renderer.setClearColor(0x000000);
        spotlight.color.set(0xff00ff);
        particlesMaterial.color.set(0x00ff00);
        break;
    case 2: // Psychedelic
        renderer.setClearColor(0x200040);
        spotlight.color.set(0xffff00);
        particlesMaterial.color.set(0xff00ff);
        break;
    case 3: // Minimalist
        renderer.setClearColor(0xffffff);
        spotlight.color.set(0x000000);
        particlesMaterial.color.set(0x000000);
        break;
}
});

controller.appendChild(modeButton);
};

setTimeout(addVisualModeButton, 1000);

window.addEventListener('keydown', (e) => {
// Space to play/pause
if (e.code === 'Space') {
const audio = document.getElementById('song');
if (audio.paused) {
    audio.play();
    document.querySelector('.play-button').style.display = 'none';
    document.querySelector('.pause-button').style.display = 'inline-block';
} else {
    audio.pause();
    document.querySelector('.pause-button').style.display = 'none';
    document.querySelector('.play-button').style.display = 'inline-block';
}
}

if (e.key === 'm') {
const audio = document.getElementById('song');
audio.muted = !audio.muted;
}

if (e.key === 'ArrowUp') {
const audio = document.getElementById('song');
const volumeSlider = document.querySelector('.volume-slider');
audio.volume = Math.min(audio.volume + 0.1, 1);
volumeSlider.value = audio.volume;
}

if (e.key === 'ArrowDown') {
const audio = document.getElementById('song');
const volumeSlider = document.querySelector('.volume-slider');
audio.volume = Math.max(audio.volume - 0.1, 0);
volumeSlider.value = audio.volume;
}

if (e.key === 'v') {
const modeButton = document.querySelector('.mode-button');
if (modeButton) modeButton.click();
}
});

const createAudioSpectrum = () => {
const controller = document.querySelector('.audio-controller');
if (!controller) return;

const spectrumContainer = document.createElement('div');
spectrumContainer.className = 'spectrum-container';
spectrumContainer.style.position = 'absolute';
spectrumContainer.style.top = '-80px';
spectrumContainer.style.left = '0';
spectrumContainer.style.width = '100%';
spectrumContainer.style.height = '40px';
spectrumContainer.style.display = 'flex';
spectrumContainer.style.alignItems = 'flex-end';
spectrumContainer.style.justifyContent = 'space-between';

for (let i = 0; i < 32; i++) {
const bar = document.createElement('div');
bar.className = 'spectrum-bar';
bar.style.flex = '1';
bar.style.height = '2px';
bar.style.margin = '0 1px';
bar.style.background = 'linear-gradient(to top, #00ffff, #ff00ff)';
bar.style.transition = 'height 0.05s';
spectrumContainer.appendChild(bar);
}

controller.appendChild(spectrumContainer);

setInterval(() => {
if (!analyser) return;

analyser.getByteFrequencyData(frequencyData);
const bars = document.querySelectorAll('.spectrum-bar');
const step = Math.floor(frequencyData.length / bars.length);

bars.forEach((bar, index) => {
    const value = frequencyData[index * step] / 255;
    bar.style.height = `${value * 40}px`;
});
}, 30);
};

setTimeout(createAudioSpectrum, 1000);

const addAudioFileUpload = () => {
    const controller = document.querySelector('.audio-controller');
    if (!controller) return;

    const uploadButton = document.createElement('button');
    uploadButton.className = 'upload-button';
    uploadButton.innerHTML = '<i class="fas fa-upload"></i>';
    uploadButton.style.position = 'absolute';
    uploadButton.style.top = '-30px';
    uploadButton.style.left = '0';
    uploadButton.style.background = 'rgba(0, 0, 0, 0.7)';
    uploadButton.style.padding = '5px 10px';
    uploadButton.style.borderRadius = '5px';

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'audio/*';
    fileInput.style.display = 'none';

    uploadButton.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const url = URL.createObjectURL(file);

        // Remove old audio element if it exists
        const oldAudio = document.getElementById('song');
        if (oldAudio) {
            oldAudio.pause();
            oldAudio.remove();
        }

        // Create new audio element
        const audioElement = document.createElement('audio');
        audioElement.id = 'song';
        audioElement.src = url;
        audioElement.className = 'hide'; // keep hidden
        audioElement.controls = true;
        document.body.appendChild(audioElement); // or append to a specific container

        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }

        try {
            audioSrc = audioCtx.createMediaElementSource(audioElement);
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 2048;
            frequencyData = new Uint8Array(analyser.frequencyBinCount);

            audioSrc.connect(analyser);
            audioSrc.connect(audioCtx.destination);

            document.querySelector('.song-title').textContent = file.name;
            audioElement.play();
            document.querySelector('.play-button').style.display = 'none';
            document.querySelector('.pause-button').style.display = 'inline-block';
        } catch (error) {
            console.error("Error setting up audio context:", error);
        }
    });

    controller.appendChild(uploadButton);
    controller.appendChild(fileInput);
};

setTimeout(addAudioFileUpload, 1000);



const addEqualizerControls = () => {
const controller = document.querySelector('.audio-controller');
if (!controller) return;

const eqButton = document.createElement('button');
eqButton.className = 'eq-button';
eqButton.innerHTML = '<i class="fas fa-sliders-h"></i>';
eqButton.style.position = 'absolute';
eqButton.style.top = '-30px';
eqButton.style.left = '40px';
eqButton.style.background = 'rgba(0, 0, 0, 0.7)';
eqButton.style.padding = '5px 10px';
eqButton.style.borderRadius = '5px';

const eqPanel = document.createElement('div');
eqPanel.className = 'eq-panel';
eqPanel.style.position = 'absolute';
eqPanel.style.bottom = '100%';
eqPanel.style.left = '0';
eqPanel.style.width = '100%';
eqPanel.style.background = 'rgba(0, 0, 0, 0.8)';
eqPanel.style.borderRadius = '10px 10px 0 0';
eqPanel.style.padding = '10px';
eqPanel.style.display = 'none';
eqPanel.style.flexDirection = 'column';
eqPanel.style.gap = '10px';

const createEQControl = (name, min, max, value) => {
const controlContainer = document.createElement('div');
controlContainer.style.display = 'flex';
controlContainer.style.flexDirection = 'column';
controlContainer.style.alignItems = 'center';

const label = document.createElement('label');
label.textContent = name;
label.style.marginBottom = '5px';
label.style.color = '#fff';

const slider = document.createElement('input');
slider.type = 'range';
slider.min = min;
slider.max = max;
slider.step = '0.1';
slider.value = value;
slider.className = `eq-${name.toLowerCase()}-slider`;
slider.style.width = '100%';

controlContainer.appendChild(label);
controlContainer.appendChild(slider);

return controlContainer;
};

eqPanel.appendChild(createEQControl('Bass', '0', '2', '1'));
eqPanel.appendChild(createEQControl('Mid', '0', '2', '1'));
eqPanel.appendChild(createEQControl('Treble', '0', '2', '1'));

eqButton.addEventListener('click', () => {
eqPanel.style.display = eqPanel.style.display === 'none' ? 'flex' : 'none';
});

controller.appendChild(eqButton);
controller.appendChild(eqPanel);

let bassFilter, midFilter, trebleFilter;

const initializeFilters = () => {
if (!audioCtx || !audioSrc) return;

bassFilter = audioCtx.createBiquadFilter();
bassFilter.type = 'lowshelf';
bassFilter.frequency.value = 200;
bassFilter.gain.value = 0;

midFilter = audioCtx.createBiquadFilter();
midFilter.type = 'peaking';
midFilter.frequency.value = 1000;
midFilter.Q.value = 1;
midFilter.gain.value = 0;

trebleFilter = audioCtx.createBiquadFilter();
trebleFilter.type = 'highshelf';
trebleFilter.frequency.value = 3000;
trebleFilter.gain.value = 0;

audioSrc.disconnect();
audioSrc.connect(bassFilter);
bassFilter.connect(midFilter);
midFilter.connect(trebleFilter);
trebleFilter.connect(analyser);
trebleFilter.connect(audioCtx.destination);

document.querySelector('.eq-bass-slider').addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    bassFilter.gain.value = (value - 1) * 15; 
});

document.querySelector('.eq-mid-slider').addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    midFilter.gain.value = (value - 1) * 15;
});

document.querySelector('.eq-treble-slider').addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    trebleFilter.gain.value = (value - 1) * 15;
});
};

const checkAudioContext = setInterval(() => {
if (audioCtx && audioSrc) {
    initializeFilters();
    clearInterval(checkAudioContext);
}
}, 500);
};

setTimeout(addEqualizerControls, 1000);