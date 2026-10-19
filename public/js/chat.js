import { apiGet, apiPost, clearToken, clearUser, getUser } from "./api.js";

const messageStatus = document.querySelector("#message-status");
const messageList = document.querySelector("#message-list");
const messageForm = document.querySelector("#message-form");
const messageInput = document.querySelector("#message-input");

let isFirstLoad = true;
let isLoading = false;

function setStatus(message, isError = false) {
  if (!messageStatus) return;
  messageStatus.textContent = message;
  messageStatus.classList.toggle("status-error", isError);
}

function renderMessages(messages) {
  if (!messageList) return;

  const currentUser = getUser();
  const wasNearBottom =
    messageList.scrollHeight -
      messageList.scrollTop -
      messageList.clientHeight <
    100;

  messageList.replaceChildren();

  for (const message of messages) {
    const item = document.createElement("li");
    const heading = document.createElement("div");
    const sender = document.createElement("strong");
    const date = document.createElement("small");
    const body = document.createElement("p");

    if (currentUser && message.sender_id === currentUser.id) {
      item.classList.add("own");
    }

    sender.textContent = message.sender_name || "User";
    date.textContent = message.created_at
      ? new Date(message.created_at).toLocaleString()
      : "";
    body.textContent = message.body || "";

    heading.className = "chat-message-heading";
    heading.append(sender, date);
    item.append(heading, body);
    messageList.append(item);
  }

  if (wasNearBottom || isFirstLoad) {
    messageList.scrollTop = messageList.scrollHeight;
  }

  isFirstLoad = false;
}

async function loadMessages(showLoading = false) {
  if (isLoading) return;
  isLoading = true;

  if (showLoading) setStatus("Loading messages…");

  try {
    const data = await apiGet("/api/chat/public/messages");
    const messages = Array.isArray(data.messages) ? data.messages : [];

    renderMessages(messages);
    messageForm.hidden = false;
    setStatus(messages.length ? "" : "No messages yet. Start the conversation.");
  } catch (error) {
    setStatus(error.message || "Could not load messages.", true);
  } finally {
    isLoading = false;
  }
}

messageForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const body = messageInput.value.trim();
  if (!body) return;

  const sendButton = messageForm.querySelector('button[type="submit"]');
  sendButton.disabled = true;
  setStatus("Sending message…");

  try {
    await apiPost("/api/chat/public/messages", { body });
    messageInput.value = "";
    await loadMessages();
    messageInput.focus();
  } catch (error) {
    setStatus(error.message || "Could not send the message.", true);
  } finally {
    sendButton.disabled = false;
  }
});

document.querySelector("#logout-button")?.addEventListener("click", () => {
  clearToken();
  clearUser();
  window.location.href = "/login.html";
});

if (!localStorage.getItem("nearhelp_token")) {
  window.location.href = "/login.html";
} else {
  loadMessages(true);
  window.setInterval(() => loadMessages(), 8000);
}
