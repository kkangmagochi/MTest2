// character.js - Manages character loading, saving, editing
import { DOMElements, displayCurrentCharacterUI, renderFavoriteGifts, showNotification } from './ui.js';
import {
    getCharacters,
    getCurrentCharacter,
    setCurrentCharacter,
    setCharacters,
    addCharacter,
    updateCharacterInList,
    removeCharacterFromList,
    incrementDaysCount,
    setStats,
    getCharacterStats,
    getAllCharacterStats,
    saveStateToLocalStorage
} from './state.js';
import { generateGreeting } from './api.js'; // Import greeting generation

// --- Character List Management ---

export function renderSavedCharactersList() {
    const characters = getCharacters();
    DOMElements.savedCharactersList.innerHTML = ''; // Clear list

    characters.forEach((char, index) => {
        const characterCard = document.createElement('div');
        characterCard.className = 'character-card';
        characterCard.dataset.index = index; // Store index

        const img = document.createElement('img');
        img.src = char.image;
        img.alt = char.name;
        img.onerror = () => img.src = 'placeholder.png'; // Basic error handling

        const name = document.createElement('p');
        name.textContent = char.name;

        characterCard.appendChild(img);
        characterCard.appendChild(name);

        characterCard.addEventListener('click', () => {
            loadCharacterByIndex(index);
            closeModal(DOMElements.characterModal); // Close modal on selection
        });

        DOMElements.savedCharactersList.appendChild(characterCard);
    });

    populateEditCharacterSelect();
    populateDeleteCharacterSelect();
}

export function populateEditCharacterSelect() {
    const characters = getCharacters();
    DOMElements.editCharacterSelect.innerHTML = '<option value="">선택하세요</option>'; // Reset dropdown

    characters.forEach((char, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = char.name;
        DOMElements.editCharacterSelect.appendChild(option);
    });
     DOMElements.editCharacterForm.style.display = 'none'; // Hide form initially
}


export function populateDeleteCharacterSelect() {
    const characters = getCharacters();
    DOMElements.deleteCharacterSelect.innerHTML = '<option value="">선택하세요</option>'; // Reset dropdown

    characters.forEach((char, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = char.name;
        DOMElements.deleteCharacterSelect.appendChild(option);
    });
}

// --- Character Loading ---

export function loadCharacterByIndex(index) {
    const characters = getCharacters();
    if (index >= 0 && index < characters.length) {
        const characterToLoad = characters[index];
        setCurrentCharacter(characterToLoad); // This updates state and stats
        incrementDaysCount(); // Increment days when a character is loaded
        displayCurrentCharacterUI();
        generateGreeting(); // Generate greeting for the loaded character
        console.log(`Character '${characterToLoad.name}' loaded.`);
    } else {
        console.error(`Invalid character index: ${index}`);
    }
}

// --- Character Saving ---

function handleSaveCharacter() {
    const name = DOMElements.characterNameInput.value.trim();
    const setting = DOMElements.characterSettingInput.value.trim(); // Get setting
    const fileInput = DOMElements.characterImgInput;

    if (name === '' || !fileInput.files || fileInput.files.length === 0) {
        showNotification('캐릭터 이름, 설정, 이미지를 모두 입력해주세요.', 3000);
        return;
    }
     if (setting === '') { // Check if setting is empty
        showNotification('캐릭터 설정을 입력해주세요.', 3000);
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        const newCharacter = {
            name: name,
            image: e.target.result,
            profileImage: e.target.result, // Default profile image to main image
            type: DOMElements.characterTypeExisting.checked ? 'existing' : 'original',
            setting: setting, // Save setting
            // Detailed fields
            genre: DOMElements.characterGenreInput.value.trim(),
            tone: DOMElements.characterToneInput.value.trim(),
            lore: DOMElements.characterLoreInput.value.trim(),
            personality: DOMElements.characterPersonalityInput.value.trim(),
            speechStyle: DOMElements.characterSpeechStyleInput.value.trim(),
            customDialog: '', // Initialize empty
            customGift: ''      // Initialize empty
        };

        addCharacter(newCharacter); // Add to state
        renderSavedCharactersList(); // Update UI list
        setCurrentCharacter(newCharacter); // Set as current character
        displayCurrentCharacterUI();
        resetCharacterForm();
        showNotification(`${name} 캐릭터가 저장되었습니다!`, 3000);
        closeModal(DOMElements.characterModal);
         generateGreeting(); // Generate greeting for the new character
    };

    reader.onerror = function() {
        showNotification('이미지 파일을 읽는 중 오류가 발생했습니다.', 3000);
    }

    reader.readAsDataURL(file);
}

