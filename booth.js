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
    let globalAudioCtx = null;

    function initAudioContext() {
        if (!globalAudioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                globalAudioCtx = new AudioContext();
            }
        }
        if (globalAudioCtx && globalAudioCtx.state === 'suspended') {
            globalAudioCtx.resume();
        }
    }

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
    async function selectFilm(stock) {
        selectedFilmStock = stock;
        const film = FILMS[stock];
        
        const cLeft = document.getElementById('curtain-left');
        const cRight = document.getElementById('curtain-right');
        
        if (cLeft && cRight) {
            cLeft.classList.add('closed');
            cRight.classList.add('closed');
            cLeft.classList.remove('open-sides');
            cRight.classList.remove('open-sides');
            await sleep(600); // Give it time to close
        }
        
        // Setup Studio UI
        overlayModeText.innerText = film.overlayMode;
        tintStatus.innerText = film.tint;
        video.style.filter = film.filter;
        
        // Enter Dark Mode Studio
        document.body.classList.remove('bg-[#fafafa]', 'text-gray-900');
        document.body.classList.add('bg-[#232121]', 'text-white'); // Warm dark charcoal instead of black
        
        viewSetup.classList.add('hidden');
        viewStudio.classList.remove('hidden');
        
        // Hide Navbar during Studio Mode
        const navContainer = document.getElementById('global-nav-container');
        if (navContainer) navContainer.classList.add('hidden');
        
        initAudioContext();

        await initCamera();
        
        if (cLeft && cRight) {
            await sleep(200);
            cLeft.classList.remove('closed');
            cRight.classList.remove('closed');
            cLeft.classList.add('open-sides');
            cRight.classList.add('open-sides');
        }
        
        // Auto-start shooting after entering studio if camera is ready
        await sleep(500);
        if (stream) {
            startBtn.click();
        }
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
        if (!globalAudioCtx) return;
        try {
            const osc = globalAudioCtx.createOscillator();
            const gainNode = globalAudioCtx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, globalAudioCtx.currentTime);
            
            gainNode.gain.setValueAtTime(0, globalAudioCtx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, globalAudioCtx.currentTime + 0.05);
            gainNode.gain.linearRampToValueAtTime(0, globalAudioCtx.currentTime + 0.15);
            
            osc.connect(gainNode);
            gainNode.connect(globalAudioCtx.destination);
            
            osc.start(globalAudioCtx.currentTime);
            osc.stop(globalAudioCtx.currentTime + 0.2);
        } catch(e) {}
    }

    function playShutterSound() {
        if (!globalAudioCtx) return;
        try {
            const bufferSize = globalAudioCtx.sampleRate * 0.1;
            const buffer = globalAudioCtx.createBuffer(1, bufferSize, globalAudioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) { data[i] = Math.random() * 2 - 1; }
            
            const noise = globalAudioCtx.createBufferSource();
            noise.buffer = buffer;
            const noiseFilter = globalAudioCtx.createBiquadFilter();
            noiseFilter.type = 'highpass';
            noiseFilter.frequency.value = 1000;
            const gainNode = globalAudioCtx.createGain();
            noise.connect(noiseFilter);
            noiseFilter.connect(gainNode);
            gainNode.connect(globalAudioCtx.destination);
            gainNode.gain.setValueAtTime(1, globalAudioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, globalAudioCtx.currentTime + 0.1);
            
            const osc = globalAudioCtx.createOscillator();
            osc.type = 'square';
            osc.frequency.setValueAtTime(150, globalAudioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(40, globalAudioCtx.currentTime + 0.05);
            const oscGain = globalAudioCtx.createGain();
            osc.connect(oscGain);
            oscGain.connect(globalAudioCtx.destination);
            oscGain.gain.setValueAtTime(0.5, globalAudioCtx.currentTime);
            oscGain.gain.exponentialRampToValueAtTime(0.01, globalAudioCtx.currentTime + 0.05);
            
            noise.start(globalAudioCtx.currentTime);
            osc.start(globalAudioCtx.currentTime);
            
            setTimeout(() => { noise.stop(); osc.stop(); }, 150);
        } catch(e) {}
    }

    function playPrintingSound() {
        if (!globalAudioCtx) return;
        try {
            const duration = 6.0; 
            
            const osc = globalAudioCtx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(60, globalAudioCtx.currentTime);
            
            for(let i=0; i<60; i++) {
                osc.frequency.linearRampToValueAtTime(60 + (i%2===0?5:0), globalAudioCtx.currentTime + (i*0.1));
            }
            
            const oscGain = globalAudioCtx.createGain();
            oscGain.gain.setValueAtTime(0.3, globalAudioCtx.currentTime);
            oscGain.gain.linearRampToValueAtTime(0.6, globalAudioCtx.currentTime + duration/2);
            oscGain.gain.linearRampToValueAtTime(0, globalAudioCtx.currentTime + duration);
            
            osc.connect(oscGain);
            oscGain.connect(globalAudioCtx.destination);
            osc.start(globalAudioCtx.currentTime);
            osc.stop(globalAudioCtx.currentTime + duration);

            const bufferSize = globalAudioCtx.sampleRate * duration;
            const buffer = globalAudioCtx.createBuffer(1, bufferSize, globalAudioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) { data[i] = Math.random() * 2 - 1; }
            
            const noise = globalAudioCtx.createBufferSource();
            noise.buffer = buffer;
            
            const noiseFilter = globalAudioCtx.createBiquadFilter();
            noiseFilter.type = 'lowpass';
            noiseFilter.frequency.value = 800;

            const noiseGain = globalAudioCtx.createGain();
            noiseGain.gain.setValueAtTime(0, globalAudioCtx.currentTime);
            noiseGain.gain.linearRampToValueAtTime(0.15, globalAudioCtx.currentTime + 0.5);
            noiseGain.gain.linearRampToValueAtTime(0.15, globalAudioCtx.currentTime + duration - 0.5);
            noiseGain.gain.linearRampToValueAtTime(0, globalAudioCtx.currentTime + duration);

            noise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(globalAudioCtx.destination);
            
            noise.start(globalAudioCtx.currentTime);
        } catch(e){}
    }

    function playChemicalSwish() {
        if (!globalAudioCtx) return;
        try {
            const duration = 2.0;
            
            const bufferSize = globalAudioCtx.sampleRate * duration;
            const buffer = globalAudioCtx.createBuffer(1, bufferSize, globalAudioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) { data[i] = Math.random() * 2 - 1; }
            
            const noise = globalAudioCtx.createBufferSource();
            noise.buffer = buffer;
            const noiseFilter = globalAudioCtx.createBiquadFilter();
            noiseFilter.type = 'lowpass';
            
            // Sweep filter frequency to sound like liquid swishing
            noiseFilter.frequency.setValueAtTime(200, globalAudioCtx.currentTime);
            noiseFilter.frequency.exponentialRampToValueAtTime(800, globalAudioCtx.currentTime + duration / 2);
            noiseFilter.frequency.exponentialRampToValueAtTime(200, globalAudioCtx.currentTime + duration);
            
            const gainNode = globalAudioCtx.createGain();
            noise.connect(noiseFilter);
            noiseFilter.connect(gainNode);
            gainNode.connect(globalAudioCtx.destination);
            
            // Slow fade in and out for the liquid sound
            gainNode.gain.setValueAtTime(0, globalAudioCtx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, globalAudioCtx.currentTime + duration / 4);
            gainNode.gain.linearRampToValueAtTime(0.3, globalAudioCtx.currentTime + duration * 0.75);
            gainNode.gain.linearRampToValueAtTime(0, globalAudioCtx.currentTime + duration);
            
            noise.start(globalAudioCtx.currentTime);
        } catch(e) {}
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

    async function generateStrip(images, userCaption = '') {
        const stripCanvas = document.createElement('canvas');
        const sCtx = stripCanvas.getContext('2d');
        
        const imgWidth = 800;
        const imgHeight = 960; // 4:5ish portrait
        const padding = 40;
        const spacing = 80;
        const topPadding = 40;
        const bottomPadding = 400;
        
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
        const footerY = stripCanvas.height - bottomPadding + 100;
        
        sCtx.textAlign = 'center';
        sCtx.fillStyle = '#888';
        sCtx.font = '26px "Space Mono", monospace';
        sCtx.fillText('ARCHIVE ID: 9021-X-44', stripCanvas.width / 2, footerY);
        
        sCtx.fillStyle = '#111';
        sCtx.font = 'italic 72px "Playfair Display", serif';
        sCtx.fillText('Filmbooth', stripCanvas.width / 2, footerY + 80);

        if (userCaption && userCaption.trim() !== '') {
            sCtx.fillStyle = '#0f172a';
            sCtx.font = '600 56px "Caveat", cursive';
            sCtx.save();
            sCtx.translate(stripCanvas.width / 2, footerY + 200);
            sCtx.rotate(-2 * Math.PI / 180);
            sCtx.fillText(userCaption, 0, 0);
            sCtx.restore();
        }

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
        initAudioContext();
        
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
        const loader = document.getElementById('global-loader');
        if(loader) {
            const loaderText = loader.querySelector('.loader-text');
            if(loaderText) loaderText.innerText = 'Developing Film...';
            loader.classList.remove('hidden');
            playChemicalSwish();
            await sleep(2000);
        }

        // Switch Views and Theme
        document.body.classList.remove('bg-zinc-950', 'text-white', 'bg-[#232121]');
        document.body.classList.add('bg-[#fafafa]', 'text-gray-900');
        
        const cLeft = document.getElementById('curtain-left');
        const cRight = document.getElementById('curtain-right');
        if (cLeft && cRight) {
            cLeft.classList.remove('open-sides');
            cRight.classList.remove('open-sides');
        }

        const navContainer = document.getElementById('global-nav-container');
        if (navContainer) navContainer.classList.remove('hidden');

        viewStudio.classList.add('hidden');
        viewPrint.classList.remove('hidden');
        
        // Set date
        const now = new Date();
        captureDate.innerText = `${now.getDate().toString().padStart(2, '0')}.${(now.getMonth()+1).toString().padStart(2, '0')}.${now.getFullYear()}`;

        if(loader) {
            loader.classList.add('hidden');
            await sleep(400);
            const loaderText = loader.querySelector('.loader-text');
            if(loaderText) loaderText.innerText = 'Winding...';
        }
        
        // Show caption UI BEFORE printing
        const captionOverlay = document.getElementById('caption-overlay');
        const captionInput = document.getElementById('caption-input');
        
        let userCaption = '';
        if (captionOverlay && captionInput) {
            // Position the overlay correctly in the empty printer slot
            captionOverlay.classList.remove('bottom-16', 'translate-y-4');
            captionOverlay.classList.add('top-[40%]', '-translate-y-1/2'); 
            captionOverlay.classList.remove('opacity-0', 'pointer-events-none');
            captionInput.value = '';
            captionInput.focus();

            const submitCaptionBtn = document.getElementById('submit-caption-btn');
            if (submitCaptionBtn) {
                const newSubmitBtn = submitCaptionBtn.cloneNode(true);
                submitCaptionBtn.parentNode.replaceChild(newSubmitBtn, submitCaptionBtn);
                
                const newCaptionInput = captionInput.cloneNode(true);
                captionInput.parentNode.replaceChild(newCaptionInput, captionInput);
                
                newCaptionInput.focus();

                userCaption = await new Promise((resolve) => {
                    newSubmitBtn.addEventListener('click', () => {
                        resolve(newCaptionInput.value);
                    });
                    newCaptionInput.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') resolve(newCaptionInput.value);
                    });
                });
            }
            captionOverlay.classList.add('opacity-0', 'pointer-events-none', 'translate-y-4');
            captionOverlay.classList.remove('top-[40%]', '-translate-y-1/2');
            captionOverlay.classList.add('bottom-16'); // Reset for next time
        }

        // Generate strip with the final caption
        finalStripUrl = await generateStrip(capturedImages, userCaption);
        
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
    startOverBtn.addEventListener('click', async () => {
        const loader = document.getElementById('global-loader');
        if(loader) {
            const loaderText = loader.querySelector('.loader-text');
            if(loaderText) loaderText.innerText = 'Rewinding...';
            loader.classList.remove('hidden');
            if(typeof playSoftShutter === 'function') playSoftShutter();
            await sleep(800);
        }

        // Ensure Light Theme
        document.body.classList.remove('bg-[#232121]', 'text-white');
        document.body.classList.add('bg-[#fafafa]', 'text-gray-900');
        
        const navContainer = document.getElementById('global-nav-container');
        if (navContainer) navContainer.classList.remove('hidden');

        finalPrintImage.classList.remove('printing-animation');
        finalPrintImage.style.animationPlayState = '';
        finalPrintImage.src = '';
        finalStripUrl = null;
        
        const captionInput = document.getElementById('caption-input');
        if (captionInput) captionInput.value = '';
        
        viewPrint.classList.add('hidden');
        viewSetup.classList.remove('hidden'); // Go back to setup instead of studio
        
        startBtn.disabled = false;
        startBtn.innerHTML = `WIND & SHOOT <span class="w-4 h-4 rounded-full bg-[#c83232] shadow-inner ml-2"></span>`;
        statusText.innerText = 'OPTICAL VIEWFINDER';
        expCounter.innerText = 'EXP 01/04';
        frameCurrent.innerText = '01';

        if(loader) {
            loader.classList.add('hidden');
            await sleep(400);
            const loaderText = loader.querySelector('.loader-text');
            if(loaderText) loaderText.innerText = 'Winding...';
        }
    });
});
