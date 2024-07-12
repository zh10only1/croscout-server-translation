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

    result = await response.json();
    return result.translatedText;
};