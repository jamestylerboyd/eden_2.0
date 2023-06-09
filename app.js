const sendButton = document.getElementById('sendButton');
const micButton = document.getElementById('micButton');
const muteToggle = document.getElementById('muteToggle');
const userMessage = document.getElementById('userMessage');
const uuidInput = document.getElementById('uuidInput');
const chatWindow = document.querySelector('.flex.flex-col.space-y-4');
const statusBubble = document.getElementById('statusBubble');
const statusText = document.getElementById('statusText');

const API_KEY = '414c3159-b797-4b21-8516-06df22614892';
const CHARACTER = 'eden';

let isTyping = false;

function setStatus(status) {
    statusText.textContent = status;
    switch (status) {
        case 'Idle':
            statusBubble.style.backgroundColor = 'green';
            break;
        case 'Processing':
            statusBubble.style.backgroundColor = 'yellow';
            break;
        case 'Error':
            statusBubble.style.backgroundColor = 'red';
            break;
    }
}

function addMessage(message, isUser = true) {
    const timestamp = new Date().toLocaleTimeString();
    const messageElement = `
        <div class="flex items-end ${isUser ? 'justify-end' : ''}">
            <div class="${isUser ? 'bg-gray-700' : 'bg-blue-500'} text-white p-2 rounded-lg">
                <p>${message}</p>
                <span class="text-xs">${timestamp}</span>
            </div>
            <div class="w-2 h-2 rounded-full ${isUser ? 'bg-green-400 ml-2' : 'bg-blue-400 mr-2'} mt-4"></div>
        </div>
    `;
    chatWindow.innerHTML += messageElement;
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

async function sendMessage() {
const message = userMessage.value.trim();
const uuid = uuidInput.value.trim();
if (message && uuid) {
addMessage(message, true);
userMessage.value = '';
setStatus('Processing');
try {
    const response = await fetch('https://api.carter.ai/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            apiKey: API_KEY,
            character: CHARACTER,
            input: message,
            uuid: uuid
        })
    });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    addMessage('Eden is typing...', false);
    const fillerResponse = await fetch('https://api.carter.ai/personalise', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            apiKey: API_KEY,
            character: CHARACTER,
            input: message,
            uuid: uuid
        })
    });
    if (!fillerResponse.ok) {
        throw new Error(`HTTP error! status: ${fillerResponse.status}`);
    }
    const fillerData = await fillerResponse.json();
    addMessage(fillerData.output, false);
    addMessage(data.output, false);
    if (!muteToggle.checked) {
        const speechResponse = await fetch('https://api.carter.ai/speak', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                apiKey: API_KEY,
                character: CHARACTER,
                input: data.output,
                gender: 'female'
            })
        });
        if (!speechResponse.ok) {
            throw new Error(`HTTP error! status: ${speechResponse.status}`);
        }
        const speechData = await speechResponse.json();
        const audio = new Audio(speechData.audio);
        audio.play();
    }
    setStatus('Idle');
} catch (error) {
    setStatus('Error');
    console.error('There was a problem with the fetch operation:', error);
}
} else {
alert('Please enter a UUID and a message.');
}
}


sendButton.addEventListener('click', sendMessage);
userMessage.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

if (window.SpeechRecognition || window.webkitSpeechRecognition) {
    micButton.addEventListener('click', () => {
        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.onresult = (event) => {
            userMessage.value = event.results[0][0].transcript;
            sendMessage();
        };
        recognition.start();
    });
} else {
    micButton.disabled = true;
    alert('Your browser does not support voice input. Please use a supported browser.');
}