// ============================================
// FOODCART - MAIN JAVASCRIPT
// ============================================

const FOOD_ITEMS = [
    {
        id: 1,
        name: "Classic Burger",
        category: "Burgers",
        price: 99,
        emoji: "🍔",
        description: "Juicy burger with fresh vegetables"
    },
    {
        id: 2,
        name: "Cheese Pizza",
        category: "Pizza",
        price: 179,
        emoji: "🍕",
        description: "Cheesy pizza with delicious toppings"
    },
    {
        id: 3,
        name: "French Fries",
        category: "Snacks",
        price: 69,
        emoji: "🍟",
        description: "Crispy golden potato fries"
    },
    {
        id: 4,
        name: "Cold Coffee",
        category: "Drinks",
        price: 89,
        emoji: "🥤",
        description: "Chilled and creamy cold coffee"
    },
    {
        id: 5,
        name: "Chicken Burger",
        category: "Burgers",
        price: 149,
        emoji: "🍔",
        description: "Delicious burger with a chicken patty"
    },
    {
        id: 6,
        name: "Chocolate Shake",
        category: "Drinks",
        price: 109,
        emoji: "🍫",
        description: "Rich chocolate milkshake"
    }
];

let cart = [];
let activeCategory = "All";

// Render food menu
function renderFoodItems() {
    const container = document.getElementById("food-list");

    if (!container) {
        console.warn("Add an element with id='food-list' to index.html.");
        return;
    }

    const filteredItems = activeCategory === "All"
        ? FOOD_ITEMS
        : FOOD_ITEMS.filter(item => item.category === activeCategory);

    container.innerHTML = filteredItems.map(item => `
        <article class="food-card">
            <div class="food-emoji">${item.emoji}</div>
            <h3>${item.name}</h3>
            <p>${item.description}</p>
            <div class="food-card-bottom">
                <strong>₹${item.price}</strong>
                <button type="button" onclick="addToCart(${item.id})">
                    Add +
                </button>
            </div>
        </article>
    `).join("");
}

// Filter food by category
function filterCategory(category) {
    activeCategory = category;
    renderFoodItems();
}

// Add food to cart
function addToCart(id) {
    const item = FOOD_ITEMS.find(food => food.id === id);

    if (!item) return;

    const existingItem = cart.find(food => food.id === id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...item, quantity: 1 });
    }

    renderCart();

    console.log(`${item.name} added to cart.`);
}

// Change item quantity
function changeQuantity(id, change) {
    const item = cart.find(food => food.id === id);

    if (!item) return;

    item.quantity += change;

    if (item.quantity <= 0) {
        cart = cart.filter(food => food.id !== id);
    }

    renderCart();
}

// Calculate cart total
function getCartTotal() {
    return cart.reduce(
        (total, item) => total + item.price * item.quantity,
        0
    );
}

// Render shopping cart
function renderCart() {
    const container = document.getElementById("cart-items");
    const totalElement = document.getElementById("cart-total");
    const countElement = document.getElementById("cart-count");

    const count = cart.reduce(
        (total, item) => total + item.quantity,
        0
    );

    if (countElement) {
        countElement.textContent = count;
    }

    if (totalElement) {
        totalElement.textContent = `₹${getCartTotal()}`;
    }

    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = "<p>Your cart is empty 🛒</p>";
        return;
    }

    container.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div>
                <strong>${item.emoji} ${item.name}</strong>
                <p>₹${item.price} × ${item.quantity}</p>
            </div>

            <div class="quantity-controls">
                <button type="button"
                    onclick="changeQuantity(${item.id}, -1)">−</button>

                <span>${item.quantity}</span>

                <button type="button"
                    onclick="changeQuantity(${item.id}, 1)">+</button>
            </div>
        </div>
    `).join("");
}

// Start the website
document.addEventListener("DOMContentLoaded", () => {
    renderFoodItems();
    renderCart();
    console.log("FoodCart is ready!");
});