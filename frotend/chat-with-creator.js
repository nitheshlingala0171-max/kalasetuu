
const API = "http://localhost:5000/api/chat";
const CRAFT_API = "http://localhost:5000/api/creators/admin/crafts";

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

    // Direct chat from Product Details
    if (currentCraftId) {
        await loadCraftDetails(currentCraftId);
    }

    // Load all previous conversations
    await loadCustomerConversations();

    // If opened from Product Details, open that creator directly
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
// SHOW CONVERSATION LIST OR CHAT SCREEN
// =====================================================

function createConversationListArea() {

    const listScreen = document.getElementById(
        "conversationListScreen"
    );

    const chatLayout = document.querySelector(".chat-layout");

    const params = new URLSearchParams(window.location.search);

    const hasDirectChat = params.has("creatorId");

    if (!listScreen || !chatLayout) return;

    if (hasDirectChat) {

        listScreen.style.display = "none";
        chatLayout.style.display = "";

    } else {

        listScreen.style.display = "block";
        chatLayout.style.display = "none";

    }
}


// =====================================================
// SHOW SELECTED CHAT
// =====================================================

function showChatScreen() {

    const listScreen = document.getElementById(
        "conversationListScreen"
    );

    const chatLayout = document.querySelector(".chat-layout");

    if (listScreen) {
        listScreen.style.display = "none";
    }

    if (chatLayout) {
        chatLayout.style.display = "";
    }
}


// =====================================================
// SHOW ALL CONVERSATIONS
// =====================================================

function showConversationList() {

    const listScreen = document.getElementById(
        "conversationListScreen"
    );

    const chatLayout = document.querySelector(".chat-layout");

    if (listScreen) {
        listScreen.style.display = "block";
    }

    if (chatLayout) {
        chatLayout.style.display = "none";
    }

    currentConversationId = null;

    if (messagePolling) {
        clearInterval(messagePolling);
        messagePolling = null;
    }
}


// =====================================================
// LOAD SELECTED CRAFT DETAILS
// =====================================================

async function loadCraftDetails(craftId) {

    if (!craftId) return;

    try {

        const response = await fetch(CRAFT_API);
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error("Unable to load craft details.");
        }

        const craft = data.crafts.find(item =>
            String(item.id) === String(craftId) &&
            item.status === "Approved"
        );

        if (!craft) {
            console.error("Selected craft not found:", craftId);
            return;
        }

        // Product image
        const productImage = document.querySelector(
            ".product-card .product-image img"
        );

        if (productImage) {
            productImage.src =
                craft.image || "images/kalasetu-logo.png";

            productImage.alt = craft.name || "Craft";
        }

        // Product name
        const productName = document.querySelector(
            ".product-card .product-info h3"
        );

        if (productName) {
            productName.textContent =
                craft.name || "Handmade Craft";
        }

        // Product category
        const productCategory = document.querySelector(
            ".product-card .product-info p"
        );

        if (productCategory) {
            productCategory.textContent =
                craft.category || "Handmade Craft";
        }

        // Product price
        const productPrice = document.querySelector(
            ".product-card .product-info strong"
        );

        if (productPrice) {
            productPrice.textContent =
                "₹" + Number(craft.price || 0).toLocaleString("en-IN");
        }

        // Creator name in left panel
        const creatorName = document.querySelector(
            ".creator-card .creator-info h3"
        );

        if (creatorName) {
            creatorName.textContent =
                craft.creator_name || "Local Artisan";
        }

        // Creator avatar
        const creatorAvatar = document.querySelector(
            ".creator-card .creator-avatar"
        );

        if (creatorAvatar) {
            creatorAvatar.textContent =
                (craft.creator_name || "A").charAt(0).toUpperCase();
        }

        // Chat header creator name
        const chatCreatorName = document.querySelector(
            ".chat-person h2"
        );

        if (chatCreatorName) {
            chatCreatorName.textContent =
                craft.creator_name || "Local Artisan";
        }

        // Chat header avatar
        const chatAvatar = document.querySelector(
            ".small-avatar"
        );

        if (chatAvatar) {
            chatAvatar.textContent =
                (craft.creator_name || "A").charAt(0).toUpperCase();
        }

    } catch (error) {

        console.error("Craft Details Error:", error);

    }
}


