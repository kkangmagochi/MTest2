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

// --- 이미지 처리 헬퍼 ---
async function processImageFile(file, maxWidth = 200, maxHeight = 200, quality = 0.7, maxSizeKB = 300) {
    return new Promise((resolve, reject) => {
        const fileSizeKB = file.size / 1024;
        console.log(`Original image size: ${fileSizeKB.toFixed(2)} KB`);

        const reader = new FileReader();

        reader.onload = (e) => {
            const originalDataUrl = e.target.result;

            // 300KB 이하이고 PNG가 아니거나, PNG여도 300KB 이하이면 원본 사용
            if (fileSizeKB <= maxSizeKB) {
                 console.log("Image is small enough or not PNG, using original.");
                 resolve(originalDataUrl); // 원본 Data URL 반환
                 return;
            }

             // 300KB 초과 시 리사이징 및 JPEG 변환
            console.log("Image size exceeds limit, resizing and converting to JPEG...");
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;
                const ratio = Math.min(maxWidth / width, maxHeight / height);

                width = Math.round(width * ratio);
                height = Math.round(height * ratio);

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // JPEG로 변환 및 압축
                const resizedDataUrl = canvas.toDataURL('image/jpeg', quality);
                const resizedSizeKB = resizedDataUrl.length * 0.75 / 1024; // Estimate base64 size
                console.log(`Resized image size (JPEG, quality ${quality}): ~${resizedSizeKB.toFixed(2)} KB`);
                resolve(resizedDataUrl);
            };
            img.onerror = (error) => {
                console.error("Image loading error for resizing:", error);
                reject(new Error("이미지 로딩 중 오류 발생"));
            };
            img.src = originalDataUrl; // 원본 Data URL 사용
        };
        reader.onerror = (error) => {
            console.error("FileReader error:", error);
            reject(new Error("파일 읽기 오류"));
        };
        reader.readAsDataURL(file); // 여기서 파일을 읽기 시작
    });
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

