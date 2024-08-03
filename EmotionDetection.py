import cv2
from fer import FER
from flask import Flask, jsonify
from flask_cors import CORS
import threading

# Initialize Flask app and FER detector
app = Flask(__name__)
CORS(app)
detector = FER(mtcnn=True)

def detect_emotion():
    cap = cv2.VideoCapture(1)
    
    if not cap.isOpened():
        print("Error: Could not open webcam.")
        return
    
    while True:
        ret, frame = cap.read()
        if not ret:
            print("Error: Could not read frame.")
            break
        
        emotion, score = detector.top_emotion(frame)
        
        if emotion:
            text = f"Emotion: {emotion}, Score: {score:.2f}"
        else:
            text = "No emotion detected"
        cv2.putText(frame, text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2, cv2.LINE_AA)
        cv2.imshow('Emotion Detection', frame)
        
        app.config['emotion'] = emotion
        app.config['score'] = score

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    cap.release()
    cv2.destroyAllWindows()

@app.route('/emotion', methods=['GET'])
def get_emotion():
    emotion = app.config.get('emotion', 'No emotion detected')
    score = app.config.get('score', 0)
    return jsonify({'emotion': emotion, 'score': score})

def run_flask():
    app.run(debug=True, use_reloader=False)

if __name__ == '__main__':
    threading.Thread(target=run_flask).start()
    detect_emotion()
