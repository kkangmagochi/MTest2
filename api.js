// api.js - Handles interactions with Google Gemini API
import { getApiKey, setApiKey, getCurrentCharacter, getStats, getSelectedModel, setSelectedModel, setApiConnected, isApiConnected } from './state.js';
import { DOMElements, updateApiConnectionStatus, displayApiResponse, showNotification, updateGenerationStatus } from './ui.js';

// --- API Call Function ---
export async function callGeminiAPI(prompt) {
    const apiKey = getApiKey();
    const selectedModel = getSelectedModel() || 'gemini-2.5-pro-exp-03-25'; // 새 모델을 기본값으로 설정
    
    if (!apiKey) {
        throw new Error("API 키가 설정되지 않았습니다.");
    }
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;
    console.log(`Calling Gemini API (${selectedModel}): ${apiUrl}`);
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ 
                    parts: [{ text: prompt }] 
                }],
                safetySettings: [
                    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
                ],
                generationConfig: {
                    temperature: 0.8,
                    maxOutputTokens: 150,
                }
            })
        });
        
        const responseData = await response.json();
        
        if (!response.ok) {
            console.error("API Error Response:", responseData);
            let errorMessage = `API 요청 실패 (${response.status})`;
            
            if (responseData.error?.message) {
                errorMessage += `: ${responseData.error.message}`;
            }
            
            // API 키 관련 문제 확인
            if (response.status === 400 && responseData.error?.message.toLowerCase().includes('api key not valid')) {
                errorMessage = "API 키가 유효하지 않습니다. 확인 후 다시 연결해주세요.";
                setApiConnected(false);
                updateApiConnectionStatus('연결 실패: 잘못된 API 키', 'red');
            } else if (response.status === 403) {
                errorMessage = "API 접근 권한이 없습니다. 키 설정을 확인하세요.";
                setApiConnected(false);
                updateApiConnectionStatus('연결 실패: 접근 권한 없음', 'red');
            }
            
            throw new Error(errorMessage);
        }
        
        console.log("API Success Response:", responseData);
        
        if (responseData.candidates && responseData.candidates[0].content) {
            let responseText = responseData.candidates[0].content.parts[0].text;
            
            // 텍스트 정리: 앞뒤 공백 및 줄바꿈 제거
            responseText = responseText.replace(/^\s+|\s+$/g, '').replace(/\n/g, ' ');
            
            // 마크다운이나 따옴표 제거
            responseText = responseText.replace(/^\*+|\*+$/g, '').replace(/^"+|"+$/g, '').trim();
            
            return responseText;
        } else if (responseData.candidates && responseData.candidates[0].finishReason === 'SAFETY') {
            console.warn("API response blocked due to safety settings.");
            return "미안해요, 그 질문에는 답하기 어려워요.";
        } else {
            console.warn("API response format unexpected:", responseData);
            throw new Error('API 응답 형식이 올바르지 않습니다.');
        }
    } catch (error) {
        console.error("API call error:", error);
        
        if (error.message.includes("API 키가 유효하지 않습니다")) {
            setApiConnected(false);
            updateApiConnectionStatus('연결 실패: 잘못된 API 키', 'red');
        }
        
        throw error;
    }
}

