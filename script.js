// Global state variables
let products = []; // Holds all products fetched from JSON
let currentLang = localStorage.getItem('bakeryLang') || 'de'; // Remembers language
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentProductInModal = null;
let currentPage = 1;
const productsPerPage = 12;
let currentFilteredProducts = [];

// DOM element references
const modal = document.getElementById('modal');
const orderModal = document.getElementById('orderModal');
const productGrid = document.getElementById('productGrid');
const cartCountSpan = document.getElementById('cartCount');
const pickupDateInput = document.getElementById('pickupDate');
const pickupTimeSelect = document.getElementById('pickupTime');
const paginationContainer = document.getElementById('paginationContainer');

// Language translations
const translations = {
  de: {
    langSwitch: 'Deutsch', mainTitle: 'Macis Biobäckerei in Leipzig', subTitle: 'Traditionelle Backkunst, jeden Tag frisch',
    orderNowBtn: 'Jetzt bestellen', allBakedGoods: 'Alle Backwaren', bread: 'Brot', rolls: 'Brötchen', sweets: 'Süßes', searchBtn: 'Suche',
    holidaySpecials: 'Sonn- & Feiertags',
    orderTitle: 'Deine Bestellung', submitBtn: 'Absenden', contactTitle: 'Kontakt & Öffnungszeiten', addressLabel: 'Adresse:', phoneLabel: 'Telefon:', emailLabel: 'E-Mail:',
    openingHoursTitle: 'Öffnungszeiten', openingHoursWeekday: 'Montag – Samstag: 7:00 – 19:00 Uhr', openingHoursSunday: 'Sonntag: 8:00 – 12:00 Uhr',
    selectProductQuantityAlert: 'Bitte gib eine gültige Menge ein.', noProductsAddedAlert: 'Dein Warenkorb ist leer.',
    addAtLeastOneProductAlert: 'Bitte füge mindestens ein Produkt zum Warenkorb hinzu.', providePhoneNumberAlert: 'Bitte gib deine Telefonnummer an, um die Bestellung abzuschicken.',
    orderSuccessAlert: 'Vielen Dank für deine Bestellung! Wir haben sie erhalten.', newOrderEmailSubject: 'Neue Bäckerei Bestellung', newOrderEmailBodyTitle: 'Neue Bestellung:',
    nameEmailBody: 'Name:', emailEmailBody: 'E-Mail:', phoneEmailBody: 'Telefon:', productsEmailBody: 'Produkte:', messageEmailBody: 'Nachricht:',
    pickupDateLabel: 'Abholdatum:', pickupTimeLabel: 'Abholzeit:',
    pickupTimeInvalid: 'Bitte wähle eine Abholzeit innerhalb der Öffnungszeiten (Mo-Sa: 7-19 Uhr, So: 8-12 Uhr).', pickupTimePast: 'Die gewählte Abholzeit liegt in der Vergangenheit.',
    addToCartBtn: 'Zum Warenkorb', yourCart: 'Dein Warenkorb', searchPlaceholder: 'Gib ein, was du suchst...', yourName: 'Dein Name', phoneNumber: 'Telefonnummer',
    emailOptional: 'E-Mail (optional)', messageOptional: 'Nachricht (optional)', notProvided: 'Nicht angegeben', totalText: 'Gesamt:',
    prevPage: 'Zurück', nextPage: 'Weiter',
    holidayProductOnNonHolidayAlert: 'Ihre Bestellung enthält Artikel, die nur an Sonn- und Feiertagen erhältlich sind. Bitte wählen Sie einen entsprechenden Tag als Abholdatum.'
  },
  en: {
    langSwitch: 'English', mainTitle: 'Macis Organic Bakery in Leipzig', subTitle: 'Traditional Baking, Fresh Every Day',
    orderNowBtn: 'Order Now', allBakedGoods: 'All Baked Goods', bread: 'Bread', rolls: 'Rolls', sweets: 'Sweets', searchBtn: 'Search',
    holidaySpecials: 'Sundays & Holidays',
    orderTitle: 'Your Order', submitBtn: 'Submit', contactTitle: 'Contact & Opening Hours', addressLabel: 'Address:', phoneLabel: 'Phone:', emailLabel: 'Email:',
    openingHoursTitle: 'Opening Hours', openingHoursWeekday: 'Monday – Saturday: 7:00 AM – 7:00 PM', openingHoursSunday: 'Sunday: 8:00 AM – 12:00 PM',
    selectProductQuantityAlert: 'Please enter a valid quantity.', noProductsAddedAlert: 'Your cart is empty.',
    addAtLeastOneProductAlert: 'Please add at least one product to the cart.', providePhoneNumberAlert: 'Please provide your phone number to submit the order.',
    orderSuccessAlert: 'Thank you for your order! We have received it.', newOrderEmailSubject: 'New Bakery Order', newOrderEmailBodyTitle: 'New Order:',
    nameEmailBody: 'Name:', emailEmailBody: 'Email:', phoneEmailBody: 'Phone:', productsEmailBody: 'Products:', messageEmailBody: 'Message:',
    pickupDateLabel: 'Pickup Date:', pickupTimeLabel: 'Pickup Time:',
    pickupTimeInvalid: 'Please select a pickup time within opening hours (Mon-Sat: 7 AM - 7 PM, Sun: 8 AM - 12 PM).', pickupTimePast: 'The selected pickup time is in the past.',
    addToCartBtn: 'Add to Cart', yourCart: 'Your Cart', searchPlaceholder: 'Enter what you are looking for...', yourName: 'Your Name', phoneNumber: 'Phone Number',
    emailOptional: 'E-Mail (optional)', messageOptional: 'Message (optional)', notProvided: 'Not provided', totalText: 'Total:',
    prevPage: 'Previous', nextPage: 'Next',
    holidayProductOnNonHolidayAlert: 'Your order contains Sunday/Holiday-only items. Please select an appropriate day as your pickup date.'
  }
};

