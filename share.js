// share.js - Handles the image sharing feature using html2canvas
import { DOMElements, showNotification } from './ui.js';
import { getCurrentCharacter, getStats, getDaysCount } from './state.js';

function createShareableImage() {
    const character = getCurrentCharacter();
    if (!character) {
        showNotification("이미지를 생성하려면 캐릭터를 선택해주세요.", 3000);
        return;
    }

    const stats = getStats();
    const days = getDaysCount();

    // Create a temporary container for the image content
    const captureContainer = document.createElement('div');
    captureContainer.style.position = 'absolute';
    captureContainer.style.left = '-9999px'; // Move off-screen
    captureContainer.style.width = '350px'; // Adjust size as needed
    captureContainer.style.padding = '20px';
    captureContainer.style.border = '1px solid #ccc';
    captureContainer.style.borderRadius = '10px';
    captureContainer.style.backgroundColor = '#f0f8ff'; // Light background
    captureContainer.style.fontFamily = "'Noto Sans KR', sans-serif";
    captureContainer.style.color = '#5a5a5a';
    captureContainer.style.display = 'flex';
    captureContainer.style.flexDirection = 'column';
    captureContainer.style.alignItems = 'center';
    captureContainer.style.gap = '10px';

    // Title
    const title = document.createElement('h3');
    title.textContent = `${character.name}와(과) 함께한 ${days}일`;
    title.style.margin = '0 0 10px 0';
    title.style.textAlign = 'center';
    title.style.color = '#4a4a4a';

    // Character Image
    const img = document.createElement('img');
    img.src = character.image;
    img.style.width = '120px';
    img.style.height = '120px';
    img.style.objectFit = 'contain';
    img.style.borderRadius = '10px';
    img.style.marginBottom = '10px';
     // Add crossOrigin attribute for html2canvas if images are from different origins (less likely with data URLs)
    img.crossOrigin = 'anonymous';

    // Stats Display
    const statsContainer = document.createElement('div');
    statsContainer.style.width = '100%';
    statsContainer.style.fontSize = '14px';

    function createStatLine(label, value, color) {
        const p = document.createElement('p');
        p.style.display = 'flex';
        p.style.justifyContent = 'space-between';
        p.style.marginBottom = '5px';
        const labelSpan = document.createElement('span');
        labelSpan.textContent = label;
        labelSpan.style.fontWeight = '500';
        const valueSpan = document.createElement('span');
        valueSpan.textContent = `${Math.round(value)} / 100`;
        valueSpan.style.color = color;
        valueSpan.style.fontWeight = 'bold';
        p.appendChild(labelSpan);
        p.appendChild(valueSpan);
        return p;
    }

    statsContainer.appendChild(createStatLine('호감도', stats.affection, 'var(--progress-affection, #ff9eb5)'));
    statsContainer.appendChild(createStatLine('허기', stats.hunger, 'var(--progress-hunger, #86c1ff)'));
    statsContainer.appendChild(createStatLine('행복도', stats.happiness, 'var(--progress-happiness, #a5dbb2)'));

    // Add elements to container
    captureContainer.appendChild(title);
    captureContainer.appendChild(img);
    captureContainer.appendChild(statsContainer);

    // Add to body to render, then capture
    document.body.appendChild(captureContainer);

    DOMElements.shareImageContainer.innerHTML = '<p>이미지 생성 중...</p>';
    DOMElements.downloadShareImageBtn.style.display = 'none';

    // Use html2canvas - ensure the library is loaded
    if (typeof html2canvas === 'undefined') {
        console.error("html2canvas library is not loaded.");
        DOMElements.shareImageContainer.innerHTML = '<p>오류: 이미지 생성 라이브러리를 로드할 수 없습니다.</p>';
        document.body.removeChild(captureContainer); // Clean up
        return;
    }

    html2canvas(captureContainer, {
        useCORS: true, // Important if using external images, though data URLs are fine
        logging: false // Disable console logs from html2canvas
     }).then(canvas => {
        // Display the generated image in the modal
        DOMElements.shareImageContainer.innerHTML = ''; // Clear loading message
        const generatedImage = document.createElement('img');
        generatedImage.src = canvas.toDataURL('image/png');
        generatedImage.style.maxWidth = '100%';
        generatedImage.style.maxHeight = '400px'; // Limit display size in modal
        generatedImage.style.borderRadius = '8px';
        DOMElements.shareImageContainer.appendChild(generatedImage);

        // Show download button
        DOMElements.downloadShareImageBtn.style.display = 'inline-block';
        DOMElements.downloadShareImageBtn.onclick = () => {
            downloadCanvasAsImage(canvas, `${character.name}_${days}일.png`);
        };

    }).catch(error => {
        console.error('html2canvas error:', error);
        DOMElements.shareImageContainer.innerHTML = `<p>이미지 생성 중 오류 발생: ${error.message}</p>`;
    }).finally(() => {
         // Clean up the temporary container from the body regardless of success/failure
        document.body.removeChild(captureContainer);
    });
}

function downloadCanvasAsImage(canvas, filename) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function initSharing() {
    DOMElements.createShareImageBtn.addEventListener('click', createShareableImage);
    // Download button listener is added dynamically after image creation
    console.log("Sharing module initialized.");
}
