
const API_BASE = "http://localhost:5000/api/customers";

const refundTableBody = document.getElementById("refundTableBody");
const refundMessage = document.getElementById("refundMessage");

async function loadRefunds() {
    refundMessage.textContent = "Loading refund requests...";

    try {
        const response = await fetch(`${API_BASE}/admin/refunds`);
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Unable to load refunds.");
        }

        const refunds = data.refunds || [];

        document.getElementById("totalRefunds").textContent = refunds.length;
        document.getElementById("pendingRefunds").textContent =
            refunds.filter(r => r.status === "Pending").length;
        document.getElementById("approvedRefunds").textContent =
            refunds.filter(r => r.status === "Approved").length;
        document.getElementById("rejectedRefunds").textContent =
            refunds.filter(r => r.status === "Rejected").length;

        refundTableBody.innerHTML = "";

        if (refunds.length === 0) {
            refundMessage.textContent = "No refund requests found.";
            refundTableBody.innerHTML =
                `<tr><td colspan="8">No refund requests available.</td></tr>`;
            return;
        }

        refundMessage.textContent = `${refunds.length} refund request(s) found.`;

        refunds.forEach(refund => {
            const row = document.createElement("tr");

            const statusClass = String(refund.status || "")
                .toLowerCase()
                .replace(/[^a-z]/g, "");

            const date = refund.requested_at
                ? new Date(refund.requested_at).toLocaleDateString()
                : "-";

            const reason = escapeHTML(refund.reason || "-");
            const customer = escapeHTML(refund.customer_name || "Customer");
            const status = escapeHTML(refund.status || "Pending");
            const paymentStatus = refund.payment_status || "Not Processed";

            let actionHTML = "-";

            if (refund.status === "Pending") {
                actionHTML = `
                    <div class="action-buttons">
                        <button class="approve-btn"
                            onclick="updateRefund(${refund.id}, 'Approved')">
                            Approve
                        </button>

                        <button class="reject-btn"
                            onclick="updateRefund(${refund.id}, 'Rejected')">
                            Reject
                        </button>
                    </div>
                `;
            } else if (
                refund.status === "Approved" &&
                paymentStatus !== "Processed"
            ) {
                actionHTML = `
                    <button class="approve-btn"
                        onclick="processRefundPayment(${refund.id})">
                        Mark as Processed
                    </button>
                `;
            } else if (paymentStatus === "Processed") {
                actionHTML = `
                    <span class="status approved">Processed</span>
                `;
            }

            row.innerHTML = `
                <td>${refund.id}</td>

                <td>
                    <strong>${customer}</strong><br>
                    <small>${escapeHTML(refund.customer_contact || "")}</small>
                </td>

                <td>${refund.order_id}</td>

                <td>₹${Number(refund.total_price || 0).toFixed(2)}</td>

                <td>${reason}</td>

                <td>${date}</td>

                <td>
                    <span class="status ${statusClass}">${status}</span>
                    <br>
                    <small>Payment: ${escapeHTML(paymentStatus)}</small>
                </td>

                <td>${actionHTML}</td>
            `;

            refundTableBody.appendChild(row);
        });

    } catch (error) {
        console.error("Refund loading error:", error);
        refundMessage.textContent = error.message;
        refundTableBody.innerHTML =
            `<tr><td colspan="8">Unable to load refund requests.</td></tr>`;
    }
}


// APPROVE OR REJECT REFUND

async function updateRefund(refundId, status) {
    const action = status === "Approved" ? "approve" : "reject";

    if (!confirm(`Are you sure you want to ${action} this refund request?`)) {
        return;
    }

    const adminNote = prompt("Enter admin note (optional):") || "";

    try {
        const response = await fetch(
            `${API_BASE}/admin/refunds/${refundId}/status`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    status: status,
                    adminNote: adminNote
                })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Unable to update refund.");
        }

        alert(data.message || "Refund status updated.");
        await loadRefunds();

    } catch (error) {
        console.error("Refund update error:", error);
        alert(error.message);
    }
}


// MARK REFUND PAYMENT AS PROCESSED

async function processRefundPayment(refundId) {
    const confirmed = confirm(
        "Mark this refund payment as Processed? This is a demo status update, not an actual bank transfer."
    );

    if (!confirmed) return;

    try {
        const response = await fetch(
            `${API_BASE}/admin/refunds/${refundId}/payment-status`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Unable to process refund.");
        }

        alert(data.message || "Refund marked as processed.");
        await loadRefunds();

    } catch (error) {
        console.error("Refund payment error:", error);
        alert(error.message);
    }
}


function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

document.addEventListener("DOMContentLoaded", loadRefunds);