// List of public holidays in Saxony, Germany (Format: MM-DD)
const publicHolidays = [
    "01-01", // New Year's Day
    "05-01", // Labour Day
    "10-03", // Day of German Unity
    "10-31", // Reformation Day
    "12-25", // Christmas Day
    "12-26", // 2nd Day of Christmas
    // Good Friday and Easter Monday are variable, need calculation
];

function isPublicHoliday(date) {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const dateString = `${month}-${day}`;
    
    if (publicHolidays.includes(dateString)) return true;

    // Calculate Easter Sunday for the given year
    const year = date.getFullYear();
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const easterMonth = Math.floor((h + l - 7 * m + 114) / 31);
    const easterDay = ((h + l - 7 * m + 114) % 31) + 1;
    const easterSunday = new Date(year, easterMonth - 1, easterDay);

    // Good Friday is 2 days before Easter Sunday
    const goodFriday = new Date(easterSunday);
    goodFriday.setDate(easterSunday.getDate() - 2);

    // Easter Monday is 1 day after Easter Sunday
    const easterMonday = new Date(easterSunday);
    easterMonday.setDate(easterSunday.getDate() + 1);

    // Check if the date is Good Friday or Easter Monday
    if (date.getTime() === goodFriday.getTime() || date.getTime() === easterMonday.getTime()) {
        return true;
    }

    return false;
}


