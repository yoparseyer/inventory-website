// Global variables
let currentUser = null;
let inventoryData = [];
let businessCategories = {
    restaurant: ['Meat & Poultry', 'Vegetables', 'Dairy', 'Beverages', 'Spices & Seasonings', 'Frozen Items', 'Dry Goods'],
    hardware: ['Tools', 'Fasteners', 'Electrical', 'Plumbing', 'Paint & Supplies', 'Safety Equipment', 'Hardware'],
    pharmacy: ['Prescription Drugs', 'OTC Medications', 'Vitamins & Supplements', 'Medical Supplies', 'Personal Care', 'First Aid'],
    retail: ['Clothing', 'Electronics', 'Home & Garden', 'Sports & Outdoors', 'Books & Media', 'Toys & Games', 'Accessories'],
    grocery: ['Fresh Produce', 'Meat & Seafood', 'Dairy & Eggs', 'Bakery', 'Frozen Foods', 'Pantry Items', 'Beverages'],
    warehouse: ['Raw Materials', 'Finished Goods', 'Packaging', 'Equipment', 'Supplies', 'Components'],
    other: ['General Items', 'Supplies', 'Equipment', 'Materials', 'Products']
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadUserData();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);

    // Registration form
    document.getElementById('registerForm').addEventListener('submit', handleRegistration);

    // Add item form
    document.getElementById('addItemForm').addEventListener('submit', handleAddItem);

    // Settings form
    document.getElementById('settingsForm').addEventListener('submit', handleSettings);

    // Business type change
    document.getElementById('businessType').addEventListener('change', updateCategoriesOnRegistration);

    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
}

// Modal functions
function showLogin() {
    closeAllModals();
    document.getElementById('loginModal').style.display = 'block';
}

function showRegister() {
    closeAllModals();
    document.getElementById('registerModal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => modal.style.display = 'none');
}

// Authentication functions
function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // Simulate login (in real app, this would be an API call)
    const users = JSON.parse(localStorage.getItem('inventoryUsers') || '[]');
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        showNotification('Login successful!', 'success');
        showDashboard();
        closeModal('loginModal');
    } else {
        showNotification('Invalid email or password', 'error');
    }
}

function handleRegistration(event) {
    event.preventDefault();

    const formData = {
        businessName: document.getElementById('businessName').value,
        businessType: document.getElementById('businessType').value,
        ownerName: document.getElementById('ownerName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        password: document.getElementById('password').value,
        confirmPassword: document.getElementById('confirmPassword').value,
        registrationDate: new Date().toISOString(),
        id: Date.now().toString()
    };

    // Validation
    if (formData.password !== formData.confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }

    // Check if email already exists
    const users = JSON.parse(localStorage.getItem('inventoryUsers') || '[]');
    if (users.find(u => u.email === formData.email)) {
        showNotification('Email already registered', 'error');
        return;
    }

    // Save user
    users.push(formData);
    localStorage.setItem('inventoryUsers', JSON.stringify(users));

    // Auto login
    currentUser = formData;
    localStorage.setItem('currentUser', JSON.stringify(formData));

    showNotification('Registration successful!', 'success');
    showDashboard();
    closeModal('registerModal');
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    document.getElementById('dashboard').style.display = 'none';
    document.querySelector('.hero').style.display = 'block';
    document.querySelector('.features').style.display = 'block';
    showNotification('Logged out successfully', 'success');
}

// Dashboard functions
function showDashboard() {
    document.querySelector('.hero').style.display = 'none';
    document.querySelector('.features').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';

    // Update dashboard header
    document.getElementById('businessNameDisplay').textContent = currentUser.businessName;
    document.getElementById('userNameDisplay').textContent = currentUser.ownerName;

    // Load user's inventory
    loadInventory();
    updateCategories();
    updateReports();
    loadSettings();
}

function showTab(tabName) {
    // Hide all tabs
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));

    // Remove active class from all buttons
    const buttons = document.querySelectorAll('.tab-button');
    buttons.forEach(btn => btn.classList.remove('active'));

    // Show selected tab
    document.getElementById(tabName + '-tab').classList.add('active');
    event.target.classList.add('active');
}

// Inventory management
function loadInventory() {
    const userInventory = JSON.parse(localStorage.getItem(`inventory_${currentUser.id}`) || '[]');
    inventoryData = userInventory;
    displayInventory();
}