function resetCharacterForm() {
    DOMElements.characterNameInput.value = '';
    DOMElements.characterImgInput.value = ''; // Clear file input
    DOMElements.characterSettingInput.value = '';
    DOMElements.characterGenreInput.value = '';
    DOMElements.characterToneInput.value = '';
    DOMElements.characterLoreInput.value = '';
    DOMElements.characterPersonalityInput.value = '';
    DOMElements.characterSpeechStyleInput.value = '';
    DOMElements.characterTypeExisting.checked = true; // Reset radio button
     // Reset collapsible section if needed
    const customToggle = document.getElementById('character-custom-toggle');
    if (customToggle) customToggle.checked = false;
}

// --- Character Editing ---

function handleEditCharacterSelection() {
    const selectedIndex = DOMElements.editCharacterSelect.value;
    const characters = getCharacters();

    if (selectedIndex === "" || !characters[selectedIndex]) {
        DOMElements.editCharacterForm.style.display = 'none';
        return;
    }

    const index = parseInt(selectedIndex);
    const charToEdit = characters[index];

    // Populate the edit form
    DOMElements.editCharacterNameInput.value = charToEdit.name;
    DOMElements.currentCharacterImg.src = charToEdit.image;
    DOMElements.editCharacterSettingInput.value = charToEdit.setting || ''; // Populate setting

    if (charToEdit.type === 'original') {
        DOMElements.editCharacterTypeOriginal.checked = true;
    } else {
        DOMElements.editCharacterTypeExisting.checked = true;
    }
    // Populate detailed fields
    DOMElements.editCharacterGenreInput.value = charToEdit.genre || '';
    DOMElements.editCharacterToneInput.value = charToEdit.tone || '';
    DOMElements.editCharacterLoreInput.value = charToEdit.lore || '';
    DOMElements.editCharacterPersonalityInput.value = charToEdit.personality || '';
    DOMElements.editCharacterSpeechStyleInput.value = charToEdit.speechStyle || '';

    // Show the form
    DOMElements.editCharacterForm.style.display = 'block';
     // Ensure collapsible section is closed initially or based on content
    const editCustomToggle = document.getElementById('edit-character-custom-toggle');
     if (editCustomToggle) {
        editCustomToggle.checked = !!(charToEdit.genre || charToEdit.tone || charToEdit.lore || charToEdit.personality || charToEdit.speechStyle);
     }
}

function handleUpdateCharacter() {
    const selectedIndex = DOMElements.editCharacterSelect.value;
    if (selectedIndex === "") {
        showNotification('수정할 캐릭터를 선택해주세요.', 3000);
        return;
    }

    const index = parseInt(selectedIndex);
    const characters = getCharacters();
    const originalCharacter = characters[index];

    const name = DOMElements.editCharacterNameInput.value.trim();
    const setting = DOMElements.editCharacterSettingInput.value.trim(); // Get setting

    if (name === '') {
        showNotification('캐릭터 이름은 필수입니다.', 3000);
        return;
    }
    if (setting === '') {
         showNotification('캐릭터 설정은 필수입니다.', 3000);
        return;
    }


    const updatedCharacterData = {
        ...originalCharacter, // Keep existing customDialog, customGift, profileImage etc.
        name: name,
        setting: setting, // Update setting
        type: DOMElements.editCharacterTypeOriginal.checked ? 'original' : 'existing',
         // Update detailed fields
        genre: DOMElements.editCharacterGenreInput.value.trim(),
        tone: DOMElements.editCharacterToneInput.value.trim(),
        lore: DOMElements.editCharacterLoreInput.value.trim(),
        personality: DOMElements.editCharacterPersonalityInput.value.trim(),
        speechStyle: DOMElements.editCharacterSpeechStyleInput.value.trim()
    };

    const fileInput = DOMElements.editCharacterImgInput;

    // Check if a new image file was selected
    if (fileInput.files && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const reader = new FileReader();

        reader.onload = function(e) {
            updatedCharacterData.image = e.target.result;
            // Optionally update profile image if main image changes? Decide on behavior.
            // updatedCharacterData.profileImage = e.target.result;
            finalizeCharacterUpdate(index, updatedCharacterData);
             fileInput.value = ''; // Clear file input after successful read
        };

        reader.onerror = function() {
            showNotification('새 이미지를 읽는 중 오류가 발생했습니다.', 3000);
        }
        reader.readAsDataURL(file);
    } else {
        // No new image, update with existing image data
        finalizeCharacterUpdate(index, updatedCharacterData);
    }
}

function finalizeCharacterUpdate(index, updatedCharacter) {
    const currentCharacter = getCurrentCharacter();
    const originalName = getCharacters()[index].name;

    updateCharacterInList(index, updatedCharacter); // Update state

    // If the currently active character was the one being edited, update the active character state
    if (currentCharacter && currentCharacter.name === originalName) {
        setCurrentCharacter(updatedCharacter);
        displayCurrentCharacterUI(); // Refresh UI immediately
    }

    renderSavedCharactersList(); // Refresh list in the modal
    closeModal(DOMElements.editCharacterModal);
    showNotification(`${updatedCharacter.name} 캐릭터 정보가 수정되었습니다.`, 3000);
    DOMElements.editCharacterForm.style.display = 'none'; // Hide form after update
     DOMElements.editCharacterSelect.value = ""; // Reset select dropdown
}

