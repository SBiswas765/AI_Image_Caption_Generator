// background.js

async function generateCaptions(imageUrl, options) {
  const apiProvider = options.apiProvider;
  const apiKey = options.apiKey;
  const model = options.modelName || "gpt-4-vision-preview";
  const endpoint = apiProvider === "custom" ? options.customEndpoint : getEndpoint(apiProvider);

  const payload = {
    model,
    prompt: `Generate ${options.captionCount || 3} different ${options.tone} captions in ${options.language} for this image.`,
    image: imageUrl,
    n: options.captionCount || 3,
    temperature: options.temperature || 0.7,
    max_tokens: options.maxTokens || 300
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.choices) {
      return result.choices.map(choice => choice.text.trim());
    } else if (result.captions) {
      return result.captions;
    } else {
      throw new Error("Unexpected response structure");
    }
  } catch (error) {
    console.error("Caption generation error:", error);
    return ["❌ Failed to generate captions."];
  }
}

function getEndpoint(provider) {
  switch (provider) {
    case "openrouter":
      return "https://openrouter.ai/api/v1/chat/completions";
    case "huggingface":
      return "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base";
    case "google":
      return "https://vision.googleapis.com/v1/images:annotate";
    default:
      return "";
  }
}

// Call this from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "generateCaptions") {
    generateCaptions(message.imageUrl, message.options).then(sendResponse);
    return true; // Keep message channel open for async
  }
});
