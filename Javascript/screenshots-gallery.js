/**
 * Screenshot gallery: album filters, grid, lightbox.
 * Expects window.SCREENSHOTS_CATALOG from screenshots-data.js
 */
(function () {
  var grid = document.getElementById("shotGrid");
  var filters = document.getElementById("shotFilters");
  var statusEl = document.getElementById("shotStatus");
  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightboxImage");
  var lightboxLink = document.getElementById("lightboxLink");
  var lightboxCounter = document.getElementById("lightboxCounter");
  var lightboxCaption = document.getElementById("lightboxCaption");

  if (!grid) return;

  var flat = [];
  var currentIndex = 0;
  var activeAlbum = "all";

  function setStatus(msg) {
    if (!statusEl) return;
    statusEl.textContent = msg || "";
  }

  function flatten(albums, albumId) {
    var list = [];
    albums.forEach(function (album) {
      if (albumId !== "all" && album.id !== albumId) return;
      (album.images || []).forEach(function (img, i) {
        list.push({
          src: img.src,
          alt: img.alt || album.title + " " + (i + 1),
          album: album.title,
          albumId: album.id
        });
      });
    });
    return list;
  }

  function renderFilters(albums) {
    if (!filters) return;
    filters.innerHTML = "";

    function addChip(id, label) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "shot-chip" + (activeAlbum === id ? " is-active" : "");
      btn.textContent = label;
      btn.addEventListener("click", function () {
        activeAlbum = id;
        render();
      });
      filters.appendChild(btn);
    }

    addChip("all", "Alle");
    albums.forEach(function (a) {
      addChip(a.id, a.title + " (" + (a.images || []).length + ")");
    });
  }

  function renderGrid() {
    grid.innerHTML = "";
    flat.forEach(function (item, index) {
      var card = document.createElement("button");
      card.type = "button";
      card.className = "shot-card";
      card.style.animationDelay = Math.min(index * 0.03, 0.36) + "s";
      card.setAttribute("aria-label", item.alt);

      var media = document.createElement("div");
      media.className = "shot-card__media";

      var img = document.createElement("img");
      img.src = item.src;
      img.alt = item.alt;
      img.loading = "lazy";
      media.appendChild(img);

      var meta = document.createElement("div");
      meta.className = "shot-card__meta";
      meta.innerHTML =
        '<span class="shot-card__album">' +
        item.album +
        '</span><span class="shot-card__open">Ansehen</span>';

      card.appendChild(media);
      card.appendChild(meta);
      card.addEventListener("click", function (e) {
        e.stopPropagation();
        openLightbox(index);
      });
      grid.appendChild(card);
    });
  }

  function render() {
    var data = window.SCREENSHOTS_CATALOG || { albums: [] };
    var albums = data.albums || [];
    renderFilters(albums);
    flat = flatten(albums, activeAlbum);
    renderGrid();
    setStatus(flat.length + " Screenshots");
  }

  function openLightbox(index) {
    if (!flat.length) return;
    currentIndex = (index + flat.length) % flat.length;
    var item = flat[currentIndex];
    lightboxImg.src = item.src;
    lightboxImg.alt = item.alt;
    lightboxLink.href = item.src;
    lightboxCounter.textContent = currentIndex + 1 + " / " + flat.length;
    lightboxCaption.textContent = item.album + " · " + item.alt;
    lightbox.hidden = false;
    document.body.classList.add("lightbox-open");
  }

  function closeLightbox() {
    lightbox.hidden = true;
    document.body.classList.remove("lightbox-open");
    lightboxImg.removeAttribute("src");
  }

  function step(delta) {
    openLightbox(currentIndex + delta);
  }

  document.getElementById("lightboxPrev").addEventListener("click", function (e) {
    e.stopPropagation();
    step(-1);
  });
  document.getElementById("lightboxNext").addEventListener("click", function (e) {
    e.stopPropagation();
    step(1);
  });
  document.getElementById("lightboxClose").addEventListener("click", function (e) {
    e.stopPropagation();
    closeLightbox();
  });
  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox || e.target.classList.contains("lightbox__backdrop")) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (lightbox.hidden) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });

  if (window.SCREENSHOTS_CATALOG) {
    render();
  } else {
    setStatus("Keine Screenshots geladen. Bitte generate-screenshots.ps1 ausführen.");
  }
})();
