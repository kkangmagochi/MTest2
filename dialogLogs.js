// dialogLogs.js - Manages the dialog log feature
import { DOMElements, showNotification } from './ui.js';
import { getDialogLogs, addDialogLog, removeDialogLog } from './state.js';

export function addLogEntry(text, action) {
    const currentCharacter = import('./state.js').then(state => state.getCurrentCharacter()); // Get current character async
    currentCharacter.then(char => {
        if (!text || text.trim() === '') return;

        const logEntry = {
            text: text,
            action: action,
            timestamp: new Date().toLocaleString(),
            character: char ? char.name : '시스템' // Use character name or 'System'
        };
        addDialogLog(logEntry);
        // Optionally re-render if the log modal is open, but might be excessive.
        // It will re-render next time it's opened.
    });

}


export function renderDialogLogs() {
    const logs = getDialogLogs();
    const listElement = DOMElements.dialogLogsList;
    if (!listElement) return;

    listElement.innerHTML = ''; // Clear previous logs

    if (logs.length === 0) {
        const emptyItem = document.createElement('div');
        emptyItem.className = 'empty-logs';
        emptyItem.textContent = '저장된 대화 로그가 없습니다.';
        listElement.appendChild(emptyItem);
        return;
    }

    logs.forEach((log, index) => {
        const logItem = document.createElement('div');
        logItem.className = 'dialog-log-item';

        const logText = document.createElement('div');
        logText.className = 'dialog-log-text';
        logText.textContent = log.text;

        const logInfo = document.createElement('div');
        logInfo.className = 'dialog-log-info';
        // Ensure character name exists
        const characterName = log.character || '캐릭터';
        logInfo.textContent = `${characterName} - ${log.action} [${log.timestamp}]`;

        const logActions = document.createElement('div');
        logActions.className = 'dialog-log-actions';

        // Copy Button
        const copyBtn = document.createElement('button');
        copyBtn.className = 'log-action-btn';
        copyBtn.textContent = '복사';
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(log.text)
                .then(() => {
                    copyBtn.textContent = '복사됨!';
                    showNotification('클립보드에 복사되었습니다.', 1500);
                    setTimeout(() => { copyBtn.textContent = '복사'; }, 2000);
                })
                .catch(err => {
                    console.error('Clipboard copy failed:', err);
                    showNotification('클립보드 복사 실패', 2000);
                });
        });

        // Delete Button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'log-action-btn delete-btn';
        deleteBtn.textContent = '삭제';
        deleteBtn.addEventListener('click', () => {
            removeDialogLog(index); // Remove from state
            renderDialogLogs(); // Re-render the list immediately
        });

        logActions.appendChild(copyBtn);
        logActions.appendChild(deleteBtn);

        logItem.appendChild(logText);
        logItem.appendChild(logInfo);
        logItem.appendChild(logActions);

        listElement.appendChild(logItem);
    });
}

export function initDialogLogs() {
    // Initial render if needed, though typically done when opening modal
     // renderDialogLogs();
    console.log("Dialog Log module initialized.");
     // No specific event listeners needed here as they are added during render
}
