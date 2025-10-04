// Global variables
let currentEmails = [];
let selectedEmails = new Set();

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadSenders();
    checkConnection();
    loadStats();
});

// Tab functionality
function showTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => tab.classList.remove('active'));
    
    // Remove active class from all tab buttons
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => button.classList.remove('active'));
    
    // Show selected tab content
    document.getElementById(tabName + '-tab').classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
    
    // Load data for the active tab
    if (tabName === 'emails') {
        loadEmails();
    } else if (tabName === 'stats') {
        loadStats();
    }
}

// Sender management functions
async function loadSenders() {
    try {
        showLoading();
        const response = await fetch('/api/senders');
        const data = await response.json();
        
        if (data.success) {
            displaySenders(data.senders);
        } else {
            showError('Failed to load senders: ' + data.error);
        }
    } catch (error) {
        showError('Error loading senders: ' + error.message);
    } finally {
        hideLoading();
    }
}

function displaySenders(senders) {
    const senderList = document.getElementById('senderList');
    
    if (senders.length === 0) {
        senderList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No senders added yet. Add an email address above to get started.</p>';
        return;
    }
    
    senderList.innerHTML = senders.map(sender => `
        <div class="list-item">
            <div class="sender-item">
                <span class="sender-email">${sender}</span>
                <button onclick="removeSender('${sender}')" class="btn btn-danger" style="padding: 8px 12px; font-size: 0.9rem;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

async function addSender() {
    const emailInput = document.getElementById('senderEmail');
    const email = emailInput.value.trim();
    
    if (!email) {
        showError('Please enter an email address');
        return;
    }
    
    if (!isValidEmail(email)) {
        showError('Please enter a valid email address');
        return;
    }
    
    try {
        showLoading();
        const response = await fetch('/api/senders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (data.success) {
            emailInput.value = '';
            loadSenders();
            showSuccess(data.message);
        } else {
            showError(data.message || 'Failed to add sender');
        }
    } catch (error) {
        showError('Error adding sender: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function removeSender(email) {
    if (!confirm(`Are you sure you want to remove ${email} from the sender list?`)) {
        return;
    }
    
    try {
        showLoading();
        const response = await fetch(`/api/senders/${encodeURIComponent(email)}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadSenders();
            showSuccess(data.message);
        } else {
            showError(data.message || 'Failed to remove sender');
        }
    } catch (error) {
        showError('Error removing sender: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Email management functions
async function loadEmails() {
    const daysOld = document.getElementById('daysOld').value;
    
    try {
        showLoading();
        const response = await fetch(`/api/emails?daysOld=${daysOld}`);
        const data = await response.json();
        
        if (data.success) {
            currentEmails = data.emails;
            displayEmails(data.emails);
            updateDeleteButton();
        } else {
            showError('Failed to load emails: ' + data.error);
        }
    } catch (error) {
        showError('Error loading emails: ' + error.message);
    } finally {
        hideLoading();
    }
}

function displayEmails(emails) {
    const emailList = document.getElementById('emailList');
    
    if (emails.length === 0) {
        emailList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No emails found matching your criteria. Try adjusting the time filter or add more senders to your list.</p>';
        return;
    }
    
    emailList.innerHTML = emails.map(email => `
        <div class="list-item email-item-container" data-uid="${email.uid}">
            <input type="checkbox" class="email-checkbox" onchange="toggleEmailSelection(${email.uid})">
            <div class="email-item">
                <div class="email-info">
                    <div class="email-from">${email.from}</div>
                    <div class="email-subject">${email.subject}</div>
                    <div class="email-date">${formatDate(email.date)}</div>
                </div>
                <div class="email-age">${email.daysOld} days old</div>
            </div>
        </div>
    `).join('');
}

function toggleEmailSelection(uid) {
    const emailItem = document.querySelector(`[data-uid="${uid}"]`);
    const checkbox = emailItem.querySelector('.email-checkbox');
    
    if (checkbox.checked) {
        selectedEmails.add(uid);
        emailItem.classList.add('selected');
    } else {
        selectedEmails.delete(uid);
        emailItem.classList.remove('selected');
    }
    
    updateDeleteButton();
}

function selectAllEmails() {
    selectedEmails.clear();
    currentEmails.forEach(email => {
        selectedEmails.add(email.uid);
        const emailItem = document.querySelector(`[data-uid="${email.uid}"]`);
        const checkbox = emailItem.querySelector('.email-checkbox');
        checkbox.checked = true;
        emailItem.classList.add('selected');
    });
    updateDeleteButton();
}

function deselectAllEmails() {
    selectedEmails.clear();
    currentEmails.forEach(email => {
        const emailItem = document.querySelector(`[data-uid="${email.uid}"]`);
        const checkbox = emailItem.querySelector('.email-checkbox');
        checkbox.checked = false;
        emailItem.classList.remove('selected');
    });
    updateDeleteButton();
}

function updateDeleteButton() {
    const deleteBtn = document.getElementById('deleteBtn');
    const selectedCount = document.getElementById('selectedCount');
    
    selectedCount.textContent = selectedEmails.size;
    deleteBtn.disabled = selectedEmails.size === 0;
}

function deleteSelectedEmails() {
    if (selectedEmails.size === 0) {
        showError('Please select emails to delete');
        return;
    }
    
    const count = selectedEmails.size;
    document.getElementById('confirmMessage').textContent = 
        `Are you sure you want to delete ${count} email${count > 1 ? 's' : ''}? This action cannot be undone.`;
    
    showModal();
}

async function confirmDelete() {
    const emailUids = Array.from(selectedEmails);
    
    try {
        showLoading();
        closeModal();
        
        const response = await fetch('/api/emails/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ emailUids })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess(`Successfully deleted ${data.deletedCount} email${data.deletedCount > 1 ? 's' : ''}`);
            selectedEmails.clear();
            loadEmails(); // Reload the email list
        } else {
            showError('Failed to delete emails: ' + data.error);
        }
    } catch (error) {
        showError('Error deleting emails: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Statistics functions
async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        
        if (data.success) {
            displayStats(data.stats);
        } else {
            console.error('Failed to load stats:', data.error);
        }
    } catch (error) {
        console.error('Error loading stats:', error.message);
    }
}

function displayStats(stats) {
    document.getElementById('totalSenders').textContent = stats.totalSenders;
    document.getElementById('totalEmails').textContent = stats.totalEmails;
    
    const emailsBySender = document.getElementById('emailsBySender');
    
    if (Object.keys(stats.emailsBySender).length === 0) {
        emailsBySender.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No emails found from senders in your list.</p>';
        return;
    }
    
    emailsBySender.innerHTML = Object.entries(stats.emailsBySender)
        .sort(([,a], [,b]) => b - a)
        .map(([sender, count]) => `
            <div class="sender-stat-item">
                <span class="sender-email">${sender}</span>
                <span class="email-count">${count} email${count > 1 ? 's' : ''}</span>
            </div>
        `).join('');
}

// Connection status
async function checkConnection() {
    const statusElement = document.getElementById('connectionStatus');
    
    try {
        const response = await fetch('/api/test-connection');
        const data = await response.json();
        
        if (data.success) {
            statusElement.className = 'connection-status connected';
            statusElement.innerHTML = '<i class="fas fa-circle"></i><span>Connected</span>';
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        statusElement.className = 'connection-status error';
        statusElement.innerHTML = '<i class="fas fa-circle"></i><span>Connection Error</span>';
    }
}

// Modal functions
function showModal() {
    document.getElementById('confirmModal').classList.add('show');
}

function closeModal() {
    document.getElementById('confirmModal').classList.remove('show');
}

// Utility functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function showLoading() {
    document.getElementById('loadingOverlay').classList.add('show');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('show');
}

function showSuccess(message) {
    // Create a temporary success message
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4caf50;
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 1002;
        animation: slideIn 0.3s ease;
    `;
    successDiv.innerHTML = `<i class="fas fa-check"></i> ${message}`;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

function showError(message) {
    // Create a temporary error message
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f44336;
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 1002;
        animation: slideIn 0.3s ease;
    `;
    errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Add CSS animation for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Handle Enter key in email input
document.getElementById('senderEmail').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addSender();
    }
});
