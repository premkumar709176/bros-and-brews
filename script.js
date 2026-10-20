// =============================================
// BROS & BREWS — SUPABASE CONNECTION
// =============================================

const SUPABASE_URL = "https://suscodhmbpctrwidoefo.supabase.co/rest/v1/";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_d-UuMIgT3i-nZG1PfgqkBQ_rWQRVBfu";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

let allMenuItems = [];
let activeCategory = "all";

// ---------------------------------------------
// LOAD MENU FROM SUPABASE
// ---------------------------------------------

async function loadMenu() {
    const container = document.getElementById("food-list");

    try {
        const { data, error } = await supabaseClient
            .from("menu_items")
            .select("*, categories(name)")
            .eq("is_available", true)
            .order("name");

        if (error) throw error;

        allMenuItems = data || [];

        renderCategoryFilters();
        renderMenu();

    } catch (error) {
        console.error("Menu loading error:", error);

        container.innerHTML =
            '<p class="muted">Unable to load the menu. ' +
            'Please try again later.</p>';
    }
}

// ---------------------------------------------
// LOAD CATEGORIES
// ---------------------------------------------

async function loadCategories() {
    try {
        const { data, error } = await supabaseClient
            .from("categories")
            .select("id, name")
            .order("name");

        if (error) throw error;

        return data || [];

    } catch (error) {
        console.error("Category loading error:", error);
        return [];
    }
}

// ---------------------------------------------
// CATEGORY FILTER BUTTONS
// ---------------------------------------------

async function renderCategoryFilters() {
    const container = document.getElementById("category-filters");
    const categories = await loadCategories();

    const buttons = [
        { id: "all", name: "All Items" },
        ...categories.map(category => ({
            id: String(category.id),
            name: category.name
        }))
    ];

    container.innerHTML = buttons.map(category => `
        <button
            type="button"
            class="filter-button ${
                String(activeCategory) === category.id ? "active" : ""
            }"
            data-category="${category.id}">
            ${escapeHTML(category.name)}
        </button>
    `).join("");

    container.querySelectorAll("button").forEach(button => {
        button.addEventListener("click", () => {
            activeCategory = button.dataset.category;

            container.querySelectorAll("button").forEach(item => {
                item.classList.toggle(
                    "active",
                    item.dataset.category === activeCategory
                );
            });

            renderMenu();
        });
    });
}

// ---------------------------------------------
// DISPLAY MENU ITEMS
// ---------------------------------------------

function renderMenu() {
    const container = document.getElementById("food-list");

    const filteredItems = allMenuItems.filter(item => {
        if (activeCategory === "all") return true;

        return String(item.category_id) === activeCategory;
    });

    if (filteredItems.length === 0) {
        container.innerHTML =
            '<p class="muted">Our menu is being prepared. ' +
            'Check back soon!</p>';
        return;
    }

    container.innerHTML = filteredItems.map(item => {
        const photo = item.photo_url
            ? `<img src="${escapeHTML(item.photo_url)}"
                    alt="${escapeHTML(item.name)}"
                    loading="lazy"
                    onerror="this.parentElement.textContent='🍽️'">`
            : "🍽️";

        const category = item.categories?.name || "Our Menu";

        return `
            <article class="food-card">
                <div class="food-photo">${photo}</div>

                <div class="food-content">
                    <h3>${escapeHTML(item.name)}</h3>

                    <p>${escapeHTML(item.description || "")}</p>

                    <div class="food-meta">
                        <span>${escapeHTML(category)}</span>
                        <span>
                            ${
                                item.calories !== null
                                    ? `${item.calories} kcal`
                                    : "Calories not listed"
                            }
                        </span>
                    </div>

                    <div class="food-bottom">
                        <span class="price">
                            ₹${Number(item.price).toFixed(2)}
                        </span>

                        ${
                            item.is_available
                                ? '<span class="status">Available</span>'
                                : '<span class="status sold-out">Sold Out</span>'
                        }
                    </div>
                </div>
            </article>
        `;
    }).join("");
}

// ---------------------------------------------
// LOAD APPROVED REVIEWS ONLY
// ---------------------------------------------

