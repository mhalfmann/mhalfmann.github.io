/**
 * Screenshot gallery.
 * Fast path: screenshots-data.js from generate-screenshots.ps1 (instant).
 * Slow path (no catalog): probe numbered files 1.png, 2.png, …
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

  var EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif"];
  var MAX_PER_ALBUM = 120;
  var DEFAULT_ALBUMS = [
    { id: "Lego", title: "Lego" },
    { id: "FlightSimulator", title: "Flight Simulator" }
  ];

  var albums = [];
  var flat = [];
  var currentIndex = 0;
  var activeAlbum = "all";

  function setStatus(msg) {
    if (!statusEl) return;
    statusEl.textContent = msg || "";
  }

  function probeUrl(url) {
    return new Promise(function (resolve) {
      var img = new Image();
      var timer = setTimeout(function () {
        finish(false);
      }, 800);
      var done = false;
      function finish(ok) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve(ok);
      }
      img.onload = function () {
        finish(true);
      };
      img.onerror = function () {
        finish(false);
      };
      img.src = url;
    });
  }

  async function findFirstExisting(basePathNoExt) {
    var checks = EXTENSIONS.map(function (ext) {
      return probeUrl(basePathNoExt + ext).then(function (ok) {
        return ok ? ext : null;
      });
    });
    var results = await Promise.all(checks);
    for (var i = 0; i < results.length; i++) {
      if (results[i]) return results[i];
    }
    return null;
  }

  async function probeNumberedAlbum(def) {
    var folder = "./Assets/Screenshots/" + def.id + "/";
    var images = [];
    var ext = await findFirstExisting(folder + "1");
    if (!ext) return { id: def.id, title: def.title, images: [] };

    images.push({ src: folder + "1" + ext, alt: def.title + " 1" });
    for (var i = 2; i <= MAX_PER_ALBUM; i++) {
      var src = folder + i + ext;
      if (!(await probeUrl(src))) break;
      images.push({ src: src, alt: def.title + " " + i });
    }
    return { id: def.id, title: def.title, images: images };
  }

  function flatten(albumId) {
    var list = [];
    albums.forEach(function (album) {
      if (albumId !== "all" && album.id !== albumId) return;
      (album.images || []).forEach(function (img) {
        list.push({
          src: img.src,
          alt: img.alt,
          album: album.title,
          albumId: album.id
        });
      });
    });
    return list;
  }

  function renderFilters() {
    if (!filters) return;
    filters.innerHTML = "";

    function addChip(id, label) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "shot-chip" + (activeAlbum === id ? " is-active" : "");
      btn.textContent = label;
      btn.addEventListener("click", function () {
        activeAlbum = id;
        paint();
      });
      filters.appendChild(btn);
    }

    addChip("all", "Alle");
    albums.forEach(function (a) {
      if (!a.images.length) return;
      addChip(a.id, a.title + " (" + a.images.length + ")");
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

  function paint() {
    flat = flatten(activeAlbum);
    renderFilters();
    renderGrid();
    setStatus(flat.length + " Bilder");
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

  async function boot() {
    var catalog = window.SCREENSHOTS_CATALOG && window.SCREENSHOTS_CATALOG.albums;

    // Fast: use generate-screenshots.ps1 output immediately
    if (catalog && catalog.length) {
      albums = catalog.filter(function (a) {
        return a.images && a.images.length;
      });
      if (albums.length) {
        paint();
        return;
      }
    }

    // Fallback without catalog: numbered probe (slower)
    setStatus("Bildergalerie wird geladen…");
    var defs = DEFAULT_ALBUMS.slice();
    var scanned = await Promise.all(defs.map(probeNumberedAlbum));
    albums = scanned.filter(function (a) {
      return a.images.length > 0;
    });
    if (!albums.length) {
      setStatus("Keine Bilder gefunden. Bitte generate-screenshots.ps1 ausführen.");
      grid.innerHTML = "";
      return;
    }
    paint();
  }

  boot();
})();
