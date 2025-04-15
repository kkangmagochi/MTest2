// state.js - Manages application state and local storage

// Private state variables
let _stats = { affection: 50, hunger: 50, happiness: 50 };
let _currentCharacter = null;
let _characters = [];
let _apiKey = '';
let _apiConnected = false;
let _daysCount = 0;
let _characterStats = {}; // Character-specific stats
let _dialogLogs = [];
let _selectedModel = 'gemini-2.0-flash'; // Default model
let _characterGifts = {}; // Character-specific gift lists

const MAX_DIALOG_LOGS = 10;

// --- Getters ---
export function getStats() { return { ..._stats }; } // Return a copy
export function getCurrentCharacter() { return _currentCharacter; }
export function getCharacters() { return [..._characters]; } // Return a copy
export function getApiKey() { return _apiKey; }
export function isApiConnected() { return _apiConnected; }
export function getDaysCount() { return _daysCount; }
export function getCharacterStats(characterName) { return _characterStats[characterName] ? { ..._characterStats[characterName] } : null; }
export function getAllCharacterStats() { return { ..._characterStats }; }
export function getDialogLogs() { return [..._dialogLogs]; } // Return a copy
export function getSelectedModel() { return _selectedModel; }
export function getCharacterGifts(characterName) {
    return _characterGifts[characterName] || [];
}

// --- Setters/Updaters ---
export function setStats(newStats) {
    _stats = { ...newStats };
    // Ensure stats are within bounds
    _stats.affection = Math.max(0, Math.min(100, _stats.affection));
    _stats.hunger = Math.max(0, Math.min(100, _stats.hunger));
    _stats.happiness = Math.max(0, Math.min(100, _stats.happiness));

    if (_currentCharacter) {
        _characterStats[_currentCharacter.name] = { ..._stats };
    }
    saveStateToLocalStorage();
}

export function updateStat(statName, value) {
    if (_stats.hasOwnProperty(statName)) {
        _stats[statName] = Math.max(0, Math.min(100, _stats[statName] + value));
        if (_currentCharacter) {
            _characterStats[_currentCharacter.name] = { ..._stats };
        }
        saveStateToLocalStorage();
    }
}

export function setCurrentCharacter(character) {
    _currentCharacter = character;
    if (_currentCharacter && _characterStats[_currentCharacter.name]) {
        _stats = { ..._characterStats[_currentCharacter.name] };
    } else if (_currentCharacter) {
        // Initialize stats for new character if none exist
        _stats = { affection: 50, hunger: 50, happiness: 50 };
        _characterStats[_currentCharacter.name] = { ..._stats };
    } else {
        // Reset stats if no character is selected
        _stats = { affection: 50, hunger: 50, happiness: 50 };
    }
    saveStateToLocalStorage(); // Save character change
}

export function setCharacters(newCharacters) {
    _characters = [...newCharacters]; // Store a copy
    saveStateToLocalStorage();
}

export function addCharacter(newCharacter) {
    _characters.push(newCharacter);
    // Initialize stats for the new character
    _characterStats[newCharacter.name] = { affection: 50, hunger: 50, happiness: 50 };
    saveStateToLocalStorage();
}

export function updateCharacterInList(index, updatedCharacter) {
    if (index >= 0 && index < _characters.length) {
        const oldName = _characters[index].name;
        _characters[index] = updatedCharacter;

        // If name changed, migrate stats
        if (oldName !== updatedCharacter.name && _characterStats[oldName]) {
            _characterStats[updatedCharacter.name] = { ..._characterStats[oldName] };
            delete _characterStats[oldName];
        }
        saveStateToLocalStorage();
    }
}

export function removeCharacterFromList(index) {
     if (index >= 0 && index < _characters.length) {
        const removedCharName = _characters[index].name;
        _characters.splice(index, 1);
        // Remove associated stats
        if (_characterStats[removedCharName]) {
            delete _characterStats[removedCharName];
        }
        saveStateToLocalStorage();
     }
}

export function setApiKey(key) {
    _apiKey = key;
    localStorage.setItem('geminiApiKey', _apiKey); // Save API key separately
}

export function setApiConnected(isConnected) {
    _apiConnected = isConnected;
}

export function incrementDaysCount() {
    _daysCount++;
    saveStateToLocalStorage();
}

export function setDaysCount(count) {
    _daysCount = count;
    saveStateToLocalStorage();
}

export function addDialogLog(logEntry) {
    _dialogLogs.unshift(logEntry); // Add to the beginning
    if (_dialogLogs.length > MAX_DIALOG_LOGS) {
        _dialogLogs.pop(); // Remove the oldest log
    }
    saveStateToLocalStorage();
}

