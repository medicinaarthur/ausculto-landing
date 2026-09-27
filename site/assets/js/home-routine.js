(() => {
  "use strict";
  const track = document.getElementById("m-routine-list");
  if (!track) return;
  const cards = [...track.querySelectorAll(".routine-card")];
  const controls = track.parentElement.querySelector(".routine-controls");
  const previous = controls.querySelector("[data-routine-prev]");
  const next = controls.querySelector("[data-routine-next]");
  const counter = controls.querySelector("[data-routine-index]");
  const mobile = matchMedia("(max-width: 639px)");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let index = 0, settle;
  function positions() {
    const left = track.getBoundingClientRect().left + parseFloat(getComputedStyle(track).paddingLeft);
    return cards.map(card => card.getBoundingClientRect().left - left + track.scrollLeft);
  }
  function sync() {
    controls.hidden = !mobile.matches;
    if (!mobile.matches) return;
    const offsets = positions();
    index = offsets.reduce((best, offset, i) => Math.abs(offset - track.scrollLeft) < Math.abs(offsets[best] - track.scrollLeft) ? i : best, 0);
    // The last card can stop before its left edge aligns, since it is narrower than the viewport.
    if (track.scrollLeft > 0 && track.scrollWidth - track.clientWidth - track.scrollLeft < 3) index = cards.length - 1;
    previous.disabled = index === 0;
    next.disabled = index === cards.length - 1;
    counter.textContent = String(index + 1);
  }
  function go(delta) {
    const target = Math.max(0, Math.min(cards.length - 1, index + delta));
    track.scrollTo({ left: positions()[target], behavior: reduced.matches ? "instant" : "smooth" });
  }
  previous.addEventListener("click", () => go(-1));
  next.addEventListener("click", () => go(1));
  track.addEventListener("scroll", () => { clearTimeout(settle); settle = setTimeout(sync, 120); }, {passive:true});
  track.addEventListener("scrollend", sync);
  track.addEventListener("keydown", event => {
    if (!mobile.matches || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    const focused = cards.indexOf(document.activeElement);
    const target = Math.max(0, Math.min(cards.length - 1, (focused < 0 ? index : focused) + (event.key === "ArrowRight" ? 1 : -1)));
    cards[target].focus({preventScroll:true});
    track.scrollTo({left:positions()[target], behavior:reduced.matches ? "instant" : "smooth"});
  });
  mobile.addEventListener("change", sync);
  addEventListener("resize", sync, {passive:true});
  sync();
})();
