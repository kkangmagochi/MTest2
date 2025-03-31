// actions.js - Handles user interactions (feeding, playing, etc.)
import { DOMElements, animateCharacter, showSpeechBubble, updateStatsDisplay, playNightAnimation, showNotification } from './ui.js';
import { getStats, getCurrentCharacter, updateStat, setStats, getCharacterStats, saveStateToLocalStorage } from './state.js';
import { generateAIResponse } from './api.js';
import { addLogEntry } from './dialogLogs.js'; // Use renamed function

// --- Default Responses (Fallback) ---
const defaultDialogs = [
    "오늘은 날씨가 좋네요!", "같이 놀아요!", "뭐하고 있어요?",
    "기분이 좋아요!", "심심해요~"
];
const defaultGifts = [
    "귀여운 인형", "맛있는 초콜릿", "예쁜 꽃", "특별한 책", "멋진 옷"
];

function getRandomDefaultDialog() {
    return defaultDialogs[Math.floor(Math.random() * defaultDialogs.length)];
}

function getRandomDefaultGift() {
    return defaultGifts[Math.floor(Math.random() * defaultGifts.length)];
}

// --- Action Handlers ---

async function handleFeed() {
    const currentCharacter = getCurrentCharacter();
    if (!currentCharacter) return;

    console.log("Feed action triggered");
    updateStat('hunger', 20); // +20 hunger
    updateStat('happiness', 5); // +5 happiness
    updateStatsDisplay(); // Update UI
    animateCharacter();

    let response = '맛있어요! 감사합니다!'; // Default positive response
    const currentHunger = getStats().hunger;

    try {
        const aiResponse = await generateAIResponse("feed");
        if (aiResponse) {
            response = aiResponse;
        } else {
            // Fallback logic based on hunger
            if (currentHunger > 80) response = '으, 배가 너무 불러요... 그래도 고마워요.';
            // No specific low hunger message needed if default is positive
        }
    } catch (error) {
        console.error("Feed AI response error:", error);
        // Use fallback logic on error
         if (currentHunger > 80) response = '으, 배가 너무 불러요... 그래도 고마워요.';
    }

    showSpeechBubble(response);
    addLogEntry(response, "밥주기"); // Log the action and response
}

async function handlePlay() {
    const currentCharacter = getCurrentCharacter();
    if (!currentCharacter) return;

    console.log("Play action triggered");
    updateStat('happiness', 20); // +20 happiness
    updateStat('affection', 10); // +10 affection
    updateStat('hunger', -5);   // -5 hunger
    updateStatsDisplay();
    animateCharacter();

    let response = getRandomDefaultDialog(); // Fallback

    try {
        const aiResponse = await generateAIResponse("play");
        if (aiResponse) {
            response = aiResponse;
        }
    } catch (error) {
        console.error("Play AI response error:", error);
    }

    showSpeechBubble(response);
    addLogEntry(response, "놀아주기");
}

function getGiftList() {
    const character = getCurrentCharacter();
    let gifts = defaultGifts;
    if (character && character.customGift && character.customGift.trim() !== '') {
        const customGifts = character.customGift.split(',').map(g => g.trim()).filter(g => g !== '');
        if (customGifts.length > 0) {
            gifts = customGifts;
        }
    }
    return gifts;
}


async function handleGift() {
    const currentCharacter = getCurrentCharacter();
    if (!currentCharacter) return;

    console.log("Gift action triggered");
    updateStat('affection', 20); // +20 affection
    updateStat('happiness', 15); // +15 happiness
    updateStatsDisplay();
    animateCharacter();

    const availableGifts = getGiftList();
    const selectedGift = availableGifts[Math.floor(Math.random() * availableGifts.length)];
    console.log(`Selected random gift: ${selectedGift}`);

    let response = `${selectedGift}! 정말 좋아해요!`; // Default positive

    try {
         // Pass the selected gift name as context for better AI response
        const aiResponse = await generateAIResponse("gift", `마음에 들어할 만한 '${selectedGift}'를 선물 받았습니다.`);
        if (aiResponse) {
            response = aiResponse;
        }
    } catch (error) {
        console.error("Gift AI response error:", error);
    }

    showSpeechBubble(response);
    addLogEntry(response, `선물주기 (${selectedGift})`);
}