export function setDialogLogs(logs) {
    _dialogLogs = logs.slice(0, MAX_DIALOG_LOGS); // Ensure max size
    saveStateToLocalStorage();
}

export function removeDialogLog(index) {
    if (index >= 0 && index < _dialogLogs.length) {
        _dialogLogs.splice(index, 1);
        saveStateToLocalStorage();
    }
}

export function setSelectedModel(modelName) {
    _selectedModel = modelName;
    localStorage.setItem('selectedModel', _selectedModel); // Save model selection separately
}

export function setCharacterGifts(characterName, gifts) {
    _characterGifts[characterName] = gifts;
    saveStateToLocalStorage();
}

// --- Local Storage ---
const STORAGE_KEYS = {
    CHARACTERS: 'virtualPetCharacters',
    CHARACTER_STATS: 'virtualPetCharacterStats',
    STATS: 'virtualPetStats', // For the last active character state
    CURRENT_CHARACTER: 'virtualPetCurrentCharacter',
    DAYS_COUNT: 'virtualPetDaysCount',
    DIALOG_LOGS: 'virtualPetDialogLogs'
    // API Key and Model are saved separately above
};

export function loadStateFromLocalStorage() {
    const savedCharacters = localStorage.getItem(STORAGE_KEYS.CHARACTERS);
    if (savedCharacters) {
  _characters = JSON.parse(savedCharacters);
  console.log("Loaded characters:", _characters);
  // 각 캐릭터의 customGift 확인
  _characters.forEach(char => {
    console.log(`Character ${char.name} has gifts:`, char.customGift);
  });
}

    const savedCharacterStats = localStorage.getItem(STORAGE_KEYS.CHARACTER_STATS);
    if (savedCharacterStats) _characterStats = JSON.parse(savedCharacterStats);

    // Load current character *after* characters and stats
    const savedCurrentCharacter = localStorage.getItem(STORAGE_KEYS.CURRENT_CHARACTER);
     if (savedCurrentCharacter) {
        _currentCharacter = JSON.parse(savedCurrentCharacter);
        // Load the stats for the current character if they exist
        if (_characterStats[_currentCharacter.name]) {
            _stats = { ..._characterStats[_currentCharacter.name] };
        } else {
             // Fallback if stats for the loaded character are missing
            _stats = { affection: 50, hunger: 50, happiness: 50 };
            _characterStats[_currentCharacter.name] = { ..._stats }; // Save default stats for them
        }
    } else {
         // If no current character, load general stats or defaults
        const savedStats = localStorage.getItem(STORAGE_KEYS.STATS);
        _stats = savedStats ? JSON.parse(savedStats) : { affection: 50, hunger: 50, happiness: 50 };
    }


    const savedApiKey = localStorage.getItem('geminiApiKey');
    if (savedApiKey) _apiKey = savedApiKey;

    const savedDaysCount = localStorage.getItem(STORAGE_KEYS.DAYS_COUNT);
    if (savedDaysCount) _daysCount = parseInt(savedDaysCount);

    const savedDialogLogs = localStorage.getItem(STORAGE_KEYS.DIALOG_LOGS);
    if (savedDialogLogs) _dialogLogs = JSON.parse(savedDialogLogs);

    const savedModel = localStorage.getItem('selectedModel');
    if (savedModel) _selectedModel = savedModel;

    const savedCharacterGifts = localStorage.getItem('virtualPetCharacterGifts');
    if (savedCharacterGifts) _characterGifts = JSON.parse(savedCharacterGifts);

    console.log("State loaded from local storage.");
}

export function saveStateToLocalStorage() {
    localStorage.setItem(STORAGE_KEYS.CHARACTERS, JSON.stringify(_characters));
    localStorage.setItem(STORAGE_KEYS.CHARACTER_STATS, JSON.stringify(_characterStats));
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(_stats)); // Save last active stats
    localStorage.setItem(STORAGE_KEYS.DAYS_COUNT, _daysCount.toString());
    localStorage.setItem(STORAGE_KEYS.DIALOG_LOGS, JSON.stringify(_dialogLogs));

    if (_currentCharacter) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_CHARACTER, JSON.stringify(_currentCharacter));
    } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_CHARACTER);
    }
    // API Key and Model are saved in their setters
    localStorage.setItem('virtualPetCharacterGifts', JSON.stringify(_characterGifts));
    console.log("State saved to local storage.");
}