// =====================================================
// LOAD CUSTOMER CONVERSATIONS
// =====================================================

async function loadCustomerConversations() {

    const container = document.getElementById(
        "conversationItems"
    );

    if (!container) return;

    try {

        const response = await fetch(
            `${API}/customer/${customer.id}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || "Unable to load conversations."
            );
        }

        container.replaceChildren();

        const conversations = data.conversations || [];

        if (conversations.length === 0) {

            const emptyMessage = document.createElement("p");

            emptyMessage.textContent =
                "No conversations yet. Open a craft and chat with its creator.";

            emptyMessage.style.cssText = `
                padding:20px;
                color:#777;
                text-align:center;
            `;

            container.appendChild(emptyMessage);
            return;
        }

        conversations.forEach(conversation => {

            const button = document.createElement("button");

            button.type = "button";

            button.style.cssText = `
                display:block;
                width:100%;
                padding:14px;
                margin-bottom:10px;
                text-align:left;
                border:1px solid #e5cbb5;
                border-radius:10px;
                background:#fff;
                cursor:pointer;
                transition:background 0.2s;
            `;

            const creatorName = document.createElement("strong");

            creatorName.textContent =
                conversation.creator_name || "Creator";

            creatorName.style.cssText = `
                display:block;
                color:#593b2e;
                font-size:15px;
            `;

            const details = document.createElement("div");

            details.textContent =
                conversation.craft_name || "General conversation";

            details.style.cssText = `
                font-size:13px;
                color:#9b6245;
                margin-top:5px;
            `;

            const lastMessage = document.createElement("div");

            lastMessage.textContent =
                conversation.last_message || "No messages yet";

            lastMessage.style.cssText = `
                font-size:12px;
                color:#777;
                margin-top:6px;
            `;

            button.append(
                creatorName,
                details,
                lastMessage
            );

            button.addEventListener("click", async () => {

                currentCreatorId = conversation.creator_id;
                currentCraftId = conversation.craft_id;

                showChatScreen();

                if (currentCraftId) {
                    await loadCraftDetails(currentCraftId);
                }

                await openConversation(
                    conversation.conversation_id
                );

            });

            container.appendChild(button);

        });

    } catch (error) {

        console.error("Conversation list error:", error);

        container.textContent =
            "Unable to load conversations. Please refresh.";

    }
}


// =====================================================
// CREATE OR OPEN CONVERSATION
// =====================================================

async function openOrCreateConversation(
    creatorId,
    craftId = null
) {

    try {

        const response = await fetch(
            `${API}/conversations`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    customerId: customer.id,
                    creatorId,
                    craftId
                })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || "Unable to open conversation."
            );
        }

        showChatScreen();

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

    messagePolling = setInterval(() => {
        loadMessages();
    }, 4000);

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
            throw new Error(
                data.message || "Unable to load messages."
            );
        }

        const container = document.getElementById(
            "chatMessages"
        );

        if (!container) return;

        const wasNearBottom =
            container.scrollHeight -
            container.scrollTop -
            container.clientHeight < 100;

        container.replaceChildren();

        if (!data.messages || data.messages.length === 0) {

            const empty = document.createElement("p");

            empty.textContent = "Start your conversation!";

            empty.style.cssText = `
                text-align:center;
                color:#888;
                padding:20px;
            `;

            container.appendChild(empty);

        }

        (data.messages || []).forEach(item => {
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
// DISPLAY MESSAGE
// =====================================================

function addMessageToScreen(item) {

    const container = document.getElementById(
        "chatMessages"
    );

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

    time.style.cssText = `
        display:block;
        margin-top:5px;
        color:#777;
        font-size:10px;
    `;

    time.textContent =
        new Date(item.created_at).toLocaleString();

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
            throw new Error(
                data.message || "Message could not be sent."
            );
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
// QUICK QUESTIONS
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
function backToConversations() {
    showConversationList();
    loadCustomerConversations();
}