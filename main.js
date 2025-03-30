// 전역 DOM 요소 참조
const domElements = {
    characterUploadBtn: document.getElementById('character-upload-btn'),
    characterContainer: document.getElementById('character-container'),
    dialogueContainer: document.getElementById('dialogue-container'),
    copyButtons: document.querySelectorAll('.copy-btn'),
    customDialogueBtn: document.getElementById('custom-dialogue-btn')
};

// 애플리케이션 상태 관리
const appState = {
    currentCharacter: null,
    dialogueHistory: [],
    customDialogues: [],
    isAIConnected: false
};

// 모듈 초기화 및 이벤트 리스너 설정
document.addEventListener('DOMContentLoaded', () => {
    // 각 모듈 초기화
    initCharacterModule();
    initDialogueModule();
    initSettingsModule();
    initAIModule();
    
    // 이벤트 리스너 설정
    setupEventListeners();
    
    // 저장된 캐릭터 불러오기
    loadSavedCharacter();
});

// 이벤트 리스너 설정
function setupEventListeners() {
    // 캐릭터 업로드 버튼
    if (domElements.characterUploadBtn) {
        domElements.characterUploadBtn.addEventListener('click', () => {
            openCharacterUploadModal();
        });
    }
    
    // 대화 복사 버튼
    domElements.copyButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const dialogueText = e.target.closest('.dialogue-item').querySelector('p').textContent;
            copyToClipboard(dialogueText);
            showNotification('대화가 클립보드에 복사되었습니다.');
        });
    });
    
    // 맞춤 대화 버튼
    if (domElements.customDialogueBtn) {
        domElements.customDialogueBtn.addEventListener('click', () => {
            openCustomDialogueModal();
        });
    }
}

// 저장된 캐릭터 불러오기
function loadSavedCharacter() {
    const savedCharacter = localStorage.getItem('currentCharacter');
    if (savedCharacter) {
        appState.currentCharacter = JSON.parse(savedCharacter);
        displayCharacter(appState.currentCharacter);
    } else {
        showCharacterUploadPrompt();
    }
}

// 캐릭터 표시
function displayCharacter(character) {
    if (!domElements.characterContainer) return;
    
    // 이전 콘텐츠 지우기
    domElements.characterContainer.innerHTML = '';
    
    // 캐릭터 요소 생성 및 추가
    const characterElem = document.createElement('div');
    characterElem.classList.add('character');
    characterElem.innerHTML = `
        <img src="${character.imageUrl}" alt="${character.name}">
        <h3>${character.name}</h3>
    `;
    
    domElements.characterContainer.appendChild(characterElem);
    
    // AI 응답 얻기
    if (appState.isAIConnected) {
        getAIResponse('greeting', character);
    }
}

// 캐릭터 업로드 프롬프트 표시
function showCharacterUploadPrompt() {
    if (!domElements.characterContainer) return;
    
    domElements.characterContainer.innerHTML = `
        <div class="upload-prompt">
            <p>캐릭터를 업로드해주세요!</p>
            <p>좌측 하단의 캐릭터 업로드 버튼을 눌러주세요.</p>
        </div>
    `;
}

// 알림 표시
function showNotification(message) {
    const notification = document.createElement('div');
    notification.classList.add('notification');
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 2000);
    }, 10);
}

// 클립보드에 텍스트 복사
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).catch(err => {
        console.error('클립보드 복사 실패:', err);
    });
}

// 다른 모듈에서 접근할 수 있도록 전역 객체 생성
window.app = {
    state: appState,
    elements: domElements,
    displayCharacter,
    showNotification,
    copyToClipboard,
    showCharacterUploadPrompt
};
