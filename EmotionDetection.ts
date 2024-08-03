interface EmotionData {
    emotion: string;
    score: number;
    timestamp?: number; // Optional property for timestamp
}

const emotionHistory: EmotionData[] = [];
const historyDuration = 5 * 1000; // 5 seconds in milliseconds

async function fetchEmotion(): Promise<void> {
    try {
        const response = await fetch('http://127.0.0.1:5000/emotion');
        if (response.ok) {
            const data: EmotionData = await response.json();
            console.log('Received data:', data);

            // Store emotion data with timestamp
            emotionHistory.push({ ...data, timestamp: Date.now() });

            // Remove data older than 5 seconds
            const cutoffTime = Date.now() - historyDuration;
            while (emotionHistory.length > 0 && emotionHistory[0].timestamp! < cutoffTime) {
                emotionHistory.shift();
            }

            // Analyze the most frequent emotion
            const emotionCounts = emotionHistory.reduce((acc, entry) => {
                acc[entry.emotion] = (acc[entry.emotion] || 0) + 1;
                return acc;
            }, {} as { [key: string]: number });

            const mostFrequentEmotion = Object.keys(emotionCounts).reduce((a, b) =>
                emotionCounts[a] > emotionCounts[b] ? a : b
            );

            // Display data in the HTML
            const emotionElement = document.getElementById('emotion');
            const scoreElement = document.getElementById('score');
            const messageElement = document.getElementById('message');

            if (emotionElement && scoreElement && messageElement) {
                emotionElement.textContent = `Emotion: ${mostFrequentEmotion}`;
                scoreElement.textContent = `Score: ${emotionCounts[mostFrequentEmotion]}`;
                
                // Display message based on the most frequent emotion
                switch (mostFrequentEmotion) {
                    case 'happy':
                        messageElement.textContent = '😊 You’re doing great! Keep it up!';
                        break;
                    case 'neutral':
                        messageElement.textContent = '😐 Everything’s calm and steady. Maybe now’s a good time to set some new goals or take a quick break.';
                        break;
                    case 'angry':
                        messageElement.textContent = '😠 Feeling angry? Maybe a walk would help you calm down.';
                        break;
                    case 'sad':
                        messageElement.textContent = '😢 It’s okay to feel sad. Take a break and do something you enjoy.';
                        break;
                    case 'surprised':
                        messageElement.textContent = '😲 Surprise! It’s a great time to embrace the unexpected.';
                        break;
                    default:
                        messageElement.textContent = ''; // Clear message if no specific emotion
                }
            }
        } else {
            console.error('Failed to fetch emotion data. Status:', response.status);
        }
    } catch (error) {
        console.error('Error fetching emotion data:', error);
    }
}

// Fetch emotion data every second
setInterval(fetchEmotion, 1000);
