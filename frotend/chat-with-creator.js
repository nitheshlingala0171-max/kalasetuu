
const API = "http://localhost:5000/api/chat";

const customer = JSON.parse(
    localStorage.getItem("customerAccount") || "null"
);

let currentConversationId = null;
let currentCreatorId = null;
let currentCraftId = null;
let messagePolling = null;

// =====================================================
// INITIALIZE
// =====================================================

document.addEventListener("DOMContentLoaded", async () => {
    if (!customer || !customer.id) {
        alert("Please login as a customer first.");
        window.location.href = "customer-login.html";
        return;
    }

    createConversationListArea();

    const params = new URLSearchParams(window.location.search);

    currentCreatorId = params.get("creatorId");
    currentCraftId = params.get("craftId");

    await loadCustomerConversations();

    // Open a conversation directly when creatorId is supplied.
    if (currentCreatorId) {
        await openOrCreateConversation(
            Number(currentCreatorId),
            currentCraftId ? Number(currentCraftId) : null
        );
    }

    const input = document.getElementById("messageInput");

    if (input) {
        input.addEventListener("keydown", event => {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
            }
        });
    }
});


// =====================================================
// CONVERSATION LIST AREA
// =====================================================

function createConversationListArea() {
    if (document.getElementById("customerConversationList")) return;

    const area = document.createElement("section");

    area.id = "customerConversationList";

    area.style.cssText = `
        padding: 12px;
        margin-bottom: 12px;
        border-bottom: 1px solid #ddd;
        max-height: 220px;
        overflow-y: auto;
    `;

    area.innerHTML = `
        <h3 style="margin:0 0 10px;color:#245b35;">
            Your Conversations
        </h3>
        <div id="conversationItems">
            Loading conversations...
        </div>
    `;

    const messages = document.getElementById("chatMessages");

    if (messages && messages.parentElement) {
        messages.parentElement.insertBefore(area, messages);
    } else {
        document.body.prepend(area);
    }
}


// =====================================================
// LOAD CUSTOMER CONVERSATIONS
// =====================================================

async function loadCustomerConversations() {
    const container = document.getElementById("conversationItems");

    if (!container) return;

    try {
        const response = await fetch(
            `${API}/customer/${customer.id}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Unable to load conversations.");
        }

        container.replaceChildren();

        if (!data.conversations.length) {
            container.textContent = "No conversations yet.";
            return;
        }

        data.conversations.forEach(conversation => {
            const button = document.createElement("button");

            button.type = "button";
            button.style.cssText = `
                display:block;
                width:100%;
                padding:10px;
                margin-bottom:7px;
                text-align:left;
                border:1px solid #ddd;
                border-radius:8px;
                background:#fff;
                cursor:pointer;
            `;

            const creatorName = document.createElement("strong");
            creatorName.textContent = conversation.creator_name || "Creator";

            const details = document.createElement("div");
            details.style.cssText = "font-size:12px;color:#777;margin-top:4px;";
            details.textContent =
                conversation.craft_name || "General conversation";

            const lastMessage = document.createElement("div");
            lastMessage.style.cssText = "font-size:12px;margin-top:4px;";
            lastMessage.textContent =
                conversation.last_message || "No messages yet";

            button.append(creatorName, details, lastMessage);

            button.addEventListener("click", () => {
                currentCreatorId = conversation.creator_id;
                currentCraftId = conversation.craft_id;
                openConversation(conversation.conversation_id);
            });

            container.appendChild(button);
        });

    } catch (error) {
        console.error("Conversation list error:", error);
        container.textContent = "Unable to load conversations. Please refresh.";
    }
}


// =====================================================
// CREATE OR OPEN CONVERSATION
// =====================================================

async function openOrCreateConversation(creatorId, craftId = null) {
    try {
        const response = await fetch(`${API}/conversations`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                customerId: customer.id,
                creatorId,
                craftId
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Unable to open conversation.");
        }

        await loadCustomerConversations();

        await openConversation(data.conversation.id);

    } catch (error) {
        console.error("Open conversation error:", error);
        alert(error.message);
    }
}


// =====================================================
// OPEN EXISTING CONVERSATION
// =====================================================

async function openConversation(conversationId) {
    currentConversationId = conversationId;

    const messages = document.getElementById("chatMessages");

    if (messages) {
        messages.replaceChildren();
        messages.textContent = "Loading messages...";
    }

    await loadMessages();

    if (messagePolling) {
        clearInterval(messagePolling);
    }

    // Refresh messages periodically to receive creator replies.
    messagePolling = setInterval(loadMessages, 4000);
}


// =====================================================
// LOAD MESSAGES
// =====================================================

async function loadMessages() {
    if (!currentConversationId) return;

    try {
        const response = await fetch(
            `${API}/conversations/${currentConversationId}/messages?customerId=${customer.id}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Unable to load messages.");
        }

        const container = document.getElementById("chatMessages");

        if (!container) return;

        const wasNearBottom =
            container.scrollHeight - container.scrollTop -
            container.clientHeight < 100;

        container.replaceChildren();

        if (!data.messages.length) {
            const empty = document.createElement("p");
            empty.textContent = "Start your conversation!";
            container.appendChild(empty);
        }

        data.messages.forEach(item => {
            addMessageToScreen(item);
        });

        if (wasNearBottom) {
            container.scrollTop = container.scrollHeight;
        }

    } catch (error) {
        console.error("Load messages error:", error);
    }
}