async function loadReviews() {
    const container = document.getElementById("review-list");

    try {
        const { data, error } = await supabaseClient
            .from("reviews")
            .select("customer_name, rating, comment, created_at")
            .eq("is_approved", true)
            .order("created_at", { ascending: false })
            .limit(12);

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML =
                '<p class="muted">Be one of the first to share ' +
                'your experience!</p>';
            return;
        }

        container.innerHTML = data.map(review => `
            <article class="review-card">
                <div class="stars">
                    ${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}
                </div>

                <h3>${escapeHTML(review.customer_name)}</h3>

                <p>${escapeHTML(review.comment)}</p>
            </article>
        `).join("");

    } catch (error) {
        console.error("Review loading error:", error);

        container.innerHTML =
            '<p class="muted">Reviews are temporarily unavailable.</p>';
    }
}

// ---------------------------------------------
// SUBMIT A REVIEW FOR ADMIN APPROVAL
// ---------------------------------------------

async function submitReview(event) {
    event.preventDefault();

    const form = document.getElementById("review-form");
    const button = document.getElementById("review-submit");
    const message = document.getElementById("review-message");

    const customerName = document
        .getElementById("customer-name").value.trim();

    const rating = Number(
        document.getElementById("rating").value
    );

    const comment = document
        .getElementById("review-comment").value.trim();

    if (
        customerName.length < 1 ||
        customerName.length > 80 ||
        !Number.isInteger(rating) ||
        rating < 1 ||
        rating > 5 ||
        comment.length < 1 ||
        comment.length > 1000
    ) {
        message.textContent = "Please check your review details.";
        return;
    }

    button.disabled = true;
    button.textContent = "Submitting...";

    try {
        const { error } = await supabaseClient
            .from("reviews")
            .insert({
                customer_name: customerName,
                rating: rating,
                comment: comment,
                is_approved: false
            });

        if (error) throw error;

        message.textContent =
            "Thank you! Your review was submitted for approval.";

        form.reset();

    } catch (error) {
        console.error("Review submission error:", error);

        message.textContent =
            "We couldn't submit your review. Please try again.";
    } finally {
        button.disabled = false;
        button.textContent = "Submit Review";
    }
}

// ---------------------------------------------
// LOAD BUSINESS DETAILS
// ---------------------------------------------

async function loadBusinessDetails() {
    try {
        const { data, error } = await supabaseClient
            .from("business_details")
            .select("*")
            .limit(1)
            .maybeSingle();

        if (error) throw error;

        if (!data) return;

        document.getElementById("contact-name").textContent =
            data.business_name || "Bros & Brews";

        document.getElementById("business-description").textContent =
            data.description ||
            "Good food and great company at Bros & Brews.";

        document.getElementById("business-address").textContent =
            data.address || "Location details coming soon.";

        const phone = document.getElementById("business-phone");
        phone.textContent = data.phone || "Contact number coming soon.";

        if (data.phone) {
            const link = document.createElement("a");
            link.href = "tel:" + data.phone.replace(/[^\d+]/g, "");
            link.textContent = data.phone;
            phone.replaceChildren(link);
        }

        const hours = document.getElementById("opening-hours");
        const openingHours = data.opening_hours || {};

        const entries = Object.entries(openingHours);

        hours.textContent = entries.length
            ? entries.map(([day, time]) => `${day}: ${time}`).join(" | ")
            : "Opening hours coming soon.";

        const mapLink = document.getElementById("map-link");

        if (data.map_url) {
            try {
                const parsedURL = new URL(data.map_url);

                if (
                    parsedURL.protocol === "https:" ||
                    parsedURL.protocol === "http:"
                ) {
                    mapLink.href = parsedURL.href;
                    mapLink.hidden = false;
                }
            } catch {
                console.warn("Invalid map URL in business details.");
            }
        }

    } catch (error) {
        console.error("Business details loading error:", error);
    }
}

// ---------------------------------------------
// BASIC HTML ESCAPING
// ---------------------------------------------

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

// ---------------------------------------------
// START WEBSITE
// ---------------------------------------------

document.addEventListener("DOMContentLoaded", async () => {
    document.getElementById("current-year").textContent =
        new Date().getFullYear();

    document.getElementById("review-form").addEventListener(
        "submit",
        submitReview
    );

    await Promise.all([
        loadMenu(),
        loadReviews(),
        loadBusinessDetails()
    ]);

    console.log("Bros & Brews website initialized.");
});