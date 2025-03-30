// main.js - 메인 기능 및 UI 처리

// 전역 변수
let currentCharacter = null;
let apiConnected = false;

// 애플리케이션 초기화
document.addEventListener('DOMContentLoaded', () => {
    initializeUI();
    setupEventListeners();
    checkApiConnection();
});

// UI 초기화
function initializeUI() {
    // 환영 메시지 표시
    showMessage('안녕하세요! 캐릭터를 업로드해주세요!');
    
    // 저장된 캐릭터가 있는지 확인
    const savedCharacter = localStorage.getItem('character');
    if (savedCharacter) {
        currentCharacter = JSON.parse(savedCharacter);
        displayCharacter(currentCharacter);
    }
    
    // 맞춤 대화 로드
    loadCustomDialogues();
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 캐릭터 업로드 버튼
    const uploadButton = document.querySelector('.character-upload-button');
    if (uploadButton) {
        uploadButton.addEventListener('click', openCharacterUploadDialog);
    }
    
    // 메뉴 버튼들
    const menuButtons = document.querySelectorAll('.menu-button');
    menuButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const menuType = e.target.dataset.menu;
            openMenu(menuType);
        });
    });
    
    // 팝업 닫기 버튼
    const closeButtons = document.querySelectorAll('.close-popup');
    closeButtons.forEach(button => {
        button.addEventListener('click', closePopup);
    });
    
    // 메시지 전송
    const sendButton = document.getElementById('send-button');
    const messageInput = document.getElementById('message-input');
    
    if (sendButton && messageInput) {
        // 버튼 클릭으로 메시지 전송
        sendButton.addEventListener('click', () => {
            sendMessage();
        });
        
        // Enter 키로 메시지 전송
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
    
    // API 연결 테스트
    const testApiButton = document.getElementById('test-api');
    const saveApiButton = document.getElementById('save-api');
    
    if (testApiButton) {
        testApiButton.addEventListener('click', testApiConnection);
    }
    
    if (saveApiButton) {
        saveApiButton.addEventListener('click', saveApiKey);
    }
    
    // 캐릭터 삭제
    const deleteCharButton = document.getElementById('delete-character');
    if (deleteCharButton) {
        deleteCharButton.addEventListener('click', deleteCharacter);
    }
    
    // 맞춤 대화 추가
    const addDialogueButton = document.getElementById('add-dialogue');
    if (addDialogueButton) {
        addDialogueButton.addEventListener('click', () => {
            const textarea = document.getElementById('new-dialogue');
            if (textarea && textarea.value.trim()) {
                saveCustomDialogue(textarea.value);
                textarea.value = '';
                loadCustomDialogues();
            }
        });
    }
}

// API 연결 상태 확인
function checkApiConnection() {
    import('./ai.js').then(AI => {
        AI.checkConnection()
            .then(connected => {
                apiConnected = connected;
                updateConnectionStatus(connected);
            })
            .catch(error => {
                console.error('API 연결 확인 중 오류 발생:', error);
                updateConnectionStatus(false);
            });
    });
}

// 연결 상태 표시 업데이트
function updateConnectionStatus(connected) {
    const statusElement = document.getElementById('api-status');
    if (statusElement) {
        statusElement.textContent = connected ? '연결됨' : '연결 안됨';
        statusElement.className = connected ? 'connected' : 'disconnected';
    }
    
    // API 테스트 결과 표시 (보이는 경우)
    const testResult = document.getElementById('api-test-result');
    if (testResult && testResult.style.display !== 'none') {
        testResult.textContent = connected ? 'API 연결 성공!' : 'API 연결 실패!';
        testResult.className = connected ? 'success' : 'error';
    }
}

// 캐릭터 업로드 대화상자 열기
function openCharacterUploadDialog() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = handleCharacterUpload;
    input.click();
}

// 캐릭터 파일 업로드 처리
function handleCharacterUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const character = {
            id: Date.now().toString(),
            name: file.name.replace(/\.[^/.]+$/, ""), // 파일 확장자 제거
            image: e.target.result,
            level: 1,
            happiness: 50,
            lastInteraction: new Date().toISOString()
        };
        
        currentCharacter = character;
        localStorage.setItem('character', JSON.stringify(character));
        displayCharacter(character);
    };
    reader.readAsDataURL(file);
}

