document.addEventListener('DOMContentLoaded', function() {
    // Initialize demo mode variables
    const demoState = {
        handRaised: false,
        messageInterval: null
    };

    // DOM Elements
    const liveStream = document.getElementById('liveStream');
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const handRaiseBtn = document.getElementById('handRaiseBtn');
    const handRaiseStatus = document.getElementById('handRaiseStatus');
    const viewerCount = document.getElementById('viewerCount');
    const pollContainer = document.getElementById('pollContainer');
    const noPollMessage = document.getElementById('noPollMessage');
    const notifications = document.getElementById('notifications');

    // State
    let isHandRaised = false;
    let currentPoll = null;
    let hasVoted = false;

    // Stream Controls
    const volumeBtn = document.querySelector('.volume-btn');
    const volumeSlider = document.querySelector('.volume-slider');
    const qualitySelector = document.querySelector('.quality-selector');
    const fullscreenBtn = document.querySelector('.fullscreen-btn');

    // Initialize video stream
    async function initializeStream() {
        try {
            // Add event listeners for video
            // Show loading state
            showNotification('Loading class stream...', 'info');
            
            liveStream.addEventListener('loadedmetadata', () => {
                showNotification('Preparing class stream...', 'info');
            });

            liveStream.addEventListener('loadeddata', () => {
                showNotification('Class stream ready', 'success');
            });

            liveStream.addEventListener('waiting', () => {
                showNotification('Buffering...', 'info');
            });

            liveStream.addEventListener('play', () => {
                showNotification('Class started', 'info');
            });

            liveStream.addEventListener('pause', () => {
                showNotification('Class paused', 'info');
            });

            liveStream.addEventListener('ended', () => {
                showNotification('Class ended', 'info');
                // Loop the video for demo purposes
                setTimeout(() => {
                    liveStream.currentTime = 0;
                    liveStream.play().catch(() => {
                        showNotification('Click play to restart the class', 'info');
                    });
                }, 2000);
            });

            liveStream.addEventListener('error', (e) => {
                console.error('Video error:', e);
                showNotification('Error loading video stream. Please refresh the page.', 'error');
            });

            // Initialize demo features
            initializeSocketConnection();
            showNotification('Welcome to Advanced Physics - Wave Motion', 'success');
        } catch (error) {
            console.error('Stream initialization error:', error);
            showNotification('Error initializing class. Please refresh the page.', 'error');
        }
    }

    // Initialize demo mode for development
    function initializeSocketConnection() {
        console.info('Running in demo mode');
        simulateLiveInteraction();
    }

    // Simulate live interaction for development/demo mode
    function simulateLiveInteraction() {
        // Update viewer count
        viewerCount.textContent = '42';

        // Add demo welcome message
        setTimeout(() => {
            addChatMessage({
                username: 'Dr. Sarah Johnson',
                content: 'Welcome to our Physics class! Today we\'ll discuss Wave Motion.',
                timestamp: new Date(),
                isOwn: false
            });

            // Show demo poll
            setTimeout(() => {
                displayPoll({
                    question: 'What is the primary factor affecting wave speed?',
                    options: [
                        { text: 'Medium elasticity', votes: 35 },
                        { text: 'Wave frequency', votes: 25 },
                        { text: 'Wave amplitude', votes: 15 },
                        { text: 'Medium density', votes: 25 }
                    ]
                });
            }, 2000);

            // Simulate periodic chat messages
            setInterval(() => {
                const demoMessages = [
                    'Remember to take notes on wave interference patterns',
                    'Any questions about the wave equation?',
                    'Let\'s look at some practical examples',
                    'This concept will be important for next week\'s lab'
                ];
                const randomMessage = demoMessages[Math.floor(Math.random() * demoMessages.length)];
                
                addChatMessage({
                    username: 'Dr. Sarah Johnson',
                    content: randomMessage,
                    timestamp: new Date(),
                    isOwn: false
                });
            }, 30000); // New message every 30 seconds
        }, 1000);

        showNotification('Demo mode active - Some features may be limited', 'info');
    }

    // Chat Functions
    function addChatMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${message.isOwn ? 'own' : ''}`;
        messageElement.innerHTML = `
            <div class="username">${message.username}</div>
            <div class="timestamp">${new Date(message.timestamp).toLocaleTimeString()}</div>
            <div class="content">${message.content}</div>
        `;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function handleHandRaise() {
        demoState.handRaised = !demoState.handRaised;
        handRaiseBtn.classList.toggle('hand-raised', demoState.handRaised);
        handRaiseStatus.classList.toggle('hidden', !demoState.handRaised);
        showNotification(`You ${demoState.handRaised ? 'raised' : 'lowered'} your hand`, 'info');
    }

    // Poll Functions
    function displayPoll(poll) {
        currentPoll = poll;
        hasVoted = false;
        pollContainer.classList.remove('hidden');
        noPollMessage.classList.add('hidden');

        const pollQuestion = document.getElementById('pollQuestion');
        const pollOptions = document.getElementById('pollOptions');
        
        pollQuestion.textContent = poll.question;
        pollOptions.innerHTML = '';

        poll.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'poll-option w-full text-left p-3 rounded bg-white/10 hover:bg-white/20 transition';
            button.innerHTML = `
                <div class="progress" style="width: ${option.votes}%"></div>
                <div class="content flex justify-between">
                    <span>${option.text}</span>
                    <span>${option.votes}%</span>
                </div>
            `;
            
            button.addEventListener('click', () => {
                if (!hasVoted) {
                    const options = currentPoll.options.map((opt, idx) => ({
                        ...opt,
                        votes: idx === index ? opt.votes + 5 : opt.votes // Simulate other votes
                    }));
                    displayPoll({ ...currentPoll, options });
                    hasVoted = true;
                    showNotification('Your vote has been recorded', 'success');
                }
            });
            
            pollOptions.appendChild(button);
        });
    }

    // Hand Raise Functions
    function toggleHandRaise() {
        demoState.handRaised = !demoState.handRaised;
        handRaiseBtn.classList.toggle('hand-raised', demoState.handRaised);
        handRaiseStatus.classList.toggle('hidden', !demoState.handRaised);
        showNotification(`You ${demoState.handRaised ? 'raised' : 'lowered'} your hand`, 'info');

        // Simulate other students raising hands
        if (demoState.handRaised) {
            setTimeout(() => {
                showNotification('John Smith raised their hand', 'info');
            }, 3000);
            setTimeout(() => {
                showNotification('Emma Davis raised their hand', 'info');
            }, 7000);
        }
    }

    // Notification Function
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type} mb-2`;
        notification.textContent = message;
        notifications.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    // Stream Control Functions
    function toggleMute() {
        liveStream.muted = !liveStream.muted;
        updateVolumeIcon();
    }

    function updateVolumeIcon() {
        const icon = volumeBtn.querySelector('i');
        if (liveStream.muted || liveStream.volume === 0) {
            icon.className = 'fas fa-volume-mute';
        } else if (liveStream.volume < 0.5) {
            icon.className = 'fas fa-volume-down';
        } else {
            icon.className = 'fas fa-volume-up';
        }
    }

    function handleVolumeChange() {
        const value = volumeSlider.value;
        liveStream.volume = value / 100;
        liveStream.muted = value === '0';
        updateVolumeIcon();
    }

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            liveStream.requestFullscreen().catch(err => {
                showNotification('Error entering fullscreen mode', 'error');
            });
        } else {
            document.exitFullscreen();
        }
    }

    // Poll Functions
    function handlePollVote(optionIndex) {
        if (!hasVoted && currentPoll) {
            const options = currentPoll.options.map((option, index) => {
                if (index === optionIndex) {
                    return { ...option, votes: option.votes + 5 }; // Simulate other votes
                }
                return option;
            });
            displayPoll({ ...currentPoll, options });
            hasVoted = true;
            showNotification('Your vote has been recorded', 'success');
        }
    }

    // Event Listeners
    sendMessageBtn.addEventListener('click', () => {
        const content = chatInput.value.trim();
        if (content) {
            addChatMessage({
                username: 'You',
                content,
                timestamp: new Date(),
                isOwn: true
            });
            chatInput.value = '';
            
            // Simulate instructor response
            setTimeout(() => {
                const responses = [
                    'Good question! Let me explain...',
                    'That\'s an interesting point.',
                    'Anyone else want to share their thoughts on this?',
                    'Let\'s discuss this further.'
                ];
                const response = responses[Math.floor(Math.random() * responses.length)];
                addChatMessage({
                    username: 'Dr. Sarah Johnson',
                    content: response,
                    timestamp: new Date(),
                    isOwn: false
                });
            }, 1500);
        }
    });

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessageBtn.click();
    });

    handRaiseBtn.addEventListener('click', handleHandRaise);
    volumeBtn.addEventListener('click', toggleMute);
    volumeSlider.addEventListener('input', handleVolumeChange);
    fullscreenBtn.addEventListener('click', toggleFullscreen);

    qualitySelector.addEventListener('change', () => {
        showNotification(`Video quality changed to ${qualitySelector.value}p`, 'info');
    });

    // Initialize with a slight delay to ensure DOM is fully loaded
    setTimeout(() => {
        initializeStream();
        updateVolumeIcon();
    }, 1000);
});
