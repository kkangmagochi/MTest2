// main.js - Main application entry point
import { loadStateFromLocalStorage, getSelectedModel } from './state.js';
import { displayCurrentCharacterUI, updateStatsDisplay, updateDaysDisplay, updateModelSelectionUI } from './ui.js';
import { initCharacter } from './character.js';
import { initActions } from './actions.js';
import { initApi } from './api.js';
import { initModals } from './modals.js';
import { initDialogLogs } from './dialogLogs.js';
import { initSharing } from './share.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed. Initializing application...");

    // 1. Load saved state from Local Storage
    loadStateFromLocalStorage();

    // 2. Initialize UI components (setting initial values)
    updateModelSelectionUI(getSelectedModel()); // Set correct radio button for API model

    // 3. Initialize different modules (attaching event listeners, etc.)
    initModals();
    initCharacter(); // Includes rendering saved list, setting up forms
    initActions();
    initApi(); // Includes initial connection test if API key exists
    initDialogLogs();
    initSharing();

    // 4. Display the initial UI based on loaded state
    displayCurrentCharacterUI(); // Shows character or placeholder
    // updateStatsDisplay(); // Called within displayCurrentCharacterUI
    // updateDaysDisplay(); // Called within displayCurrentCharacterUI

    console.log("Application initialized successfully.");
});
