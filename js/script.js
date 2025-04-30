console.log("JS файл підключено успішно!");

document.addEventListener("DOMContentLoaded", () => {
    loadMenu(); 
    loadCart(); 
    loadOrders(); 
    startOrderTimer();
    setInterval(updateTimers, 1000);
    addHoverEffectToAllButtons();
    const customCakeForm = document.querySelector("#custom-cake-form");
    if (customCakeForm) {
        customCakeForm.addEventListener("submit", addCustomCakeToCart);
    }
});

// ========== ЗАВАНТАЖЕННЯ МЕНЮ ==========
function loadMenu() {
    fetch('menu.json')
        .then(response => response.json())
        .then(data => {
            //шукаємо контейнер в штмл і вставляємо туди потім дані
            const container = document.getElementById('menu-container');

            for (const category in data) {
                const section = document.createElement('section');
                const heading = document.createElement('h2');
                heading.textContent = category;
                section.appendChild(heading);

                const grid = document.createElement('div');
                grid.className = 'menu-grid';

                const items = data[category];
                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'menu-item';

                    itemDiv.innerHTML = `
                        <img src="${item.image}" alt="${item.name}">
                        <h3>${item.name}</h3>
                        <p>Ціна: ${item.price} грн</p>
                        <button class="btn">Додати в кошик</button>
                        <button class="description-btn">Показати опис</button>
                     <p class="description" style="display: none;">${item.description}</p>
                    `;

                    const addBtn = itemDiv.querySelector(".btn");
                    addBtn.addEventListener("click", () => {
                        addToCart(item.name, parseInt(item.price));
                        const originalText = addBtn.textContent;
                        const originalColor = addBtn.style.backgroundColor;
                        addBtn.style.backgroundColor = "#6ccc6c";
                        addBtn.textContent = "У кошику";
                        setTimeout(() => {
                            addBtn.style.backgroundColor = originalColor;
                            addBtn.textContent = originalText;
                        }, 2000);
                    });

                    const descBtn = itemDiv.querySelector(".description-btn");
                    const descText = itemDiv.querySelector(".description");

                    descBtn.addEventListener("click", () => {
                        if (descText.style.display === "none") {
                            descText.style.display = "block";
                            descBtn.textContent = "Сховати опис";
                        } else {
                            descText.style.display = "none";
                            descBtn.textContent = "Показати опис";
                        }
                    });

                    grid.appendChild(itemDiv);
                }

                section.appendChild(grid);
                container.appendChild(section);
            }
        })
}

// ========== КОШИК ==========

function addCustomCakeToCart(event) {
    
    event.preventDefault();

    const size = document.querySelector("#cake-size").value;
    const filling = document.querySelector("#cake-filling").value;
    const decor = document.querySelector("#cake-decor").value.trim();


    // Перевірка заповнення полів
    if (!size || !filling|| !decor) {
        alert("Будь ласка, заповніть всі поля для кастомного торта!");
        return;
    }

    let description = `Розмір: ${size}, начинка: ${filling}`;
    if (decor) {
        description += `, декор: ${decor}`;
    }

    let price = 0;
    if (size === "Малий") price = 500;
    else if (size === "Середній") price = 1000;
    else if (size === "Великий") price = 1500;

    addToCart("Кастомний торт", price, description);
    loadCart();
}

function addToCart(name, price, description = "") {

    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existingItem = cart.find(item => item.name === name && item.description === description);

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ name, price, quantity: 1, description });
    }
    
    localStorage.setItem("cart", JSON.stringify(cart));
    alert("Товар додано до кошика!");
    loadCart();
}

function loadCart() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const cartTableBody = document.getElementById("cart-items");
    if (!cartTableBody) return; 
    const cartTable = document.querySelector("#cart-items");
    const totalPrice = document.querySelector("#total-price");

    if (!cartTable || !totalPrice) return;

    cartTable.innerHTML = "";
    let total = 0;

    for (let index = 0; index < cart.length; index++) {
        const item = cart[index];
        const row = document.createElement("tr");

        const columns = [
            { label: "Назва", value: item.name },
            { label: "Ціна", value: `${item.price} грн` },
            { label: "Кількість", value: item.quantity },
            { label: "Видалити", value: "", html: `<button class="btn btn-remove" onclick="removeFromCart(${index})">✖</button>` },
            { label: "Опис", value: "", 
                html: item.description ? `
                <button class="description-btn">Показати опис</button>
                <p class="description" style="display: none;">${item.description}</p>
            ` : ""
        }
        ];

        for (let colIndex = 0; colIndex < columns.length; colIndex++) {
            const col = columns[colIndex];
            const td = document.createElement("td");
            td.setAttribute("data-label", col.label);
            if (col.html) {
                td.innerHTML = col.html;

                const descBtn = td.querySelector(".description-btn");
                if (descBtn) {
                    const descText = td.querySelector(".description");
                    descBtn.addEventListener("click", () => {
                        if (descText.style.display === "none") {
                            descText.style.display = "block";
                            descBtn.textContent = "Сховати опис";
                        } else {
                            descText.style.display = "none";
                            descBtn.textContent = "Показати опис";
                        }
                    });
                }

            } else {
                td.textContent = col.value;
            }
            row.appendChild(td);
        }

        cartTable.appendChild(row);
        total += item.price * item.quantity;
    }

    totalPrice.textContent = `${total} грн`;

    const orderBtn = document.querySelector("#place-order");
    if (orderBtn) {
        orderBtn.addEventListener("click", placeOrder);
    }
}

