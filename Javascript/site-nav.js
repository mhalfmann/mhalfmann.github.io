/**
 * Shared header navigation for portfolio pages.
 */
(function () {
  var list = document.getElementById("list");
  var listButton = document.getElementById("listButton");
  if (!list || !listButton) return;

  if (window.jQuery) {
    jQuery(list).hide();
  } else {
    list.hidden = true;
  }

  listButton.addEventListener("click", function (e) {
    e.stopPropagation();
    if (window.jQuery) {
      jQuery(list).toggle();
    } else {
      list.hidden = !list.hidden;
    }
  });

  document.body.addEventListener("click", function (event) {
    if (event.target && event.target.id === "listIcon") return;
    if (event.target && event.target.closest && event.target.closest("#listButton")) return;
    if (window.jQuery) {
      jQuery(list).hide();
    } else {
      list.hidden = true;
    }
  });

  window.gotoPage = function (element) {
    var href = element.getAttribute("href");
    if (href) location.href = href;
  };
})();