// --- 프롬프트 생성 ---
export function createCharacterPrompt(actionContext, additionalDetails = '') {
    const character = getCurrentCharacter();
    const stats = getStats();
    
    if (!character) return "";
    
    // 기본 프롬프트 구조
    let prompt = `당신은 이제부터 '${character.name}'이라는 캐릭터입니다. 다음 정보를 바탕으로 사용자와 자연스럽게 대화해주세요.\n\n`;
    
    prompt += `### 캐릭터 정보\n`;
    prompt += `- 이름: ${character.name}\n`;
    prompt += `- 타입: ${character.type === 'existing' ? '기존 작품 캐릭터' : '오리지널 캐릭터'}\n`;
    if (character.setting) prompt += `- 기본 설정: ${character.setting}\n`;
    if (character.userNickname) prompt += `- 사용자 호칭: ${character.userNickname}\n`;
    if (character.genre) prompt += `- 장르: ${character.genre}\n`;
    if (character.tone) prompt += `- 말투: ${character.tone}\n`;
    if (character.personality) prompt += `- 성격: ${character.personality}\n`;
    if (character.lore) prompt += `- 세계관: ${character.lore}\n`;
    
    // 현재 상태
    prompt += `\n### 현재 상태\n`;
    prompt += `- 호감도: ${Math.round(stats.affection)}/100 (${stats.affection < 30 ? '낮음' : stats.affection < 70 ? '보통' : '높음'})\n`;
    prompt += `- 허기: ${Math.round(stats.hunger)}/100 (${stats.hunger < 30 ? '배고픔' : stats.hunger > 80 ? '배부름' : '보통'})\n`;
    prompt += `- 행복도: ${Math.round(stats.happiness)}/100 (${stats.happiness < 30 ? '우울함' : stats.happiness > 70 ? '행복함' : '보통'})\n`;
    
    // 상황
    prompt += `\n### 현재 상황\n`;
    prompt += `- ${actionContext}\n`;
    if (additionalDetails) prompt += `- 추가 정보: ${additionalDetails}\n`;
    
    // 지침
    prompt += `\n### 응답 지침\n`;
    prompt += `1. '${character.name}'의 입장에서 대답해주세요.\n`;
    prompt += `2. 캐릭터의 성격, 말투, 현재 상태(감정)를 자연스럽게 반영해주세요.\n`;
    prompt += `3. 상황에 맞는 적절하고 창의적인 반응을 보여주세요.\n`;
    prompt += `4. 간결하게 1~3 문장으로 대답해주세요.\n`;
    prompt += `5. 사용자의 이름을 언급 할 필요가 있는 경우 '${character.userNickname || "사용자"}' 라고 호칭해주세요.\n`;
    prompt += `6. 당신이 AI라는 사실이나 이 지침에 대해서는 절대 언급하지 마세요.\n\n`;
    
    prompt += `대답:`;
    
    console.log("Generated Prompt:", prompt);
    return prompt;
}

// --- AI 상호작용 함수 ---
export async function generateGreeting() {
    const character = getCurrentCharacter();
    
    if (!getApiKey() || !character) {
        if (character) {
            import('./ui.js').then(ui => ui.showSpeechBubble(`안녕하세요! 저는 ${character.name}이에요!`));
        }
        return;
    }
    
    try {
        const prompt = createCharacterPrompt("사용자와 처음 만남", "친근하게 인사해주세요.");
        const response = await callGeminiAPI(prompt);
        
        import('./ui.js').then(ui => ui.showSpeechBubble(response));
        import('./dialogLogs.js').then(logs => logs.addLogEntry(response, "인사"));
    } catch (error) {
        console.error("AI Greeting generation error:", error);
        import('./ui.js').then(ui => ui.showSpeechBubble(`반가워요! 저는 ${character.name}이에요!`));
    }
}

export async function generateAIResponse(action, additionalContext = '') {
    const character = getCurrentCharacter();
    
    if (!isApiConnected() || !character) {
        console.warn("AI Response generation skipped: API not connected or no character.");
        return null;
    }
    
    console.log(`Generating AI response for action: ${action}`);
    
    let actionDescription = "";
    switch (action) {
        case "feed":
            actionDescription = "사용자가 밥을 줌";
            break;
        case "play":
            actionDescription = "사용자가 놀아줌";
            break;
        case "gift":
            actionDescription = "사용자가 선물을 줌";
            break;
        case "sleep_greeting":
            actionDescription = "잠자리에 들 시간";
            additionalContext = additionalContext || "잘 자라고 인사해주세요.";
            break;
        case "sleep_wakeup":
            actionDescription = "아침에 일어남";
            break;
        case "customGift":
            actionDescription = "사용자가 선물을 줌";
            break;
        case "click":
            actionDescription = "사용자가 캐릭터를 클릭함";
            break;
        case "stats_reset":
            actionDescription = "스탯이 초기화됨";
            additionalContext = additionalContext || "상태가 기본으로 돌아갔습니다.";
            break;
        default:
            actionDescription = action;
    }
    
    const prompt = createCharacterPrompt(actionDescription, additionalContext);
    
    try {
        const response = await callGeminiAPI(prompt);
        console.log(`AI response for ${action}: ${response}`);
        return response;
    } catch (error) {
        console.error(`AI response generation failed for action ${action}:`, error);
        return null;
    }
}