// 캐릭터 화면에 표시
function displayCharacter(character) {
    const characterDisplay = document.getElementById('character-display');
    if (!characterDisplay) return;
    
    characterDisplay.innerHTML = `
        <div class="character">
            <img src="${character.image}" alt="${character.name}" class="character-image">
            <div class="character-info">
                <h3>${character.name}</h3>
                <p>레벨: ${character.level}</p>
                <p>행복도: ${character.happiness}%</p>
            </div>
        </div>
    `;
    
    updateCharacterInfo(character);
    showMessage(`${character.name}이(가) 등장했습니다!`);
}

// 팝업의 캐릭터 정보 업데이트
function updateCharacterInfo(character) {
    const characterInfo = document.getElementById('character-info');
    if (characterInfo && character) {
        characterInfo.innerHTML = `
            <div class="character-details">
                <img src="${character.image}" alt="${character.name}" class="character-thumbnail">
                <div>
                    <h3>${character.name}</h3>
                    <p>레벨: ${character.level}</p>
                    <p>행복도: ${character.happiness}%</p>
                    <p>마지막 상호작용: ${new Date(character.lastInteraction).toLocaleString()}</p>
                </div>
            </div>
        `;
    }
}

// 메시지 영역에 메시지 표시
function showMessage(text, isUser = false) {
    const messageArea = document.getElementById('message-area');
    if (messageArea) {
        const messageElement = document.createElement('div');
        messageElement.className = isUser ? 'message user-message' : 'message';
        messageElement.textContent = text;
        
        // 복사 버튼 추가
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-button';
        copyButton.textContent = '복사';
        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(text)
                .then(() => {
                    copyButton.textContent = '복사됨';
                    setTimeout(() => {
                        copyButton.textContent = '복사';
                    }, 2000);
                })
                .catch(err => {
                    console.error('클립보드에 복사 실패:', err);
                });
        });
        
        messageElement.appendChild(copyButton);
        messageArea.appendChild(messageElement);
        messageArea.scrollTop = messageArea.scrollHeight;
    }
}

// AI에 메시지 전송
async function sendMessage() {
    const messageInput = document.getElementById('message-input');
    if (!messageInput || !messageInput.value.trim()) return;
    
    const message = messageInput.value.trim();
    messageInput.value = '';
    
    // 사용자 메시지 표시
    showMessage(message, true);
    
    if (!apiConnected) {
        showMessage('API가 연결되지 않았습니다. API 설정을 확인해주세요.');
        return;
    }
    
    if (!currentCharacter) {
        showMessage('먼저 캐릭터를 업로드해주세요.');
        return;
    }
    
    try {
        // 로딩 표시
        const sendButton = document.getElementById('send-button');
        if (sendButton) {
            sendButton.disabled = true;
            sendButton.textContent = '로딩 중...';
        }
        
        // AI 모듈 불러오기 및 응답 가져오기
        const AI = await import('./ai.js');
        const response = await AI.sendMessage(message, currentCharacter);
        
        // AI 응답 표시
        showMessage(response);
        
        // 캐릭터 상태 업데이트
        if (currentCharacter) {
            currentCharacter.lastInteraction = new Date().toISOString();
            currentCharacter.happiness = Math.min(100, currentCharacter.happiness + 5);
            
            // 행복도가 10 증가할 때마다 레벨업
            const newLevel = Math.floor((currentCharacter.happiness - 50) / 10) + 1;
            if (newLevel > currentCharacter.level) {
                currentCharacter.level = newLevel;
                showMessage(`축하합니다! ${currentCharacter.name}이(가) 레벨 ${newLevel}로 올라갔습니다!`);
            }
            
            localStorage.setItem('character', JSON.stringify(currentCharacter));
            displayCharacter(currentCharacter);
        }
    } catch (error) {
        showMessage(`오류 발생: ${error.message}`);
    } finally {
        // 버튼 상태 복원
        const sendButton = document.getElementById('send-button');
        if (sendButton) {
            sendButton.disabled = false;
            sendButton.textContent = '전송';
        }
    }
}

// 메뉴 팝업 열기
function openMenu(menuType) {
    closeAllPopups(); // 열려있는 팝업 모두 닫기
    
    const popup = document.getElementById(`${menuType}-popup`);
    if (popup) {
        popup.style.display = 'block';
        
        // 메뉴 타입별 특수 동작
        if (menuType === 'api-connect') {
            // 저장된 API 키 표시
            const apiKeyInput = document.getElementById('api-key');
            if (apiKeyInput) {
                apiKeyInput.value = localStorage.getItem('geminiApiKey') || '';
            }
            
            // 연결 상태 표시 업데이트
            updateConnectionStatus(apiConnected);
        } else if (menuType === 'character') {
            // 캐릭터 정보 업데이트
            updateCharacterInfo(currentCharacter);
        }
    }
}

