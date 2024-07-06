export const translateText = async (text: string, targetLang: string): Promise<string> => {
    let result: any = "";

    try {
        const response = await fetch("https://translate.croscout.eu", {
            method: "POST",
            body: JSON.stringify({
                q: text,
                source: "auto",
                target: targetLang,
                format: "text",
                alternatives: 3,
                api_key: ""
            }),
            headers: { "Content-Type": "application/json" }
        });

        result = await response.json();
    } catch (error) {
        console.error("Error", error)
    }
    return result.translatedText;
};