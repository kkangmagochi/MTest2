// API 설정
const apiConfig = {
    baseUrl: 'https://api.example.com/v1', // 실제 API 엔드포인트로 변경 필요
    apiKey: '', 
    model: 'gpt-3.5-turbo', // 기본 모델
    maxTokens: 150
};

// AI 모듈 초기화
function initAIModule() {
    // 저장된 API 키 확인
    const savedApiKey = localStorage.getItem('apiKey');
    if (savedApiKey) {
        apiConfig.apiKey = savedApiKey;
        window.app.state.isAIConnected = true;
        updateAIConnectionStatus(true);
    }
    
    // AI 설정 폼 이벤트 리스너 설정
    const aiSettingsForm = document.getElementById('ai-settings-form');
    if (aiSettingsForm) {
        aiSettingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveAPISettings(e.target);
        });
    }
}

// API 설정 저장
function saveAPISettings(form) {
    const apiKey = form.querySelector('#api-key').value.trim();
    const model = form.querySelector('#api-model').value;
    const maxTokens = parseInt(form.querySelector('#max-tokens').value, 10);
    
    if (apiKey) {
        apiConfig.apiKey = apiKey;
        localStorage.setItem('apiKey', apiKey);
        
        if (model) {
            apiConfig.model = model;
            localStorage.setItem('apiModel', model);
        }
        
        if (!isNaN(maxTokens) && maxTokens > 0) {
            apiConfig.maxTokens = maxTokens;
            localStorage.setItem('maxTokens', maxTokens.toString());
        }
        
        window.app.state.isAIConnected = true;
        updateAIConnectionStatus(true);
        window.app.showNotification('AI 설정이 저장되었습니다.');
        
        // 캐릭터가 있으면 초기 응답 얻기
        if (window.app.state.currentCharacter) {
            getAIResponse('greeting', window.app.state.currentCharacter);
        }
    } else {
        window.app.showNotification('API 키를 입력해주세요.');
    }
}

// AI 연결 상태 UI 업데이트
function updateAIConnectionStatus(isConnected) {
    const statusElement = document.getElementById('ai-connection-status');
    if (statusElement) {
        statusElement.textContent = isConnected ? '연결됨' : '연결되지 않음';
        statusElement.className = isConnected ? 'connected' : 'disconnected';
    }
}