// --- API 연결 테스트 ---
export function testApiConnection() {
    const apiKey = getApiKey();
    
    if (!apiKey) {
        updateApiConnectionStatus('API 키 없음', 'red');
        setApiConnected(false);
        return;
    }
    
    console.log("Starting API connection test...");
    updateApiConnectionStatus('테스트 중...', 'orange');
    setApiConnected(false);
    
    // 연결 테스트용 간단한 프롬프트
    callGeminiAPI("This is a test message to verify API key validity.")
        .then(response => {
            if (response && typeof response === 'string' && response.length > 0) {
                console.log("API Connection Test Success:", response);
                updateApiConnectionStatus('연결됨', 'green');
                setApiConnected(true);
                showNotification("API 연결 성공!", 2000);
            } else {
                console.warn("API Connection Test Warning: Received success code but invalid content.", response);
                throw new Error("API는 응답했으나, 유효한 내용을 받지 못했습니다.");
            }
        })
        .catch(error => {
            console.error('API Connection Test Failed:', error);
            
            const currentStatus = DOMElements.connectionStatus.textContent;
            if (!currentStatus.includes('잘못된 API 키') && !currentStatus.includes('접근 권한 없음')) {
                updateApiConnectionStatus(`연결 실패: ${error.message}`, 'red');
            }
            
            setApiConnected(false);
        });
}

// --- API 테스트 기능 ---
function handleApiTest() {
    const testMessage = DOMElements.testMessageInput.value.trim();
    
    if (testMessage === '') {
        showNotification('테스트 메시지를 입력해주세요.', 3000);
        return;
    }
    
    if (!isApiConnected()) {
        showNotification('먼저 API를 연결해주세요.', 3000);
        return;
    }
    
    displayApiResponse('API 호출 중...');
    
    const character = getCurrentCharacter();
    const characterContext = character ? `'${character.name}' 캐릭터처럼 응답해주세요.` : '일반적인 어시스턴트처럼 응답해주세요.';
    
    callGeminiAPI(`${characterContext} 사용자 메시지: ${testMessage}`)
        .then(response => {
            displayApiResponse(`${response}`);
        })
        .catch(error => {
            displayApiResponse(`오류 발생: ${error.message}`);
        });
}

// --- AI 콘텐츠 생성 ---
async function handleGenerateDialogs() {
    const character = getCurrentCharacter();
    
    if (!isApiConnected() || !character) {
        showNotification("AI 기능을 사용하려면 API 연결 및 캐릭터 선택이 필요합니다.", 3000);
        return;
    }
    
    updateGenerationStatus(DOMElements.dialogGenerationStatus, "생성 중...");
    
    try {
        const prompt = `'${character.name}' 캐릭터 정보:
- 타입: ${character.type === 'existing' ? '기존 작품 캐릭터' : '오리지널 캐릭터'}
${character.setting ? `- 설정: ${character.setting}` : ''}
${character.personality ? `- 성격: ${character.personality}` : ''}
${character.tone ? `- 말투: ${character.tone}` : ''}
${character.userNickname ? `- 사용자 호칭: ${character.userNickname}` : ''}

위 정보를 바탕으로, 이 캐릭터가 평소 할 법한 다양한 대사 7개를 생성해주세요.

지침:
1. 캐릭터의 성격과 말투를 완벽히 반영하세요.
2. 다양한 감정(기쁨, 슬픔, 지루함, 궁금함 등)을 표현하는 대사를 포함하세요.
3. 짧고 자연스러운 문장으로 만드세요.
4. 각 대사는 쉼표(,)로 구분하여 한 줄로 나열해주세요. 번호나 다른 설명은 붙이지 마세요.`;

        const response = await callGeminiAPI(prompt);
        DOMElements.customDialogInput.value = response.replace(/\n/g, ', ').replace(/,,/g, ',');
        updateGenerationStatus(DOMElements.dialogGenerationStatus, "생성 완료!");
    } catch (error) {
        console.error("Dialog generation error:", error);
        updateGenerationStatus(DOMElements.dialogGenerationStatus, `오류: ${error.message}`);
    }
}