// =====================================================
// DISPLAY MESSAGE SAFELY
// =====================================================

function addMessageToScreen(item) {
    const container = document.getElementById("chatMessages");

    if (!container) return;

    const wrapper = document.createElement("div");

    const isCustomer = item.sender_type === "customer";

    wrapper.style.cssText = `
        display:flex;
        justify-content:${isCustomer ? "flex-end" : "flex-start"};
        margin:10px 0;
    `;

    const bubble = document.createElement("div");

    bubble.style.cssText = `
        max-width:75%;
        padding:10px 14px;
        border-radius:12px;
        background:${isCustomer ? "#e3f2cd" : "#f1f1f1"};
        color:#222;
        overflow-wrap:anywhere;
    `;

    const messageText = document.createElement("div");
    messageText.textContent = item.message;

    const time = document.createElement("small");
    time.style.cssText = "display:block;margin-top:5px;color:#777;font-size:10px;";
    time.textContent = new Date(item.created_at).toLocaleString();

    bubble.append(messageText, time);
    wrapper.appendChild(bubble);
    container.appendChild(wrapper);
}


// =====================================================
// SEND CUSTOMER MESSAGE
// =====================================================

async function sendMessage() {
    const input = document.getElementById("messageInput");

    if (!input) return;

    const message = input.value.trim();

    if (!message) return;

    if (!currentConversationId) {
        alert("Please select a creator conversation first.");
        return;
    }

    input.disabled = true;

    try {
        const response = await fetch(
            `${API}/conversations/${currentConversationId}/messages`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    senderType: "customer",
                    senderId: customer.id,
                    message
                })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Message could not be sent.");
        }

        input.value = "";

        await loadMessages();
        await loadCustomerConversations();

    } catch (error) {
        console.error("Send message error:", error);
        alert(error.message);
    } finally {
        input.disabled = false;
        input.focus();
    }
}


// =====================================================
// QUICK MESSAGES
// =====================================================

function sendQuickMessage(message) {
    const input = document.getElementById("messageInput");

    if (!input) return;

    input.value = message;
    sendMessage();
}


// =====================================================
// EMOJI
// =====================================================

function addEmoji() {
    const input = document.getElementById("messageInput");

    if (!input) return;

    input.value += " 😊";
    input.focus();
}


// =====================================================
// CONTACT CREATOR
// =====================================================

function contactCreator() {
    if (!currentConversationId) {
        alert("Please select a conversation first.");
        return;
    }

    alert("You can contact the creator through this chat.");
}


// =====================================================
// CLEANUP
// =====================================================

window.addEventListener("beforeunload", () => {
    if (messagePolling) {
        clearInterval(messagePolling);
    }
});
