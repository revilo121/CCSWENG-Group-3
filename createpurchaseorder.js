let purchaseOrderCounter = 1; 

document.addEventListener('DOMContentLoaded', fetchAndDisplayOrders); // Fetch existing orders when the page loads

function createPurchaseOrder() {
    const fullName = askForValidInput("Enter Full Name:", isValidName);
    const supplier = askForValidInput("Enter Supplier:", isValidName);
    const cost = askForValidInput("Enter Cost (numeric, up to two decimal places):", isValidCost);
    const arrivalDate = askForValidInput("Enter Arrival Date (MM/DD/YYYY):", isValidDate);

    const formattedCost = formatCost(cost); 
    const formattedDate = formatDate(arrivalDate); 

    const orderNumber = `P${String(purchaseOrderCounter).padStart(4, '0')}`;
    purchaseOrderCounter++;

    addNewOrderCard(orderNumber, fullName, supplier, formattedCost, formattedDate);

    const purchaseOrder = {
        orderNumber: orderNumber,
        fullName: fullName,
        supplier: supplier,
        cost: cost, 
        arrivalDate: arrivalDate 
    };

    fetch('/purchaseorders', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchaseOrder),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

function fetchAndDisplayOrders() {
    fetch('/purchaseorders')
        .then(response => response.json())
        .then(orders => {
            orders.forEach(order => {
                const formattedCost = formatCost(order.cost);
                const formattedDate = formatDate(order.arrivalDate);
                addNewOrderCard(order.orderNumber, order.fullName, order.supplier, formattedCost, formattedDate);
            });
        })
        .catch(error => {
            console.error('Error fetching orders:', error);
        });
}

function askForValidInput(promptMessage, validationFunction) {
    let input;
    do {
        input = prompt(promptMessage);
        if (!validationFunction(input)) {
            alert("Invalid input. Please try again.");
        }
    } while (!validationFunction(input));
    return input;
}

function isValidName(input) {
    return input.trim() !== "";
}

function isValidCost(input) {
    const costRegex = /^\d{1,6}(\.\d{1,2})?$/;
    return costRegex.test(input) && parseFloat(input) > 0;
}

function isValidDate(dateStr) {
    const [month, day, year] = dateStr.split("/").map(Number);

    if (!month || !day || !year || year.toString().length !== 4) {
        return false;
    }

    const date = new Date(year, month - 1, day);
    const today = new Date();

    if (date.getMonth() + 1 !== month || date.getDate() !== day || date.getFullYear() !== year) {
        return false;
    }

    return date >= today;
}

function formatCost(costStr) {
    const cost = parseFloat(costStr).toFixed(2);
    return `P${cost}`; 
}

function formatDate(dateStr) {
    const [month, day, year] = dateStr.split("/").map(Number);

    const monthNames = ["January", "February", "March", "April", "May", "June", 
                        "July", "August", "September", "October", "November", "December"];

    return `${monthNames[month - 1]} ${day}, ${year}`;
}

function addNewOrderCard(orderNumber, fullName, supplier, cost, arrivalDate) {
    const orderGrid = document.querySelector(".order-grid");

    const newCard = document.createElement("div");
    newCard.classList.add("item-card");

    newCard.innerHTML = `
        <div class="card-header">
            <span class="item-name">${orderNumber}</span>
            <span class="item-dot"></span>
        </div>
        <p>Created by: ${fullName}</p>
        <p>Supplier: ${supplier}</p>
        <p>Cost: ${cost}</p>
        <p>Arrival: ${arrivalDate}</p>
        <div class="card-menu">
            <i class="fas fa-ellipsis-h"></i>
        </div>
    `;

    orderGrid.appendChild(newCard);
}
