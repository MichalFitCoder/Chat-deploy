export const generateKeyPair = async () => {
    const keyPair = await window.crypto.subtle.generateKey(
        {
            name: "ECDH",
            namedCurve: "P-256",
        },
        true,
        ["deriveKey", "deriveBits"]
    );
    return keyPair;
};

export const exportPublicKey = async (publicKey) => {
    const exported = await window.crypto.subtle.exportKey("spki", publicKey);
    const base64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
    return base64;
};

export const importPublicKey = async (publicKeyBase64) => {
    const cleanedBase64 = publicKeyBase64.replace(/^"|"$/g, '').trim();
    const binary = Uint8Array.from(atob(cleanedBase64), c => c.charCodeAt(0));
    return window.crypto.subtle.importKey(
        "spki",
        binary,
        { name: "ECDH", namedCurve: "P-256" },
        true,
        []
    );
};

// Helper function to convert ArrayBuffer to Base64
export const arrayBufferToBase64 = (buffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    bytes.forEach((byte) => binary += String.fromCharCode(byte));
    return window.btoa(binary);
};

export const exportPrivateKey = async (privateKey) => {
    const exported = await window.crypto.subtle.exportKey("pkcs8", privateKey);
    return arrayBufferToBase64(exported);
};

export const importPrivateKey = async (privateKeyBase64) => {
    const cleanedBase64 = privateKeyBase64.replace(/^"|"$/g, '').trim();
    try{
        const binary = Uint8Array.from(atob(cleanedBase64), c => c.charCodeAt(0));
        return window.crypto.subtle.importKey(
            "pkcs8",
            binary,
            { name: "ECDH", namedCurve: "P-256" },
            true,
            ["deriveKey", "deriveBits"]
        );
    }catch(error){
        return console.error("Error importing private key:", error);
    }
};


// ------------ Creating shared key for chat encryption --------------

    // Helper function for generating shared keys for each chat
    export const deriveSharedKey = async (privateKey, publicKey) => {
        const sharedKey = await window.crypto.subtle.deriveKey(
            { name: "ECDH", public: publicKey },
            privateKey,
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"]
        );
        return sharedKey;
    };
    
    // Function to fetch the stored AES key from sessionStorage
    export const getStoredSharedKey = (chatId) => {
        const storedKeyBase64 = sessionStorage.getItem(chatId);
        if (!storedKeyBase64) return null;
        
        const sharedKeyArrayBuffer = Uint8Array.from(atob(storedKeyBase64), c => c.charCodeAt(0));
        return window.crypto.subtle.importKey(
            "raw",
            sharedKeyArrayBuffer,
            { name: "AES-GCM", length: 256 },
            false,
            ["encrypt", "decrypt"]
        );
    };
    
    // Function to store the AES key in sessionStorage
    export const storeSharedKey = (chatId, sharedKey) => {
        window.crypto.subtle.exportKey("raw", sharedKey).then(exportedKey => {
            const keyBase64 = btoa(String.fromCharCode(...new Uint8Array(exportedKey)));
            sessionStorage.setItem(chatId, keyBase64);
        });
    };