function removeFromCart(index) {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    if (cart[index].quantity > 1) {
        cart[index].quantity--;
    } else {
        cart.splice(index, 1);
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    loadCart();
}

// ========== ЗАМОВЛЕННЯ ==========
function placeOrder() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    if (cart.length === 0) {
        alert("Ваш кошик порожній!");
        return;
    }

    const orders = JSON.parse(localStorage.getItem("orders")) || [];
    const orderNumber = orders.length + 1000;
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order = {
        id: `#${orderNumber}`,
        date: new Date().toLocaleDateString("uk-UA"),
        status: "В дорозі",
        total: `${total} грн`,
        deliveryTime: Date.now() + 30 * 1000, // 30 секунд у мс
        items: cart 
    };

    orders.push(order);
    localStorage.setItem("orders", JSON.stringify(orders));
    localStorage.setItem("cart", JSON.stringify([]));

    alert("Замовлення оформлено! Доставка очікується через 30 хвилин.");
    loadCart();
    loadOrders();
    startOrderTimer();
}

function loadOrders() {
    const orders = JSON.parse(localStorage.getItem("orders")) || [];
    const ordersTable = document.querySelector("#orders-list");
    if (!ordersTable) return;

    ordersTable.innerHTML = "";

    let i = 0;
    while (i < orders.length) { 
        const order = orders[i];
        const row = document.createElement("tr");
        const remainingTime = Math.max(0, Math.ceil((order.deliveryTime - Date.now()) / 1000));
        const timeDisplay = remainingTime > 0 ? formatTime(remainingTime) : "30 хв";

        const columns = [
            { label: "Номер", value: order.id },
            { label: "Дата", value: order.date },
            { label: "Статус", value: order.status, class: "order-status" },
            { label: "Сума", value: order.total },
            { label: "Час", value: timeDisplay, class: "order-timer" }
        ];

        let j = 0; 
        while (j < columns.length) { 
            const col = columns[j];
            const td = document.createElement("td");
            td.setAttribute("data-label", col.label);
            td.textContent = col.value;
            if (col.class) td.classList.add(col.class);
            row.appendChild(td);
            j++; 
        }

        ordersTable.appendChild(row);
        i++; 
    }
}
        
// ========== СТАТУСИ І ТАЙМЕРИ ==========
function updateOrderStatus() {
    const orders = JSON.parse(localStorage.getItem("orders")) || [];
    const now = Date.now();
    let updated = false;

    orders.forEach(order => {
        if (order.status !== "Доставлено" && now >= order.deliveryTime) {
            order.status = "Доставлено";
            updated = true;
        }
    });

    if (updated) {
        localStorage.setItem("orders", JSON.stringify(orders));
        loadOrders();
    }
}

function updateTimers() {
    const orders = JSON.parse(localStorage.getItem("orders")) || [];
    const rows = document.querySelectorAll("#orders-list tr");

    orders.forEach((order, index) => {
        const remainingTime = Math.max(0, Math.ceil((order.deliveryTime - Date.now()) / 1000));
        const timeDisplay = remainingTime > 0 ? formatTime(remainingTime) : "30 хв";

        if (rows[index]) {
            rows[index].querySelector(".order-timer").textContent = timeDisplay;
            rows[index].querySelector(".order-status").textContent = order.status;
        }

        if (remainingTime <= 0 && order.status !== "Доставлено") {
            order.status = "Доставлено";
        }
    });

    localStorage.setItem("orders", JSON.stringify(orders));
}

function startOrderTimer() {
    updateOrderStatus();
    setInterval(updateOrderStatus, 60000); // кожну хвилину

}

function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min} хв ${sec} сек`;
}

function addHoverEffectToAllButtons() {
    const buttons = document.querySelectorAll("button");
    for (let i = 0; i < buttons.length; i++) { 
        const button = buttons[i];
        button.addEventListener("mouseenter", () => {
            button.style.transform = "scale(1.1)";
            button.style.transition = "transform 0.2s ease";
        });
        button.addEventListener("mouseleave", () => {
            button.style.transform = "scale(1)";
        });
    }
}