async function handleSleep() {
    const currentCharacter = getCurrentCharacter();
    if (!currentCharacter) return;

    console.log("Sleep action triggered");
    playNightAnimation(); // Start animation immediately

    let initialResponse = "잘 자요..."; // Initial message before stats change

     try {
        const aiGreetingResponse = await generateAIResponse("sleep_greeting"); // Optional: AI says goodnight
        if (aiGreetingResponse) {
            initialResponse = aiGreetingResponse;
        }
    } catch(error) {
        console.error("Sleep greeting AI error:", error);
    }
    showSpeechBubble(initialResponse, 1500); // Show short goodnight message


    // Apply stat changes after the animation duration (1.5s)
    setTimeout(async () => {
        let wasHungry = getStats().hunger < 20;

        updateStat('hunger', -30); // Significant hunger decrease

        // Adjust happiness/affection based on hunger *after* sleep
        const currentHunger = getStats().hunger;
        if (currentHunger < 20 && wasHungry) { // If still hungry (or became very hungry)
             updateStat('happiness', -25);
             updateStat('affection', -15);
        } else { // If not too hungry
             updateStat('happiness', 15);
             updateStat('affection', 10);
        }
        updateStatsDisplay(); // Update UI with final stats

        // Now get the wake-up message
        let wakeUpResponse = '잘 잤어요! 기분이 좋아요!'; // Default positive wake-up
         if (currentHunger < 20) {
            wakeUpResponse = '배고파요... 밥 주세요ㅠㅠ';
        }

        try {
            // Pass context about hunger state for wake-up message
            const wakeUpContext = currentHunger < 20 ? "아침에 일어났지만 매우 배고픈 상태입니다." : "아침에 잘 자고 일어났습니다.";
            const aiWakeUpResponse = await generateAIResponse("sleep_wakeup", wakeUpContext);
            if (aiWakeUpResponse) {
                wakeUpResponse = aiWakeUpResponse;
            }
        } catch (error) {
            console.error("Sleep wake-up AI response error:", error);
             // Use default logic if AI fails
             if (currentHunger < 20) {
                wakeUpResponse = '배고파요... 밥 주세요ㅠㅠ';
            } else {
                wakeUpResponse = '잘 잤어요! 기분이 좋아요!';
            }
        }

        showSpeechBubble(wakeUpResponse);
        addLogEntry(wakeUpResponse, "잠자기 (일어남)");

    }, 1500); // Corresponds to night animation duration
}


async function handleCustomGift() {
    const currentCharacter = getCurrentCharacter();
    if (!currentCharacter) return;

    const customGiftName = DOMElements.customGiftInput.value.trim();
    if (customGiftName === '') {
        showNotification('선물 이름을 입력해주세요.', 3000);
        return;
    }

    console.log(`Custom gift action: ${customGiftName}`);
    updateStat('affection', 15); // Slightly less than random gift?
    updateStat('happiness', 10);
    updateStatsDisplay();
    animateCharacter();

    let response = `${customGiftName}! 정말 고마워요!`; // Default positive

    try {
        const giftContext = `사용자로부터 '${customGiftName}' 선물을 받았습니다.`;
        const aiResponse = await generateAIResponse("customGift", giftContext);
        if (aiResponse) {
            response = aiResponse;
        }
    } catch (error) {
        console.error("Custom gift AI response error:", error);
    }

    showSpeechBubble(response);
    addLogEntry(response, `선물주기 (${customGiftName})`);
    DOMElements.customGiftInput.value = ''; // Clear input after giving
}

function handleStatsReset() {
    const currentCharacter = getCurrentCharacter();
    if (!currentCharacter) return;

    if (confirm('정말 스탯을 초기화하시겠습니까?')) {
        const defaultStats = { affection: 50, hunger: 50, happiness: 50 };
        setStats(defaultStats); // This updates state and saves
        updateStatsDisplay(); // Update UI
        showSpeechBubble('스탯이 초기화되었어요!');
        addLogEntry('스탯 초기화됨', '시스템');
    }
}

async function handleCharacterClick() {
     const currentCharacter = getCurrentCharacter();
    if (!currentCharacter) return;

    animateCharacter();

    let response = getRandomDefaultDialog(); // Fallback

    try {
        const aiResponse = await generateAIResponse("click");
        if (aiResponse) {
            response = aiResponse;
        }
    } catch (error) {
        console.error("Character click AI response error:", error);
    }

    showSpeechBubble(response);
    addLogEntry(response, "클릭");
}


// --- Initialization ---

export function initActions() {
    DOMElements.feedButton.addEventListener('click', handleFeed);
    DOMElements.playButton.addEventListener('click', handlePlay);
    DOMElements.giftButton.addEventListener('click', handleGift);
    DOMElements.sleepButton.addEventListener('click', handleSleep);
    DOMElements.giveGiftBtn.addEventListener('click', handleCustomGift);
    DOMElements.statsResetBtn.addEventListener('click', handleStatsReset);
    DOMElements.characterImage.addEventListener('click', handleCharacterClick);

    console.log("Action handlers initialized.");
}
