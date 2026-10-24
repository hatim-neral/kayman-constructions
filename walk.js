/*
 * Scroll walkthrough.
 * A single walkthrough video that only moves when you scroll: the scroll
 * position sets a target time, and the video eases toward it every frame,
 * so it glides like playback instead of jumping.
 */
(() => {
  const video = document.querySelector('.walk-video');
  const walk = document.querySelector('.walk');
  if (!video || !walk) return;

  // start: seconds into video/walkthrough-*.mp4 where each room begins
  const ROOMS = [
    { start: 0, name: 'Outside', service: 'Whole-home renovation',
      text: 'Siding, windows, roofing and glass walls, planned together with everything inside.' },
    { start: 10.9, name: 'Living and dining', service: 'Open-concept remodeling',
      text: 'Load-bearing walls swapped for beams, new stairs, built-ins and ceiling work.' },
    { start: 25.5, name: 'Kitchen', service: 'Kitchen remodeling',
      text: 'Custom cabinets, stone counters and islands, with the plumbing, gas and electrical moved to where you need them.' },
    { start: 35.7, name: 'Primary suite', service: 'Bedrooms and additions',
      text: 'New bedrooms, second stories and hallway reworks, framed and finished to match the house.' },
    { start: 44.0, name: 'Primary bath', service: 'Bathroom remodeling',
      text: 'Glass showers, freestanding tubs and double vanities, waterproofed for Gulf Coast humidity.' },
    { start: 51.7, name: 'Back patio', service: 'Outdoor living',
      text: 'Covered patios, outdoor kitchens and sliding glass walls, framed to Houston wind-load code.' },
  ];
  const N = ROOMS.length;

  const hero = document.querySelector('.hero');
  const heroScrim = document.querySelector('.hero-scrim');
  const cue = document.querySelector('.scroll-cue');
  const caption = document.querySelector('.caption');
  const capRoom = caption.querySelector('.caption-room');
  const capService = caption.querySelector('.caption-service');
  const capText = caption.querySelector('.caption-text');
  const list = document.querySelector('.rooms ol');

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  /* ---------- Logo intro ---------- */

  // Hide the logo once the first frame is ready: at least 1.2s, at most 3.5s
  const intro = document.querySelector('.intro');
  if (intro) {
    const shownAt = performance.now();
    let done = false;
    const hide = () => {
      if (done) return;
      done = true;
      setTimeout(() => {
        intro.classList.add('is-done');
        setTimeout(() => intro.remove(), 800); // don't depend on the fade animation alone
      }, Math.max(0, 1200 - (performance.now() - shownAt)));
    };
    video.addEventListener('loadeddata', hide, { once: true });
    setTimeout(hide, 3500);
  }

  /* ---------- Load the video ---------- */

  // Smaller file on phones. Downloading the whole file up front (instead of
  // streaming it) is what makes scrubbing backwards and forwards instant.
  const src = window.innerWidth <= 800 ? 'video/walkthrough-854.mp4' : 'video/walkthrough-1280.mp4';
  let duration = 59.9;
  video.src = src;
  video.addEventListener('loadedmetadata', () => { duration = video.duration || duration; request(); });

  if (window.fetch && location.protocol !== 'file:') {
    fetch(src)
      .then(r => (r.ok ? r.blob() : Promise.reject()))
      .then(blob => {
        const t = video.currentTime;
        video.src = URL.createObjectURL(blob);
        video.addEventListener('loadedmetadata', () => { video.currentTime = t; }, { once: true });
      })
      .catch(() => {});
  }

  // iOS only paints frames of a video after it has played once
  const unlock = () => {
    video.play().then(() => video.pause()).catch(() => {});
    window.removeEventListener('touchstart', unlock);
  };
  window.addEventListener('touchstart', unlock, { passive: true });

  /* ---------- Room list ---------- */

  ROOMS.forEach((room, i) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = room.name;
    b.addEventListener('click', () => goTo(i));
    li.appendChild(b);
    list.appendChild(li);
  });
  const buttons = [...list.querySelectorAll('button')];

  /* ---------- Floor plan ---------- */

  // The route through the plan, as [seconds into the video, x, y]
  const ROUTE = [
    [0, 80, 162], [7, 80, 131], [12, 72, 100], [20, 118, 96], [28, 180, 92],
    [33, 120, 78], [37, 79, 64], [41, 46, 34], [44, 96, 32], [46.5, 122, 30],
    [49, 79, 64], [51, 96, 128], [55, 150, 146], [60, 186, 150],
  ];
  const plan = document.querySelector('.plan');
  let placeOnPlan = () => {};
  if (plan) {
    const pathEl = plan.querySelector('.plan-path');
    const trail = plan.querySelector('.plan-trail');
    const dot = plan.querySelector('.plan-dot');
    const pulse = plan.querySelector('.plan-pulse');
    const labels = [...plan.querySelectorAll('[data-room]')];
    const d = 'M' + ROUTE.map(([, x, y]) => `${x} ${y}`).join('L');
    pathEl.setAttribute('d', d);
    trail.setAttribute('d', d);
    const lengths = [0];
    for (let i = 1; i < ROUTE.length; i++) {
      lengths.push(lengths[i - 1] + Math.hypot(ROUTE[i][1] - ROUTE[i - 1][1], ROUTE[i][2] - ROUTE[i - 1][2]));
    }
    const total = lengths[lengths.length - 1];
    pathEl.style.strokeDasharray = total;

    placeOnPlan = (time, idx) => {
      let i = 1;
      while (i < ROUTE.length - 1 && time > ROUTE[i][0]) i++;
      const [t0, x0, y0] = ROUTE[i - 1];
      const [t1, x1, y1] = ROUTE[i];
      const f = clamp((time - t0) / (t1 - t0));
      const x = x0 + (x1 - x0) * f, y = y0 + (y1 - y0) * f;
      pathEl.style.strokeDashoffset = total - (lengths[i - 1] + (lengths[i] - lengths[i - 1]) * f);
      dot.setAttribute('cx', x); dot.setAttribute('cy', y);
      pulse.setAttribute('cx', x); pulse.setAttribute('cy', y);
      labels.forEach(l => l.classList.toggle('is-here', +l.dataset.room === idx));
    };
    labels.forEach(l => l.addEventListener('click', () => goTo(+l.dataset.room)));
  }

  function scrollRange() {
    return walk.offsetHeight - window.innerHeight;
  }

  function goTo(i) {
    const time = i === 0 ? 0 : ROOMS[i].start + 1.2;
    window.scrollTo({ top: walk.offsetTop + (time / duration) * scrollRange(), behavior: 'smooth' });
  }

  function roomAt(time) {
    let i = 0;
    while (i < N - 1 && time >= ROOMS[i + 1].start) i++;
    return i;
  }

  /* ---------- Scrubbing ---------- */

  let target = 0;      // where the scrollbar says we should be (seconds)
  let current = 0;     // where the video is being eased to (seconds)
  let running = false;
  let shownCaption = -1;

  function readScroll() {
    const p = clamp(-walk.getBoundingClientRect().top / scrollRange());
    target = p * duration;
    cue.style.opacity = clamp(1 - p * 40) * 0.9;
  }

  let lastFrame = 0;

  function paint(now) {
    // ease toward the scroll position; this is what makes it feel like video.
    // Time-based, so it glides at the same speed on 60Hz and 120Hz screens.
    const dt = lastFrame ? Math.min((now - lastFrame) / 1000, 0.1) : 1 / 60;
    lastFrame = now;
    const diff = target - current;
    current = Math.abs(diff) < 0.004 ? target : current + diff * (1 - Math.exp(-dt / 0.11));
    if (!video.seeking && Math.abs(video.currentTime - current) > 0.01) {
      video.currentTime = current;
    }

    const heroOpacity = clamp(1 - current / 1.6);
    hero.style.opacity = heroOpacity;
    hero.style.visibility = heroOpacity < 0.02 ? 'hidden' : '';
    heroScrim.style.opacity = heroOpacity;

    const idx = roomAt(current);
    const start = ROOMS[idx].start;
    const end = idx < N - 1 ? ROOMS[idx + 1].start : duration + 2;
    const fadeIn = clamp((current - start - 0.4) / 0.8);
    const fadeOut = clamp((end - current - 0.4) / 0.8);
    const capOpacity = Math.min(fadeIn, fadeOut) * (idx === 0 ? 1 - heroOpacity : 1);

    if (idx !== shownCaption) {
      shownCaption = idx;
      capRoom.textContent = ROOMS[idx].name;
      capService.textContent = ROOMS[idx].service;
      capText.textContent = ROOMS[idx].text;
      buttons.forEach((b, i) => (i === idx ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current')));
      // replay the caption's entrance for the new room
      caption.classList.remove('is-in');
      void caption.offsetWidth;
      caption.classList.add('is-in');
    }
    placeOnPlan(current, idx);
    caption.style.opacity = capOpacity.toFixed(3);

    // keep going until the video has actually landed on the target frame
    const settled = current === target && !video.seeking && Math.abs(video.currentTime - target) <= 0.01;
    if (!settled && video.readyState >= 1) requestAnimationFrame(paint);
    else { running = false; lastFrame = 0; }
  }

  function request() {
    readScroll();
    if (!running) { running = true; requestAnimationFrame(paint); }
  }

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  request();

  /* ---------- Contact form ---------- */

  // Bookings are emailed through FormSubmit (formsubmit.co): Kaif gets each
  // booking and Amaan is copied. The very first submission sends Kaif a one-time
  // activation email; bookings are delivered once that link has been clicked.
  const BOOKING_TO = 'kaif@kaymanconstructions.com';
  const BOOKING_CC = 'amaan@kaymanconstructions.com';

  const form = document.querySelector('.contact-form');
  if (form) {
    const err = form.querySelector('.form-error');
    const done = form.querySelector('.form-done');
    const button = form.querySelector('button[type="submit"]');
    const label = button.textContent;

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const missing = [];
      form.querySelectorAll('[required]').forEach(f => {
        const bad = !f.value.trim() || !f.checkValidity();
        f.setAttribute('aria-invalid', bad ? 'true' : 'false');
        if (bad) missing.push(form.querySelector(`label[for="${f.id}"]`).textContent.trim().toLowerCase());
      });
      if (missing.length) {
        err.textContent = `Add your ${missing.join(', ')} so we can reach you.`;
        err.hidden = false;
        done.hidden = true;
        return;
      }

      const data = Object.fromEntries(new FormData(form));
      if (data._honey) return; // filled in by a bot
      delete data._honey;

      err.hidden = true;
      button.disabled = true;
      button.textContent = 'Sending…';
      try {
        const res = await fetch(`https://formsubmit.co/ajax/${BOOKING_TO}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            Name: data.name,
            Phone: data.phone,
            'ZIP code': data.zip,
            Email: data.email || 'Not given',
            Project: data.type,
            Notes: data.notes || 'None',
            _subject: `New walkthrough request: ${data.name} (${data.type})`,
            _cc: BOOKING_CC,
            _replyto: data.email || BOOKING_TO,
            _template: 'table',
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || String(json.success) === 'false') throw new Error(json.message || res.status);
        form.querySelectorAll('input, select, textarea').forEach(f => { f.disabled = true; });
        button.textContent = 'Walkthrough requested';
        done.hidden = false;
      } catch (error) {
        button.disabled = false;
        button.textContent = label;
        err.textContent = 'Your request didn’t go through. Please try again, or call Kaif at +1 (209) 351-1726.';
        err.hidden = false;
      }
    });
  }
})();
