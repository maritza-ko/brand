
import { GoogleGenAI } from "@google/genai";

// Mocking the service logic locally to verify the flow
const getApiKey = (userProvidedKey) => {
    if (userProvidedKey && userProvidedKey.trim().length > 0) {
        return userProvidedKey.trim();
    }
    return "DEFAULT_KEY";
};

const getAI = (apiKey) => {
    const finalKey = getApiKey(apiKey);
    console.log("Using API Key:", finalKey);
    return new GoogleGenAI({ apiKey: finalKey });
};

async function test() {
    console.log("--- Test 1: No Key Provided (Should use Default) ---");
    getAI();

    console.log("\n--- Test 2: User Key Provided (Should use User Key) ---");
    getAI("USER_PROVIDED_KEY_12345");

    console.log("\n--- Test 3: Empty User Key (Should use Default) ---");
    getAI("");
}

test();
