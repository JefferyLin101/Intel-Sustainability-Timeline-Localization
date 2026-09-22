const rtlLanguageCodes = new Set([
  "ar", "dv", "fa", "he", "iw", "ku", "ps", "sd", "ur", "yi"
]);
const detectedLanguage = (navigator.languages && navigator.languages[0]) || navigator.language || "en";
const detectedLanguageCode = detectedLanguage.toLowerCase().split("-")[0];
const isRightToLeft = rtlLanguageCodes.has(detectedLanguageCode);
document.documentElement.lang = detectedLanguage;
document.documentElement.dir = isRightToLeft ? "rtl" : "ltr";

const timelineBar = document.querySelector(".timeline-years");
const timelineLinks = [...document.querySelectorAll(".timeline-years a")];
const timelineCards = [...document.querySelectorAll(".timeline-card")];
const timelineTrack = document.querySelector(".timeline-cards-track");
const previousPreview = document.querySelector(".timeline-preview-previous");
const nextPreview = document.querySelector(".timeline-preview-next");
let pendingMobileYear = null;
const timelineSections = timelineLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

function animateScroll(element, target, duration) {
  const start = element.scrollLeft;
  const distance = target - start;
  const startTime = performance.now();

  function step(currentTime) {
    const progress = Math.min((currentTime - startTime) / duration, 1);
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    element.scrollLeft = start + distance * easedProgress;
    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

function centerTimelineLink(link) {
  const linkCenter = link.offsetLeft + link.offsetWidth / 2;
  const barCenter = timelineBar.clientWidth / 2;
  animateScroll(timelineBar, linkCenter - barCenter, 700);
  timelineBar.querySelector(".timeline-years-track").style.setProperty(
    "--active-dot-left",
    `${link.offsetLeft + link.offsetWidth / 2}px`
  );
}

function setActiveYear(id) {
  timelineLinks.forEach((link) => {
    const isActive = link.getAttribute("href") === `#${id}`;
    link.classList.toggle("is-active", isActive);
    link.setAttribute("aria-current", isActive ? "step" : "false");
    if (isActive) {
      centerTimelineLink(link);
    }
  });
}

function showTimelineCard(index) {
  const boundedIndex = Math.max(0, Math.min(index, timelineCards.length - 1));
  const card = timelineCards[boundedIndex];
  const cardCenter = card.offsetLeft + card.offsetWidth / 2;
  animateScroll(timelineTrack, cardCenter - timelineTrack.clientWidth / 2, 900);
  timelineCards.forEach((timelineCard, cardIndex) => {
    timelineCard.classList.toggle("is-current", cardIndex === boundedIndex);
  });
  setActiveYear(card.id);
  previousPreview.disabled = boundedIndex === 0;
  nextPreview.disabled = boundedIndex === timelineCards.length - 1;
}

function updateCurrentCard() {
  const index = currentTimelineCard();
  const card = timelineCards[index];
  timelineCards.forEach((timelineCard, cardIndex) => {
    timelineCard.classList.toggle("is-current", cardIndex === index);
  });
  setActiveYear(card.id);
  previousPreview.disabled = index === 0;
  nextPreview.disabled = index === timelineCards.length - 1;
}

function currentTimelineCard() {
  const trackCenter = timelineTrack.scrollLeft + timelineTrack.clientWidth / 2;
  return timelineCards.reduce((closestIndex, card, cardIndex) => {
    const closestDistance = Math.abs(
      timelineCards[closestIndex].offsetLeft + timelineCards[closestIndex].offsetWidth / 2 - trackCenter
    );
    const cardDistance = Math.abs(card.offsetLeft + card.offsetWidth / 2 - trackCenter);
    return cardDistance < closestDistance ? cardIndex : closestIndex;
  }, 0);
}

timelineLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const section = document.querySelector(link.getAttribute("href"));
    const cardIndex = timelineCards.indexOf(section);
    if (window.matchMedia("(min-width: 56.25rem)").matches) {
      showTimelineCard(cardIndex);
    } else {
      pendingMobileYear = section.id;
      setActiveYear(section.id);
      section.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  });
});

previousPreview.addEventListener("click", () => showTimelineCard(currentTimelineCard() - 1));
nextPreview.addEventListener("click", () => showTimelineCard(currentTimelineCard() + 1));

timelineTrack.addEventListener("scroll", () => {
  if (window.matchMedia("(min-width: 56.25rem)").matches) {
    updateCurrentCard();
  }
}, { passive: true });

const timelineObserver = new IntersectionObserver(
  (entries) => {
    if (pendingMobileYear) {
      const targetEntry = entries.find(
        (entry) => entry.target.id === pendingMobileYear
      );
      if (targetEntry && targetEntry.isIntersecting) {
        setActiveYear(pendingMobileYear);
        pendingMobileYear = null;
      }
      return;
    }
    const visibleSection = entries
      .filter((entry) => entry.isIntersecting)
      .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];
    if (visibleSection) {
      setActiveYear(visibleSection.target.id);
    }
  },
  { rootMargin: "-18% 0px -62%", threshold: [0, 0.25, 0.5, 0.75, 1] }
);

timelineSections.forEach((section) => timelineObserver.observe(section));
timelineLinks[0].classList.add("is-active");
timelineLinks[0].setAttribute("aria-current", "step");
showTimelineCard(0);

timelineCards.forEach((card) => {
  card.addEventListener("click", () => {
    card.classList.toggle("is-revealed");
  });
});

document.querySelector("#newsletter-form").addEventListener("submit", (event) => {
  event.preventDefault();
  event.currentTarget.reset();
});
