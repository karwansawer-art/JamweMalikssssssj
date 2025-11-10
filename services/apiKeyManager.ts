

// =======================================================
// --- سیستمی زیرەکی دەستکردی التعافي (RecoveryAI) ---
// --- إدارة المفاتيح والاتصال المركزي ---
// =======================================================

const API_KEYS = [
    'AIzaSyAEWEOoEZ3WudeE19LnyHLInEZy7Bqlyss',
    'AIzaSyBETVAx6JxbeVSGY_NEVLrxWum2l-sQ7Zk',
    'AIzaSyCtd3tTDLXlrGUPMpTt5QvlJSC6CdYr8As',
    'AIzaSyAQbVIu4OtqCGpss_5h-6bUkPffMVrXBUc',
    'AIzaSyDyOvyLx4uTjEN0q0Kh4NAdXMWv6lIwrC8',
    'AIzaSyCfK_MbXapx-i108DcwJJb_AGL7CL_pk_s',
    'AIzaSyDL0iVEAVIAPM7d0P7uuLOiqgXRNhR3WzU',
    'AIzaSyAIyZiNZYqTV6A4DVM-B4B-LXMha3ycpTc',
    'AIzaSyBwDY3L9H2TTBVZJUZDcR5gW2UoNnrkaEk',
    'AIzaSyAX3oHv6ztjYI-r3Ko5DGnxGFHVbDj3u4o',
    'AIzaSyDmyH3aRZSxyHmuPFDlKoMlKu26sSUr6uU',
    'AIzaSyDmLsxEZAbqbO513E8sPId1XY8wNtS1ivo',
    'AIzaSyD2hWxVSymHAdIR1Teh_5n8gcDwid1ofAk',
    'AIzaSyBcDv6BMrmN2_gvwdi_R8LI4gC7LtJIiE',
    'AIzaSyDj74NMSE5cxwfmW09TXwdLGmwIy8k9340',
    'AIzaSyAsa93Q1aMRotd0R1sQskvJfJoHJ-2Efoo',
    'AIzaSyDvbE45aKpTBMWi5x4r0nN27PzEoRo1S5g',
    'AIzaSyDmlusuvY51jDaUYbdv1YJ9iIZMHylsGlQ',
    'AIzaSyBskKXjHhQG8E2EStktQ92aPljscggGmU4',
    'AIzaSyA-naloBU-4qDVKEGoSGKjUn5rnZdPdTdY',
    'AIzaSyB4aMandShXjhVwfwclEFUcEHO2fF71u6Q',
    'AIzaSyBFqwGqtjkHsgbw3_0GXtcoDSnOATmOz_0',
    'AIzaSyB2SIGu9NovjKOf4MV7k7e8N3LOzVaQdV8',
    'AIzaSyDKOjzKWCx0eLRAr6k8d0t2vnOpkTLZdZM',
    'AIzaSyDDPvkT6Md518zGBT0Ah1aFqfKxToopBqE',
    'AIzaSyB_vbpYT1RWODIhHQzYgxWquvYPW0fzs1Q',
    'AIzaSyDmfVBc9Fftfx4iV7_sMg1jUQb0upMo0xM',
    'AIzaSyASZirPNSCkl5DXoezXB1N6IQxrLxhcuUo',
    'AIzaSyCTwf88tE7z9zA6AtNYLqay7mSn_LGyNBU',
    'AIzaSyCuNfTdEFXdEWZdyYM_-MCMy68TQuEbvk0',
    'AIzaSyBDDgVKbVKIxfqpt6NBceuhm-7Lz3bElFY',
    'AIzaSyAi5x0KAto2Nn-qw_HUbYblshZpZzvkxio',
    'AIzaSyDPa6jSCyKQAWtqk0Nliw07S5xb0QLjL9s',
    'AIzaSyBBT19-CMaGCqnBcKLBSaB6pdE90QlcnCw',
    'AIzaSyC1CaSnAyV0D6xIbjdBpYzkJG_A_UUDG7Q',
    'AIzaSyAS6XBwrbtzkRzxYTUjSWY0n_FBOXQRmWM',
    'AIzaSyDFWpTpDv27UNFUkVXxbCMgFkCgV1p89tA',
    'AIzaSyCVILdDHQIrYINkAIitiHVi00OlRvwiP_c',
    'AIzaSyC0T2v80vpc_ab0X45CVeRuTEURetItxL4',
    'AIzaSyAUYLFpo8MoVwC14Gcz5EoJTl1zcj0w3nU',
    'AIzaSyADC1tI56QGvirgHddGPgfO_XLRjQ0jJsw',
    'AIzaSyANejtqAPLJhkOqBXKApGzdxKxwa1uvRJ0',
    'AIzaSyBxARK28sr6xZLpGi5-epxyJj6Zq59N6A8',
    'AIzaSyBcJdhTU447L3ZsrdHLfE_ewNdjTDNeXls',
    'AIzaSyAiIuiHmH009PcYu7C9PYIsHgR2YJjCLzk',
    'AIzaSyDKLNCVDmmqfO0N11kGCTS5RPsfNbRjMto',
    'AIzaSyDhyREGieShMQqXSf7v7XcqKPS6mN0lO-M',
];

class ApiKeyManager {
    private keys: string[];
    private currentIndex: number;
    constructor(keys: string[]) {
        if (!keys || keys.length === 0) { throw new Error("لا توجد مفاتيح API لتهيئتها."); }
        this.keys = keys;
        this.currentIndex = 0;
    }
    public getKey(): string { return this.keys[this.currentIndex]; }
    public rotateKey(): string {
        this.currentIndex = (this.currentIndex + 1) % this.keys.length;
        console.warn(`تم تبديل مفتاح API. المفتاح الجديد هو: ...${this.keys[this.currentIndex].slice(-4)}`);
        return this.getKey();
    }
}

const apiKeyManager = new ApiKeyManager(API_KEYS);

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent';

export async function callGeminiAPI(
    systemInstruction: string,
    userPrompt: string,
    retries: number = API_KEYS.length
): Promise<string> {
    if (retries <= 0) { throw new Error("فشل الاتصال بـ API بعد استنفاد جميع المفاتيح."); }
    const apiKey = apiKeyManager.getKey();
    const apiUrl = `${GEMINI_API_URL}?key=${apiKey}`;
    
    const payload = {
        ...(systemInstruction && { systemInstruction: { parts: [{ text: systemInstruction }] } }),
        contents: [{ parts: [{ text: userPrompt }] }]
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            if (response.status === 429 || response.status >= 500) {
                console.warn(`خطأ ${response.status} مع المفتاح الحالي. يتم التبديل...`);
                apiKeyManager.rotateKey();
                return callGeminiAPI(systemInstruction, userPrompt, retries - 1);
            }
            throw new Error(`خطأ في API: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!text) { 
            const finishReason = result.candidates?.[0]?.finishReason;
            if (finishReason && finishReason !== 'STOP') {
                console.error(`API call finished with reason: ${finishReason}`);
                throw new Error("تم حظر الاستجابة لأسباب تتعلق بالسلامة أو لأسباب أخرى.");
            }
            throw new Error("لم يتم العثور على نص في استجابة API."); 
        }
        
        return text;
    } catch (error) {
        console.error("خطأ أثناء الاتصال بـ Gemini:", error);
        apiKeyManager.rotateKey();
        return callGeminiAPI(systemInstruction, userPrompt, retries - 1);
    }
}
