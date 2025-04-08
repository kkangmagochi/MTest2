// character.js - 캐릭터 로딩, 저장, 수정 관리

import { DOMElements, displayCurrentCharacterUI, renderFavoriteGifts, showNotification, showSpeechBubble } from './ui.js';
import {
  getCharacters,
  getCurrentCharacter,
  setCurrentCharacter,
  addCharacter,
  updateCharacterInList,
  removeCharacterFromList,
  incrementDaysCount,
  saveStateToLocalStorage
} from './state.js';
import { generateGreeting } from './api.js';

// --- 이미지 리사이징 및 변환 유틸리티 함수 ---
function resizeAndConvertImage(file, maxWidth, maxHeight, quality, callback) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const img = new Image();
        
        img.onload = function() {
            // 파일 크기 확인 (byte를 kb로 변환)
            const fileSizeKB = file.size / 1024;
            
            // 300kb 미만이면 원본 이미지 사용
            if (fileSizeKB < 300) {
                callback(e.target.result);
                return;
            }
            
            // 리사이징 필요
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // 원본 이미지 비율 유지하면서 크기 계산
            let width = img.width;
            let height = img.height;
            
            if (width > maxWidth) {
                height *= maxWidth / width;
                width = maxWidth;
            }
            
            if (height > maxHeight) {
                width *= maxHeight / height;
                height = maxHeight;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // 이미지 그리기
            ctx.drawImage(img, 0, 0, width, height);
            
            // JPEG 형식으로 변환하여 반환
            const jpegDataUrl = canvas.toDataURL('image/jpeg', quality);
            callback(jpegDataUrl);
        };
        
        img.src = e.target.result;
    };
    
    reader.onerror = function(error) {
        console.error("FileReader Error:", error);
        showNotification('이미지 파일을 읽는 중 오류가 발생했습니다.', 3000);
    };
    
    reader.readAsDataURL(file);
}


// --- 캐릭터 목록 관리 ---
export function renderSavedCharactersList() {
  const characters = getCharacters();
  DOMElements.savedCharactersList.innerHTML = '';
  
  characters.forEach((char, index) => {
    const characterCard = document.createElement('div');
    characterCard.className = 'character-card';
    characterCard.dataset.index = index;
    
    const img = document.createElement('img');
    img.src = char.image;
    img.alt = char.name;
    img.onerror = () => img.src = 'placeholder.png';
    
    const name = document.createElement('p');
    name.textContent = char.name;
    
    characterCard.appendChild(img);
    characterCard.appendChild(name);
    
    characterCard.addEventListener('click', () => {
      loadCharacterByIndex(index);
      closeModal(DOMElements.characterModal);
    });
    
    DOMElements.savedCharactersList.appendChild(characterCard);
  });
  
  populateEditCharacterSelect();
  populateDeleteCharacterSelect();
}

export function populateEditCharacterSelect() {
  const characters = getCharacters();
  if (!DOMElements.editCharacterSelect) return;
  
  DOMElements.editCharacterSelect.innerHTML = '';
  const defaultOption = document.createElement('option');
  defaultOption.value = "";
  defaultOption.textContent = "선택하세요";
  DOMElements.editCharacterSelect.appendChild(defaultOption);
  
  characters.forEach((char, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = char.name;
    DOMElements.editCharacterSelect.appendChild(option);
  });
  
  if (DOMElements.editCharacterForm) {
    DOMElements.editCharacterForm.style.display = 'none';
  }
}

export function populateDeleteCharacterSelect() {
  const characters = getCharacters();
  if (!DOMElements.deleteCharacterSelect) return;
  
  DOMElements.deleteCharacterSelect.innerHTML = '';
  const defaultOption = document.createElement('option');
  defaultOption.value = "";
  defaultOption.textContent = "선택하세요";
  DOMElements.deleteCharacterSelect.appendChild(defaultOption);
  
  characters.forEach((char, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = char.name;
    DOMElements.deleteCharacterSelect.appendChild(option);
  });
}

// --- 캐릭터 로딩 ---
export function loadCharacterByIndex(index) {
  const characters = getCharacters();
  if (index >= 0 && index < characters.length) {
    const characterToLoad = characters[index];
    setCurrentCharacter(characterToLoad);
    incrementDaysCount();
    displayCurrentCharacterUI();
    generateGreeting();
    console.log(`Character '${characterToLoad.name}' loaded.`);
  } else {
    console.error(`Invalid character index: ${index}`);
  }
}

