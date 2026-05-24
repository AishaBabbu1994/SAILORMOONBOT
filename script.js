// Variables globales
let groqApiKey = null;
let appConfig = null;

const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const apiStatus = document.getElementById('apiStatus');

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// Inicialización
window.addEventListener('DOMContentLoaded', async () => {
    await loadConfig();
    askForApiKey();
});

async function loadConfig() {
    try {
        const response = await fetch('config.json');
        if (!response.ok) throw new Error('No se pudo cargar config.json');
        appConfig = await response.json();
        apiStatus.textContent = "🌙 Usagi-chan lista · Esperando tu clave 🌙";
        console.log("Configuración cargada:", appConfig);
    } catch (error) {
        console.error("Error cargando config:", error);
        apiStatus.textContent = "⚠️ Usando personalidad por defecto (Usagi)";
        appConfig = {
            system_prompt: "Eres Usagi, una chica alegre, glotona y valiente. Habla con emojis de luna y corazón.",
            model: "llama-3.1-8b-instant",
            temperature: 0.85,
            max_tokens: 150
        };
    }
}

function askForApiKey() {
    const key = prompt("🔑 Sailor Moon necesita tu clave de Groq.\n\nObtén una gratis en https://console.groq.com\n\nIntroduce tu clave (empieza por gsk_):");
    
    if (key && key.trim().startsWith("gsk_")) {
        groqApiKey = key.trim();
        apiStatus.textContent = "✅ ¡Poder del corazón activado! Usagi puede charlar 💖";
        userInput.disabled = false;
        sendBtn.disabled = false;
        userInput.focus();
        addBotMessage("✨ ¡Yay! Ya podemos hablar. Cuéntame, ¿quieres un consejo o solo charlar? Por cierto, ¿tienes pastel? 🍰🐰🌙");
    } else {
        apiStatus.textContent = "❌ Clave no válida · Recarga la página";
        addBotMessage("🐰 ¡Oh no! Esa clave no sirve. Recarga y pon una clave válida de Groq, por favor. ¡Te ayudo con gusto después! 💕");
        userInput.disabled = true;
        sendBtn.disabled = true;
    }
}

function addBotMessage(text) {
    addMessage(text, false);
}

function addUserMessage(text) {
    addMessage(text, true);
}

function addMessage(text, isUser) {
    const messageDiv = document.createElement('div');
    const avatar = document.createElement('div');
    avatar.textContent = isUser ? '👤' : '🐰';
    const bubble = document.createElement('div');
    bubble.textContent = text;
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(bubble);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
        <div>🐰</div>
        <div>✨ Usagi está pensando... (o comiendo pastel) 🍰✨</div>
    `;
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
    const typing = document.getElementById('typingIndicator');
    if (typing) typing.remove();
}

async function callGroqAPI(userMessage) {
    if (!appConfig) {
        return "🐰 Ups, mi broche aún no brilla. Recarga la página, por favor. 🌙";
    }
    
    const messages = [
        { role: "system", content: appConfig.system_prompt },
        { role: "user", content: userMessage }
    ];
    
    const requestBody = {
        model: appConfig.model,
        messages: messages,
        temperature: appConfig.temperature,
        max_tokens: appConfig.max_tokens
    };
    
    try {
        const response = await fetch(GROQ_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${groqApiKey}`
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
        }
        
        const data = await response.json();
        return data.choices[0].message.content;
        
    } catch (error) {
        console.error("Error llamando a Groq API:", error);
        return "🌙 ¡Ay, no! Mi poder lunar falló. ¿Revisamos tu conexión o clave de API? ¡No te rindas! 💖🐰";
    }
}

async function handleSendMessage() {
    const message = userInput.value.trim();
    if (!message) return;
    
    userInput.disabled = true;
    sendBtn.disabled = true;
    
    addUserMessage(message);
    userInput.value = '';
    
    showTypingIndicator();
    const botResponse = await callGroqAPI(message);
    removeTypingIndicator();
    addBotMessage(botResponse);
    
    userInput.disabled = false;
    sendBtn.disabled = false;
    userInput.focus();
}

sendBtn.addEventListener('click', handleSendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !userInput.disabled && !sendBtn.disabled) {
        handleSendMessage();
    }
});