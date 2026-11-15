(function () {
  var API = "https://script.google.com/macros/s/AKfycbwIY6Oibqru0rG0CeTHIOaIA3Xbt7xjn1L7FKyPskcUfj7bX-Z1S2jqNs0fAQHFQjsR/exec";
  var raw = null;
  try { raw = JSON.parse(localStorage.getItem("mw_user") || "null"); } catch (e) {}

  function toLogin() {
    try { localStorage.removeItem("mw_user"); } catch (e) {}
    location.replace("login.html");
  }
  function reveal() { document.documentElement.style.visibility = ""; }

  // رسالة واضحة بدل الصفحة البيضاء، تعمل سواء اكتمل تحميل الصفحة أم لا
  function fail(detail) {
    function render() {
      reveal();
      var b = document.body;
      b.innerHTML = "";
      b.style.cssText = "font-family:Tahoma,sans-serif;text-align:center;padding:40px;direction:rtl";
      var p = document.createElement("p");
      p.textContent = "تعذر التحقق من الجلسة. تأكد من الاتصال ثم أعد المحاولة.";
      var d = document.createElement("p");
      d.style.cssText = "color:#888;font-size:13px;direction:ltr";
      d.textContent = detail || "";
      var b1 = document.createElement("button");
      b1.textContent = "إعادة المحاولة";
      b1.onclick = function () { location.reload(); };
      var b2 = document.createElement("button");
      b2.textContent = "تسجيل الدخول";
      b2.style.marginRight = "10px";
      b2.onclick = toLogin;
      b.appendChild(p); b.appendChild(d); b.appendChild(b1); b.appendChild(b2);
    }
    if (document.body) render(); else document.addEventListener("DOMContentLoaded", render);
  }

  if (!raw || raw.success !== true || !raw.token) { toLogin(); return; }

  document.documentElement.style.visibility = "hidden";
  // ضمان ألا تبقى الصفحة مخفية أكثر من 15 ثانية
  var timer = setTimeout(function () { fail("timeout"); }, 15000);

  fetch(API, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "verify", token: raw.token })
  })
    .then(function (r) { return r.text(); })
    .then(function (t) {
      clearTimeout(timer);
      var r;
      try { r = JSON.parse(t); } catch (e) { fail("invalid response: " + t.slice(0, 80)); return; }
      if (!r || r.success !== true || !r.user) { toLogin(); return; }
      var u = r.user;
      var fresh = {
        success: true, token: raw.token,
        username: String(u.username), name: String(u.name),
        level: String(u.level), specialization: String(u.specialization || ""),
        role: u.role === "admin" ? "admin" : "user"
      };
      var changed = ["username", "level", "specialization", "role"].some(function (k) {
        return String(raw[k] || "") !== String(fresh[k] || "");
      });
      localStorage.setItem("mw_user", JSON.stringify(fresh));
      if (changed) { location.reload(); return; }
      reveal();
    })
    .catch(function (e) {
      clearTimeout(timer);
      fail(String(e && e.message || e));
    });
})();