async function handleGenerateGifts() {
    const character = getCurrentCharacter();
    
    if (!isApiConnected() || !character) {
        showNotification("AI 기능을 사용하려면 API 연결 및 캐릭터 선택이 필요합니다.", 3000);
        return;
    }
    
    updateGenerationStatus(DOMElements.giftGenerationStatus, "생성 중...");
    
    try {
        const prompt = `'${character.name}' 캐릭터 정보:
- 타입: ${character.type === 'existing' ? '기존 작품 캐릭터' : '오리지널 캐릭터'}
${character.setting ? `- 설정: ${character.setting}` : ''}
${character.personality ? `- 성격: ${character.personality}` : ''}
${character.userNickname ? `- 사용자 호칭: ${character.userNickname}` : ''}
${character.genre ? `- 장르: ${character.genre}` : ''}
${character.lore ? `- 세계관: ${character.lore}` : ''}

위 정보를 바탕으로, 이 캐릭터가 좋아할 만한 구체적인 선물 아이템 7개를 제안해주세요.

지침:
1. 캐릭터의 성격, 취향, 배경(장르/세계관)을 고려하여 독창적인 선물을 포함하세요.
2. 일반적인 선물과 특별한 선물을 섞어주세요.
3. 선물 이름만 쉼표(,)로 구분하여 한 줄로 나열해주세요. 번호나 다른 설명은 붙이지 마세요.`;

        const response = await callGeminiAPI(prompt);
        DOMElements.customGiftListInput.value = response.replace(/\n/g, ', ').replace(/,,/g, ',');
        updateGenerationStatus(DOMElements.giftGenerationStatus, "생성 완료!");
    } catch (error) {
        console.error("Gift generation error:", error);
        updateGenerationStatus(DOMElements.giftGenerationStatus, `오류: ${error.message}`);
    }
}

// --- 기본 모델 업데이트 ---
function updateDefaultModel() {
    // 새 모델을 기본값으로 설정
    const newModel = 'gemini-2.5-pro-exp-03-25';
    setSelectedModel(newModel);
    console.log(`기본 모델이 업데이트되었습니다: ${newModel}`);
}

// --- 초기화 ---
export function initApi() {
    // 새 모델을 기본값으로 설정
    updateDefaultModel();
    
    // API 모달 이벤트 리스너
    DOMElements.connectApiBtn.addEventListener('click', () => {
        setApiKey(DOMElements.apiKeyInput.value.trim());
        testApiConnection();
    });
    
    DOMElements.testApiBtn.addEventListener('click', handleApiTest);
    
    // 콘텐츠 생성 이벤트 리스너
    DOMElements.generateDialogBtn.addEventListener('click', handleGenerateDialogs);
    DOMElements.generateGiftsBtn.addEventListener('click', handleGenerateGifts);
    
    // API 키가 이미 존재하는지 확인
    if (getApiKey()) {
        DOMElements.apiKeyInput.value = getApiKey();
        testApiConnection();
    } else {
        updateApiConnectionStatus('연결되지 않음', 'red');
        setApiConnected(false);
    }
    
    console.log("API 모듈이 Gemini 2.5 Pro Exp 모델로 초기화되었습니다.");
}
