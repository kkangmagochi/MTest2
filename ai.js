// ai.js - Gemini API 연결 모듈

// Gemini API 설정
const CONFIG = {
    apiKey: '', // UI를 통해 설정됨
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    characterPrompt: '당신은 사용자의 가상 캐릭터입니다. 친근하고 귀여운 말투로 짧은 대답을 해주세요.'
};

// API 연결이 작동하는지 확인
async function checkConnection() {
    if (!CONFIG.apiKey) {
        // 저장된 키를 먼저 불러옴
        loadApiKey();
        if (!CONFIG.apiKey) {
            return false;
        }
    }
    
    try {
        const response = await fetch(`${CONFIG.apiEndpoint}?key=${CONFIG.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: 'Hello, testing connection'
                    }]
                }]
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Error:', errorData);
            throw new Error(`API 응답 오류: ${response.status}`);
        }
        
        const data = await response.json();
        return data && data.candidates && data.candidates.length > 0;
    } catch (error) {
        console.error('API 연결 확인 중 오류 발생:', error);
        return false;
    }
}

// API 키 설정
function setApiKey(key) {
    CONFIG.apiKey = key;
    localStorage.setItem('geminiApiKey', key);
    return checkConnection();
}

// 저장된 API 키 불러오기
function loadApiKey() {
    const savedKey = localStorage.getItem('geminiApiKey');
    if (savedKey) {
        CONFIG.apiKey = savedKey;
        return true;
    }
    return false;
}

// AI에 메시지 전송하고 응답 받기
async function sendMessage(message, character) {
    if (!CONFIG.apiKey) {
        throw new Error('API 키가 설정되지 않았습니다.');
    }
    
    try {
        let characterInfo = '';
        if (character) {
            characterInfo = `당신은 이름이 ${character.name}인 캐릭터입니다. 레벨은 ${character.level}이고 행복도는 ${character.happiness}%입니다.`;
        }
        
        const response = await fetch(`${CONFIG.apiEndpoint}?key=${CONFIG.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `${CONFIG.characterPrompt} ${characterInfo} 사용자: ${message}`
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Error:', errorData);
            throw new Error(`API 응답 오류: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.candidates || data.candidates.length === 0) {
            throw new Error('AI 응답을 받지 못했습니다.');
        }
        
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error('메시지 전송 중 오류 발생:', error);
        throw error;
    }
}

// 모듈 초기화
function initialize() {
    loadApiKey();
}

// 모듈 로드 시 초기화 호출
initialize();

// 다른 모듈에 함수 노출
export {
    checkConnection,
    setApiKey,
    sendMessage
};
