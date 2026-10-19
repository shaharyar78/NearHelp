import { apiPost } from "./api.js";

const form = document.querySelector("#assistant-form");
const questionInput = document.querySelector("#assistant-question");
const status = document.querySelector("#assistant-status");

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = form.querySelector('button[type="submit"]');
  const question = questionInput.value.trim();
  if (!question) return;

  button.disabled = true;
  status.textContent = "Thinking…";
  status.classList.remove("assistant-error");
  try {
    const data = await apiPost("/api/assistant/ask", { question });
    status.textContent = data.answer;
  } catch (error) {
    status.textContent = error.message || "The assistant could not respond. Please try again.";
    status.classList.add("assistant-error");
  } finally {
    button.disabled = false;
  }
});