function displayInventory() {
    const tbody = document.getElementById('inventoryTableBody');
    tbody.innerHTML = '';

    inventoryData.forEach((item, index) => {
        const status = getItemStatus(item);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>${item.quantity} ${item.unit}</td>
            <td>$${parseFloat(item.price).toFixed(2)}</td>
            <td>$${(item.quantity * item.price).toFixed(2)}</td>
            <td><span class="status-badge status-${status.class}">${status.text}</span></td>
            <td>
                <button class="action-btn btn-edit" onclick="editItem(${index})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn btn-delete" onclick="deleteItem(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function getItemStatus(item) {
    if (item.quantity === 0) {
        return { class: 'out-of-stock', text: 'Out of Stock' };
    } else if (item.quantity <= item.minStock) {
        return { class: 'low-stock', text: 'Low Stock' };
    } else {
        return { class: 'in-stock', text: 'In Stock' };
    }
}

function handleAddItem(event) {
    event.preventDefault();

    const newItem = {
        name: document.getElementById('itemName').value,
        category: document.getElementById('itemCategory').value,
        quantity: parseInt(document.getElementById('itemQuantity').value),
        unit: document.getElementById('itemUnit').value,
        price: parseFloat(document.getElementById('itemPrice').value),
        minStock: parseInt(document.getElementById('minStock').value),
        description: document.getElementById('itemDescription').value,
        dateAdded: new Date().toISOString(),
        id: Date.now().toString()
    };

    // Add expiration date and batch number for applicable business types
    if (['restaurant', 'pharmacy', 'grocery'].includes(currentUser.businessType)) {
        newItem.expirationDate = document.getElementById('expirationDate').value;
        newItem.batchNumber = document.getElementById('batchNumber').value;
    }

    inventoryData.push(newItem);
    saveInventory();
    displayInventory();
    updateReports();

    // Reset form
    document.getElementById('addItemForm').reset();
    showNotification('Item added successfully!', 'success');

    // Switch to inventory tab
    showTab('inventory');
}

function editItem(index) {
    const item = inventoryData[index];

    // Fill form with item data
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemCategory').value = item.category;
    document.getElementById('itemQuantity').value = item.quantity;
    document.getElementById('itemUnit').value = item.unit;
    document.getElementById('itemPrice').value = item.price;
    document.getElementById('minStock').value = item.minStock;
    document.getElementById('itemDescription').value = item.description || '';

    if (item.expirationDate) {
        document.getElementById('expirationDate').value = item.expirationDate;
    }
    if (item.batchNumber) {
        document.getElementById('batchNumber').value = item.batchNumber;
    }

    // Remove the item from array (will be re-added when form is submitted)
    inventoryData.splice(index, 1);
    saveInventory();
    displayInventory();

    // Switch to add item tab
    showTab('add-item');
    showNotification('Item loaded for editing', 'success');
}

function deleteItem(index) {
    if (confirm('Are you sure you want to delete this item?')) {
        inventoryData.splice(index, 1);
        saveInventory();
        displayInventory();
        updateReports();
        showNotification('Item deleted successfully', 'success');
    }
}

function saveInventory() {
    localStorage.setItem(`inventory_${currentUser.id}`, JSON.stringify(inventoryData));
}

// Search and filter functions
function searchInventory() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const rows = document.querySelectorAll('#inventoryTableBody tr');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function filterInventory() {
    const selectedCategory = document.getElementById('categoryFilter').value;
    const rows = document.querySelectorAll('#inventoryTableBody tr');

    rows.forEach(row => {
        const categoryCell = row.cells[1].textContent;
        row.style.display = !selectedCategory || categoryCell === selectedCategory ? '' : 'none';
    });
}

// Categories management
function updateCategories() {
    const categories = businessCategories[currentUser.businessType] || businessCategories.other;

    // Update add item form categories
    const categorySelect = document.getElementById('itemCategory');
    categorySelect.innerHTML = '<option value="">Select Category</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });

    // Update filter dropdown
    const filterSelect = document.getElementById('categoryFilter');
    filterSelect.innerHTML = '<option value="">All Categories</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        filterSelect.appendChild(option);
    });

    // Show/hide expiration fields based on business type
    const expirationRow = document.getElementById('expirationRow');
    if (['restaurant', 'pharmacy', 'grocery'].includes(currentUser.businessType)) {
        expirationRow.style.display = 'block';
    } else {
        expirationRow.style.display = 'none';
    }
}

function updateCategoriesOnRegistration() {
    const businessType = document.getElementById('businessType').value;
    // This function can be used to show different fields based on business type during registration
}

// Reports and analytics
function updateReports() {
    const totalItems = inventoryData.length;
    const totalValue = inventoryData.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const lowStockItems = inventoryData.filter(item => item.quantity <= item.minStock).length;
    const categories = [...new Set(inventoryData.map(item => item.category))].length;

    document.getElementById('totalItems').textContent = totalItems;
    document.getElementById('totalValue').textContent = `$${totalValue.toFixed(2)}`;
    document.getElementById('lowStockItems').textContent = lowStockItems;
    document.getElementById('totalCategories').textContent = categories;
}

