// ui.js - Handles DOM manipulation and UI updates
import { getStats, getCurrentCharacter, getDaysCount } from './state.js';

// --- DOM Element Selection ---
export const DOMElements = {
    characterContainer: document.getElementById('character-container'),
    noCharacterDisplay: document.getElementById('no-character'),
    characterImage: document.getElementById('character-image'),
    speechBubble: document.getElementById('speech-bubble'),
    characterSpeech: document.getElementById('character-speech'),
    gameTitle: document.getElementById('game-title'),
    affectionBar: document.getElementById('affection-bar'),
    hungerBar: document.getElementById('hunger-bar'),
    happinessBar: document.getElementById('happiness-bar'),
    affectionValue: document.getElementById('affection-value'),
    hungerValue: document.getElementById('hunger-value'),
    happinessValue: document.getElementById('happiness-value'),
    daysCountDisplay: document.getElementById('days-count'),
    characterStatus: document.getElementById('character-status-text'),
    profileImage: document.getElementById('profile-image'),
    statsResetBtn: document.getElementById('stats-reset-btn'),
    feedButton: document.getElementById('feed-button'),
    playButton: document.getElementById('play-button'),
    giftButton: document.getElementById('gift-button'),
    sleepButton: document.getElementById('sleep-button'),
    customGiftInput: document.getElementById('custom-gift-input'),
    giveGiftBtn: document.getElementById('give-gift-btn'),
    characterUploadBtn: document.getElementById('character-upload-btn'),
    settingsBtn: document.getElementById('settings-btn'),
    apiConnectionBtn: document.getElementById('api-connection-btn'),
    profileBtn: document.getElementById('profile-btn'),
    shareBtn: document.getElementById('share-btn'),
    dialogLogsBtn: document.getElementById('dialog-logs-btn'),
    characterModal: document.getElementById('character-modal'),
    settingsModal: document.getElementById('settings-modal'),
    apiModal: document.getElementById('api-modal'),
    profileModal: document.getElementById('profile-modal'),
    shareModal: document.getElementById('share-modal'),
    editCharacterModal: document.getElementById('edit-character-modal'),
    deleteCharacterModal: document.getElementById('delete-character-modal'),
    dialogLogsModal: document.getElementById('dialog-logs-modal'),
    nightOverlay: document.getElementById('night-overlay'),
    closeButtons: document.querySelectorAll('.close'),
    dialogLogsList: document.getElementById('dialog-logs-list'),
    characterNameInput: document.getElementById('character-name'),
    characterImgInput: document.getElementById('character-img'),
    characterTypeExisting: document.getElementById('character-type-existing'),
    // Add other form inputs as needed from original script...
    characterSettingInput: document.getElementById('character-setting'),
    characterGenreInput: document.getElementById('character-genre'),
    characterToneInput: document.getElementById('character-tone'),
    characterLoreInput: document.getElementById('character-lore'),
    characterPersonalityInput: document.getElementById('character-personality'),
    characterSpeechStyleInput: document.getElementById('character-speech-style'),
    saveCharacterBtn: document.getElementById('save-character'),
    savedCharactersList: document.getElementById('saved-characters-list'),
    editCharacterBtn: document.getElementById('edit-character-btn'),
    deleteCharacterBtn: document.getElementById('delete-character-btn'),
    currentCharacterName: document.getElementById('current-character-name'),
    customDialogInput: document.getElementById('custom-dialog'),
    customGiftListInput: document.getElementById('custom-gift'), // Renamed from customGift
    saveSettingsBtn: document.getElementById('save-settings'),
    generateDialogBtn: document.getElementById('generate-dialog-btn'),
    generateGiftsBtn: document.getElementById('generate-gifts-btn'),
    dialogGenerationStatus: document.getElementById('dialog-generation-status'),
    giftGenerationStatus: document.getElementById('gift-generation-status'),
    editCharacterSelect: document.getElementById('edit-character-select'),
    editCharacterForm: document.getElementById('edit-character-form'),
    editCharacterNameInput: document.getElementById('edit-character-name'),
    editCharacterImgInput: document.getElementById('edit-character-img'),
    currentCharacterImg: document.getElementById('current-character-img'),
    editCharacterTypeExisting: document.getElementById('edit-character-type-existing'),
    editCharacterSettingInput: document.getElementById('edit-character-setting'),
    editCharacterGenreInput: document.getElementById('edit-character-genre'),
    editCharacterToneInput: document.getElementById('edit-character-tone'),
    editCharacterLoreInput: document.getElementById('edit-character-lore'),
    editCharacterPersonalityInput: document.getElementById('edit-character-personality'),
    editCharacterSpeechStyleInput: document.getElementById('edit-character-speech-style'),
    updateCharacterBtn: document.getElementById('update-character'),
    deleteCharacterSelect: document.getElementById('delete-character-select'),
    confirmDeleteBtn: document.getElementById('confirm-delete'),
    cancelDeleteBtn: document.getElementById('cancel-delete'),
    apiKeyInput: document.getElementById('api-key'),
    connectApiBtn: document.getElementById('connect-api'),
    connectionStatus: document.getElementById('connection-status'),
    testMessageInput: document.getElementById('test-message'),
    testApiBtn: document.getElementById('test-api'),
    apiResponse: document.getElementById('api-response'),
    modelFlashRadio: document.getElementById('model-flash'),
    modelProRadio: document.getElementById('model-pro'),
    profileCharacterName: document.getElementById('profile-character-name'),
    profileImgInput: document.getElementById('profile-img'),
    saveProfileBtn: document.getElementById('save-profile'),
    profilePreviewImg: document.getElementById('profile-preview-img'),
    createShareImageBtn: document.getElementById('create-share-image'),
    shareImageContainer: document.getElementById('share-image-container'),
    downloadShareImageBtn: document.getElementById('download-share-image'),
    favoriteGiftsList: document.getElementById('favorite-gifts-list'),
    notificationTemplate: document.getElementById('notification-template'),
    notificationMessage: document.getElementById('notification-message'),
};

