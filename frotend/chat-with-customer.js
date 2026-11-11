const API = "http://localhost:5000/api/chat";

const creator = JSON.parse(
    localStorage.getItem("loggedInCreator") || "null"
);

let conversations = [];
let currentConversationId = null;
let messagePolling = null;
let isLoadingMessages = false;


// =====================================================
// INITIALIZE
// =====================================================

document.addEventListener("DOMContentLoaded", async () => {

    if (!creator || !creator.id) {
        alert("Please login as a creator first.");
        window.location.href = "creator-auth.html";
        return;
    }

    document.getElementById("sendButton")
        .addEventListener("click", sendMessage);

    document.getElementById("emojiButton")
        .addEventListener("click", addEmoji);

    document.getElementById("messageInput")
        .addEventListener("keydown", event => {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
            }
        });

    document.getElementById("conversationSearch")
        .addEventListener("input", filterConversations);

    await loadCreatorConversations();

    // Refresh inbox periodically.
    messagePolling = setInterval(() => {
        loadCreatorConversations();

        if (currentConversationId) {
            loadMessages();
        }
    }, 4000);
});


// =====================================================
// LOAD CREATOR CONVERSATIONS
// =====================================================

async function loadCreatorConversations() {

    const list = document.getElementById("conversationList");

    try {

        const response = await fetch(
            `${API}/creator/${creator.id}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Unable to load conversations.");
        }

        conversations = data.conversations || [];

        document.getElementById("conversationCount").textContent =
            conversations.length;

        renderConversations();

    } catch (error) {

        console.error("Creator conversation error:", error);

        list.textContent =
            "Unable to load conversations. Please check your backend.";
    }
}


// =====================================================
// RENDER CONVERSATION LIST
// =====================================================

function renderConversations(filtered = conversations) {

    const list = document.getElementById("conversationList");

    list.replaceChildren();

    if (!filtered.length) {

        const empty = document.createElement("p");
        empty.className = "empty-list";
        empty.textContent = "No customer conversations yet.";

        list.appendChild(empty);
        return;
    }

    filtered.forEach(conversation => {

        const button = document.createElement("button");

        button.type = "button";
        button.className = "conversation-item";

        if (
            Number(conversation.conversation_id) ===
            Number(currentConversationId)
        ) {
            button.classList.add("active");
        }

        const avatar = document.createElement("div");
        avatar.className = "conversation-avatar";

        avatar.textContent =
            (conversation.customer_name || "C")
                .trim()
                .charAt(0)
                .toUpperCase();

        const details = document.createElement("div");
        details.className = "conversation-details";

        const name = document.createElement("strong");
        name.textContent = conversation.customer_name || "Customer";

        const craft = document.createElement("small");
        craft.textContent =
            conversation.craft_name || "General conversation";

        const lastMessage = document.createElement("div");
        lastMessage.className = "last-message";
        lastMessage.textContent =
            conversation.last_message || "No messages yet";

        details.append(name, craft, lastMessage);

        button.append(avatar, details);

        button.addEventListener("click", () => {
            openConversation(conversation);
        });

        list.appendChild(button);
    });
}


// =====================================================
// SEARCH CONVERSATIONS
// =====================================================

function filterConversations() {

    const search = document.getElementById("conversationSearch")
        .value.trim().toLowerCase();

    const filtered = conversations.filter(conversation => {

        const customerName =
            (conversation.customer_name || "").toLowerCase();

        const craftName =
            (conversation.craft_name || "").toLowerCase();

        return customerName.includes(search) ||
               craftName.includes(search);
    });

    renderConversations(filtered);
}


// =====================================================
// OPEN CONVERSATION
// =====================================================

async function openConversation(conversation) {

    currentConversationId = conversation.conversation_id;

    renderConversations();

    const customerName =
        conversation.customer_name || "Customer";

    document.getElementById("customerName").textContent =
        customerName;

    document.getElementById("customerAvatar").textContent =
        customerName.trim().charAt(0).toUpperCase();

    document.getElementById("customerStatus").textContent =
        "Customer conversation";

    document.getElementById("craftName").textContent =
        conversation.craft_name || "General conversation";

    document.getElementById("craftDetails").textContent =
        conversation.craft_category
            ? `${conversation.craft_category} | ₹${conversation.craft_price || 0}`
            : "General conversation";

    const craftContext = document.getElementById("craftContext");

    const oldImage = craftContext.querySelector("img");

    if (oldImage) {
        oldImage.remove();
    }

    const placeholder = craftContext.querySelector(".craft-placeholder");

    if (conversation.craft_image) {

        const image = document.createElement("img");

        image.src = conversation.craft_image;
        image.alt = conversation.craft_name || "Craft";
        image.onerror = () => {
            image.remove();
            placeholder.style.display = "flex";
        };

        placeholder.style.display = "none";

        craftContext.insertBefore(image, craftContext.children[1]);

    } else {
        placeholder.style.display = "flex";
    }

    document.getElementById("messageInput").disabled = false;
    document.getElementById("sendButton").disabled = false;
    document.getElementById("emojiButton").disabled = false;

    await loadMessages();

    document.getElementById("messageInput").focus();
}


// =====================================================
// LOAD MESSAGES
// =====================================================

async function loadMessages() {

    if (!currentConversationId || isLoadingMessages) return;

    isLoadingMessages = true;

    try {

        const response = await fetch(
            `${API}/conversations/${currentConversationId}/messages?creatorId=${creator.id}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Unable to load messages.");
        }

        // Prevent an older request from updating a newly selected chat.
        if (!currentConversationId) return;

        displayMessages(data.messages || []);

    } catch (error) {

        console.error("Load messages error:", error);

    } finally {
        isLoadingMessages = false;
    }
}


