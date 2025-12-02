

document.addEventListener("DOMContentLoaded", () => {

  const header = document.querySelector("header");
  const scrollBtn = document.getElementById("scrollTopBtn");

  if (!header) return; // sécurité, au cas où

  let lastScroll = 0;

  window.addEventListener("scroll", () => {
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

    // --- Masque le menu si on scrolle vers le bas ---
    if (currentScroll > lastScroll && currentScroll > 100) {
      header.style.top = "-80px";
    } else {
      header.style.top = "0";
    }

    lastScroll = currentScroll;

    // --- Affiche / cache la flèche ---
    if (scrollBtn) {
      if (currentScroll > 300) {
        scrollBtn.style.display = "flex";
      } else {
        scrollBtn.style.display = "none";
      }
    }
  });

  // --- Remonter en haut ---
  if (scrollBtn) {
    scrollBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

});

