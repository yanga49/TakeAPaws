"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function fetchEmotion() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch('http://127.0.0.1:5000/emotion');
            console.log('Response status:', response.status);
            if (response.ok) {
                const data = yield response.json();
                console.log('Received data:', data);
                if (data && data.emotion && data.score !== undefined) {
                    const emotionElement = document.getElementById('emotion');
                    const scoreElement = document.getElementById('score');
                    if (emotionElement && scoreElement) {
                        emotionElement.textContent = `Emotion: ${data.emotion}`;
                        scoreElement.textContent = `Score: ${data.score}`;
                    }
                    else {
                        console.error('Element(s) not found');
                    }
                }
                else {
                    console.error('Data format error:', data);
                }
            }
            else {
                console.error('Failed to fetch emotion data. Status:', response.status);
            }
        }
        catch (error) {
            console.error('Error fetching emotion data:', error);
        }
    });
}
setInterval(fetchEmotion, 1000);