// =====================================================
// DISPLAY MESSAGES
// =====================================================

function displayMessages(messages) {

    const container = document.getElementById("chatMessages");

    const wasNearBottom =
        container.scrollHeight -
        container.scrollTop -
        container.clientHeight < 100;

    container.replaceChildren();

    if (!messages.length) {

        const empty = document.createElement("div");

        empty.className = "empty-chat";

        const heading = document.createElement("h3");
        heading.textContent = "Start the conversation";

        const description = document.createElement("p");
        description.textContent =
            "Send a message to answer the customer's questions.";

        empty.append(heading, description);

        container.appendChild(empty);

        return;
    }

    messages.forEach(item => {

        const wrapper = document.createElement("div");

        const isCreator = item.sender_type === "creator";

        wrapper.className =
            `message-row ${isCreator ? "creator-message" : "customer-message"}`;

        const content = document.createElement("div");
        content.className = "message-content";

        const bubble = document.createElement("div");
        bubble.className = "message-bubble";

        // textContent prevents message HTML from being executed.
        bubble.textContent = item.message;

        const time = document.createElement("span");
        time.className = "message-time";

        time.textContent =
            new Date(item.created_at).toLocaleString();

        content.append(bubble, time);
        wrapper.appendChild(content);

        container.appendChild(wrapper);
    });

    if (wasNearBottom) {
        container.scrollTop = container.scrollHeight;
    }
}


// =====================================================
// SEND CREATOR MESSAGE
// =====================================================

async function sendMessage() {

    const input = document.getElementById("messageInput");

    const message = input.value.trim();

    if (!message) return;

    if (!currentConversationId) {
        alert("Please select a customer conversation first.");
        return;
    }

    const sendButton = document.getElementById("sendButton");

    input.disabled = true;
    sendButton.disabled = true;

    try {

        const response = await fetch(
            `${API}/conversations/${currentConversationId}/messages`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    senderType: "creator",
                    senderId: creator.id,
                    message: message
                })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Message could not be sent.");
        }

        input.value = "";

        await loadMessages();
        await loadCreatorConversations();

    } catch (error) {

        console.error("Send message error:", error);

        alert(error.message);

    } finally {

        input.disabled = false;
        sendButton.disabled = false;
        input.focus();
    }
}


// =====================================================
// ADD EMOJI
// =====================================================

function addEmoji() {

    const input = document.getElementById("messageInput");

    if (input.disabled) return;

    input.value += " 😊";
    input.focus();
}


// =====================================================
// CLEANUP
// =====================================================

window.addEventListener("beforeunload", () => {

    if (messagePolling) {
        clearInterval(messagePolling);
    }

});
// =====================================================
// BACK TO ALL CONVERSATIONS
// =====================================================

function backToCreatorConversations() {

    currentConversationId = null;

    // Reset customer details
    document.getElementById("customerName").textContent =
        "Select a conversation";

    document.getElementById("customerAvatar").textContent = "C";

    document.getElementById("customerStatus").textContent =
        "Customer conversation";

    // Reset craft details
    document.getElementById("craftName").textContent =
        "No craft selected";

    document.getElementById("craftDetails").textContent =
        "Select a customer conversation to view details.";

    const craftContext = document.getElementById("craftContext");
    const oldImage = craftContext.querySelector("img");

    if (oldImage) {
        oldImage.remove();
    }

    const placeholder = craftContext.querySelector(".craft-placeholder");

    if (placeholder) {
        placeholder.style.display = "flex";
    }

    // Reset messages
    const messages = document.getElementById("chatMessages");

    messages.innerHTML = `
        <div class="empty-chat">
            <div class="empty-icon">✉</div>
            <h3>Welcome to Customer Chat</h3>
            <p>Select a conversation from the left to read and reply to customer messages.</p>
        </div>
    `;

    // Disable message input
    document.getElementById("messageInput").value = "";
    document.getElementById("messageInput").disabled = true;

    document.getElementById("sendButton").disabled = true;
    document.getElementById("emojiButton").disabled = true;

    // Remove active conversation highlight
    renderConversations();
}