// 이미지 처리 (비동기)
processImageFile(file)
  .then(imageDataUrl => {
    console.log("Image processed successfully.");

    // 캐릭터 객체 생성
    const newCharacter = {
      name: name,
      image: imageDataUrl, // 처리된 이미지 데이터 사용
      profileImage: imageDataUrl, // 처리된 이미지 데이터 사용
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

    console.log("New character data created:", newCharacter);

    // 저장 시도 및 오류 처리
    try {
      addCharacter(newCharacter); // 상태에 추가 (여기서 saveStateToLocalStorage 호출됨)
      console.log("Character added to state and potentially saved.");

      // 성공 시 UI 업데이트
      renderSavedCharactersList();
      console.log("Saved characters list rendered.");
      setCurrentCharacter(newCharacter);
      console.log("Current character set.");
      displayCurrentCharacterUI();
      console.log("Main character UI displayed.");
      resetCharacterForm();
      showNotification(`${name} 캐릭터가 저장되었습니다!`, 3000);
      closeModal(DOMElements.characterModal);
      generateGreeting();

    } catch (error) {
      console.error("Error during character saving (likely storage full):", error);
      // QuotaExceededError 확인 (브라우저마다 에러 이름/코드가 다를 수 있음)
      if (error.name === 'QuotaExceededError' || error.code === 22 || error.message.toLowerCase().includes('quota')) {
         showNotification('저장 공간이 부족합니다. 기존 캐릭터를 삭제하거나 이미지를 더 압축해야 할 수 있습니다. 새로고침 후 다시 시도해주세요.', 5000);
         // 실패 시 추가된 캐릭터를 다시 제거 (선택적)
         // const chars = getCharacters();
         // const lastCharIndex = chars.findIndex(c => c.name === newCharacter.name && c.image === newCharacter.image);
         // if (lastCharIndex > -1) removeCharacterFromList(lastCharIndex);
      } else {
         showNotification("캐릭터 저장 중 오류가 발생했습니다.", 3000);
      }
    }
  })
  .catch(error => {
    console.error("Error processing image:", error);
    showNotification(`이미지 처리 중 오류 발생: ${error.message}`, 3000);
  });

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

// 이미지 처리 로직 분기
const processAndUpdate = (imageDataUrl) => {
  updatedCharacterData.image = imageDataUrl;
  // 프로필 이미지도 함께 업데이트할지 결정 (여기서는 함께 업데이트)
  if (!updatedCharacterData.profileImage || updatedCharacterData.profileImage === originalCharacter.image) {
      updatedCharacterData.profileImage = imageDataUrl;
  }

  try {
    finalizeCharacterUpdate(index, updatedCharacterData); // 여기서 저장 시도
  } catch (error) {
    console.error("Error during character update (likely storage full):", error);
    if (error.name === 'QuotaExceededError' || error.code === 22 || error.message.toLowerCase().includes('quota')) {
      showNotification('저장 공간 부족으로 캐릭터 업데이트에 실패했습니다. 기존 캐릭터를 삭제하거나 이미지를 더 압축해야 할 수 있습니다.', 5000);
      // 롤백은 복잡하므로 여기서는 알림만 표시
    } else {
      showNotification("캐릭터 업데이트 중 오류가 발생했습니다.", 3000);
    }
  }
  if (fileInput) fileInput.value = ''; // 입력 필드 초기화
};

// 새 이미지가 있는 경우 처리
if (fileInput && fileInput.files && fileInput.files.length > 0) {
  const file = fileInput.files[0];
  processImageFile(file)
    .then(imageDataUrl => {
      processAndUpdate(imageDataUrl); // 처리된 이미지로 업데이트
    })
    .catch(error => {
      console.error("Error processing new image for update:", error);
      showNotification(`새 이미지 처리 중 오류 발생: ${error.message}`, 3000);
    });
} else {
  // 이미지 변경 없이 업데이트 (오류 처리 포함)
  try {
    finalizeCharacterUpdate(index, updatedCharacterData);
  } catch (error) {
      console.error("Error during character update (without image change):", error);
      if (error.name === 'QuotaExceededError' || error.code === 22 || error.message.toLowerCase().includes('quota')) {
        showNotification('저장 공간 부족으로 캐릭터 업데이트에 실패했습니다. 기존 캐릭터를 삭제하거나 이미지를 더 압축해야 할 수 있습니다.', 5000);
      } else {
        showNotification("캐릭터 업데이트 중 오류가 발생했습니다.", 3000);
      }
  }
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

processImageFile(file) // 프로필 이미지도 동일하게 처리
  .then(newProfileImage => {
      // 메인 목록에서 캐릭터 찾아서 업데이트
      const characters = getCharacters();
      const index = characters.findIndex(char => char.name === currentCharacter.name);
      if (index !== -1) {
          const updatedCharacter = { ...characters[index], profileImage: newProfileImage };

          try {
              updateCharacterInList(index, updatedCharacter); // 여기서 저장 시도
              setCurrentCharacter(updatedCharacter); // 현재 캐릭터 상태도 업데이트

              // UI 즉시 업데이트
              if (DOMElements.profileImage) DOMElements.profileImage.src = newProfileImage;
              if (DOMElements.profilePreviewImg) DOMElements.profilePreviewImg.src = newProfileImage;

              showNotification('프로필 이미지가 업데이트되었습니다.', 3000);
          } catch (error) {
              console.error("Error updating profile image (likely storage full):", error);
              if (error.name === 'QuotaExceededError' || error.code === 22 || error.message.toLowerCase().includes('quota')) {
                  showNotification('저장 공간 부족으로 프로필 이미지 업데이트에 실패했습니다.', 5000);
              } else {
                  showNotification("프로필 이미지 업데이트 중 오류가 발생했습니다.", 3000);
              }
          }
      } else {
           showNotification('현재 캐릭터를 찾을 수 없습니다.', 3000);
      }
       if (fileInput) fileInput.value = ''; // 입력 필드 초기화
  })
  .catch(error => {
      console.error("Error processing profile image:", error);
      showNotification(`프로필 이미지 처리 중 오류 발생: ${error.message}`, 3000);
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
  const customGift = DOMElements.customGiftListInput?.value?.trim() || '';
  
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