function displayProducts() {
    productGrid.innerHTML = ""; // Clear previous products
    productGrid.classList.remove('loaded'); // Hide products while rendering
    
    const startIndex = (currentPage - 1) * productsPerPage;
    const paginatedProducts = currentFilteredProducts.slice(startIndex, startIndex + productsPerPage);

    if (paginatedProducts.length > 0) {
        productGrid.innerHTML = paginatedProducts.map((p, index) => {
            let badgeText = '';
            let badgeClass = 'product-badge';
            if (p.badge === 'new') {
                badgeClass += ' new';
                badgeText = currentLang === 'de' ? 'Neu!' : 'New!';
            } else if (p.availability === 'holiday') {
                badgeText = currentLang === 'de' ? 'Sonn- & Feiertags' : 'Sundays & Holidays';
            }

            const cartItem = cart.find(item => item.product.id === p.id);
            const quantityInCart = cartItem ? cartItem.quantity : 0;
            
            const cartControlsHTML = `
                <div class="quantity-selector">
                    <button class="quantity-btn" aria-label="Decrease quantity" data-action="decrease" data-product-id="${p.id}">-</button>
                    <span class="quantity-display" aria-live="polite">${quantityInCart}</span>
                    <button class="quantity-btn" aria-label="Increase quantity" data-action="increase" data-product-id="${p.id}">+</button>
                </div>
            `;
            
            return `
                <div class="product card-style" data-product-id="${p.id}" style="animation-delay: ${index * 60}ms">
                    <div class="product-image-container">
                        <img src="${p.img}" alt="${currentLang === 'de' ? p.name_de : p.name_en}" loading="lazy" onerror="this.onerror=null; this.src='https://via.placeholder.com/220x220?text=Image+Missing';">
                        ${badgeText ? `<div class="${badgeClass}">${badgeText}</div>` : ''}
                    </div>
                    <div class="product-info">
                        <h3>${currentLang === 'de' ? p.name_de : p.name_en}</h3>
                        <div>
                            <p class="product-price">${p.price.toFixed(2)} €</p>
                            <div class="card-cart-controls">${cartControlsHTML}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Add loaded class to show products and hide spinner
    setTimeout(() => productGrid.classList.add('loaded'), 10);
    
    renderPaginationControls();
    applyLanguage();
}

function renderPaginationControls() {
    paginationContainer.innerHTML = '';
    const pageCount = Math.ceil(currentFilteredProducts.length / productsPerPage);

    if (pageCount <= 1) return;

    const prevButton = document.createElement('button');
    prevButton.textContent = translations[currentLang].prevPage;
    prevButton.classList.add('page-btn');
    prevButton.disabled = currentPage === 1;
    prevButton.onclick = () => changePage(currentPage - 1);
    paginationContainer.appendChild(prevButton);

    for (let i = 1; i <= pageCount; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.classList.add('page-btn');
        if (i === currentPage) pageButton.classList.add('active');
        pageButton.onclick = () => changePage(i);
        paginationContainer.appendChild(pageButton);
    }

    const nextButton = document.createElement('button');
    nextButton.textContent = translations[currentLang].nextPage;
    nextButton.classList.add('page-btn');
    nextButton.disabled = currentPage === pageCount;
    nextButton.onclick = () => changePage(currentPage + 1);
    paginationContainer.appendChild(nextButton);
}

function changePage(page) {
    if (page < 1 || page > Math.ceil(currentFilteredProducts.length / productsPerPage)) return;
    currentPage = page;
    displayProducts();
    setTimeout(() => {
        const productGridTop = productGrid.getBoundingClientRect().top + window.pageYOffset - 100;
        window.scrollTo({ top: productGridTop, behavior: 'smooth' });
    }, 100);
}


function openModal(productId) {
  const p = products.find(prod => prod.id === productId);
  if (!p) return;

  currentProductInModal = p;
  const cartItem = cart.find(item => item.product.id === p.id);
  document.getElementById('modalProductQuantity').value = cartItem ? cartItem.quantity : 1;

  document.getElementById('modalImg').src = p.img;
  document.getElementById('modalTitle').textContent = currentLang === 'de' ? p.name_de : p.name_en;
  document.getElementById('modalCal').textContent = (currentLang === 'de' ? 'Kalorien: ca. ' : 'Calories: ca. ') + p.cal + ' kcal';
  document.getElementById('modalAllergen').textContent = (currentLang === 'de' ? 'Allergene: ' : 'Allergens: ') + (currentLang === 'de' ? p.allergen_de : p.allergen_en);
  
  const modalDietary = document.getElementById('modalDietary');
  if (p.dietary) {
      let badgeHTML = '';
      if (p.dietary === 'vegan') badgeHTML = `<span class="dietary-badge badge-vegan">Vegan</span>`;
      else if (p.dietary === 'vegetarian') badgeHTML = `<span class="dietary-badge badge-vegetarian">Vegetarisch</span>`;
      modalDietary.innerHTML = badgeHTML;
      modalDietary.style.display = 'block';
  } else {
      modalDietary.style.display = 'none';
  }

  document.getElementById('modalPrice').textContent = `${p.price.toFixed(2)} €`;
  modal.style.display = 'flex';
}

function closeModal() {
  modal.style.display = 'none';
  currentProductInModal = null;
}

function openOrderForm() {
  orderModal.style.display = 'flex';
  renderCartItems();
  setMinimumDateTime();
  populatePickupHours();
  validateCartAgainstPickupDate(); // Initial validation check
}

function closeOrderForm() {
  orderModal.style.display = 'none';
}

function filterProducts(cat, element) {
    document.querySelectorAll('.filter-category-btn').forEach(btn => btn.classList.remove('active'));
    if (element) element.classList.add('active');

    if (cat === 'all') {
        currentFilteredProducts = [...products];
    } else if (cat === 'holiday') {
        currentFilteredProducts = products.filter(p => p.availability === 'holiday');
    } else {
        currentFilteredProducts = products.filter(p => p.category === cat);
    }

    currentPage = 1;
    displayProducts();
}


function searchProducts() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    document.getElementById('clearSearchBtn').style.display = query ? 'block' : 'none';

    currentFilteredProducts = products.filter(p =>
        (currentLang === 'de' ? p.name_de : p.name_en).toLowerCase().includes(query)
    );
    currentPage = 1;
    displayProducts();
}


function clearSearch() {
  document.getElementById('searchInput').value = '';
  document.getElementById('clearSearchBtn').style.display = 'none';
  const activeFilter = document.querySelector('.filter-category-btn.active');
  if (activeFilter) {
      const category = activeFilter.getAttribute('onclick').match(/'([^']+)'/)[1];
      filterProducts(category, activeFilter);
  } else {
      filterProducts('all', document.querySelector('.filter-category-btn'));
  }
}


function toggleSearch() {
  const searchBarContainer = document.getElementById('searchBarContainer');
  const isHidden = searchBarContainer.style.display === 'none' || searchBarContainer.style.display === '';
  
  if (isHidden) {
    document.querySelectorAll('.filter-category-btn').forEach(btn => btn.classList.remove('active'));
  }

  searchBarContainer.style.display = isHidden ? 'block' : 'none';
  if (isHidden) {
    document.getElementById('searchInput').focus();
  } else {
    clearSearch();
  }
}

function applyLanguage() {
  document.documentElement.lang = currentLang;
  document.querySelectorAll('[data-lang-key]').forEach(el => {
    const key = el.dataset.langKey;
    const translation = translations[currentLang][key];
    if (translation) {
        const icon = el.querySelector('i');
        if (key === 'searchBtn' && icon) {
            el.title = translation;
            const textNode = Array.from(el.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
            if (textNode) textNode.remove();
        } 
        else if (key === 'yourCart') {
            const textSpan = el.querySelector('.cart-icon-text');
            if (textSpan) textSpan.textContent = translation;
        }
        else if (icon) {
            el.innerHTML = icon.outerHTML + ' ' + translation;
        } 
        else {
            el.textContent = translation;
        }
    }
  });
  document.querySelectorAll('[data-lang-placeholder]').forEach(el => {
    const key = el.dataset.langPlaceholder;
    if (translations[currentLang][key]) el.placeholder = translations[currentLang][key];
  });
  
  if (orderModal.style.display === 'flex') {
    validateCartAgainstPickupDate();
  }
  
  renderCartItems();
  updateCartCount();
  renderPaginationControls();
}

function toggleLang() {
  currentLang = currentLang === 'de' ? 'en' : 'de';
  localStorage.setItem('bakeryLang', currentLang); // Save the choice
  displayProducts();
}

function updateCartCount() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartCountSpan = document.getElementById('cartCount');

  if (totalItems > 0) {
      cartCountSpan.textContent = totalItems;
      cartCountSpan.classList.add('visible');
  } else {
      cartCountSpan.classList.remove('visible');
  }

  const cartButton = document.getElementById('cartButton');
  if (cartButton) {
    cartButton.classList.toggle('pulsing-cart', totalItems > 0);
  }

  localStorage.setItem('cart', JSON.stringify(cart));
}

function updateProductCardUI(productId) {
    const productCard = document.querySelector(`.product[data-product-id='${productId}']`);
    if (productCard) {
        const quantityDisplay = productCard.querySelector('.quantity-display');
        const cartItem = cart.find(item => item.product.id === productId);
        const quantityInCart = cartItem ? cartItem.quantity : 0;
        if (quantityDisplay) {
            quantityDisplay.textContent = quantityInCart;
        }
    }
}

function updateCartQuantity(productId, change) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    let existingItem = cart.find(item => item.product.id === productId);

    if (existingItem) {
        existingItem.quantity += change;
        if (existingItem.quantity <= 0) {
            cart = cart.filter(item => item.product.id !== productId);
        }
    } else if (change > 0) {
        cart.push({ product: product, quantity: change });
    }

    triggerCartAnimation();
    updateCartCount();
    updateProductCardUI(productId);
}

function addToCartFromModal() {
  if (!currentProductInModal) return;
  const quantity = parseInt(document.getElementById('modalProductQuantity').value);
  if (isNaN(quantity) || quantity < 0) {
    alert(translations[currentLang].selectProductQuantityAlert);
    return;
  }
  
  const itemInCart = cart.find(item => item.product.id === currentProductInModal.id);
  
  if(itemInCart) {
      itemInCart.quantity = quantity;
      if (itemInCart.quantity <= 0) {
        cart = cart.filter(item => item.product.id !== currentProductInModal.id);
      }
  } else if (quantity > 0) {
      cart.push({ product: currentProductInModal, quantity: quantity });
  }

  triggerCartAnimation();
  updateCartCount();
  updateProductCardUI(currentProductInModal.id);
  closeModal();
}

function triggerCartAnimation() {
    const cartButton = document.getElementById('cartButton');
    if (cartButton) {
        cartButton.classList.add('shake');
        setTimeout(() => {
            cartButton.classList.remove('shake');
        }, 800);
    }
}


function renderCartItems() {
  const selectedProductsList = document.getElementById('selectedProductsList');
  if (!selectedProductsList) return; 
  selectedProductsList.innerHTML = '';
  let totalPrice = 0;
  
  let totalContainer = orderModal.querySelector('.cart-total');
  if (!totalContainer) {
    document.getElementById('cartItemsContainer').insertAdjacentHTML('beforeend', '<div class="cart-total"></div>');
    totalContainer = orderModal.querySelector('.cart-total');
  }

  if (cart.length === 0) {
    selectedProductsList.innerHTML = `<p style="text-align:center;">${translations[currentLang].noProductsAddedAlert}</p>`;
    totalContainer.style.display = 'none';
  } else {
    totalContainer.style.display = 'flex';
    cart.forEach((item, index) => {
      const itemPrice = (item.product.price * item.quantity);
      totalPrice += itemPrice;
      selectedProductsList.innerHTML += `
        <div class="cart-item-row">
          <span>${currentLang === 'de' ? item.product.name_de : item.product.name_en} × ${item.quantity} (${itemPrice.toFixed(2)} €)</span>
          <button type="button" aria-label="Remove item" onclick="removeFromCart(${index})">✖</button>
        </div>
      `;
    });
    totalContainer.innerHTML = `
        <span>${translations[currentLang].totalText}</span>
        <span>${totalPrice.toFixed(2)} €</span>`;
  }
  
  validateCartAgainstPickupDate();
}

function removeFromCart(index) {
  if (!cart[index]) return;
  const productId = cart[index].product.id;
  cart.splice(index, 1);
  renderCartItems();
  updateCartCount();
  updateProductCardUI(productId);
}

function setMinimumDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const minDate = `${year}-${month}-${day}`;
    pickupDateInput.min = minDate;
    if (pickupDateInput.value < minDate) {
        pickupDateInput.value = minDate;
    }
}

function populatePickupHours() {
    pickupTimeSelect.innerHTML = '';
    const selectedDateStr = pickupDateInput.value;
    if (!selectedDateStr) return;

    const selectedDate = new Date(selectedDateStr + 'T00:00:00');
    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();
    const dayOfWeek = selectedDate.getDay();

    let startHour, endHour;
    if (dayOfWeek === 0 || isPublicHoliday(selectedDate)) { // Sunday or public holiday
        startHour = 8; endHour = 12; 
    } else { // Weekday
        startHour = 7; endHour = 19; 
    }
    
    let firstAvailableHourSet = false;
    for (let hour = startHour; hour < endHour; hour++) {
        const option = document.createElement('option');
        option.value = hour.toString().padStart(2, '0');
        option.textContent = `${hour}:00`;
        if (isToday && hour <= now.getHours()) {
            option.disabled = true;
        }
        pickupTimeSelect.appendChild(option);
        if (!firstAvailableHourSet && !option.disabled) {
            option.selected = true;
            firstAvailableHourSet = true;
        }
    }
}

function validateCartAgainstPickupDate() {
    const messageContainer = document.getElementById('date-validation-message');
    const submitBtn = document.getElementById('submitOrderBtn');
    const pickupDateStr = pickupDateInput.value;
    
    messageContainer.textContent = '';
    submitBtn.disabled = false;

    if (!pickupDateStr) return;

    const hasHolidayItem = cart.some(item => item.product.availability === 'holiday');
    if (hasHolidayItem) {
        const selectedDate = new Date(pickupDateStr + 'T00:00:00');
        const isSunday = selectedDate.getDay() === 0;
        const isHoliday = isPublicHoliday(selectedDate);
        
        if (!isSunday && !isHoliday) {
            messageContainer.textContent = translations[currentLang].holidayProductOnNonHolidayAlert;
            submitBtn.disabled = true;
            return false;
        }
    }
    return true;
}

function handleDateChange() {
    populatePickupHours();
    validateCartAgainstPickupDate();
}

function submitOrder(event) {
    event.preventDefault();

    if (!validateCartAgainstPickupDate()) {
        alert(translations[currentLang].holidayProductOnNonHolidayAlert);
        return;
    }

    const form = event.target;
    const formData = new FormData(form);
    const submitBtn = document.getElementById('submitOrderBtn');

    const name = formData.get('name');
    const phone = formData.get('phone');
    const email = formData.get('email') || (currentLang === 'de' ? 'Nicht angegeben' : 'Not provided');
    const pickupDate = formData.get('pickupDate');
    const pickupTime = formData.get('pickupTime');
    const userMessage = formData.get('message');

    // Save order details to local storage for the thank you page
    const lastOrder = { name, phone, pickupDate, pickupTime, cart };
    localStorage.setItem('lastOrder', JSON.stringify(lastOrder));

    const cartSummary = cart.map(item =>
        `${item.quantity} x ${currentLang === 'de' ? item.product.name_de : item.product.name_en} (${(item.product.price * item.quantity).toFixed(2)} €)`
    ).join('\n');
    const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0).toFixed(2);

    const emailBody = `
Name: ${name}
Telefonnummer: ${phone}
E-Mail: ${email}
Abholdatum: ${pickupDate} um ${pickupTime}:00 Uhr

Bestelldetails:
${cartSummary}

Gesamt: ${total} €
--------------------------------
Nachricht: ${userMessage}
`;

    const dataToSend = new FormData();
    dataToSend.append('access_key', formData.get('access_key'));
    dataToSend.append('subject', `Neue Bäckerei-Bestellung von ${name}`);
    dataToSend.append('from_name', name);
    dataToSend.append('text', emailBody); 

    submitBtn.disabled = true;
    submitBtn.textContent = currentLang === 'de' ? 'Wird gesendet...' : 'Sending...';

    fetch(form.action, {
        method: form.method,
        body: dataToSend,
        headers: {
            'Accept': 'application/json'
        }
    }).then(response => {
        if (response.ok) {
            // Redirect to thank you page on success
            window.location.href = 'thank-you.html';
        } else {
            response.json().then(data => {
                if (Object.hasOwn(data, 'errors')) {
                    alert(data["errors"].map(error => error["message"]).join(", "));
                } else {
                    alert(currentLang === 'de' ? 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es per Telefon.' : 'An error occurred. Please try ordering by phone.');
                }
            })
        }
    }).catch(error => {
        console.error('Error submitting order:', error);
        alert(currentLang === 'de' ? 'Die Bestellung konnte nicht gesendet werden. Bitte prüfen Sie Ihre Internetverbindung oder bestellen Sie per Telefon.' : 'The order could not be sent. Please check your internet connection or order by phone.');
    }).finally(() => {
        submitBtn.disabled = false;
        applyLanguage();
    });
}

// Initial setup when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Show spinner immediately
    productGrid.innerHTML = '<div class="loading-spinner"></div>';

    fetch('Products.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            products = data; 
            const firstFilterButton = document.querySelector('.filter-category-btn');
            if (firstFilterButton) {
                filterProducts('all', firstFilterButton);
            } else {
                currentFilteredProducts = [...products];
                displayProducts();
            }
        })
        .catch(error => {
            console.error('Could not load products:', error);
            productGrid.innerHTML = '<p style="text-align: center; color: red; font-size: 1.2rem;">Our products could not be loaded at this time. Please try again later.</p>';
        });

    // Use event delegation for product interactions
    productGrid.addEventListener('click', (event) => {
        const target = event.target;
        
        // Handle clicks on quantity buttons
        if (target.matches('.quantity-btn')) {
            const action = target.dataset.action;
            const productId = parseInt(target.dataset.productId);
            if (action === 'increase') {
                updateCartQuantity(productId, 1);
            } else if (action === 'decrease') {
                updateCartQuantity(productId, -1);
            }
            return; // Prevent modal from opening
        }
        
        // Handle clicks on the product card to open the modal
        const productCard = target.closest('.product');
        if (productCard) {
            const productId = parseInt(productCard.dataset.productId);
            openModal(productId);
        }
    });

    document.getElementById('orderForm').addEventListener('submit', submitOrder);
    
    applyLanguage();
    updateCartCount();
});
