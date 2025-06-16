document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const container = document.querySelector('.video-player-container');
    const video = document.getElementById('videoPlayer');
    const playPauseBtn = document.querySelector('.play-pause-btn');
    const volumeBtn = document.querySelector('.volume-btn');
    const volumeSlider = document.querySelector('.volume-slider');
    const progressContainer = document.querySelector('.progress-container');
    const progressBar = document.querySelector('.progress-bar');
    const timeDisplay = document.querySelector('.time-display');
    const qualitySelector = document.querySelector('.quality-selector');
    const downloadBtn = document.querySelector('.download-btn');
    const fullscreenBtn = document.querySelector('.fullscreen-btn');
    
    // Video quality sources (to be replaced with actual video URLs)
    const videoQualities = {
        '360': 'https://www.w3schools.com/html/mov_bbb.mp4',
        '480': 'https://www.w3schools.com/html/mov_bbb.mp4',
        '720': 'https://www.w3schools.com/html/mov_bbb.mp4',
        '1080': 'https://www.w3schools.com/html/mov_bbb.mp4'
    };

    let currentTime = 0; // Store video current time for quality switching

    // Prevent right-click on video
    container.addEventListener('contextmenu', e => e.preventDefault());

    // Play/Pause functionality
    function togglePlay() {
        if (video.paused) {
            video.play();
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
            video.pause();
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    }

    // Volume control
    function toggleMute() {
        video.muted = !video.muted;
        updateVolumeIcon();
        volumeSlider.value = video.muted ? 0 : (video.volume * 100);
    }

    function updateVolumeIcon() {
        const icon = volumeBtn.querySelector('i');
        if (video.muted || video.volume === 0) {
            icon.className = 'fas fa-volume-mute';
        } else if (video.volume < 0.5) {
            icon.className = 'fas fa-volume-down';
        } else {
            icon.className = 'fas fa-volume-up';
        }
    }

    function handleVolumeChange() {
        const value = volumeSlider.value;
        video.volume = value / 100;
        video.muted = value === '0';
        updateVolumeIcon();
    }

    // Progress bar
    function updateProgress() {
        const percentage = (video.currentTime / video.duration) * 100;
        progressBar.style.width = `${percentage}%`;
        timeDisplay.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
    }

    function setProgress(e) {
        const rect = progressContainer.getBoundingClientRect();
        const pos = (e.pageX - rect.left) / progressContainer.offsetWidth;
        video.currentTime = pos * video.duration;
    }

    // Time formatting
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        seconds = Math.floor(seconds % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // Quality selection
    async function changeQuality() {
        const quality = qualitySelector.value;
        currentTime = video.currentTime;
        const wasPlaying = !video.paused;
        
        // Show loading spinner (if implemented)
        // container.querySelector('.loading-spinner').style.display = 'block';
        
        video.src = videoQualities[quality];
        
        // Wait for video to load enough to play
        await video.load();
        video.currentTime = currentTime;
        
        if (wasPlaying) {
            video.play();
        }
        
        // Hide loading spinner
        // container.querySelector('.loading-spinner').style.display = 'none';
    }

    // Secure download functionality
    async function handleDownload() {
        try {
            // In a real implementation, this would call your backend API
            // The API would verify the user's authentication and rights
            // Then stream the video with proper headers to force download
            const response = await fetch('/api/video/download', {
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                }
            });

            if (!response.ok) {
                throw new Error('Download failed');
            }

            // Create a download link
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'video.mp4';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Download failed:', error);
            alert('Download failed. Please try again later.');
        }
    }

    // Fullscreen functionality
    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            container.requestFullscreen().catch(err => {
                console.error('Failed to enter fullscreen:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }

    // Event listeners
    playPauseBtn.addEventListener('click', togglePlay);
    video.addEventListener('click', togglePlay);
    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('loadedmetadata', () => {
        timeDisplay.textContent = `0:00 / ${formatTime(video.duration)}`;
    });

    volumeBtn.addEventListener('click', toggleMute);
    volumeSlider.addEventListener('input', handleVolumeChange);
    
    progressContainer.addEventListener('click', setProgress);
    
    qualitySelector.addEventListener('change', changeQuality);
    downloadBtn.addEventListener('click', handleDownload);
    fullscreenBtn.addEventListener('click', toggleFullscreen);

    // Keyboard shortcuts
    document.addEventListener('keydown', e => {
        if (e.code === 'Space') {
            e.preventDefault();
            togglePlay();
        } else if (e.code === 'ArrowLeft') {
            video.currentTime -= 5;
        } else if (e.code === 'ArrowRight') {
            video.currentTime += 5;
        } else if (e.code === 'ArrowUp') {
            e.preventDefault();
            video.volume = Math.min(1, video.volume + 0.1);
            volumeSlider.value = video.volume * 100;
            updateVolumeIcon();
        } else if (e.code === 'ArrowDown') {
            e.preventDefault();
            video.volume = Math.max(0, video.volume - 0.1);
            volumeSlider.value = video.volume * 100;
            updateVolumeIcon();
        } else if (e.code === 'KeyM') {
            toggleMute();
        } else if (e.code === 'KeyF') {
            toggleFullscreen();
        }
    });

    // Handle fullscreen change
    document.addEventListener('fullscreenchange', () => {
        container.classList.toggle('fullscreen', document.fullscreenElement !== null);
    });

    // Initialize volume
    video.volume = volumeSlider.value / 100;
    updateVolumeIcon();
});
