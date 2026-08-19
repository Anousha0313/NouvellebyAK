/* =====================================================
   NOUVELLE BY AK — FRONTEND ONLY
   No backend / database / API required
===================================================== */


/* =====================================================
   MOBILE MENU
===================================================== */

const burgerBtn = document.getElementById("burgerBtn");
const mobileMenu = document.getElementById("mobileMenu");

if (burgerBtn && mobileMenu) {
  burgerBtn.addEventListener("click", () => {
    mobileMenu.classList.toggle("open");

    const isOpen = mobileMenu.classList.contains("open");

    burgerBtn.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  });

  // Close mobile menu when a link is clicked
  mobileMenu.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      mobileMenu.classList.remove("open");
      burgerBtn.setAttribute("aria-label", "Open menu");
    });
  });
}


/* =====================================================
   SEARCH OVERLAY
===================================================== */

const searchBtn = document.getElementById("searchBtn");
const searchOverlay = document.getElementById("searchOverlay");
const closeSearch = document.getElementById("closeSearch");
const searchInput = document.getElementById("searchInput");

function openSearch() {
  if (!searchOverlay) return;

  searchOverlay.classList.add("open");

  setTimeout(() => {
    if (searchInput) {
      searchInput.focus();
    }
  }, 300);
}

function closeSearchOverlay() {
  if (!searchOverlay) return;

  searchOverlay.classList.remove("open");

  if (searchInput) {
    searchInput.value = "";
  }
}

if (searchBtn) {
  searchBtn.addEventListener("click", openSearch);
}

if (closeSearch) {
  closeSearch.addEventListener("click", closeSearchOverlay);
}


/* =====================================================
   CLOSE SEARCH WITH ESCAPE KEY
===================================================== */

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeSearchOverlay();

    if (mobileMenu) {
      mobileMenu.classList.remove("open");
    }
  }
});


/* =====================================================
   SEARCH — COMING SOON MESSAGE
===================================================== */

const searchResults = document.getElementById("searchResults");

if (searchInput && searchResults) {
  searchInput.addEventListener("input", () => {

    const query = searchInput.value.trim();

    if (!query) {
      searchResults.innerHTML = "";
      return;
    }

    searchResults.innerHTML = `
      <p style="
        font-family: 'Space Mono', monospace;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: .08em;
        color: #8B7355;
        text-align: center;
      ">
        products are coming soon ✦
      </p>
    `;
  });
}


/* =====================================================
   OVERLAY
===================================================== */

const overlay = document.getElementById("overlay");

if (overlay) {
  overlay.addEventListener("click", () => {
    closeSearchOverlay();
  });
}


/* =====================================================
   WISHLIST BUTTON
   Frontend-only for now
===================================================== */

const wishlistBtn = document.getElementById("wishlistBtn");
const wishCount = document.getElementById("wishCount");

if (wishlistBtn) {
  wishlistBtn.addEventListener("click", () => {

    const shopSection = document.getElementById("shop");

    if (shopSection) {
      shopSection.scrollIntoView({
        behavior: "smooth"
      });
    }

  });
}


/* =====================================================
   CART BUTTON
   Frontend-only for Coming Soon
===================================================== */

const cartBtn = document.getElementById("cartBtn");
const cartDrawer = document.getElementById("cartDrawer");
const closeCart = document.getElementById("closeCart");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const cartCount = document.getElementById("cartCount");

function openCart() {

  if (!cartDrawer) return;

  cartDrawer.classList.add("open");

  if (overlay) {
    overlay.classList.add("open");
  }

  if (cartItems) {
    cartItems.innerHTML = `
      <p class="drawer__empty">
        shopping is coming soon ✦
      </p>
    `;
  }

  if (cartTotal) {
    cartTotal.textContent = "$0";
  }

  if (cartCount) {
    cartCount.textContent = "0";
  }
}

function closeCartDrawer() {

  if (!cartDrawer) return;

  cartDrawer.classList.remove("open");

  if (overlay) {
    overlay.classList.remove("open");
  }
}

if (cartBtn) {
  cartBtn.addEventListener("click", openCart);
}

if (closeCart) {
  closeCart.addEventListener("click", closeCartDrawer);
}


/* =====================================================
   NEWSLETTER
   Frontend-only confirmation
===================================================== */

const newsletterForm = document.getElementById("newsletterForm");
const newsletterMsg = document.getElementById("newsletterMsg");

if (newsletterForm) {

  newsletterForm.addEventListener("submit", event => {

    event.preventDefault();

    const emailInput = newsletterForm.querySelector("input");

    if (!emailInput) return;

    const email = emailInput.value.trim();

    if (!email) return;

    if (newsletterMsg) {
      newsletterMsg.textContent =
        "you're on the list ✦ we'll keep you posted";
    }

    newsletterForm.reset();

  });

}


/* =====================================================
   CONTACT FORM
   Frontend-only confirmation
===================================================== */

const contactForm = document.getElementById("contactForm");
const contactMsg = document.getElementById("contactMsg");

if (contactForm) {

  contactForm.addEventListener("submit", event => {

    event.preventDefault();

    if (contactMsg) {
      contactMsg.textContent =
        "message received ✦ we'll get back to you soon";
    }

    contactForm.reset();

  });

}


/* =====================================================
   UGC IMAGE GRID
===================================================== */

const UGC_IMAGES = [

  "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80",

  "https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=400&q=80",

  "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&q=80",

  "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80",

  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80",

  "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=400&q=80",

  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400&q=80",

  "https://images.unsplash.com/photo-1554568218-0f1715e72254?w=400&q=80",

  "https://images.unsplash.com/photo-1503185912284-5271ff81b9a8?w=400&q=80",

  "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=400&q=80"

];

const ugcGrid = document.getElementById("ugcGrid");

if (ugcGrid) {

  ugcGrid.innerHTML = UGC_IMAGES
    .map(image => `
      <img
        src="${image}"
        alt="Nouvelle by AK customer styled look"
        loading="lazy"
      >
    `)
    .join("");

}


/* =====================================================
   SMOOTH SCROLL FOR ANCHOR LINKS
===================================================== */

document.querySelectorAll('a[href^="#"]').forEach(link => {

  link.addEventListener("click", event => {

    const targetId = link.getAttribute("href");

    if (!targetId || targetId === "#") {
      return;
    }

    const target = document.querySelector(targetId);

    if (target) {

      event.preventDefault();

      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    }

  });

});


/* =====================================================
   PREVENT EMPTY # LOGO FROM JUMPING
===================================================== */

document.querySelectorAll('a[href="#"]').forEach(link => {

  link.addEventListener("click", event => {
    event.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });

});


/* =====================================================
   INITIAL STATE
===================================================== */

if (cartCount) {
  cartCount.textContent = "0";
}

if (wishCount) {
  wishCount.textContent = "0";
}

console.log("Nouvelle by AK — frontend loaded ✦");