async function fetchEmotion(): Promise<void> {
    try {
        const response = await fetch('http://127.0.0.1:5000/emotion');
        console.log('Response status:', response.status);
        
        if (response.ok) {
            const data: { emotion: string; score: number } = await response.json();
            console.log('Received data:', data);
            
            if (data && data.emotion && data.score !== undefined) {
                const emotionElement = document.getElementById('emotion');
                const scoreElement = document.getElementById('score');
                
                if (emotionElement && scoreElement) {
                    emotionElement.textContent = `Emotion: ${data.emotion}`;
                    scoreElement.textContent = `Score: ${data.score}`;
                } else {
                    console.error('Element(s) not found');
                }
            } else {
                console.error('Data format error:', data);
            }
        } else {
            console.error('Failed to fetch emotion data. Status:', response.status);
        }
    } catch (error) {
        console.error('Error fetching emotion data:', error);
    }
}

setInterval(fetchEmotion, 1000);