// Settings management
function loadSettings() {
    document.getElementById('settingsBusinessName').value = currentUser.businessName;
    document.getElementById('settingsEmail').value = currentUser.email;
    document.getElementById('settingsPhone').value = currentUser.phone;
    document.getElementById('currency').value = currentUser.currency || 'USD';
}

function handleSettings(event) {
    event.preventDefault();

    // Update current user data
    currentUser.businessName = document.getElementById('settingsBusinessName').value;
    currentUser.email = document.getElementById('settingsEmail').value;
    currentUser.phone = document.getElementById('settingsPhone').value;
    currentUser.currency = document.getElementById('currency').value;

    // Update in localStorage
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    // Update users array
    const users = JSON.parse(localStorage.getItem('inventoryUsers') || '[]');
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        users[userIndex] = currentUser;
        localStorage.setItem('inventoryUsers', JSON.stringify(users));
    }

    // Update dashboard display
    document.getElementById('businessNameDisplay').textContent = currentUser.businessName;

    showNotification('Settings saved successfully!', 'success');
}

// Export functionality
function exportInventory() {
    const csvContent = generateCSV();
    downloadCSV(csvContent, `${currentUser.businessName}_inventory_${new Date().toISOString().split('T')[0]}.csv`);
    showNotification('Inventory exported successfully!', 'success');
}

function generateCSV() {
    const headers = ['Item Name', 'Category', 'Quantity', 'Unit', 'Unit Price', 'Total Value', 'Min Stock', 'Status'];
    const rows = inventoryData.map(item => [
        item.name,
        item.category,
        item.quantity,
        item.unit,
        item.price,
        (item.quantity * item.price).toFixed(2),
        item.minStock,
        getItemStatus(item).text
    ]);

    const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

    return csvContent;
}

function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Utility functions
function loadUserData() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showDashboard();
    }
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Real-time simulation (in a real app, this would use WebSockets or Server-Sent Events)
function simulateRealTimeUpdates() {
    setInterval(() => {
        if (currentUser && inventoryData.length > 0) {
            // Simulate random inventory changes
            const randomItem = inventoryData[Math.floor(Math.random() * inventoryData.length)];
            const change = Math.floor(Math.random() * 5) - 2; // -2 to +2

            if (randomItem.quantity + change >= 0) {
                randomItem.quantity += change;
                saveInventory();
                displayInventory();
                updateReports();
            }
        }
    }, 30000); // Update every 30 seconds
}

// Initialize real-time updates
setTimeout(simulateRealTimeUpdates, 5000);

// Sample data for demo purposes
function addSampleData() {
    if (!currentUser || inventoryData.length > 0) return;

    const sampleItems = {
        restaurant: [
            { name: 'Chicken Breast', category: 'Meat & Poultry', quantity: 25, unit: 'lbs', price: 4.99, minStock: 10 },
            { name: 'Tomatoes', category: 'Vegetables', quantity: 50, unit: 'lbs', price: 2.49, minStock: 15 },
            { name: 'Milk', category: 'Dairy', quantity: 12, unit: 'gallons', price: 3.99, minStock: 5 }
        ],
        hardware: [
            { name: 'Screws (Phillips)', category: 'Fasteners', quantity: 500, unit: 'pieces', price: 0.05, minStock: 100 },
            { name: 'Hammer', category: 'Tools', quantity: 15, unit: 'pieces', price: 24.99, minStock: 5 },
            { name: 'Paint Brush', category: 'Paint & Supplies', quantity: 30, unit: 'pieces', price: 8.99, minStock: 10 }
        ],
        pharmacy: [
            { name: 'Aspirin 325mg', category: 'OTC Medications', quantity: 100, unit: 'bottles', price: 12.99, minStock: 20 },
            { name: 'Vitamin D3', category: 'Vitamins & Supplements', quantity: 75, unit: 'bottles', price: 19.99, minStock: 15 },
            { name: 'Bandages', category: 'Medical Supplies', quantity: 200, unit: 'boxes', price: 5.99, minStock: 50 }
        ]
    };

    const items = sampleItems[currentUser.businessType] || [];
    items.forEach(item => {
        item.description = `Sample ${item.name}`;
        item.dateAdded = new Date().toISOString();
        item.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        inventoryData.push(item);
    });

    if (items.length > 0) {
        saveInventory();
        displayInventory();
        updateReports();
    }
}

// Add sample data after dashboard is shown
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (currentUser) {
            addSampleData();
        }
    }, 1000);
});