let speechTimeout = null; // To manage speech bubble hiding

// --- UI Update Functions ---

export function updateStatsDisplay() {
    const stats = getStats();
    DOMElements.affectionBar.style.width = `${stats.affection}%`;
    DOMElements.hungerBar.style.width = `${stats.hunger}%`;
    DOMElements.happinessBar.style.width = `${stats.happiness}%`;

    DOMElements.affectionValue.textContent = Math.round(stats.affection);
    DOMElements.hungerValue.textContent = Math.round(stats.hunger);
    DOMElements.happinessValue.textContent = Math.round(stats.happiness);

    updateCharacterStatus(); // Update status text based on new stats
}

export function updateCharacterStatus() {
    const currentCharacter = getCurrentCharacter();
    if (!currentCharacter) return;

    const stats = getStats();
    let status = "기본 상태";

    if (stats.hunger < 20) status = "배고픔";
    else if (stats.happiness < 20) status = "우울함";
    else if (stats.affection < 20) status = "외로움";
    else if (stats.hunger > 80 && stats.happiness > 80 && stats.affection > 80) status = "최상의 상태";
    else if (stats.hunger > 60 && stats.happiness > 60 && stats.affection > 60) status = "행복한 상태";

    DOMElements.characterStatus.textContent = status;
}

export function updateGameTitle() {
    const currentCharacter = getCurrentCharacter();
    const title = currentCharacter ? `${currentCharacter.name} 키우기` : '나만의 펫 키우기'; // Avoid specific game name
    DOMElements.gameTitle.textContent = title;
    document.title = title;
}

export function displayCurrentCharacterUI() {
    const currentCharacter = getCurrentCharacter();

    if (currentCharacter) {
        DOMElements.characterImage.src = currentCharacter.image;
        DOMElements.noCharacterDisplay.classList.remove('show');
        DOMElements.noCharacterDisplay.classList.add('hide');
        DOMElements.characterContainer.classList.remove('hide');
        DOMElements.characterContainer.classList.add('show');

        DOMElements.profileImage.src = currentCharacter.profileImage || currentCharacter.image; // Use profile or default image
        updateGameTitle();

        // Update settings/profile modal placeholders
        DOMElements.currentCharacterName.textContent = currentCharacter.name;
        DOMElements.profileCharacterName.textContent = currentCharacter.name;
        DOMElements.profilePreviewImg.src = currentCharacter.profileImage || currentCharacter.image;

        // Load character-specific settings into inputs
        DOMElements.customDialogInput.value = currentCharacter.customDialog || '';
        DOMElements.customGiftListInput.value = currentCharacter.customGift || '';

        renderFavoriteGifts();
    } else {
        DOMElements.noCharacterDisplay.classList.remove('hide');
        DOMElements.noCharacterDisplay.classList.add('show');
        DOMElements.characterContainer.classList.remove('show');
        DOMElements.characterContainer.classList.add('hide');
        updateGameTitle();

        // Reset settings/profile placeholders
        DOMElements.currentCharacterName.textContent = '없음';
        DOMElements.profileCharacterName.textContent = '없음';
        DOMElements.profilePreviewImg.src = '';
        DOMElements.customDialogInput.value = '';
        DOMElements.customGiftListInput.value = '';
        DOMElements.favoriteGiftsList.innerHTML = ''; // Clear favorite gifts
    }
    updateStatsDisplay(); // Refresh stats display for the loaded/unloaded character
    updateDaysDisplay(); // Refresh days display
}