// 모든 팝업 닫기
function closeAllPopups() {
    const popups = document.querySelectorAll('.popup');
    popups.forEach(popup => {
        popup.style.display = 'none';
    });
}

// 현재 팝업 닫기
function closePopup(event) {
    const popup = event.target.closest('.popup');
    if (popup) {
        popup.style.display = 'none';
    }
}

// API 연결 테스트
async function testApiConnection() {
    const apiKeyInput = document.getElementById('api-key');
    const testResult = document.getElementById('api-test-result');
    
    if (!apiKeyInput || !testResult) return;
    
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        testResult.textContent = 'API 키를 입력해주세요.';
        testResult.className = 'error';
        return;
    }
    
    testResult.textContent = '연결 테스트 중...';
    testResult.className = '';
    
    try {
        const AI = await import('./ai.js');
        const connected = await AI.setApiKey(apiKey);
        
        apiConnected = connected;
        testResult.textContent = connected ? 'API 연결 성공!' : 'API 연결 실패!';
        testResult.className = connected ? 'success' : 'error';
        
        updateConnectionStatus(connected);
    } catch (error) {
        testResult.textContent = `오류 발생: ${error.message}`;
        testResult.className = 'error';
        updateConnectionStatus(false);
    }
}

// API 키 저장
async function saveApiKey() {
    const apiKeyInput = document.getElementById('api-key');
    if (!apiKeyInput) return;
    
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
        const AI = await import('./ai.js');
        AI.setApiKey(apiKey);
        showMessage('API 키가 저장되었습니다.');
        closeAllPopups();
    } else {
        const testResult = document.getElementById('api-test-result');
        if (testResult) {
            testResult.textContent = 'API 키를 입력해주세요.';
            testResult.className = 'error';
        }
    }
}

// 캐릭터 삭제 (확인 포함)
function deleteCharacter() {
    if (!currentCharacter) {
        showMessage('삭제할 캐릭터가 없습니다.');
        return;
    }
    
    if (confirm('정말로 선택한 캐릭터를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
        localStorage.removeItem('character');
        currentCharacter = null;
        
        const characterDisplay = document.getElementById('character-display');
        if (characterDisplay) {
            characterDisplay.innerHTML = '';
        }
        
        showMessage('캐릭터가 삭제되었습니다. 새 캐릭터를 업로드해주세요.');
        closeAllPopups();
    }
}

// 맞춤 대화 저장
function saveCustomDialogue(text) {
    if (!text.trim()) return;
    
    let customDialogues = JSON.parse(localStorage.getItem('customDialogues') || '[]');
    customDialogues.push({
        id: Date.now().toString(),
        text: text,
        date: new Date().toISOString()
    });
    
    localStorage.setItem('customDialogues', JSON.stringify(customDialogues));
    showMessage('대화가 저장되었습니다.');
}

// 맞춤 대화 로드
function loadCustomDialogues() {
    const customDialoguesContainer = document.getElementById('custom-dialogues');
    if (!customDialoguesContainer) return;
    
    const customDialogues = JSON.parse(localStorage.getItem('customDialogues') || '[]');
    
    customDialoguesContainer.innerHTML = '';
    
    if (customDialogues.length === 0) {
        customDialoguesContainer.innerHTML = '<p>저장된 대화가 없습니다.</p>';
        return;
    }
    
    customDialogues.forEach(dialogue => {
        const dialogueElement = document.createElement('div');
        dialogueElement.className = 'custom-dialogue';
        
        dialogueElement.innerHTML = `
            <p>${dialogue.text}</p>
            <small>${new Date(dialogue.date).toLocaleString()}</small>
            <button class="use-dialogue" data-id="${dialogue.id}">사용</button>
            <button class="delete-dialogue" data-id="${dialogue.id}">삭제</button>
        `;
        
        customDialoguesContainer.appendChild(dialogueElement);
    });
    
    // 대화 버튼 이벤트 리스너
    document.querySelectorAll('.use-dialogue').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            const dialogue = customDialogues.find(d => d.id === id);
            if (dialogue) {
                const messageInput = document.getElementById('message-input');
                if (messageInput) {
                    messageInput.value = dialogue.text;
                    closeAllPopups();
                }
            }
        });
    });
    
    document.querySelectorAll('.delete-dialogue').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            const updatedDialogues = customDialogues.filter(d => d.id !== id);
            localStorage.setItem('customDialogues', JSON.stringify(updatedDialogues));
            loadCustomDialogues();
        });
    });
}
