const captureBtn = document.getElementById("captureBtn");
const statusEl = document.getElementById("status");
const answerEl = document.getElementById("answer");
const previewEl = document.getElementById("preview");

captureBtn.addEventListener("click", async () => {
  captureBtn.disabled = true;
  answerEl.textContent = "";
  previewEl.classList.remove("show");
  setStatus("Đang chụp màn hình...");

  try {
    // Gửi message cho background để nó chụp
    const response = await chrome.runtime.sendMessage({ action: "capture_and_ask" });

    if (!response.success) {
      throw new Error(response.error || "Lỗi không xác định");
    }

    // Hiển thị preview
    previewEl.src = response.screenshot;
    previewEl.classList.add("show");

    if (response.answer) {
      answerEl.textContent = response.answer;
      setStatus("✅ Đã có câu trả lời");
    } else {
      setStatus("⚠️ Chụp được nhưng AI không trả lời");
      answerEl.textContent = response.error || "";
    }
  } catch (err) {
    console.error("LỖI:", err);
    setStatus("❌ " + err.message);
    answerEl.textContent = "Chi tiết lỗi: " + err.message;
  } finally {
    captureBtn.disabled = false;
  }
});

function setStatus(text) {
  statusEl.textContent = text;
}