export function showSpeechBubble(text, duration = 5000) {
    if (!text || text.trim() === '') {
        DOMElements.speechBubble.classList.add('hide');
        return;
    }
    DOMElements.characterSpeech.textContent = text;
    DOMElements.speechBubble.classList.remove('hide');

    // Clear existing timer if any
    if (speechTimeout) clearTimeout(speechTimeout);

    // Set timer to hide bubble
    speechTimeout = setTimeout(() => {
        DOMElements.speechBubble.classList.add('hide');
        speechTimeout = null;
    }, duration);
}

export function renderFavoriteGifts() {
    const currentCharacter = getCurrentCharacter();
    const listElement = DOMElements.favoriteGiftsList;
    listElement.innerHTML = ''; // Clear previous gifts

    if (!currentCharacter || !currentCharacter.customGift) return;

    const gifts = currentCharacter.customGift.split(',')
        .map(gift => gift.trim())
        .filter(gift => gift !== ''); // Filter out empty strings

    gifts.forEach(gift => {
        const giftTag = document.createElement('div');
        giftTag.className = 'gift-tag';
        giftTag.textContent = gift;

        giftTag.addEventListener('click', () => {
            DOMElements.customGiftInput.value = gift; // Set input value on click
        });

        // Optional: Add remove functionality here if needed later
        // const removeBtn = document.createElement('span');
        // removeBtn.className = 'remove-gift';
        // removeBtn.textContent = 'x';
        // removeBtn.onclick = (e) => { /* remove logic */ e.stopPropagation(); };
        // giftTag.appendChild(removeBtn);

        listElement.appendChild(giftTag);
    });
}

export function animateCharacter() {
    DOMElements.characterImage.classList.add('bounce');
    setTimeout(() => {
        DOMElements.characterImage.classList.remove('bounce');
    }, 500); // Match animation duration
}

export function playNightAnimation() {
    DOMElements.nightOverlay.style.opacity = '1';
    setTimeout(() => {
        DOMElements.nightOverlay.style.opacity = '0';
    }, 1500);
}

export function updateDaysDisplay() {
    DOMElements.daysCountDisplay.textContent = getDaysCount();
}

// Simple Notification System
export function showNotification(message, duration = 3000) {
    const notification = DOMElements.notificationTemplate.cloneNode(true);
    notification.id = ''; // Remove template ID
    notification.querySelector('#notification-message').textContent = message;
    notification.style.display = 'block';
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, duration);
}

// Function to update API connection status display
export function updateApiConnectionStatus(statusText, color) {
    DOMElements.connectionStatus.textContent = statusText;
    DOMElements.connectionStatus.style.color = color;
    DOMElements.testApiBtn.disabled = statusText !== '연결됨'; // Disable test button if not connected
}

// Function to display API test response
export function displayApiResponse(htmlContent) {
    DOMElements.apiResponse.innerHTML = htmlContent;
}

// Function to update AI generation status
export function updateGenerationStatus(element, message) {
     if (element) {
        element.textContent = message;
        if (message && message !== "생성 중...") {
            // Clear status after a delay if it's not "Generating..."
            setTimeout(() => {
                element.textContent = "";
            }, 3000);
        }
     }
}

// Load initial model selection UI state
export function updateModelSelectionUI(selectedModel) {
    if (selectedModel === 'gemini-2.0-flash') {
        DOMElements.modelFlashRadio.checked = true;
    } else {
        DOMElements.modelProRadio.checked = true;
    }
}
