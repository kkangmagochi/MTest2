// main.js - 메인 기능과 UI 관리

document.addEventListener('DOMContentLoaded', function() {
    // 전역 변수
    let currentCharacter = null;
    const characterList = [];

    // 초기화 함수
    function init() {
        setupEventListeners();
        setupMenus();
        checkLocalStorage();
    }

    // 이벤트 리스너 설정
    function setupEventListeners() {
        // 캐릭터 업로드 버튼 이벤트
        const uploadBtn = document.querySelector('.character-upload-btn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', openCharacterUpload);
        }
        
        // 메뉴 버튼 이벤트들
        const menuButtons = document.querySelectorAll('.menu-button');
        menuButtons.forEach(button => {
            button.addEventListener('click', function() {
                openMenu(this.dataset.menu);
            });
        });
        
        // 팝업 닫기 버튼
        document.querySelectorAll('.close-popup').forEach(btn => {
            btn.addEventListener('click', closePopup);
        });
        
        // 복사 버튼
        document.querySelectorAll('.copy-button').forEach(btn => {
            btn.addEventListener('click', copyDialogue);
        });
        
        // 삭제 확인 버튼
        const deleteConfirmBtn = document.querySelector('.delete-confirm-btn');
        if (deleteConfirmBtn) {
            deleteConfirmBtn.addEventListener('click', deleteCharacter);
        }
    }
    
    // 메뉴 설정
    function setupMenus() {
        // 메뉴 동적 생성 및 설정
        createMenu('aiSettings', 'API 설정', 'api-settings-content');
        createMenu('characters', '캐릭터 관리', 'character-management-content');
        createMenu('settings', '환경설정', 'settings-content');
    }
    
    // 메뉴 생성 함수
    function createMenu(id, title, contentId) {
        const menuContainer = document.querySelector('.menu-container');
        if (!menuContainer) return;
        
        const menuButton = document.createElement('button');
        menuButton.classList.add('menu-button');
        menuButton.dataset.menu = id;
        menuButton.textContent = title;
        menuContainer.appendChild(menuButton);
        
        // 해당 메뉴의 팝업 콘텐츠 생성
        createPopup(id, title, contentId);
    }
    
    // 팝업 생성 함수
    function createPopup(id, title, contentId) {
        const popupContainer = document.querySelector('.popup-container') || createPopupContainer();
        
        const popup = document.createElement('div');
        popup.id = id + 'Popup';
        popup.classList.add('popup');
        popup.style.display = 'none';
        
        const popupHeader = document.createElement('div');
        popupHeader.classList.add('popup-header');
        
        const popupTitle = document.createElement('h2');
        popupTitle.textContent = title;
        
        const closeButton = document.createElement('button');
        closeButton.classList.add('close-popup');
        closeButton.textContent = '×';
        closeButton.addEventListener('click', closePopup);
        
        const popupContent = document.createElement('div');
        popupContent.id = contentId;
        popupContent.classList.add('popup-content');
        
        popupHeader.appendChild(popupTitle);
        popupHeader.appendChild(closeButton);
        
        popup.appendChild(popupHeader);
        popup.appendChild(popupContent);
        
        popupContainer.appendChild(popup);
    }
    
    // 팝업 컨테이너 생성
    function createPopupContainer() {
        const container = document.createElement('div');
        container.classList.add('popup-container');
        document.body.appendChild(container);
        return container;
    }
    
    // 로컬 스토리지 확인
    function checkLocalStorage() {
        const savedCharacters = localStorage.getItem('characters');
        if (savedCharacters) {
            try {
                const parsed = JSON.parse(savedCharacters);
                parsed.forEach(char => characterList.push(char));
                
                if (characterList.length > 0) {
                    currentCharacter = characterList[0];
                    updateCharacterDisplay();
                }
            } catch (e) {
                console.error('저장된 캐릭터 정보를 불러오는데 실패했습니다.', e);
            }
        }
    }
    
    // 메뉴 열기
    function openMenu(menuId) {
        const popup = document.getElementById(menuId + 'Popup');
        if (popup) {
            // 모든 팝업 닫기
            document.querySelectorAll('.popup').forEach(p => {
                p.style.display = 'none';
            });
            
            // 선택된 팝업 열기
            popup.style.display = 'block';
            
            // API 설정 메뉴인 경우 API 테스트 UI 초기화
            if (menuId === 'aiSettings') {
                initApiSettings();
            }
        }
    }
    
    // API 설정 초기화
    function initApiSettings() {
        const container = document.getElementById('api-settings-content');
        if (!container) return;
        
        container.innerHTML = '';
        
        const apiKeyInput = document.createElement('div');
        apiKeyInput.innerHTML = `
            <label for="geminiApiKey">Gemini API 키:</label>
            <input type="text" id="geminiApiKey" placeholder="API 키를 입력하세요">
            <button id="saveApiKey">저장</button>
        `;
        
        const apiTest = document.createElement('div');
        apiTest.innerHTML = `
            <h3>API 테스트</h3>
            <button id="testApiConnection">연결 테스트</button>
            <div id="apiTestResult"></div>
        `;
        
        container.appendChild(apiKeyInput);
        container.appendChild(apiTest);
        
        // 이벤트 리스너 추가
        document.getElementById('saveApiKey').addEventListener('click', saveApiKey);
        document.getElementById('testApiConnection').addEventListener('click', testApiConnection);
    }
    
    // API 키 저장
    function saveApiKey() {
        const apiKey = document.getElementById('geminiApiKey').value.trim();
        if (apiKey) {
            localStorage.setItem('geminiApiKey', apiKey);
            alert('API 키가 저장되었습니다.');
        } else {
            alert('유효한 API 키를 입력해주세요.');
        }
    }
    
    // API 연결 테스트
    function testApiConnection() {
        const resultElement = document.getElementById('apiTestResult');
        resultElement.textContent = 'API 연결 테스트 중...';
        
        // AI.js의 testConnection 함수 호출
        if (typeof AI !== 'undefined' && AI.testConnection) {
            AI.testConnection()
                .then(result => {
                    resultElement.textContent = '연결 성공: ' + result;
                    resultElement.style.color = 'green';
                })
                .catch(error => {
                    resultElement.textContent = '연결 실패: ' + error.message;
                    resultElement.style.color = 'red';
                });
        } else {
            resultElement.textContent = 'AI 모듈이 로드되지 않았습니다.';
            resultElement.style.color = 'red';
        }
    }
    
    // 캐릭터 업로드 창 열기
    function openCharacterUpload() {
        // 파일 선택 창 열기 구현
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = handleCharacterUpload;
        input.click();
    }
    
    // 캐릭터 업로드 처리
    function handleCharacterUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const character = {
                id: Date.now(),
                name: file.name.split('.')[0],
                image: e.target.result,
                level: 1,
                exp: 0,
                conversations: []
            };
            
            characterList.push(character);
            currentCharacter = character;
            
            // 로컬 스토리지에 저장
            localStorage.setItem('characters', JSON.stringify(characterList));
            
            // 화면 업데이트
            updateCharacterDisplay();
        };
        reader.readAsDataURL(file);
    }
    
    // 캐릭터 삭제
    function deleteCharacter() {
        if (!currentCharacter) return;
        
        const index = characterList.findIndex(char => char.id === currentCharacter.id);
        if (index !== -1) {
            characterList.splice(index, 1);
            
            // 로컬 스토리지 업데이트
            localStorage.setItem('characters', JSON.stringify(characterList));
            
            // 현재 캐릭터 업데이트
            currentCharacter = characterList.length > 0 ? characterList[0] : null;
            
            // 화면 업데이트
            updateCharacterDisplay();
            
            // 삭제 확인 팝업 닫기
            closePopup();
        }
    }
    
    // 대화 복사
    function copyDialogue(event) {
        const dialogueText = event.target.closest('.dialogue-item').querySelector('.dialogue-text').textContent;
        
        navigator.clipboard.writeText(dialogueText)
            .then(() => {
                alert('대화가 클립보드에 복사되었습니다.');
            })
            .catch(err => {
                console.error('클립보드 복사 실패:', err);
                alert('클립보드 복사에 실패했습니다.');
            });
    }
    
    // 캐릭터 디스플레이 업데이트
    function updateCharacterDisplay() {
        const characterContainer = document.querySelector('.character-container');
        if (!characterContainer) return;
        
        if (currentCharacter) {
            characterContainer.innerHTML = `
                <div class="character">
                    <img src="${currentCharacter.image}" alt="${currentCharacter.name}">
                    <div class="character-info">
                        <h2>${currentCharacter.name}</h2>
                        <p>레벨: ${currentCharacter.level}</p>
                        <p>경험치: ${currentCharacter.exp}</p>
                    </div>
                    <button class="character-action-btn chat-btn">대화하기</button>
                    <button class="character-action-btn delete-btn">삭제하기</button>
                </div>
            `;
            
            // 새 이벤트 리스너 추가
            characterContainer.querySelector('.chat-btn').addEventListener('click', startChat);
            characterContainer.querySelector('.delete-btn').addEventListener('click', confirmDelete);
        } else {
            characterContainer.innerHTML = `
                <div class="no-character">
                    <p>캐릭터를 업로드해주세요!</p>
                    <button class="character-upload-btn">캐릭터 업로드</button>
                </div>
            `;
            
            characterContainer.querySelector('.character-upload-btn').addEventListener('click', openCharacterUpload);
        }
    }
    
    // 대화 시작
    function startChat() {
        if (!currentCharacter) return;
        
        // AI.js의 대화 기능 호출
        if (typeof AI !== 'undefined' && AI.startConversation) {
            AI.startConversation(currentCharacter)
                .then(response => {
                    // 대화 내용을 캐릭터에 추가
                    if (!currentCharacter.conversations) {
                        currentCharacter.conversations = [];
                    }
                    
                    currentCharacter.conversations.push({
                        timestamp: new Date().toISOString(),
                        text: response
                    });
                    
                    // 경험치 증가
                    currentCharacter.exp += 10;
                    if (currentCharacter.exp >= 100) {
                        currentCharacter.level += 1;
                        currentCharacter.exp = 0;
                    }
                    
                    // 로컬 스토리지 업데이트
                    localStorage.setItem('characters', JSON.stringify(characterList));
                    
                    // 화면 업데이트
                    updateCharacterDisplay();
                    displayConversation(response);
                })
                .catch(error => {
                    console.error('대화 오류:', error);
                    alert('대화 생성에 실패했습니다.');
                });
        } else {
            alert('AI 모듈이 로드되지 않았습니다.');
        }
    }
    
    // 대화 표시
    function displayConversation(text) {
        const conversationContainer = document.querySelector('.conversation-container') || createConversationContainer();
        
        const dialogue = document.createElement('div');
        dialogue.classList.add('dialogue-item');
        
        dialogue.innerHTML = `
            <div class="dialogue-text">${text}</div>
            <button class="copy-button">복사</button>
            <button class="save-button">저장</button>
        `;
        
        conversationContainer.appendChild(dialogue);
        
        // 이벤트 리스너 추가
        dialogue.querySelector('.copy-button').addEventListener('click', copyDialogue);
        dialogue.querySelector('.save-button').addEventListener('click', saveCustomDialogue);
    }
    
    // 대화 컨테이너 생성
    function createConversationContainer() {
        const container = document.createElement('div');
        container.classList.add('conversation-container');
        document.body.appendChild(container);
        return container;
    }
    
    // 삭제 확인
    function confirmDelete() {
        const popup = document.createElement('div');
        popup.classList.add('confirm-popup');
        popup.innerHTML = `
            <div class="confirm-content">
                <p>정말로 선택한 캐릭터를 삭제하시겠습니까?</p>
                <p>이 작업은 되돌릴 수 없습니다.</p>
                <div class="confirm-buttons">
                    <button class="delete-confirm-btn">삭제</button>
                    <button class="delete-cancel-btn">취소</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(popup);
        
        // 이벤트 리스너 추가
        popup.querySelector('.delete-confirm-btn').addEventListener('click', function() {
            deleteCharacter();
            document.body.removeChild(popup);
        });
        
        popup.querySelector('.delete-cancel-btn').addEventListener('click', function() {
            document.body.removeChild(popup);
        });
    }
    
    // 사용자 지정 대화 저장
    function saveCustomDialogue(event) {
        const dialogueText = event.target.closest('.dialogue-item').querySelector('.dialogue-text').textContent;
        
        let customDialogues = JSON.parse(localStorage.getItem('customDialogues') || '[]');
        customDialogues.push(dialogueText);
        localStorage.setItem('customDialogues', JSON.stringify(customDialogues));
        
        alert('대화가 맞춤 대화에 저장되었습니다.');
    }
    
    // 팝업 닫기
    function closePopup() {
        document.querySelectorAll('.popup').forEach(popup => {
            popup.style.display = 'none';
        });
    }

    // 초기화 함수 호출
    init();

    // 외부 접근을 위한 공개 API
    window.AppMain = {
        getCurrentCharacter: function() {
            return currentCharacter;
        },
        updateCharacter: function(updatedCharacter) {
            if (!updatedCharacter || !updatedCharacter.id) return;
            
            const index = characterList.findIndex(char => char.id === updatedCharacter.id);
            if (index !== -1) {
                characterList[index] = updatedCharacter;
                
                if (currentCharacter && currentCharacter.id === updatedCharacter.id) {
                    currentCharacter = updatedCharacter;
                }
                
                localStorage.setItem('characters', JSON.stringify(characterList));
                updateCharacterDisplay();
            }
        }
    };
});
