// ai.js - Gemini API 연결 및 상호작용 관리

const AI = (function() {
    // 비공개 변수
    let apiKey = '';
    const API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    
    // 초기화 함수
    function init() {
        // 로컬 스토리지에서 API 키 가져오기
        apiKey = localStorage.getItem('geminiApiKey') || '';
    }
    
    // API 키 유효성 검사
    function validateApiKey() {
        if (!apiKey) {
            throw new Error('API 키가 설정되지 않았습니다. API 설정 메뉴에서 키를 입력해주세요.');
        }
        return true;
    }
    
    // API 요청 생성
    async function makeApiRequest(prompt) {
        validateApiKey();
        
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 500,
                    topP: 0.8,
                    topK: 40
                }
            })
        };
        
        const url = `${API_ENDPOINT}?key=${apiKey}`;
        
        try {
            const response = await fetch(url, requestOptions);
            
            if (!response.ok) {
                if (response.status === 400) {
                    throw new Error('잘못된 요청입니다. API 키를 확인해주세요.');
                } else if (response.status === 401) {
                    throw new Error('인증 오류입니다. API 키가 유효한지 확인해주세요.');
                } else if (response.status === 429) {
                    throw new Error('요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
                } else {
                    throw new Error(`API 오류: ${response.status} ${response.statusText}`);
                }
            }
            
            const data = await response.json();
            
            if (!data.candidates || data.candidates.length === 0) {
                throw new Error('응답 데이터가 없습니다.');
            }
            
            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error('API 요청 오류:', error);
            throw error;
        }
    }
    
    // API 연결 테스트
    async function testConnection() {
        try {
            validateApiKey();
            
            const testResponse = await makeApiRequest('간단한 테스트 메시지입니다. "API 연결 성공"이라고 답변해주세요.');
            return testResponse;
        } catch (error) {
            console.error('API 테스트 오류:', error);
            throw error;
        }
    }
    
    // 캐릭터 대화 생성
    async function generateCharacterResponse(character, userInput = '') {
        try {
            // 캐릭터 프로필 기반 프롬프트 생성
            const characterInfo = `
                당신은 이제 "${character.name}"라는 캐릭터입니다.
                레벨: ${character.level}
                특성: 친근하고, 사용자와 대화하기를 좋아합니다.
                
                다음과 같은 방식으로 응답해주세요:
                1. 친근하고 귀여운 어투로 대화해주세요
                2. 대화는 1-3문장으로 짧게 유지해주세요
                3. 사용자와 친구처럼 대화해주세요
                4. 이모티콘을 적절히 사용해주세요
            `;
            
            let prompt;
            if (userInput) {
                prompt = `${characterInfo}\n\n사용자: ${userInput}\n${character.name}:`;
            } else {
                prompt = `${characterInfo}\n\n${character.name}로서 사용자에게 첫 인사를 건네주세요:`;
            }
            
            const response = await makeApiRequest(prompt);
            return response;
        } catch (error) {
            console.error('캐릭터 응답 생성 오류:', error);
            throw error;
        }
    }
    
    // 대화 시작
    async function startConversation(character) {
        if (!character) {
            throw new Error('캐릭터가 선택되지 않았습니다.');
        }
        
        try {
            const response = await generateCharacterResponse(character);
            return response;
        } catch (error) {
            console.error('대화 시작 오류:', error);
            throw error;
        }
    }
    
    // 사용자 입력에 응답
    async function respondToUser(character, userInput) {
        if (!character) {
            throw new Error('캐릭터가 선택되지 않았습니다.');
        }
        
        if (!userInput) {
            throw new Error('사용자 입력이 없습니다.');
        }
        
        try {
            const response = await generateCharacterResponse(character, userInput);
            return response;
        } catch (error) {
            console.error('응답 생성 오류:', error);
            throw error;
        }
    }
    
    // 초기화 실행
    init();
    
    // 공개 API
    return {
        testConnection,
        startConversation,
        respondToUser,
        setApiKey: function(key) {
            apiKey = key;
            localStorage.setItem('geminiApiKey', key);
        },
        getApiKey: function() {
            return apiKey;
        }
    };
})();
