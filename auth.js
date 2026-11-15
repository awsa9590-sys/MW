(function () {
  var API = "https://script.google.com/macros/s/AKfycbwIY6Oibqru0rG0CeTHIOaIA3Xbt7xjn1L7FKyPskcUfj7bX-Z1S2jqNs0fAQHFQjsR/exec";
  var raw = null;
  try { raw = JSON.parse(localStorage.getItem("mw_user") || "null"); } catch (e) {}

  function toLogin() {
    try { localStorage.removeItem("mw_user"); } catch (e) {}
    location.replace("login.html");
  }
  if (!raw || raw.success !== true || !raw.token) { toLogin(); return; }

  // إخفاء الصفحة حتى يؤكد الخادم الجلسة والصلاحيات
  document.documentElement.style.visibility = "hidden";

  fetch(API, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "verify", token: raw.token })
  })
    .then(function (r) { return r.json(); })
    .then(function (r) {
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
      if (changed) { location.reload(); return; } // أعد البناء بالبيانات الصحيحة من الخادم
      document.documentElement.style.visibility = "";
    })
    .catch(function () {
      document.addEventListener("DOMContentLoaded", function () {
        document.body.textContent = "تعذر التحقق من الجلسة، تأكد من الاتصال ثم أعد تحميل الصفحة.";
        document.documentElement.style.visibility = "";
      });
    });
})();