// --- 캐릭터 저장 ---
export function handleSaveCharacter() {
  console.log("Attempting to save character...");
  
  // 폼 값 가져오기
  const name = DOMElements.characterNameInput?.value?.trim() || '';
  
  // setting 필드가 있는지 확인 (필수적이지 않도록 변경)
  let setting = '';
  if (DOMElements.characterSettingInput) {
    setting = DOMElements.characterSettingInput.value.trim();
  }
  
  const fileInput = DOMElements.characterImgInput;
  
  // 입력값 검증
  if (name === '') {
    showNotification('캐릭터 이름을 입력해주세요.', 3000);
    console.log("Save failed: Name missing.");
    return;
  }
  
  // setting 필드가 있을 경우에만 검증
  if (DOMElements.characterSettingInput && setting === '' && DOMElements.characterSettingInput.required) {
    showNotification('캐릭터 설정을 입력해주세요.', 3000);
    console.log("Save failed: Setting missing.");
    return;
  }
  
  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    showNotification('캐릭터 이미지를 선택해주세요.', 3000);
    console.log("Save failed: Image missing.");
    return;
  }
  
  const file = fileInput.files[0];
  const reader = new FileReader();
  
  reader.onerror = function(error) {
    showNotification('이미지 파일을 읽는 중 오류가 발생했습니다.', 3000);
    console.error("FileReader Error:", error);
  };
  
  reader.onload = function(e) {
    console.log("FileReader onload triggered.");
    
   // 파일 읽기 시작
try {
    // 이미지 리사이징 및 변환
    resizeAndConvertImage(file, 200, 200, 0.7, function(dataUrl) {
        console.log("Image processed.");
        try {
            // 캐릭터 객체 생성
            const newCharacter = {
                name: name,
                image: dataUrl,
                profileImage: dataUrl,
                type: DOMElements.characterTypeExisting?.checked ? 'existing' : 'original',
                setting: setting || '',
                userNickname: DOMElements.characterUserNicknameInput?.value?.trim() || '',
                genre: DOMElements.characterGenreInput?.value?.trim() || '',
                tone: DOMElements.characterToneInput?.value?.trim() || '',
                lore: DOMElements.characterLoreInput?.value?.trim() || '',
                personality: DOMElements.characterPersonalityInput?.value?.trim() || '',
                customDialog: '',
                customGift: ''
            };
            
            try {
                // 캐릭터를 상태에 추가
                addCharacter(newCharacter);
                saveStateToLocalStorage();
                
                // UI 업데이트
                renderSavedCharactersList();
                setCurrentCharacter(newCharacter);
                displayCurrentCharacterUI();
                
                // 폼 초기화 및 피드백
                resetCharacterForm();
                showNotification(`${name} 캐릭터가 저장되었습니다!`, 3000);
                closeModal(DOMElements.characterModal);
                
                // 새 캐릭터 인사말 생성
                generateGreeting();
            } catch (storageError) {
                console.error("Storage error:", storageError);
                showNotification("저장 공간이 부족합니다. 기존 캐릭터를 삭제하거나 이미지를 더 압축해야 할 수 있습니다. 새로고침 후 다시 시도해주세요.", 5000);
            }
        } catch (error) {
            console.error("Error during character saving process:", error);
            showNotification("캐릭터 저장 중 오류가 발생했습니다.", 3000);
        }
    });
} catch (error) {
    console.error("Error reading file:", error);
    showNotification("파일 읽기 오류가 발생했습니다.", 3000);
}


function resetCharacterForm() {
  // 모든 폼 필드 초기화
  if (DOMElements.characterNameInput) DOMElements.characterNameInput.value = '';
  if (DOMElements.characterImgInput) DOMElements.characterImgInput.value = '';
  if (DOMElements.characterSettingInput) DOMElements.characterSettingInput.value = '';
  if (DOMElements.characterUserNicknameInput) DOMElements.characterUserNicknameInput.value = '';
  if (DOMElements.characterGenreInput) DOMElements.characterGenreInput.value = '';
  if (DOMElements.characterToneInput) DOMElements.characterToneInput.value = '';
  if (DOMElements.characterLoreInput) DOMElements.characterLoreInput.value = '';
  if (DOMElements.characterPersonalityInput) DOMElements.characterPersonalityInput.value = '';
  
  // 라디오 버튼 초기화
  if (DOMElements.characterTypeExisting) DOMElements.characterTypeExisting.checked = true;
  
  // 접을 수 있는 섹션 초기화
  const customToggle = document.getElementById('character-custom-toggle');
  if (customToggle) customToggle.checked = false;
}

// --- 캐릭터 수정 ---
export function handleEditCharacterSelection() {
  if (!DOMElements.editCharacterSelect || !DOMElements.editCharacterForm) return;
  
  const selectedIndex = DOMElements.editCharacterSelect.value;
  const characters = getCharacters();
  
  if (selectedIndex === "" || !characters[selectedIndex]) {
    DOMElements.editCharacterForm.style.display = 'none';
    return;
  }
  
  const index = parseInt(selectedIndex);
  const charToEdit = characters[index];
  
  // 수정 폼 채우기
  if (DOMElements.editCharacterNameInput) 
    DOMElements.editCharacterNameInput.value = charToEdit.name;
  
  if (DOMElements.currentCharacterImg) 
    DOMElements.currentCharacterImg.src = charToEdit.image;
  
  // setting 필드가 있으면 채우기
  if (DOMElements.editCharacterSettingInput)
    DOMElements.editCharacterSettingInput.value = charToEdit.setting || '';
  
  // 사용자 호칭 필드 채우기
if (DOMElements.editCharacterUserNicknameInput)
    DOMElements.editCharacterUserNicknameInput.value = charToEdit.userNickname || '';
  
  // 캐릭터 타입 라디오 버튼 설정
  if (charToEdit.type === 'original') {
    if (DOMElements.editCharacterTypeOriginal)
      DOMElements.editCharacterTypeOriginal.checked = true;
  } else {
    if (DOMElements.editCharacterTypeExisting)
      DOMElements.editCharacterTypeExisting.checked = true;
  }
  
  // 상세 필드 채우기
  if (DOMElements.editCharacterGenreInput)
    DOMElements.editCharacterGenreInput.value = charToEdit.genre || '';
  
  if (DOMElements.editCharacterToneInput)
    DOMElements.editCharacterToneInput.value = charToEdit.tone || '';
  
  if (DOMElements.editCharacterLoreInput)
    DOMElements.editCharacterLoreInput.value = charToEdit.lore || '';
  
  if (DOMElements.editCharacterPersonalityInput)
    DOMElements.editCharacterPersonalityInput.value = charToEdit.personality || '';
  
  // 폼 표시
  DOMElements.editCharacterForm.style.display = 'block';
  
  // 접을 수 있는 섹션 상태 설정
  const editCustomToggle = document.getElementById('edit-character-custom-toggle');
  if (editCustomToggle) {
    editCustomToggle.checked = !!(charToEdit.genre || charToEdit.tone || 
                                charToEdit.lore || charToEdit.personality || 
                                charToEdit.speechStyle);
  }
}

export function handleUpdateCharacter() {
  if (!DOMElements.editCharacterSelect) return;
  
  const selectedIndex = DOMElements.editCharacterSelect.value;
  if (selectedIndex === "") {
    showNotification('수정할 캐릭터를 선택해주세요.', 3000);
    return;
  }
  
  const index = parseInt(selectedIndex);
  const characters = getCharacters();
  const originalCharacter = characters[index];
  
  const name = DOMElements.editCharacterNameInput?.value?.trim() || '';
  
  // setting 필드가 있는지 확인
  let setting = '';
  if (DOMElements.editCharacterSettingInput) {
    setting = DOMElements.editCharacterSettingInput.value.trim();
  }
  
  // 필수 필드 검증
  if (name === '') {
    showNotification('캐릭터 이름은 필수입니다.', 3000);
    return;
  }
  
  // setting 필드가 있고 필수인 경우만 검증
  if (DOMElements.editCharacterSettingInput && setting === '' && 
      DOMElements.editCharacterSettingInput.required) {
    showNotification('캐릭터 설정은 필수입니다.', 3000);
    return;
  }
  
  // 업데이트된 캐릭터 데이터 생성
const updatedCharacterData = {
  ...originalCharacter,
  name: name,
  // DOMElements가 존재하면 입력된 값 그대로 사용(빈 값도 그대로 적용)
  setting: DOMElements.editCharacterSettingInput ? setting : (originalCharacter.setting || ''),
  userNickname: DOMElements.editCharacterUserNicknameInput ? DOMElements.editCharacterUserNicknameInput.value.trim() : (originalCharacter.userNickname || ''),
  type: DOMElements.editCharacterTypeOriginal?.checked ? 'original' : 'existing',
  // 상세 필드도 마찬가지로 수정
  genre: DOMElements.editCharacterGenreInput ? DOMElements.editCharacterGenreInput.value.trim() : (originalCharacter.genre || ''),
  tone: DOMElements.editCharacterToneInput ? DOMElements.editCharacterToneInput.value.trim() : (originalCharacter.tone || ''),
  lore: DOMElements.editCharacterLoreInput ? DOMElements.editCharacterLoreInput.value.trim() : (originalCharacter.lore || ''),
  personality: DOMElements.editCharacterPersonalityInput ? DOMElements.editCharacterPersonalityInput.value.trim() : (originalCharacter.personality || ''),
};
  
// 새 이미지 파일 선택 여부 확인
const fileInput = DOMElements.editCharacterImgInput;
if (fileInput && fileInput.files && fileInput.files.length > 0) {
    const file = fileInput.files[0];
    
    // 이미지 리사이징 및 변환
    resizeAndConvertImage(file, 200, 200, 0.7, function(dataUrl) {
        updatedCharacterData.image = dataUrl;
        try {
            finalizeCharacterUpdate(index, updatedCharacterData);
            if (fileInput) fileInput.value = '';
        } catch (storageError) {
            console.error("Storage error:", storageError);
            showNotification("저장 공간이 부족합니다. 기존 캐릭터를 삭제하거나 이미지를 더 압축해야 할 수 있습니다. 새로고침 후 다시 시도해주세요.", 5000);
        }
    });
} else {
    // 이미지 변경 없이 업데이트
    try {
        finalizeCharacterUpdate(index, updatedCharacterData);
    } catch (storageError) {
        console.error("Storage error:", storageError);
        showNotification("저장 공간이 부족합니다. 기존 캐릭터를 삭제하거나 이미지를 더 압축해야 할 수 있습니다. 새로고침 후 다시 시도해주세요.", 5000);
    }
}

function finalizeCharacterUpdate(index, updatedCharacter) {
  const currentCharacter = getCurrentCharacter();
  const originalName = getCharacters()[index].name;
  
  updateCharacterInList(index, updatedCharacter);
  
  // 현재 활성화된 캐릭터가 수정된 경우 상태 업데이트
  if (currentCharacter && currentCharacter.name === originalName) {
    setCurrentCharacter(updatedCharacter);
    displayCurrentCharacterUI();
  }
  
  renderSavedCharactersList();
  closeModal(DOMElements.editCharacterModal);
  showNotification(`${updatedCharacter.name} 캐릭터 정보가 수정되었습니다.`, 3000);
  
  if (DOMElements.editCharacterForm)
    DOMElements.editCharacterForm.style.display = 'none';
  
  if (DOMElements.editCharacterSelect)
    DOMElements.editCharacterSelect.value = "";
}

// --- 캐릭터 삭제 ---
export function handleDeleteCharacter() {
  if (!DOMElements.deleteCharacterSelect) return;
  
  const selectedIndex = DOMElements.deleteCharacterSelect.value;
  if (selectedIndex === "") {
    showNotification('삭제할 캐릭터를 선택해주세요.', 3000);
    return;
  }
  
  const index = parseInt(selectedIndex);
  const characters = getCharacters();
  const characterToDelete = characters[index];
  const currentCharacter = getCurrentCharacter();
  
  // 상태에서 캐릭터 제거
  removeCharacterFromList(index);
  
  // 삭제된 캐릭터가 현재 캐릭터인 경우, 현재 캐릭터 해제
  if (currentCharacter && currentCharacter.name === characterToDelete.name) {
    setCurrentCharacter(null);
    displayCurrentCharacterUI();
  }
  
  // UI 업데이트
  renderSavedCharactersList();
  populateEditCharacterSelect();
  populateDeleteCharacterSelect();
  
  closeModal(DOMElements.deleteCharacterModal);
  showNotification(`${characterToDelete.name} 캐릭터가 삭제되었습니다.`, 3000);
  
  if (DOMElements.deleteCharacterSelect)
    DOMElements.deleteCharacterSelect.value = "";
}

// --- 모달 관련 ---
export function closeModal(modalElement) {
  if (modalElement) {
    modalElement.style.display = 'none';
  }
}

// --- 캐릭터 모듈 초기화 ---
export function initCharacter() {
  // 이벤트 리스너 등록
  if (DOMElements.saveCharacterBtn)
    DOMElements.saveCharacterBtn.addEventListener('click', handleSaveCharacter);
  
  if (DOMElements.editCharacterSelect)
    DOMElements.editCharacterSelect.addEventListener('change', handleEditCharacterSelection);
  
  if (DOMElements.updateCharacterBtn)
    DOMElements.updateCharacterBtn.addEventListener('click', handleUpdateCharacter);
  
  if (DOMElements.confirmDeleteBtn)
    DOMElements.confirmDeleteBtn.addEventListener('click', handleDeleteCharacter);
  
  if (DOMElements.saveProfileBtn)
    DOMElements.saveProfileBtn.addEventListener('click', handleProfileImageUpload);
  
  if (DOMElements.saveSettingsBtn)
    DOMElements.saveSettingsBtn.addEventListener('click', handleSaveSettings);
  
  // 저장된 캐릭터 목록 초기 렌더링
  renderSavedCharactersList();
}

// --- 프로필 설정 ---
export function handleProfileImageUpload() {
    const currentCharacter = getCurrentCharacter();
    if (!currentCharacter) {
        showNotification('프로필을 설정할 캐릭터를 선택해주세요.', 3000);
        return;
    }

    const fileInput = DOMElements.profileImgInput;
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        showNotification('업로드할 이미지 파일을 선택해주세요.', 3000);
        return;
    }

    const file = fileInput.files[0];
    
    // 이미지 리사이징 및 변환
    resizeAndConvertImage(file, 200, 200, 0.7, function(dataUrl) {
        const newProfileImage = dataUrl;
        
        try {
            // 메인 목록에서 캐릭터 찾아서 업데이트
            const characters = getCharacters();
            const index = characters.findIndex(char => char.name === currentCharacter.name);
            if (index !== -1) {
                const updatedCharacter = { ...characters[index], profileImage: newProfileImage };
                updateCharacterInList(index, updatedCharacter);
                // 현재 캐릭터 상태도 업데이트
                setCurrentCharacter(updatedCharacter);
                // UI 즉시 업데이트
                if (DOMElements.profileImage)
                    DOMElements.profileImage.src = newProfileImage;
                if (DOMElements.profilePreviewImg)
                    DOMElements.profilePreviewImg.src = newProfileImage;
                showNotification('프로필 이미지가 업데이트되었습니다.', 3000);
            }
        } catch (storageError) {
            console.error("Storage error:", storageError);
            showNotification("저장 공간이 부족합니다. 기존 캐릭터를 삭제하거나 이미지를 더 압축해야 할 수 있습니다. 새로고침 후 다시 시도해주세요.", 5000);
        }
        
        if (fileInput) fileInput.value = '';
    });
}

// --- 설정 저장 ---
export function handleSaveSettings() {
  const currentCharacter = getCurrentCharacter();
  if (!currentCharacter) {
    showNotification('설정을 저장할 캐릭터를 선택해주세요.', 3000);
    return;
  }
  
  const customDialog = DOMElements.customDialogInput?.value?.trim() || '';
  const customGift = DOMElements.customGiftListInput?.value?.trim() || 
                    DOMElements.customGiftList?.value?.trim() || '';
  
  // 메인 목록에서 캐릭터 찾아서 업데이트
  const characters = getCharacters();
  const index = characters.findIndex(char => char.name === currentCharacter.name);
  if (index !== -1) {
    const updatedCharacter = { ...characters[index], customDialog, customGift };
    updateCharacterInList(index, updatedCharacter);
    
    // 현재 캐릭터 상태 업데이트
    setCurrentCharacter(updatedCharacter);
    renderFavoriteGifts();
saveStateToLocalStorage();
    
    closeModal(DOMElements.settingsModal);
    showNotification('설정이 저장되었습니다.', 3000);
    
    // 말풍선 확인 메시지 표시
    if (typeof showSpeechBubble === 'function') {
      showSpeechBubble('설정이 저장되었어요!');
    }
  } else {
    showNotification('현재 캐릭터를 찾을 수 없습니다.', 3000);
  }
}
