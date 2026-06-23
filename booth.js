document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('camera-feed');
    const startBtn = document.getElementById('start-btn');
    const flashOverlay = document.getElementById('flash-overlay');
    const countdownText = document.getElementById('countdown-text');
    const permissionOverlay = document.getElementById('permission-overlay');
    const promptText = document.getElementById('prompt-text');
    const enableCameraBtn = document.getElementById('enable-camera-btn');
    const captureCanvas = document.getElementById('capture-canvas');
    const ctx = captureCanvas.getContext('2d');
    
    // View Elements
    const viewSetup = document.getElementById('view-setup');
    const viewStudio = document.getElementById('view-studio');
    const viewPrint = document.getElementById('view-print');
    
    // Setup Elements
    const stockBw = document.getElementById('stock-bw');
    const stockColor = document.getElementById('stock-color');
    
    // Studio UI Elements
    const liveIndicator = document.getElementById('live-indicator');
    const statusText = document.getElementById('status-text');
    const expCounter = document.getElementById('exp-counter');
    const timecode = document.getElementById('timecode');
    const overlayModeText = document.getElementById('overlay-mode-text');
    const tintStatus = document.getElementById('tint-status');
    const frameCurrent = document.getElementById('frame-current');
    const finalPrintImage = document.getElementById('final-print-image');
    const downloadBtn = document.getElementById('download-btn');
    const shareBtn = document.getElementById('share-btn');
    const startOverBtn = document.getElementById('start-over-btn');
    const captureDate = document.getElementById('capture-date');
    
    let stream = null;
    let capturedImages = [];
    let finalStripUrl = null;
    let selectedFilmStock = 'bw';

    const FILMS = {
        bw: {
            filter: 'grayscale(100%) contrast(120%)',
            label: 'EXP_400TX',
            overlayMode: 'FILM: ILFORD HP5',
            tint: 'NEUTRAL'
        },
        color: {
            filter: 'contrast(110%) saturate(120%) sepia(20%)',
            label: 'PORTRA_400',
            overlayMode: 'FILM: KODAK PORTRA',
            tint: 'WARM'
        }
    };

    // Film Selection Logic
    function selectFilm(stock) {
        selectedFilmStock = stock;
        const film = FILMS[stock];
        
        // Setup Studio UI
        overlayModeText.innerText = film.overlayMode;
        tintStatus.innerText = film.tint;
        video.style.filter = film.filter;
        
        // Enter Dark Mode Studio
        document.body.classList.remove('bg-[#fafafa]', 'text-gray-900');
        document.body.classList.add('bg-[#232121]', 'text-white'); // Warm dark charcoal instead of black
        
        viewSetup.classList.add('hidden');
        viewStudio.classList.remove('hidden');
        
        initCamera();
    }

    stockBw.addEventListener('click', () => selectFilm('bw'));
    stockColor.addEventListener('click', () => selectFilm('color'));

    // Request camera access
    async function initCamera() {
        if (stream) return;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } }, 
                audio: false 
            });
            video.srcObject = stream;
            permissionOverlay.classList.add('hidden');
        } catch (err) {
            console.error('Error accessing camera:', err);
        }
    }

    enableCameraBtn.addEventListener('click', initCamera);

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    async function doCountdown() {
        countdownText.style.opacity = '1';
        for (let i = 3; i > 0; i--) {
            countdownText.innerText = i;
            countdownText.style.transform = 'scale(1.2)';
            playBeepSound();
            await sleep(100);
            countdownText.style.transform = 'scale(1)';
            await sleep(900);
        }
        countdownText.style.opacity = '0';
    }

    function playBeepSound() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const actx = new AudioContext();
            const osc = actx.createOscillator();
            const gainNode = actx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, actx.currentTime);
            
            gainNode.gain.setValueAtTime(0, actx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, actx.currentTime + 0.05);
            gainNode.gain.linearRampToValueAtTime(0, actx.currentTime + 0.15);
            
            osc.connect(gainNode);
            gainNode.connect(actx.destination);
            
            osc.start(actx.currentTime);
            osc.stop(actx.currentTime + 0.2);
            
            setTimeout(() => { actx.close(); }, 300);
        } catch(e) {}
    }

    function playShutterSound() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const actx = new AudioContext();
            
            const bufferSize = actx.sampleRate * 0.1;
            const buffer = actx.createBuffer(1, bufferSize, actx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) { data[i] = Math.random() * 2 - 1; }
            
            const noise = actx.createBufferSource();
            noise.buffer = buffer;
            const noiseFilter = actx.createBiquadFilter();
            noiseFilter.type = 'highpass';
            noiseFilter.frequency.value = 1000;
            const gainNode = actx.createGain();
            noise.connect(noiseFilter);
            noiseFilter.connect(gainNode);
            gainNode.connect(actx.destination);
            gainNode.gain.setValueAtTime(1, actx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.1);
            
            const osc = actx.createOscillator();
            osc.type = 'square';
            osc.frequency.setValueAtTime(150, actx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(40, actx.currentTime + 0.05);
            const oscGain = actx.createGain();
            osc.connect(oscGain);
            oscGain.connect(actx.destination);
            oscGain.gain.setValueAtTime(0.5, actx.currentTime);
            oscGain.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.05);
            
            noise.start(actx.currentTime);
            osc.start(actx.currentTime);
            
            setTimeout(() => { noise.stop(); osc.stop(); actx.close(); }, 150);
        } catch(e) {}
    }

    function playPrintingSound() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const actx = new AudioContext();
            
            const duration = 6.0; 
            
            const osc = actx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(60, actx.currentTime);
            
            for(let i=0; i<60; i++) {
                osc.frequency.linearRampToValueAtTime(60 + (i%2===0?5:0), actx.currentTime + (i*0.1));
            }
            
            const oscGain = actx.createGain();
            oscGain.gain.setValueAtTime(0.3, actx.currentTime);
            oscGain.gain.linearRampToValueAtTime(0.6, actx.currentTime + duration/2);
            oscGain.gain.linearRampToValueAtTime(0, actx.currentTime + duration);
            
            osc.connect(oscGain);
            oscGain.connect(actx.destination);
            osc.start(actx.currentTime);
            osc.stop(actx.currentTime + duration);

            const bufferSize = actx.sampleRate * duration;
            const buffer = actx.createBuffer(1, bufferSize, actx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) { data[i] = Math.random() * 2 - 1; }
            
            const noise = actx.createBufferSource();
            noise.buffer = buffer;
            
            const noiseFilter = actx.createBiquadFilter();
            noiseFilter.type = 'lowpass';
            noiseFilter.frequency.value = 800;

            const noiseGain = actx.createGain();
            noiseGain.gain.setValueAtTime(0, actx.currentTime);
            noiseGain.gain.linearRampToValueAtTime(0.15, actx.currentTime + 0.5);
            noiseGain.gain.linearRampToValueAtTime(0.15, actx.currentTime + duration - 0.5);
            noiseGain.gain.linearRampToValueAtTime(0, actx.currentTime + duration);

            noise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(actx.destination);
            
            noise.start(actx.currentTime);
            
            setTimeout(() => { actx.close(); }, duration * 1000 + 100);
        } catch(e){}
    }

    async function showPrompt(text, duration) {
        if(!promptText) return;
        promptText.innerText = text;
        promptText.style.opacity = '1';
        await sleep(duration);
        promptText.style.opacity = '0';
        await sleep(300);
    }

    function captureFrame() {
        playShutterSound();
        flashOverlay.classList.remove('flash-active');
        void flashOverlay.offsetWidth; 
        flashOverlay.classList.add('flash-active');

        captureCanvas.width = video.videoWidth;
        captureCanvas.height = video.videoHeight;
        
        ctx.save();
        ctx.translate(captureCanvas.width, 0);
        ctx.scale(-1, 1);
        ctx.filter = FILMS[selectedFilmStock].filter;
        ctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);
        ctx.restore();
        
        return captureCanvas.toDataURL('image/png');
    }

    async function generateStrip(images) {
        const stripCanvas = document.createElement('canvas');
        const sCtx = stripCanvas.getContext('2d');
        
        const imgWidth = 800;
        const imgHeight = 960; // 4:5ish portrait
        const padding = 40;
        const spacing = 80;
        const topPadding = 40;
        const bottomPadding = 240;
        
        stripCanvas.width = imgWidth + (padding * 2);
        stripCanvas.height = topPadding + (imgHeight * 4) + (spacing * 4) + bottomPadding;
        
        // Background
        sCtx.fillStyle = '#ffffff';
        sCtx.fillRect(0, 0, stripCanvas.width, stripCanvas.height);
        
        const loadImg = (src) => new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.src = src;
        });
        
        const loadedImages = await Promise.all(images.map(loadImg));
        
        loadedImages.forEach((img, index) => {
            const yPos = topPadding + (index * (imgHeight + spacing));
            
            // Draw photo (cropped center to fit 4:5 if needed, but scaling is fine)
            // To crop center:
            const sourceRatio = img.width / img.height;
            const targetRatio = imgWidth / imgHeight;
            let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;
            
            if (sourceRatio > targetRatio) {
                sWidth = img.height * targetRatio;
                sx = (img.width - sWidth) / 2;
            } else {
                sHeight = img.width / targetRatio;
                sy = (img.height - sHeight) / 2;
            }
            
            sCtx.drawImage(img, sx, sy, sWidth, sHeight, padding, yPos, imgWidth, imgHeight);
            
            // Draw metadata below photo
            sCtx.fillStyle = '#111';
            sCtx.font = '22px "Space Mono", monospace';
            sCtx.textAlign = 'left';
            sCtx.fillText(`FRAME_0${index+1}A`, padding, yPos + imgHeight + 40);
            sCtx.textAlign = 'right';
            sCtx.fillText(FILMS[selectedFilmStock].label, padding + imgWidth, yPos + imgHeight + 40);
        });
        
        // Add footer text
        const footerY = stripCanvas.height - bottomPadding + 80;
        
        sCtx.textAlign = 'center';
        sCtx.fillStyle = '#888';
        sCtx.font = '26px "Space Mono", monospace';
        sCtx.fillText('ARCHIVE ID: 9021-X-44', stripCanvas.width / 2, footerY);
        
        sCtx.fillStyle = '#111';
        sCtx.font = 'italic 72px "Playfair Display", serif';
        sCtx.fillText('Filmbooth', stripCanvas.width / 2, footerY + 80);
        
        // Draw "AUTHENTICATED" tilted box in red
        sCtx.save();
        sCtx.translate(stripCanvas.width - 180, footerY + 60);
        sCtx.rotate(-8 * Math.PI / 180);
        sCtx.strokeStyle = '#dc2626'; // Red-600
        sCtx.lineWidth = 3;
        sCtx.strokeRect(-120, -25, 240, 50);
        sCtx.fillStyle = '#dc2626';
        sCtx.font = 'bold 18px "Space Mono", monospace';
        sCtx.textAlign = 'center';
        sCtx.textBaseline = 'middle';
        sCtx.fillText('AUTHENTICATED', 0, 0);
        sCtx.restore();
        
        return stripCanvas.toDataURL('image/png', 0.9);
    }

    startBtn.addEventListener('click', async () => {
        if (!stream) {
            alert("Please enable camera access first.");
            return;
        }

        startBtn.disabled = true;
        startBtn.innerHTML = `WINDING... <span class="w-4 h-4 rounded-full bg-[#c83232] animate-pulse ml-2"></span>`;
        statusText.innerText = 'EXPOSING';
        liveIndicator.classList.add('animate-pulse');
        capturedImages = [];

        await sleep(1000);

        const prePrompts = ["Strike a pose", "Hold it right there", "One more...", "Last one!"];
        const postPrompts = ["Beautiful.", "Gorgeous.", "Perfect.", "Processing..."];

        await showPrompt("Get ready...", 1500);

        for (let i = 0; i < 4; i++) {
            // Update UI Counters
            const frameNum = (i + 1).toString().padStart(2, '0');
            expCounter.innerText = `EXP ${frameNum}/04`;
            frameCurrent.innerText = frameNum;

            if(promptText) {
                promptText.innerText = prePrompts[i];
                promptText.style.opacity = '1';
            }
            
            await doCountdown();
            
            if(promptText) {
                promptText.style.opacity = '0';
            }
            
            const frameUrl = captureFrame();
            capturedImages.push(frameUrl);
            
            await sleep(300);
            await showPrompt(postPrompts[i], 1200);
            
            if (i < 3) await sleep(500);
        }

        // Switch Views and Theme
        document.body.classList.remove('bg-zinc-950', 'text-white');
        document.body.classList.add('bg-[#fafafa]', 'text-gray-900');
        
        viewStudio.classList.add('hidden');
        viewPrint.classList.remove('hidden');
        
        // Set date
        const now = new Date();
        captureDate.innerText = `${now.getDate().toString().padStart(2, '0')}.${(now.getMonth()+1).toString().padStart(2, '0')}.${now.getFullYear()}`;

        // Generate strip
        finalStripUrl = await generateStrip(capturedImages);
        
        finalPrintImage.onload = () => {
            finalPrintImage.classList.add('printing-animation');
            playPrintingSound();
        };
        finalPrintImage.src = finalStripUrl;
    });

    // Actions
    downloadBtn.addEventListener('click', () => {
        if(!finalStripUrl) return;
        const a = document.createElement('a');
        a.href = finalStripUrl;
        a.download = 'filmbooth-archive-strip.png';
        a.click();
    });

    shareBtn.addEventListener('click', () => {
        alert("Your strip is ready to be shared! Download it and add it to your Instagram story.");
    });

    startOverBtn.addEventListener('click', () => {
        // Ensure Light Theme
        document.body.classList.remove('bg-[#232121]', 'text-white');
        document.body.classList.add('bg-[#fafafa]', 'text-gray-900');
        
        finalPrintImage.classList.remove('printing-animation');
        finalPrintImage.src = '';
        finalStripUrl = null;
        
        viewPrint.classList.add('hidden');
        viewSetup.classList.remove('hidden'); // Go back to setup instead of studio
        
        startBtn.disabled = false;
        startBtn.innerHTML = `WIND & SHOOT <span class="w-4 h-4 rounded-full bg-[#c83232] shadow-inner ml-2"></span>`;
        statusText.innerText = 'OPTICAL VIEWFINDER';
        expCounter.innerText = 'EXP 01/04';
        frameCurrent.innerText = '01';
    });
});
