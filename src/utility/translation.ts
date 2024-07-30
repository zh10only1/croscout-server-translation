export const translateText = async (text: string, targetLang: string): Promise<string> => {
    let result: any = "";
    
    const response = await fetch("https://translate.croscout.eu", {
        method: "POST",
        body: JSON.stringify({
            q: text,
            source: "auto",
            target: targetLang,
            format: "text",
        }),
        headers: { "Content-Type": "application/json" }
    });

    if (!response.ok) {
        // Log detailed response information if not successful
        const errorText = await response.text();
        console.error(`Error: ${response.status} - ${response.statusText}\nResponse Body: ${errorText}`);
        throw new Error(`Failed to translate text: ${response.statusText}`);
    }

    result = await response.json();
    return result.translatedText;
};

export const supportedLanguages: Record<string, string> = {
    "en": "English",
    "ru": "Russian",
    "de": "German",
    "hr": "Croatian",
    "pl": "Polish",
    "cs": "Czech",
    "sv": "Swedish",
    "no": "Norway",
    "sk": "Slovak",
    "nl": "Dutch"
};


