// ⚠️ THAY KEY THẬT VÀO ĐÂY (key cuar Gemini) --> neu dung model khac co the doi
const GEMINI_API_KEY = "...";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent";

const PROMPT = `Đây là ảnh chụp màn hình một bài quiz/trắc nghiệm.
Hãy đọc kỹ câu hỏi và các lựa chọn, sau đó:
1. Đưa ra đáp án đúng nhất
2. Giải thích ngắn gọn lý do
Trả lời bằng tiếng Việt, ngắn gọn, rõ ràng.`;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "capture_and_ask") {
    handleCapture().then(sendResponse);
    return true; // giữ channel mở cho async
  }
});

async function handleCapture() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return { success: false, error: "Không tìm thấy tab" };

    console.log("Tab URL:", tab.url);
    console.log("Window ID:", tab.windowId);

    if (tab.url.startsWith("chrome://") ||
        tab.url.startsWith("chrome-extension://") ||
        tab.url.startsWith("edge://") ||
        tab.url.includes("chrome.google.com/webstore")) {
      return { success: false, error: "Không thể chụp trang hệ thống trình duyệt" };
    }

    // Chụp màn hình
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: "png"
    });
    console.log("Chụp OK, độ dài base64:", dataUrl.length);

    const base64 = dataUrl.split(",")[1];

    // Gọi Gemini
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: PROMPT },
            { inline_data: { mime_type: "image/png", data: base64 } }
          ]
        }],
        generationConfig: { maxOutputTokens: 1000, temperature: 0.2 }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        success: true,
        screenshot: dataUrl,
        error: `Gemini lỗi ${response.status}: ${errText}`
      };
    }

    const data = await response.json();
    console.log("Gemini trả về:", data);

    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "Không có phản hồi.";
    return { success: true, screenshot: dataUrl, answer };

  } catch (err) {
    console.error("LỖI background:", err);
    return { success: false, error: err.message };
  }
}