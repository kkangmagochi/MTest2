// modals.js - Manages modal dialog interactions
import { DOMElements } from './ui.js';
import { renderDialogLogs } from './dialogLogs.js'; // Needed for dialog log modal
import { populateEditCharacterSelect, populateDeleteCharacterSelect } from './character.js'; // Needed for character modals
import { getApiKey, setSelectedModel } from './state.js'; // Needed for API modal model selection
import { updateModelSelectionUI } from './ui.js'; // Needed for API modal model selection UI update

// --- Modal Opening ---

function openModal(modalElement) {
    if (modalElement) {
        // Special handling for certain modals on open
        if (modalElement === DOMElements.dialogLogsModal) {
            renderDialogLogs(); // Refresh logs when opening
        }
         if (modalElement === DOMElements.editCharacterModal) {
            populateEditCharacterSelect(); // Refresh dropdown when opening
             DOMElements.editCharacterForm.style.display = 'none'; // Ensure form is hidden initially
        }
         if (modalElement === DOMElements.deleteCharacterModal) {
            populateDeleteCharacterSelect(); // Refresh dropdown when opening
        }
        modalElement.style.display = 'block';
        console.log(`Modal opened: ${modalElement.id}`);
    } else {
        console.error("Attempted to open a null modal element.");
    }
}

// --- Modal Closing ---

function closeModal(modalElement) {
    if (modalElement) {
        modalElement.style.display = 'none';
        console.log(`Modal closed: ${modalElement.id}`);
    }
}

// --- Initialization ---

export function initModals() {
    // Button listeners to open modals
    DOMElements.characterUploadBtn.onclick = () => openModal(DOMElements.characterModal);
    DOMElements.settingsBtn.onclick = () => openModal(DOMElements.settingsModal);
    DOMElements.apiConnectionBtn.onclick = () => openModal(DOMElements.apiModal);
    DOMElements.profileBtn.onclick = () => openModal(DOMElements.profileModal);
    DOMElements.shareBtn.onclick = () => openModal(DOMElements.shareModal);
    DOMElements.dialogLogsBtn.onclick = () => openModal(DOMElements.dialogLogsModal);
    DOMElements.editCharacterBtn.onclick = () => openModal(DOMElements.editCharacterModal); // Open edit modal
     DOMElements.deleteCharacterBtn.onclick = () => openModal(DOMElements.deleteCharacterModal); // Open delete modal


    // Generic close button listeners
    DOMElements.closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            closeModal(this.closest('.modal'));
        });
    });

    // Close modal if background is clicked
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target);
        }
    });

     // Cancel button for delete confirmation
     if (DOMElements.cancelDeleteBtn) {
        DOMElements.cancelDeleteBtn.onclick = () => closeModal(DOMElements.deleteCharacterModal);
     }

     // API Model Selection Listener
     DOMElements.modelFlashRadio.addEventListener('change', function() {
        if (this.checked) {
            setSelectedModel('gemini-2.0-flash');
            // Optionally re-test connection if API key exists
             if (getApiKey()) {
                 import('./api.js').then(api => api.testApiConnection());
             }
        }
    });
    DOMElements.modelProRadio.addEventListener('change', function() {
        if (this.checked) {
            // Use the specific Pro model name required by the API if different
            setSelectedModel('gemini-1.5-pro-latest'); // Or specific Pro version if needed
            if (getApiKey()) {
                 import('./api.js').then(api => api.testApiConnection());
            }
        }
    });

    console.log("Modal interactions initialized.");
}
