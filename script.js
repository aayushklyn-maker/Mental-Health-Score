const API_BASE_URL = "https://mental-health-score-0jjb.onrender.com";

const form = document.getElementById("predictForm");
const submitBtn = document.getElementById("submitBtn");
const banner = document.getElementById("banner");
const states = {
  empty: document.getElementById("stateEmpty"),
  loading: document.getElementById("stateLoading"),
  done: document.getElementById("stateDone"),
};
const GAUGE_LENGTH = 540.35; // circumference of r=86

const NUMBER_FIELDS = {
  age: "int", daily_unlocks: "int",
  avg_daily_usage_hours: "float", study_hours: "float",
  physical_activity_hours: "float", sleep_hours_per_night: "float",
};

function showState(name) {
  Object.entries(states).forEach(([key, el]) => (el.hidden = key !== name));
}

function setBusy(busy) {
  submitBtn.disabled = busy;
  submitBtn.classList.toggle("busy", busy);
  submitBtn.querySelector(".btn-label").textContent = busy ? "Predicting…" : "Predict score";
}

function clearErrors() {
  banner.hidden = true;
  banner.innerHTML = "";
  form.querySelectorAll(".field").forEach((f) => {
    f.classList.remove("invalid");
    f.querySelector(".err").textContent = "";
  });
}

function setFieldError(name, message) {
  const field = form.querySelector(`.field[data-name="${name}"]`);
  if (!field) return false;
  field.classList.add("invalid");
  field.querySelector(".err").textContent = message;
  return true;
}

function showBanner(title, items = []) {
  banner.innerHTML = `<strong>${title}</strong>` +
    (items.length ? `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>` : "");
  banner.hidden = false;
  banner.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// Checks the form against the same rules as the Pydantic model before sending.
function collectAndValidate() {
  const data = {};
  let valid = true;
  for (const el of form.elements) {
    if (!el.name) continue;
    const raw = el.value.trim();
    if (raw === "") {
      setFieldError(el.name, "This field is required.");
      valid = false;
      continue;
    }
    if (NUMBER_FIELDS[el.name]) {
      const num = Number(raw);
      const min = el.min !== "" ? Number(el.min) : -Infinity;
      const max = el.max !== "" ? Number(el.max) : Infinity;
      if (Number.isNaN(num) || num < min || num > max) {
        const range = max === Infinity ? `at least ${min}` : `between ${min} and ${max}`;
        setFieldError(el.name, `Enter a number ${range}.`);
        valid = false;
      } else if (NUMBER_FIELDS[el.name] === "int" && !Number.isInteger(num)) {
        setFieldError(el.name, "Enter a whole number.");
        valid = false;
      } else {
        data[el.name] = num;
      }
    } else {
      data[el.name] = raw;
    }
  }
  return valid ? data : null;
}

function describeBand(score) {
  if (score >= 7) return { label: "Good mental health", color: "var(--good)", note: "This profile points to a healthy balance of habits." };
  if (score >= 5) return { label: "Moderate mental health", color: "var(--mid)", note: "Some habits may be worth adjusting, such as sleep or screen time." };
  return { label: "Needs attention", color: "var(--low)", note: "Consider talking with a counselor or someone you trust." };
}

function renderResult(score) {
  const bar = document.getElementById("gaugeBar");
  const band = describeBand(score);
  document.getElementById("scoreBand").textContent = band.label;
  document.getElementById("scoreBand").style.color = band.color;
  document.getElementById("scoreNote").textContent = band.note;
  bar.style.stroke = band.color;
  bar.style.strokeDashoffset = GAUGE_LENGTH;
  showState("done");

  const fraction = Math.min(Math.max(score / 10, 0), 1);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    bar.style.strokeDashoffset = GAUGE_LENGTH * (1 - fraction);
  }));

  // count up the number
  const out = document.getElementById("scoreValue");
  const start = performance.now();
  const duration = 1000;
  (function tick(now) {
    const t = Math.min((now - start) / duration, 1);
    out.textContent = (score * (1 - Math.pow(1 - t, 3))).toFixed(1);
    if (t < 1) requestAnimationFrame(tick); else out.textContent = score.toFixed(2);
  })(start);
}

function handleValidationDetail(detail) {
  const general = [];
  detail.forEach((d) => {
    const name = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : null;
    if (!(typeof name === "string" && setFieldError(name, d.msg))) {
      general.push(`${name ?? "Request"}: ${d.msg}`);
    }
  });
  showBanner("Some values were rejected by the server. Fix the highlighted fields and try again.", general);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors();

  const payload = collectAndValidate();
  if (!payload) {
    showBanner("Check the highlighted fields and try again.");
    return;
  }

  setBusy(true);
  showState("loading");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(`${API_BASE_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    let body = null;
    try { body = await res.json(); } catch { /* non-JSON response */ }

    if (res.ok) {
      const score = Number(body?.predicted_mental_health_score);
      if (Number.isNaN(score)) throw new Error("The server returned an unexpected response.");
      renderResult(score);
    } else if (res.status === 422 && Array.isArray(body?.detail)) {
      showState("empty");
      handleValidationDetail(body.detail);
    } else {
      showState("empty");
      const detail = typeof body?.detail === "string" ? body.detail : `Server error (${res.status}).`;
      showBanner("The prediction failed.", [detail]);
    }
  } catch (err) {
    showState("empty");
    if (err.name === "AbortError") {
      showBanner("The request timed out.", ["The server took too long to respond. Try again."]);
    } else if (err instanceof TypeError) {
      showBanner("Can't reach the server.", [`Make sure the API is running at ${API_BASE_URL}.`]);
    } else {
      showBanner("Something went wrong.", [err.message]);
    }
  } finally {
    clearTimeout(timeout);
    setBusy(false);
  }
});

form.addEventListener("reset", () => {
  clearErrors();
  showState("empty");
});

form.addEventListener("input", (e) => {
  const field = e.target.closest(".field");
  if (field) {
    field.classList.remove("invalid");
    field.querySelector(".err").textContent = "";
  }
});
