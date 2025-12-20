const backendURL = "http://localhost:8000/api/chat";
const modelName = "eunwoo";


let appData = JSON.parse(localStorage.getItem("kpop_ai")) || {
  chats: {},
  activeChat: null
};

const chatEl = document.getElementById("chat");
const promptEl = document.getElementById("prompt");
const sendBtn = document.getElementById("send");
const statusEl = document.getElementById("status");
const chatListEl = document.getElementById("chatList");

const newChatBtn = document.getElementById("newChat");
const clearBtn = document.getElementById("clearChat");
const toggleBtn = document.getElementById("toggleTheme");
const body = document.body;



function saveApp() {
  localStorage.setItem("kpop_ai", JSON.stringify(appData));
}

function createChat() {
  const id = Date.now().toString();
  appData.chats[id] = [];
  appData.activeChat = id;
  saveApp();
}

if (!appData.activeChat) createChat();



function renderMessage(role, content) {
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  div.textContent = content;
  chatEl.appendChild(div);
  chatEl.scrollTop = chatEl.scrollHeight;
}

function loadChat() {
  chatEl.innerHTML = "";
  appData.chats[appData.activeChat].forEach(m =>
    renderMessage(m.role, m.content)
  );
}

function renderChatList() {
  chatListEl.innerHTML = "";
  for (const id in appData.chats) {
    const div = document.createElement("div");
    div.className = "chat-item";
    div.textContent = "Chat " + id.slice(-4);
    div.onclick = () => {
      appData.activeChat = id;
      saveApp();
      loadChat();
    };
    chatListEl.appendChild(div);
  }
}

loadChat();
renderChatList();



async function sendMessage() {
  const text = promptEl.value.trim();
  if (!text) return;

  const messages = appData.chats[appData.activeChat];

  messages.push({ role: "user", content: text });
  saveApp();
  renderMessage("user", text);
  promptEl.value = "";

  const assistantDiv = document.createElement("div");
  assistantDiv.className = "msg assistant";
  chatEl.appendChild(assistantDiv);

 
  statusEl.style.display = "block";

  const payload = {
    model: modelName,
    messages,
    stream: true
  };

  const resp = await fetch(backendURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let assistantText = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n").filter(Boolean);

    for (const line of lines) {
      try {
        const obj = JSON.parse(line);
        if (obj?.message?.content) {
          assistantText += obj.message.content;
          assistantDiv.textContent += obj.message.content;
        }
        if (obj?.done) {
          messages.push({ role: "assistant", content: assistantText });
          saveApp();
        }
      } catch {}
    }
  }

  
  statusEl.style.display = "none";
}



sendBtn.onclick = sendMessage;

promptEl.addEventListener("keydown", e => {
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) sendMessage();
});

newChatBtn.onclick = () => {
  createChat();
  renderChatList();
  loadChat();
};

clearBtn.onclick = () => {
  appData.chats[appData.activeChat] = [];
  saveApp();
  loadChat();
};



if (localStorage.getItem("theme") === "dark") {
  body.classList.add("dark");
  toggleBtn.textContent = "☀️ Light Mode";
}

toggleBtn.onclick = () => {
  body.classList.toggle("dark");
  localStorage.setItem(
    "theme",
    body.classList.contains("dark") ? "dark" : "light"
  );
  toggleBtn.textContent = body.classList.contains("dark")
    ? "☀️ Light Mode"
    : "🌙 Dark Mode";
};