// --- Character Deletion ---

function handleDeleteCharacter() {
     const selectedIndex = DOMElements.deleteCharacterSelect.value;
     if (selectedIndex === "") {
         showNotification('삭제할 캐릭터를 선택해주세요.', 3000);
         return;
     }

     const index = parseInt(selectedIndex);
     const characters = getCharacters();
     const characterToDelete = characters[index];
     const currentCharacter = getCurrentCharacter();

     removeCharacterFromList(index); // Remove from state

     // If the deleted character was the current character, unset it
     if (currentCharacter && currentCharacter.name === characterToDelete.name) {
         setCurrentCharacter(null);
         displayCurrentCharacterUI(); // Update main UI
     }

     renderSavedCharactersList(); // Refresh list in upload modal
     populateEditCharacterSelect(); // Refresh edit dropdown
     populateDeleteCharacterSelect(); // Refresh delete dropdown

     closeModal(DOMElements.deleteCharacterModal);
     showNotification(`${characterToDelete.name} 캐릭터가 삭제되었습니다.`, 3000);
     DOMElements.deleteCharacterSelect.value = ""; // Reset select dropdown
}

// --- Profile Settings ---

function handleProfileImageUpload() {
    const currentCharacter = getCurrentCharacter();
    if (!currentCharacter) {
        showNotification('프로필을 설정할 캐릭터를 선택해주세요.', 3000);
        return;
    }

    const fileInput = DOMElements.profileImgInput;
    if (fileInput.files && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const reader = new FileReader();

        reader.onload = function(e) {
            const newProfileImage = e.target.result;
            // Find the character in the main list and update
            const characters = getCharacters();
            const index = characters.findIndex(char => char.name === currentCharacter.name);
            if (index !== -1) {
                const updatedCharacter = { ...characters[index], profileImage: newProfileImage };
                updateCharacterInList(index, updatedCharacter);

                // Update current character state as well
                 setCurrentCharacter(updatedCharacter); // This will trigger save to localStorage

                // Update UI immediately
                DOMElements.profileImage.src = newProfileImage; // Update small profile icon
                DOMElements.profilePreviewImg.src = newProfileImage; // Update preview in modal
                showNotification('프로필 이미지가 업데이트되었습니다.', 3000);
            }
             fileInput.value = ''; // Clear file input
        };
        reader.onerror = function() {
             showNotification('프로필 이미지를 읽는 중 오류가 발생했습니다.', 3000);
        }
        reader.readAsDataURL(file);
    } else {
        showNotification('업로드할 이미지 파일을 선택해주세요.', 3000);
    }
}

// --- Settings ---
function handleSaveSettings() {
    const currentCharacter = getCurrentCharacter();
    if (!currentCharacter) {
        showNotification('설정을 저장할 캐릭터를 선택해주세요.', 3000);
        return;
    }

    const customDialog = DOMElements.customDialogInput.value.trim();
    const customGift = DOMElements.customGiftListInput.value.trim();

    // Find the character in the main list and update
    const characters = getCharacters();
    const index = characters.findIndex(char => char.name === currentCharacter.name);
    if (index !== -1) {
        const updatedCharacter = { ...characters[index], customDialog, customGift };
        updateCharacterInList(index, updatedCharacter);

        // Update current character state
        setCurrentCharacter(updatedCharacter); // Triggers save

        renderFavoriteGifts(); // Update favorite gifts display
        closeModal(DOMElements.settingsModal);
        showNotification('설정이 저장되었습니다.', 3000);
        // Optionally show speech bubble confirmation
        // showSpeechBubble('설정이 저장되었어요!');
    } else {
        showNotification('현재 캐릭터를 찾을 수 없습니다.', 3000);
    }
}

// --- Initialization ---
// Helper to close modals safely
function closeModal(modalElement) {
    if (modalElement) {
        modalElement.style.display = 'none';
    }
}


export function initCharacter() {
    // Event Listeners for character management
    DOMElements.saveCharacterBtn.addEventListener('click', handleSaveCharacter);
    DOMElements.editCharacterSelect.addEventListener('change', handleEditCharacterSelection);
    DOMElements.updateCharacterBtn.addEventListener('click', handleUpdateCharacter);
    DOMElements.confirmDeleteBtn.addEventListener('click', handleDeleteCharacter); // Delete confirmation
    DOMElements.saveProfileBtn.addEventListener('click', handleProfileImageUpload);
    DOMElements.saveSettingsBtn.addEventListener('click', handleSaveSettings);

    // Initial rendering of saved characters on load
    renderSavedCharactersList();
}