// 다양한 상호작용에 대한 AI 응답 얻기
async function getAIResponse(type, character, userInput = null) {
    // AI 연결 확인
    if (!window.app.state.isAIConnected || !apiConfig.apiKey) {
        window.app.showNotification('AI API가 연결되지 않았습니다. 설정에서 API 키를 입력해주세요.');
        return;
    }
    
    // 상호작용 유형에 따른 프롬프트 생성
    let prompt = '';
    switch(type) {
        case 'greeting':
            prompt = `Character: ${character.name}\nDescription: ${character.description || '없음'}\n\n${character.name}이(가) 사용자에게 인사하는 대화를 생성해주세요.`;
            break;
        case 'response':
            prompt = `Character: ${character.name}\nDescription: ${character.description || '없음'}\n\n사용자: ${userInput}\n\n${character.name}이(가) 사용자의 말에 자연스럽게 응답하는 대화를 생성해주세요.`;
            break;
        case 'custom':
            prompt = `Character: ${character.name}\nDescription: ${character.description || '없음'}\n\n${userInput}\n\n위 상황에 대한 ${character.name}의 반응을 생성해주세요.`;
            break;
    }
    
    // 로딩 표시
    showLoadingIndicator();
    
    try {
        // API 요청
        const response = await fetch(apiConfig.baseUrl + '/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiConfig.apiKey}`
            },
            body: JSON.stringify({
                model: apiConfig.model,
                messages: [
                    { role: 'system', content: `You are roleplaying as ${character.name}. Respond in the style and personality of the character. Keep responses concise (1-3 sentences).` },
                    { role: 'user', content: prompt }
                ],
                max_tokens: apiConfig.maxTokens,
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            throw new Error(`API 응답 오류: ${response.status}`);
        }
        
        const data = await response.json();
        const aiResponse = data.choices[0].message.content.trim();
        
        // 대화 기록에 응답 추가
        addToDialogueHistory(type === 'response' ? userInput : null, aiResponse);
        
        // 로딩 표시 제거
        hideLoadingIndicator();
        
        return aiResponse;
        
    } catch (error) {
        console.error('AI API 오류:', error);
        window.app.showNotification('AI 응답을 가져오는 중 오류가 발생했습니다.');
        hideLoadingIndicator();
        return null;
    }
}

// 대화 기록에 추가하고 표시
function addToDialogueHistory(userInput, aiResponse) {
    const dialogueEntry = {
        timestamp: new Date().toISOString(),
        userInput,
        aiResponse
    };
    
    // 앱 상태에 추가
    window.app.state.dialogueHistory.push(dialogueEntry);
    
    // 대화 컨테이너에 표시
    displayDialogue(dialogueEntry);
    
    // localStorage에 저장 (최대 50개 항목으로 제한)
    if (window.app.state.dialogueHistory.length > 50) {
        window.app.state.dialogueHistory = window.app.state.dialogueHistory.slice(-50);
    }
    localStorage.setItem('dialogueHistory', JSON.stringify(window.app.state.dialogueHistory));
}

// UI에 대화 표시
function displayDialogue(dialogueEntry) {
    const dialogueContainer = window.app.elements.dialogueContainer;
    if (!dialogueContainer) return;
    
    const dialogueElement = document.createElement('div');
    dialogueElement.classList.add('dialogue-item');
    
    // 사용자 입력이 있으면 표시
    if (dialogueEntry.userInput) {
        const userElement = document.createElement('div');
        userElement.classList.add('user-dialogue');
        userElement.innerHTML = `<p>${dialogueEntry.userInput}</p>`;
        dialogueElement.appendChild(userElement);
    }
    
    // AI 응답 표시
    const aiElement = document.createElement('div');
    aiElement.classList.add('ai-dialogue');
    aiElement.innerHTML = `
        <div class="character-icon">
            <img src="${window.app.state.currentCharacter.imageUrl}" alt="${window.app.state.currentCharacter.name}">
        </div>
        <div class="dialogue-content">
            <p>${dialogueEntry.aiResponse}</p>
            <div class="dialogue-actions">
                <button class="copy-btn">복사</button>
                <button class="favorite-btn">맞춤 대화에 추가</button>
            </div>
        </div>
    `;
    dialogueElement.appendChild(aiElement);
    
    // 버튼 이벤트 리스너 추가
    const copyBtn = aiElement.querySelector('.copy-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            window.app.copyToClipboard(dialogueEntry.aiResponse);
            window.app.showNotification('대화가 클립보드에 복사되었습니다.');
        });
    }
    
    const favoriteBtn = aiElement.querySelector('.favorite-btn');
    if (favoriteBtn) {
        favoriteBtn.addEventListener('click', () => {
            addToCustomDialogues(dialogueEntry.aiResponse);
            window.app.showNotification('맞춤 대화에 추가되었습니다.');
        });
    }
    
    // 대화 컨테이너에 추가
    dialogueContainer.appendChild(dialogueElement);
    
    // 컨테이너를 맨 아래로 스크롤
    dialogueContainer.scrollTop = dialogueContainer.scrollHeight;
}

// 로딩 표시 보여주기
function showLoadingIndicator() {
    const dialogueContainer = window.app.elements.dialogueContainer;
    if (!dialogueContainer) return;
    
    const loadingElement = document.createElement('div');
    loadingElement.id = 'ai-loading';
    loadingElement.classList.add('loading-indicator');
    loadingElement.innerHTML = `
        <div class="loading-dots">
            <span></span>
            <span></span>
            <span></span>
        </div>
        <p>AI가 응답 생성 중...</p>
    `;
    
    dialogueContainer.appendChild(loadingElement);
    dialogueContainer.scrollTop = dialogueContainer.scrollHeight;
}

// 로딩 표시 숨기기
function hideLoadingIndicator() {
    const loadingElement = document.getElementById('ai-loading');
    if (loadingElement) {
        loadingElement.remove();
    }
}

// 맞춤 대화 목록에 대화 추가
function addToCustomDialogues(dialogue) {
    const customDialogue = {
        id: Date.now().toString(),
        text: dialogue,
        characterId: window.app.state.currentCharacter.id,
        timestamp: new Date().toISOString()
    };
    
    window.app.state.customDialogues.push(customDialogue);
    localStorage.setItem('customDialogues', JSON.stringify(window.app.state.customDialogues));
}

// 다른 모듈에서 접근할 수 있도록 전역 객체 생성
window.ai = {
    init: initAIModule,
    getResponse: getAIResponse,
    addToDialogueHistory,
    displayDialogue,
    addToCustomDialogues
};
