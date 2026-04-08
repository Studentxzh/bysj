const API_BASE = "http://localhost:9000/api";
const FILE_BASE = API_BASE.replace(/\/api.*/, "");

function resolveCover(url, size) {
  const placeholder = size === "large"
    ? "https://via.placeholder.com/360x220?text=No+Cover"
    : "https://via.placeholder.com/320x180?text=No+Cover";
  if (!url) {
    return placeholder;
  }
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return FILE_BASE + url;
}

async function login(event) {
  event.preventDefault();
  const form = event.target;
  const username = form.username.value.trim();
  const password = form.password.value.trim();
  const role = form.role.value;
  const msgEl = document.getElementById("loginMessage");
  msgEl.textContent = "";

  if (!username || !password) {
    msgEl.textContent = "请输入用户名和密码";
    return;
  }

  try {
    const resp = await fetch(API_BASE + "/auth/login", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({username, password})
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      msgEl.textContent = err.message || "登录失败";
      return;
    }
    const data = await resp.json();
    localStorage.setItem("currentUser", JSON.stringify(data));

    if (role === "admin" && data.role !== "admin") {
      msgEl.textContent = "该账户不是管理员";
      return;
    }
    if (data.role === "admin" && role === "admin") {
      location.href = "admin.html";
    } else {
      location.href = "index.html";
    }
  } catch (e) {
    console.error(e);
    msgEl.textContent = "无法连接服务器";
  }
}

let pageSize = 8;
let currentBooks = [];
let currentPage = 1;

let adminAnnouncementCache = {};

function formatAnnouncementTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString("zh-CN");
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const detailCommentsCtx = { textbookId: null, replyParentId: null, replyAuthorLabel: "" };

function getLoggedStudentUser() {
  const raw = localStorage.getItem("currentUser");
  if (!raw) return null;
  try {
    const u = JSON.parse(raw);
    if (u.role !== "student") return null;
    return u;
  } catch (e) {
    return null;
  }
}

function reportReasonLabel(code) {
  const m = {
    FAKE_INFO: "虚假信息",
    SPAM: "垃圾或广告",
    INAPPROPRIATE: "不当内容",
    OTHER: "其他"
  };
  return m[code] || code || "";
}

function updateDetailCommentLoginUi() {
  const hint = document.getElementById("commentLoginHint");
  const composer = document.getElementById("commentComposer");
  const stu = getLoggedStudentUser();
  if (hint) {
    hint.textContent = stu ? "" : "登录学生账号后即可发表评论与回复。";
  }
  if (composer) {
    composer.style.display = stu ? "" : "none";
  }
}

function updateDetailReportLoginUi() {
  const hint = document.getElementById("reportLoginHint");
  const wrap = document.getElementById("reportFormWrap");
  const stu = getLoggedStudentUser();
  if (hint) {
    hint.textContent = stu ? "" : "请登录学生账号后提交举报。";
  }
  if (wrap) {
    wrap.style.display = stu ? "" : "none";
  }
}

function clearCommentReply() {
  detailCommentsCtx.replyParentId = null;
  detailCommentsCtx.replyAuthorLabel = "";
  const hint = document.getElementById("commentReplyHint");
  const cancel = document.getElementById("commentCancelReply");
  if (hint) {
    hint.style.display = "none";
    hint.textContent = "";
  }
  if (cancel) cancel.style.display = "none";
}

function setCommentReply(parentId, authorName) {
  detailCommentsCtx.replyParentId = parentId;
  detailCommentsCtx.replyAuthorLabel = authorName || "";
  const hint = document.getElementById("commentReplyHint");
  const cancel = document.getElementById("commentCancelReply");
  if (hint) {
    hint.style.display = "";
    hint.textContent = "正在回复：「" + (authorName || "该评论") + "」";
  }
  if (cancel) cancel.style.display = "";
  const ta = document.getElementById("commentInput");
  if (ta) ta.focus();
}

function renderDetailComments(items) {
  const listEl = document.getElementById("commentList");
  if (!listEl) return;
  listEl.innerHTML = "";
  if (!Array.isArray(items) || items.length === 0) {
    listEl.innerHTML = "<p class=\"detail-hint\">暂无评论，来抢沙发吧。</p>";
    return;
  }
  const byParent = {};
  items.forEach(c => {
    const pid = c.parentId;
    if (pid != null) {
      if (!byParent[pid]) byParent[pid] = [];
      byParent[pid].push(c);
    }
  });
  const top = items.filter(c => c.parentId == null);
  top.forEach(c => {
    const thread = document.createElement("div");
    thread.className = "comment-thread";
    const main = document.createElement("div");
    main.className = "comment-thread-main";
    const meta = document.createElement("div");
    meta.className = "comment-meta";
    const name = escapeHtml(c.authorName || "用户");
    const timeStr = formatAnnouncementTime(c.createTime);
    const stu = getLoggedStudentUser();
    const replyBtn = stu
      ? `<button type="button" class="btn btn-ghost comment-reply-btn" style="padding:2px 8px;font-size:12px;"
          data-comment-id="${c.id}" data-author="${escapeHtml(c.authorName || "用户")}">回复</button>`
      : "";
    meta.innerHTML = `<span><strong>${name}</strong></span><span>${escapeHtml(timeStr)}</span>${replyBtn}`;
    const body = document.createElement("div");
    body.className = "comment-body";
    body.textContent = c.content || "";
    main.appendChild(meta);
    main.appendChild(body);
    thread.appendChild(main);
    const replies = byParent[c.id] || [];
    if (replies.length) {
      const box = document.createElement("div");
      box.className = "comment-replies";
      replies.forEach(r => {
        const row = document.createElement("div");
        row.className = "comment-reply-item";
        const rn = escapeHtml(r.authorName || "用户");
        const rt = formatAnnouncementTime(r.createTime);
        row.innerHTML = `<div class="comment-meta"><span><strong>${rn}</strong></span><span>${escapeHtml(rt)}</span></div>
          <div class="comment-body"></div>`;
        row.querySelector(".comment-body").textContent = r.content || "";
        box.appendChild(row);
      });
      thread.appendChild(box);
    }
    listEl.appendChild(thread);
  });
  listEl.querySelectorAll(".comment-reply-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.getAttribute("data-comment-id"), 10);
      const author = btn.getAttribute("data-author") || "";
      setCommentReply(id, author);
    });
  });
}

async function refreshDetailComments() {
  const textbookId = detailCommentsCtx.textbookId;
  const listEl = document.getElementById("commentList");
  if (!textbookId || !listEl) return;
  try {
    const resp = await fetch(`${API_BASE}/textbooks/${textbookId}/comments`);
    if (!resp.ok) {
      listEl.innerHTML = "<p class=\"detail-hint\">评论加载失败。</p>";
      return;
    }
    const items = await resp.json();
    renderDetailComments(items);
  } catch (e) {
    console.error(e);
    listEl.innerHTML = "<p class=\"detail-hint\">评论加载失败。</p>";
  }
}

async function submitDetailComment() {
  const msgEl = document.getElementById("commentMsg");
  if (msgEl) msgEl.textContent = "";
  const stu = getLoggedStudentUser();
  if (!stu) {
    location.href = "login.html";
    return;
  }
  const textbookId = detailCommentsCtx.textbookId;
  const ta = document.getElementById("commentInput");
  if (!textbookId || !ta) return;
  const content = ta.value.trim();
  if (!content) {
    if (msgEl) msgEl.textContent = "请输入评论内容";
    return;
  }
  try {
    const resp = await fetch(`${API_BASE}/textbooks/${textbookId}/comments`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        userId: stu.userId,
        content,
        parentId: detailCommentsCtx.replyParentId
      })
    });
    if (resp.status === 201) {
      ta.value = "";
      clearCommentReply();
      await refreshDetailComments();
      return;
    }
    const err = await resp.json().catch(() => ({}));
    if (msgEl) msgEl.textContent = err.message || "发表失败";
  } catch (e) {
    console.error(e);
    if (msgEl) msgEl.textContent = "无法连接服务器";
  }
}

async function submitDetailReport() {
  const msgEl = document.getElementById("reportMsg");
  if (msgEl) msgEl.textContent = "";
  const stu = getLoggedStudentUser();
  if (!stu) {
    location.href = "login.html";
    return;
  }
  const textbookId = detailCommentsCtx.textbookId;
  const reasonEl = document.getElementById("reportReason");
  const detailEl = document.getElementById("reportDetail");
  if (!textbookId || !reasonEl) return;
  const reason = reasonEl.value;
  const detail = detailEl ? detailEl.value.trim() : "";
  try {
    const resp = await fetch(`${API_BASE}/textbooks/${textbookId}/reports`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        reporterId: stu.userId,
        reason,
        detail: detail || null
      })
    });
    if (resp.status === 201) {
      if (msgEl) msgEl.textContent = "举报已提交，感谢反馈。";
      if (detailEl) detailEl.value = "";
      return;
    }
    const err = await resp.json().catch(() => ({}));
    if (msgEl) msgEl.textContent = err.message || "提交失败";
  } catch (e) {
    console.error(e);
    if (msgEl) msgEl.textContent = "无法连接服务器";
  }
}

function bindDetailBottomOnce() {
  const wrap = document.getElementById("detailBottomSection");
  if (!wrap || wrap.dataset.bound === "1") return;
  wrap.dataset.bound = "1";
  document.getElementById("commentSubmit")?.addEventListener("click", () => submitDetailComment());
  document.getElementById("commentCancelReply")?.addEventListener("click", () => clearCommentReply());
  document.getElementById("reportSubmit")?.addEventListener("click", () => submitDetailReport());
}

function showDetailBottom(show) {
  const sec = document.getElementById("detailBottomSection");
  if (sec) sec.style.display = show ? "" : "none";
}

function setHomeAnnouncementToggleState(toggleBtn, list, expanded, total) {
  if (!toggleBtn || !list) return;
  if (expanded) {
    list.classList.remove("is-collapsed");
    toggleBtn.setAttribute("aria-expanded", "true");
    toggleBtn.textContent = "收起";
  } else {
    list.classList.add("is-collapsed");
    toggleBtn.setAttribute("aria-expanded", "false");
    toggleBtn.textContent = total > 1 ? `展开全部（${total} 条）` : "展开全部";
  }
}

async function loadHomeAnnouncements() {
  const section = document.getElementById("homeAnnouncementSection");
  const list = document.getElementById("homeAnnouncementList");
  const toggleBtn = document.getElementById("homeAnnouncementToggle");
  if (!section || !list) return;
  try {
    const resp = await fetch(API_BASE + "/announcements");
    if (!resp.ok) return;
    const items = await resp.json();
    if (!Array.isArray(items) || items.length === 0) {
      section.style.display = "none";
      list.innerHTML = "";
      list.classList.remove("is-collapsed");
      if (toggleBtn) toggleBtn.style.display = "none";
      return;
    }
    section.style.display = "";
    list.innerHTML = "";
    list.classList.remove("is-collapsed");
    if (toggleBtn) {
      toggleBtn.onclick = null;
      toggleBtn.style.display = "none";
    }
    items.forEach((it, index) => {
      const article = document.createElement("article");
      article.className = "home-announcement-item" + (index > 0 ? " home-announcement-item-extra" : "");
      const h3 = document.createElement("h3");
      h3.className = "home-announcement-item-title";
      h3.textContent = it.title || "";
      const p = document.createElement("p");
      p.className = "home-announcement-item-body";
      p.textContent = it.content || "";
      article.appendChild(h3);
      article.appendChild(p);
      list.appendChild(article);
    });
    const total = items.length;
    if (total > 1 && toggleBtn) {
      toggleBtn.style.display = "";
      setHomeAnnouncementToggleState(toggleBtn, list, false, total);
      toggleBtn.onclick = () => {
        const isCollapsed = list.classList.contains("is-collapsed");
        setHomeAnnouncementToggleState(toggleBtn, list, isCollapsed, total);
      };
    } else if (toggleBtn) {
      toggleBtn.style.display = "none";
    }
  } catch (e) {
    console.error(e);
  }
}

function resetAdminAnnouncementForm() {
  const idEl = document.getElementById("adminAnnouncementId");
  const titleEl = document.getElementById("annTitle");
  const contentEl = document.getElementById("annContent");
  const enabledEl = document.getElementById("annEnabled");
  const sortEl = document.getElementById("annSort");
  const submitEl = document.getElementById("adminAnnouncementSubmit");
  const msgEl = document.getElementById("adminAnnouncementMsg");
  if (idEl) idEl.value = "";
  if (titleEl) titleEl.value = "";
  if (contentEl) contentEl.value = "";
  if (enabledEl) enabledEl.checked = true;
  if (sortEl) sortEl.value = "0";
  if (submitEl) submitEl.textContent = "发布公告";
  if (msgEl) msgEl.textContent = "";
}

function fillAdminAnnouncementForm(a) {
  const idEl = document.getElementById("adminAnnouncementId");
  const titleEl = document.getElementById("annTitle");
  const contentEl = document.getElementById("annContent");
  const enabledEl = document.getElementById("annEnabled");
  const sortEl = document.getElementById("annSort");
  const submitEl = document.getElementById("adminAnnouncementSubmit");
  const msgEl = document.getElementById("adminAnnouncementMsg");
  if (!a) return;
  if (idEl) idEl.value = String(a.id || "");
  if (titleEl) titleEl.value = a.title || "";
  if (contentEl) contentEl.value = a.content || "";
  if (enabledEl) enabledEl.checked = a.enabled === 1;
  if (sortEl) sortEl.value = a.sortOrder != null ? String(a.sortOrder) : "0";
  if (submitEl) submitEl.textContent = "保存修改";
  if (msgEl) msgEl.textContent = "";
  const form = document.getElementById("adminAnnouncementForm");
  if (form) form.scrollIntoView({behavior: "smooth", block: "nearest"});
}

async function loadAdminAnnouncements() {
  const tbody = document.getElementById("adminAnnouncementTbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  adminAnnouncementCache = {};
  try {
    const resp = await fetch(API_BASE + "/admin/announcements");
    if (!resp.ok) return;
    const rows = await resp.json();
    if (!Array.isArray(rows)) return;
    rows.forEach(a => {
      adminAnnouncementCache[a.id] = a;
      const tr = document.createElement("tr");
      const fullTitle = a.title || "";
      const titleShort = fullTitle.length > 36 ? fullTitle.slice(0, 36) + "…" : fullTitle;
      tr.innerHTML = `
        <td>${a.id}</td>
        <td title="${escapeHtml(fullTitle)}">${escapeHtml(titleShort)}</td>
        <td>${a.sortOrder != null ? a.sortOrder : 0}</td>
        <td>${a.enabled === 1 ? "是" : "否"}</td>
        <td>${escapeHtml(formatAnnouncementTime(a.updateTime))}</td>
        <td>
          <button type="button" class="btn btn-primary" style="padding:4px 10px;font-size:12px;margin-right:6px;"
            data-ann-id="${a.id}" data-action="edit">编辑</button>
          <button type="button" class="btn btn-danger" style="padding:4px 10px;font-size:12px;"
            data-ann-id="${a.id}" data-action="delete">删除</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.addEventListener("click", async (e) => {
      const btn = e.target.closest("button[data-ann-id]");
      if (!btn) return;
      const id = Number(btn.getAttribute("data-ann-id"), 10);
      const action = btn.getAttribute("data-action");
      if (action === "edit") {
        fillAdminAnnouncementForm(adminAnnouncementCache[id]);
        return;
      }
      if (action === "delete") {
        if (!confirm(`确定删除公告 ID ${id} 吗？`)) return;
        try {
          const delResp = await fetch(`${API_BASE}/admin/announcements/${id}`, {method: "DELETE"});
          if (delResp.status === 204) {
            resetAdminAnnouncementForm();
            await loadAdminAnnouncements();
          } else {
            alert("删除失败");
          }
        } catch (err) {
          console.error(err);
          alert("无法连接服务器");
        }
      }
    }, {once: true});
  } catch (e) {
    console.error(e);
  }
}

async function submitAdminAnnouncement(event) {
  event.preventDefault();
  const msgEl = document.getElementById("adminAnnouncementMsg");
  if (msgEl) msgEl.textContent = "";
  const idEl = document.getElementById("adminAnnouncementId");
  const idRaw = idEl && idEl.value ? idEl.value.trim() : "";
  const titleEl = document.getElementById("annTitle");
  const contentEl = document.getElementById("annContent");
  const sortEl = document.getElementById("annSort");
  const title = titleEl ? titleEl.value.trim() : "";
  const content = contentEl ? contentEl.value : "";
  const enabled = document.getElementById("annEnabled") && document.getElementById("annEnabled").checked ? 1 : 0;
  const sortOrder = sortEl ? parseInt(sortEl.value, 10) : 0;
  if (!title) {
    if (msgEl) msgEl.textContent = "标题不能为空";
    return;
  }
  const payload = {
    title,
    content: content || "",
    enabled,
    sortOrder: Number.isNaN(sortOrder) ? 0 : sortOrder
  };
  try {
    const isEdit = idRaw !== "";
    const url = isEdit
      ? `${API_BASE}/admin/announcements/${encodeURIComponent(idRaw)}`
      : API_BASE + "/admin/announcements";
    const resp = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload)
    });
    if (!resp.ok) {
      if (msgEl) msgEl.textContent = isEdit ? "保存失败" : "发布失败";
      return;
    }
    if (msgEl) msgEl.textContent = isEdit ? "已保存" : "已发布";
    resetAdminAnnouncementForm();
    await loadAdminAnnouncements();
  } catch (e) {
    console.error(e);
    if (msgEl) msgEl.textContent = "无法连接服务器";
  }
}

function normalizeKeyword(text) {
  return (text || "")
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "");
}

function isOrderedSubsequence(keyword, target) {
  if (!keyword) return true;
  if (!target) return false;
  let i = 0;
  let j = 0;
  while (i < keyword.length && j < target.length) {
    if (keyword[i] === target[j]) i++;
    j++;
  }
  return i === keyword.length;
}

function matchBookByKeyword(book, keyword) {
  const k = normalizeKeyword(keyword);
  if (!k) return true;
  const fields = [
    book.title,
    book.author,
    book.publisher,
    book.courseName,
    book.isbn
  ];
  return fields.some(v => {
    const t = normalizeKeyword(v);
    return t.includes(k) || isOrderedSubsequence(k, t);
  });
}

function renderBooks() {
  const grid = document.getElementById("bookGrid");
  if (!grid) return;
  grid.innerHTML = "";
  const ps = pageSize || 8;
  const start = (currentPage - 1) * ps;
  const pageItems = currentBooks.slice(start, start + ps);
  pageItems.forEach(b => {
      const card = document.createElement("article");
      card.className = "book-card";
      card.addEventListener("click", () => {
        if (!b.id) return;
        location.href = `detail.html?id=${b.id}`;
      });
      const img = document.createElement("img");
      img.className = "book-cover";
      img.src = resolveCover(b.coverImage, "small");
      img.alt = b.title || "封面";
      const body = document.createElement("div");
      body.className = "book-body";

      const title = document.createElement("div");
      title.className = "book-title";
      title.textContent = b.title || "";

      const meta = document.createElement("div");
      meta.className = "book-meta";
      meta.textContent = (b.author || "") + (b.publisher ? " · " + b.publisher : "");

      const price = document.createElement("div");
      price.className = "book-price";
      if (b.transferType === "FREE") {
        price.textContent = "免费赠送";
      } else if (b.transferType === "BORROW") {
        price.textContent = "只借不卖";
      } else {
        price.textContent = b.price != null ? ("¥" + b.price) : "面议";
      }

      body.appendChild(title);
      body.appendChild(meta);
      body.appendChild(price);
      card.appendChild(img);
      card.appendChild(body);
      grid.appendChild(card);
  });
  const info = document.getElementById("pagerInfo");
  if (info) {
    const totalPages = Math.max(1, Math.ceil(currentBooks.length / (pageSize || 8)));
    info.textContent = `第 ${currentPage} / ${totalPages} 页`;
  }
}

async function loadBooks(keyword) {
  const kw = (keyword || "").trim();
  const url = new URL(API_BASE + "/textbooks");
  if (kw !== "") {
    url.searchParams.set("keyword", kw);
  }
  try {
    const resp = await fetch(url.toString());
    if (!resp.ok) {
      currentBooks = [];
      renderBooks();
      return;
    }
    let books = await resp.json();
    // 兜底：后端返回为空时，本地再做一次模糊匹配，避免关键字检索失效。
    if (kw !== "" && Array.isArray(books) && books.length === 0) {
      const allResp = await fetch(API_BASE + "/textbooks");
      if (allResp.ok) {
        const allBooks = await allResp.json();
        books = (Array.isArray(allBooks) ? allBooks : []).filter(b => matchBookByKeyword(b, kw));
      }
    }
    currentBooks = Array.isArray(books) ? books : [];
    currentPage = 1;
    renderBooks();
  } catch (e) {
    console.error(e);
  }
}

async function loadAdminUsers() {
  const tbody = document.getElementById("adminUserTbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  try {
    const resp = await fetch(API_BASE + "/admin/users");
    const users = await resp.json();
    users.forEach(u => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${u.id}</td>
        <td>${u.username}</td>
        <td>${u.realName || ""}</td>
        <td>${u.status === 1 ? "正常" : "禁用"}</td>
        <td>
          <button class="btn btn-primary" style="padding:4px 10px;font-size:12px;"
            data-id="${u.id}" data-status="${u.status === 1 ? 0 : 1}">
            ${u.status === 1 ? "禁用" : "启用"}
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.addEventListener("click", async (e) => {
      const btn = e.target.closest("button[data-id]");
      if (!btn) return;
      const id = btn.getAttribute("data-id");
      const status = btn.getAttribute("data-status");
      await fetch(`${API_BASE}/admin/users/${id}/status?status=${status}`, {
        method: "PATCH"
      });
      await loadAdminUsers();
    }, {once: true});
  } catch (e) {
    console.error(e);
  }
}

async function loadAdminOrders() {
  const tbody = document.getElementById("adminOrderTbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  try {
    const resp = await fetch(API_BASE + "/admin/sale-orders");
    if (!resp.ok) {
      const tr = document.createElement("tr");
      const hint = resp.status === 404
        ? "（多为后端未包含该接口，请重新编译并启动 Spring Boot）"
        : resp.status >= 500
          ? "（请查看后端控制台与数据库是否存在表 transaction_record）"
          : "";
      tr.innerHTML = `<td colspan="7" style="color:#b91c1c;">加载失败：HTTP ${resp.status} ${hint}</td>`;
      tbody.appendChild(tr);
      return;
    }
    const orders = await resp.json();
    if (!Array.isArray(orders) || orders.length === 0) {
      const tr = document.createElement("tr");
      tr.innerHTML = "<td colspan=\"7\" style=\"color:#6b7280;\">暂无出售类订单</td>";
      tbody.appendChild(tr);
      return;
    }
    orders.forEach(o => {
      const tr = document.createElement("tr");
      const priceStr = o.price != null ? ("¥" + o.price) : "—";
      const sellerCell = (o.sellerRealName ? escapeHtml(o.sellerRealName) : "—")
        + (o.sellerId != null ? `<br><span style="color:#6b7280;font-size:12px;">ID ${o.sellerId}</span>` : "");
      const buyerCell = (o.buyerRealName ? escapeHtml(o.buyerRealName) : "—")
        + (o.buyerId != null ? `<br><span style="color:#6b7280;font-size:12px;">ID ${o.buyerId}</span>` : "");
      tr.innerHTML = `
        <td>${o.orderId}</td>
        <td>${escapeHtml(o.textbookTitle || "")}</td>
        <td>${priceStr}</td>
        <td>${sellerCell}</td>
        <td>${buyerCell}</td>
        <td>${escapeHtml(o.status || "")}</td>
        <td>${escapeHtml(formatOrderTime(o.createTime))}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (e) {
    console.error(e);
    const tr = document.createElement("tr");
    tr.innerHTML = "<td colspan=\"7\" style=\"color:#b91c1c;\">无法连接服务器</td>";
    tbody.appendChild(tr);
  }
}

async function loadAdminStudents() {
  const tbody = document.getElementById("adminStudentTbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  try {
    const resp = await fetch(API_BASE + "/admin/students");
    const users = await resp.json();
    users.forEach(u => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${u.id}</td>
        <td>${u.username}</td>
        <td>${u.realName || ""}</td>
        <td>${u.phone || ""}</td>
        <td>${u.college || ""}</td>
        <td>${u.major || ""}</td>
        <td>${u.className || ""}</td>
        <td>${u.status === 1 ? "正常" : "禁用"}</td>
        <td>
          <button class="btn btn-primary" style="padding:4px 10px;font-size:12px;"
            data-id="${u.id}" data-status="${u.status === 1 ? 0 : 1}">
            ${u.status === 1 ? "禁用" : "启用"}
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.addEventListener("click", async (e) => {
      const btn = e.target.closest("button[data-id]");
      if (!btn) return;
      const id = btn.getAttribute("data-id");
      const status = btn.getAttribute("data-status");
      await fetch(`${API_BASE}/admin/students/${id}/status?status=${status}`, {
        method: "PATCH"
      });
      await loadAdminStudents();
    }, {once: true});
  } catch (e) {
    console.error(e);
  }
}

async function submitAdminCreateUser(event) {
  event.preventDefault();
  const form = event.target;
  const msgEl = document.getElementById("adminCreateUserMsg");
  msgEl.textContent = "";
  const username = form.username.value.trim();
  const password = form.password.value.trim();
  const realName = form.realName.value.trim();
  if (!username || !password) {
    msgEl.textContent = "账号和密码不能为空";
    return;
  }
  try {
    const resp = await fetch(API_BASE + "/admin/users", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        username,
        password,
        realName
      })
    });
    if (!resp.ok) {
      msgEl.textContent = "创建失败，请检查账号是否重复";
      return;
    }
    msgEl.textContent = "创建成功";
    form.reset();
    await loadAdminUsers();
  } catch (e) {
    console.error(e);
    msgEl.textContent = "无法连接服务器";
  }
}

async function submitAdminCreateStudent(event) {
  event.preventDefault();
  const form = event.target;
  const msgEl = document.getElementById("adminCreateStudentMsg");
  msgEl.textContent = "";
  const username = form.username.value.trim();
  const password = form.password.value.trim();
  const realName = form.realName.value.trim();
  const phone = form.phone.value.trim();
  const college = form.college.value.trim();
  const major = form.major.value.trim();
  const className = form.className.value.trim();
  if (!username || !password) {
    msgEl.textContent = "账号和密码不能为空";
    return;
  }
  try {
    const resp = await fetch(API_BASE + "/admin/students", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        username,
        password,
        realName,
        phone,
        college,
        major,
        className
      })
    });
    if (!resp.ok) {
      msgEl.textContent = "创建失败，请检查账号是否重复";
      return;
    }
    msgEl.textContent = "创建成功";
    form.reset();
    await loadAdminStudents();
  } catch (e) {
    console.error(e);
    msgEl.textContent = "无法连接服务器";
  }
}

async function loadAdminBooks() {
  const tbody = document.getElementById("adminBookTbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  try {
    const resp = await fetch(API_BASE + "/admin/textbooks");
    const books = await resp.json();
    books.forEach(b => {
      const tr = document.createElement("tr");
      const canForceOff = b.status === "ON_SALE";
      tr.innerHTML = `
        <td>${b.id}</td>
        <td>${b.title || ""}</td>
        <td>${b.transferType || ""}</td>
        <td>${b.price != null ? ("¥" + b.price) : ""}</td>
        <td>${b.status || ""}</td>
        <td>
          <button class="btn btn-primary" style="padding:4px 10px;font-size:12px;margin-right:6px;"
            data-id="${b.id}" data-action="force-off" ${canForceOff ? "" : "disabled"}>
            强制下架
          </button>
          <button class="btn btn-danger" style="padding:4px 10px;font-size:12px;"
            data-id="${b.id}" data-action="delete">
            删除
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.addEventListener("click", async (e) => {
      const btn = e.target.closest("button[data-id]");
      if (!btn) return;
      const id = btn.getAttribute("data-id");
      const action = btn.getAttribute("data-action");
      try {
        if (action === "force-off") {
          if (!confirm(`确定要强制下架ID为 ${id} 的教材吗？`)) return;
          const respPatch = await fetch(`${API_BASE}/admin/textbooks/${id}/status?status=OFF_SALE`, {
            method: "PATCH"
          });
          if (respPatch.status === 204) {
            await loadAdminBooks();
          } else {
            alert("强制下架失败，请稍后再试");
          }
          return;
        }
        if (action === "delete") {
          if (!confirm(`确定要删除ID为 ${id} 的教材吗？`)) return;
          const respDel = await fetch(`${API_BASE}/admin/textbooks/${id}`, {
            method: "DELETE"
          });
          if (respDel.status === 204) {
            await loadAdminBooks();
          } else {
            alert("删除失败，请稍后再试");
          }
        } else {
          return;
        }
      } catch (err) {
        console.error(err);
        alert("无法连接服务器");
      }
    }, {once: true});
  } catch (e) {
    console.error(e);
  }
}

async function loadAdminComments() {
  const tbody = document.getElementById("adminCommentTbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  try {
    const resp = await fetch(API_BASE + "/admin/textbook-comments");
    if (!resp.ok) return;
    const rows = await resp.json();
    if (!Array.isArray(rows)) return;
    rows.forEach(c => {
      const tr = document.createElement("tr");
      const layer = c.parentId == null ? "一级" : "回复";
      const fullContent = c.content || "";
      const short = fullContent.length > 48 ? fullContent.slice(0, 48) + "…" : fullContent;
      const stLabel = c.status === "HIDDEN" ? "隐藏" : "展示";
      const title = c.textbookTitle || "";
      const titleShort = title.length > 22 ? title.slice(0, 22) + "…" : title;
      const author = c.authorName || "";
      const hideShow = c.status === "VISIBLE"
        ? `<button type="button" class="btn btn-ghost" style="padding:4px 8px;font-size:12px;margin-right:4px;" data-cid="${c.id}" data-caction="hide">隐藏</button>`
        : `<button type="button" class="btn btn-primary" style="padding:4px 8px;font-size:12px;margin-right:4px;" data-cid="${c.id}" data-caction="show">显示</button>`;
      tr.innerHTML = `
        <td>${c.id}</td>
        <td title="${escapeHtml(title)}">${escapeHtml(titleShort)}</td>
        <td title="${escapeHtml(author)}">${c.userId}<br><span style="font-size:12px;color:#6b7280;">${escapeHtml(author)}</span></td>
        <td>${layer}</td>
        <td title="${escapeHtml(fullContent)}">${escapeHtml(short)}</td>
        <td>${stLabel}</td>
        <td>${escapeHtml(formatAnnouncementTime(c.createTime))}</td>
        <td>${hideShow}
          <button type="button" class="btn btn-danger" style="padding:4px 8px;font-size:12px;" data-cid="${c.id}" data-caction="delete">删除</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.addEventListener("click", async e => {
      const btn = e.target.closest("button[data-cid]");
      if (!btn) return;
      const id = btn.getAttribute("data-cid");
      const action = btn.getAttribute("data-caction");
      try {
        if (action === "hide" || action === "show") {
          const status = action === "hide" ? "HIDDEN" : "VISIBLE";
          const respPatch = await fetch(`${API_BASE}/admin/textbook-comments/${id}/status`, {
            method: "PATCH",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({status})
          });
          if (respPatch.status === 204) {
            await loadAdminComments();
          } else {
            alert("更新状态失败");
          }
          return;
        }
        if (action === "delete") {
          if (!confirm(`确定删除评论 ID ${id} 吗？其下级回复会一并删除。`)) return;
          const respDel = await fetch(`${API_BASE}/admin/textbook-comments/${id}`, {method: "DELETE"});
          if (respDel.status === 204) {
            await loadAdminComments();
          } else {
            alert("删除失败");
          }
        }
      } catch (err) {
        console.error(err);
        alert("无法连接服务器");
      }
    }, {once: true});
  } catch (e) {
    console.error(e);
  }
}

async function loadAdminReports() {
  const tbody = document.getElementById("adminReportTbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  try {
    const resp = await fetch(API_BASE + "/admin/textbook-reports");
    if (!resp.ok) return;
    const rows = await resp.json();
    if (!Array.isArray(rows)) return;
    rows.forEach(r => {
      const tr = document.createElement("tr");
      const title = r.textbookTitle || "";
      const titleShort = title.length > 18 ? title.slice(0, 18) + "…" : title;
      const det = r.detail || "";
      const detShort = det.length > 24 ? det.slice(0, 24) + "…" : det;
      const stMap = {PENDING: "待处理", PROCESSED: "已处理", REJECTED: "驳回"};
      const stLabel = stMap[r.status] || r.status;
      const remark = r.adminRemark || "";
      const remarkShort = remark.length > 16 ? remark.slice(0, 16) + "…" : remark;
      tr.innerHTML = `
        <td>${r.id}</td>
        <td title="${escapeHtml(title)}">${escapeHtml(titleShort)}</td>
        <td>${r.reporterId}<br><span style="font-size:12px;color:#6b7280;">${escapeHtml(r.reporterName || "")}</span></td>
        <td>${escapeHtml(reportReasonLabel(r.reason))}</td>
        <td title="${escapeHtml(det)}">${escapeHtml(detShort)}</td>
        <td>${stLabel}</td>
        <td title="${escapeHtml(remark)}">${escapeHtml(remarkShort)}</td>
        <td>${escapeHtml(formatAnnouncementTime(r.createTime))}</td>
        <td>
          <button type="button" class="btn btn-primary" style="padding:4px 8px;font-size:12px;margin-right:4px;"
            data-rid="${r.id}" data-raction="done">已处理</button>
          <button type="button" class="btn btn-ghost" style="padding:4px 8px;font-size:12px;"
            data-rid="${r.id}" data-raction="reject">驳回</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.addEventListener("click", async e => {
      const btn = e.target.closest("button[data-rid]");
      if (!btn) return;
      const id = btn.getAttribute("data-rid");
      const action = btn.getAttribute("data-raction");
      const status = action === "done" ? "PROCESSED" : "REJECTED";
      const defRemark = action === "done" ? "已核实并处理" : "经核实不予采纳";
      const remark = (prompt("管理员备注（可选）", defRemark) || "").trim();
      try {
        const respPatch = await fetch(`${API_BASE}/admin/textbook-reports/${id}`, {
          method: "PATCH",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({status, adminRemark: remark || null})
        });
        if (respPatch.status === 204) {
          await loadAdminReports();
        } else {
          alert("更新失败");
        }
      } catch (err) {
        console.error(err);
        alert("无法连接服务器");
      }
    }, {once: true});
  } catch (e) {
    console.error(e);
  }
}

async function submitPublish(event) {
  event.preventDefault();
  const current = localStorage.getItem("currentUser");
  const msgEl = document.getElementById("publishMessage");
  msgEl.textContent = "";
  if (!current) {
    msgEl.textContent = "请先登录后再发布教材";
    setTimeout(() => location.href = "login.html", 1200);
    return;
  }
  const user = JSON.parse(current);
  const form = event.target;
  const fileInput = form.coverFile;
  let coverImageUrl = "";
  if (fileInput && fileInput.files && fileInput.files[0]) {
    const fd = new FormData();
    fd.append("file", fileInput.files[0]);
    try {
      const uploadResp = await fetch(API_BASE + "/upload/cover", {
        method: "POST",
        body: fd
      });
      if (uploadResp.ok) {
        const uploadData = await uploadResp.json();
        coverImageUrl = uploadData.url || "";
      }
    } catch (e) {
      console.error(e);
    }
  }
  const payload = {
    userId: user.userId,
    title: form.title.value.trim(),
    author: form.author.value.trim(),
    publisher: form.publisher.value.trim(),
    publishYear: form.publishYear.value.trim(),
    courseName: form.courseName.value.trim(),
    conditionLevel: form.conditionLevel.value.trim(),
    transferType: form.transferType.value,
    price: form.price.value ? Number(form.price.value) : null,
    coverImage: coverImageUrl,
    description: form.description.value.trim()
  };
  if (!payload.title) {
    msgEl.textContent = "书名不能为空";
    return;
  }
  try {
    const resp = await fetch(API_BASE + "/textbooks", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload)
    });
    if (!resp.ok) {
      msgEl.textContent = "发布失败，请稍后重试";
      return;
    }
    msgEl.textContent = "发布成功！即将返回列表页……";
    setTimeout(() => location.href = "index.html", 1200);
  } catch (e) {
    console.error(e);
    msgEl.textContent = "无法连接服务器";
  }
}

function initProfilePage() {
  const infoUsername = document.getElementById("profileUsername");
  if (!infoUsername) return;
  const currentStr = localStorage.getItem("currentUser");
  if (!currentStr) {
    alert("请先登录");
    location.href = "login.html";
    return;
  }
  const user = JSON.parse(currentStr);
  infoUsername.textContent = user.username || "";
  const infoRealName = document.getElementById("profileRealName");
  const infoRole = document.getElementById("profileRole");
  const inputRealName = document.getElementById("profileRealNameInput");
  if (infoRealName) {
    infoRealName.textContent = user.realName || "";
  }
  if (infoRole) {
    infoRole.textContent = user.role === "admin" ? "管理员" : "学生";
  }
  if (inputRealName) {
    inputRealName.value = user.realName || "";
  }
  loadMyBooks(user.userId);
  loadMySaleOrders(user.userId);
}

function formatOrderTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString("zh-CN");
}

async function loadMySaleOrders(buyerId) {
  const listEl = document.getElementById("myOrderList");
  const emptyEl = document.getElementById("myOrdersEmpty");
  if (!listEl) return;
  listEl.innerHTML = "";
  try {
    const resp = await fetch(`${API_BASE}/transactions/sale-orders?buyerId=${buyerId}`);
    if (!resp.ok) return;
    const orders = await resp.json();
    if (!orders.length) {
      if (emptyEl) emptyEl.style.display = "block";
      return;
    }
    if (emptyEl) emptyEl.style.display = "none";
    orders.forEach(o => {
      const row = document.createElement("div");
      row.className = "order-row";
      row.addEventListener("click", () => {
        location.href = `order.html?id=${o.orderId}`;
      });
      const img = document.createElement("img");
      img.className = "order-row-cover";
      img.src = resolveCover(o.coverImage, "small");
      img.alt = "";
      const meta = document.createElement("div");
      meta.className = "order-row-meta";
      const title = document.createElement("div");
      title.className = "order-row-title";
      title.textContent = o.textbookTitle || "教材";
      const sub1 = document.createElement("div");
      sub1.className = "order-row-sub";
      sub1.textContent = (o.paymentDisplay || "") + " ｜ " + formatOrderTime(o.createTime);
      const sub2 = document.createElement("div");
      sub2.className = "order-row-sub";
      sub2.textContent = o.price != null ? "¥" + o.price : "";
      meta.appendChild(title);
      meta.appendChild(sub1);
      meta.appendChild(sub2);
      row.appendChild(img);
      row.appendChild(meta);
      listEl.appendChild(row);
    });
  } catch (e) {
    console.error(e);
  }
}

async function loadOrderPage() {
  const root = document.getElementById("orderRoot");
  if (!root) return;
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const currentStr = localStorage.getItem("currentUser");
  if (!currentStr) {
    root.innerHTML = "<p class=\"detail-hint\">请先登录后查看订单。</p><p style=\"margin-top:12px;\"><button type=\"button\" class=\"btn btn-primary\" onclick=\"location.href='login.html'\">去登录</button></p>";
    return;
  }
  if (!id) {
    root.innerHTML = "<p>缺少订单编号。</p>";
    return;
  }
  const user = JSON.parse(currentStr);
  try {
    const resp = await fetch(`${API_BASE}/transactions/sale-orders/${id}?buyerId=${user.userId}`);
    if (resp.status === 403 || resp.status === 404) {
      const err = await resp.json().catch(() => ({}));
      root.innerHTML = "<p>" + (err.message || "订单不存在或无权查看") + "</p>";
      return;
    }
    if (!resp.ok) {
      root.innerHTML = "<p>加载失败，请稍后重试。</p>";
      return;
    }
    const o = await resp.json();
    root.innerHTML = "";
    const card = document.createElement("div");
    card.className = "order-card";
    const head = document.createElement("div");
    head.className = "order-head";
    const badge = document.createElement("span");
    badge.className = "order-status-paid";
    badge.textContent = "已付款";
    const orderNo = document.createElement("span");
    orderNo.style.fontSize = "13px";
    orderNo.style.color = "#6b7280";
    orderNo.textContent = "订单号：" + o.orderId;
    head.appendChild(badge);
    head.appendChild(orderNo);
    const hint = document.createElement("p");
    hint.className = "detail-hint";
    hint.style.marginTop = "0";
    hint.textContent = o.paymentDisplay || "演示环境：未接入真实支付。";
    const body = document.createElement("div");
    body.className = "order-body";
    const img = document.createElement("img");
    img.className = "order-cover";
    img.src = resolveCover(o.coverImage, "large");
    img.alt = "";
    const info = document.createElement("dl");
    info.className = "order-info";
    const addRow = (label, value) => {
      const dt = document.createElement("dt");
      dt.textContent = label;
      const dd = document.createElement("dd");
      dd.textContent = value;
      info.appendChild(dt);
      info.appendChild(dd);
    };
    addRow("教材", o.textbookTitle || "");
    addRow("成交金额", o.price != null ? "¥" + o.price : "—");
    addRow("卖家", o.sellerRealName || "—");
    addRow("下单时间", formatOrderTime(o.createTime));
    body.appendChild(img);
    body.appendChild(info);
    card.appendChild(head);
    card.appendChild(hint);
    card.appendChild(body);
    root.appendChild(card);
  } catch (e) {
    console.error(e);
    root.innerHTML = "<p>加载失败，请检查网络。</p>";
  }
}

async function loadMyBooks(userId) {
  const grid = document.getElementById("myBookGrid");
  if (!grid) return;
  grid.innerHTML = "";
  try {
    const resp = await fetch(`${API_BASE}/user/textbooks?userId=${userId}`);
    const books = await resp.json();
    books.forEach(b => {
      const card = document.createElement("article");
      card.className = "book-card";
      card.addEventListener("click", () => {
        if (!b.id) return;
        location.href = `detail.html?id=${b.id}`;
      });
      const img = document.createElement("img");
      img.className = "book-cover";
      img.src = resolveCover(b.coverImage, "small");
      img.alt = b.title || "封面";
      const body = document.createElement("div");
      body.className = "book-body";
      const title = document.createElement("div");
      title.className = "book-title";
      title.textContent = b.title || "";
      const meta = document.createElement("div");
      meta.className = "book-meta";
      meta.textContent = (b.author || "") + (b.publisher ? " · " + b.publisher : "");
      const price = document.createElement("div");
      price.className = "book-price";
      if (b.transferType === "FREE") {
        price.textContent = "免费赠送";
      } else if (b.transferType === "BORROW") {
        price.textContent = "只借不卖";
      } else {
        price.textContent = b.price != null ? ("¥" + b.price) : "面议";
      }
      body.appendChild(title);
      body.appendChild(meta);
      body.appendChild(price);
      card.appendChild(img);
      card.appendChild(body);
      grid.appendChild(card);
    });
  } catch (e) {
    console.error(e);
  }
}

async function submitProfileName(event) {
  event.preventDefault();
  const currentStr = localStorage.getItem("currentUser");
  const msgEl = document.getElementById("profileNameMsg");
  msgEl.textContent = "";
  if (!currentStr) {
    msgEl.textContent = "请先登录";
    return;
  }
  const user = JSON.parse(currentStr);
  const form = event.target;
  const realName = form.realName.value.trim();
  if (!realName) {
    msgEl.textContent = "姓名不能为空";
    return;
  }
  try {
    const resp = await fetch(API_BASE + "/user/name", {
      method: "PATCH",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({userId: String(user.userId), realName})
    });
    if (!resp.ok) {
      msgEl.textContent = "更新失败";
      return;
    }
    user.realName = realName;
    localStorage.setItem("currentUser", JSON.stringify(user));
    const infoRealName = document.getElementById("profileRealName");
    if (infoRealName) infoRealName.textContent = realName;
    msgEl.textContent = "已保存";
  } catch (e) {
    console.error(e);
    msgEl.textContent = "无法连接服务器";
  }
}

async function submitProfilePwd(event) {
  event.preventDefault();
  const currentStr = localStorage.getItem("currentUser");
  const msgEl = document.getElementById("profilePwdMsg");
  msgEl.textContent = "";
  if (!currentStr) {
    msgEl.textContent = "请先登录";
    return;
  }
  const user = JSON.parse(currentStr);
  const form = event.target;
  const oldPassword = form.oldPassword.value;
  const newPassword = form.newPassword.value;
  const newPassword2 = form.newPassword2.value;
  if (!oldPassword || !newPassword || !newPassword2) {
    msgEl.textContent = "请填写完整";
    return;
  }
  if (newPassword !== newPassword2) {
    msgEl.textContent = "两次新密码不一致";
    return;
  }
  try {
    const resp = await fetch(API_BASE + "/user/password", {
      method: "PATCH",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        userId: String(user.userId),
        oldPassword,
        newPassword
      })
    });
    if (resp.status === 204) {
      msgEl.textContent = "密码已修改，下次请用新密码登录";
      form.reset();
    } else {
      const err = await resp.json().catch(() => ({}));
      msgEl.textContent = err.message || "修改失败";
    }
  } catch (e) {
    console.error(e);
    msgEl.textContent = "无法连接服务器";
  }
}
async function loadDetail() {
  const root = document.getElementById("detailRoot");
  if (!root) return;
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  if (!id) {
    showDetailBottom(false);
    root.innerHTML = "<p>未找到该教材，请从列表页重新进入。</p>";
    return;
  }
  try {
    const resp = await fetch(`${API_BASE}/textbooks/${id}`);
    if (!resp.ok) {
      showDetailBottom(false);
      root.innerHTML = "<p>该教材不存在或已下架。</p>";
      return;
    }
    const b = await resp.json();
    const cover = document.getElementById("detailCover");
    const title = document.getElementById("detailTitle");
    const meta = document.getElementById("detailMeta");
    const price = document.getElementById("detailPrice");
    const extra = document.getElementById("detailExtra");
    const contact = document.getElementById("detailContact");
    const desc = document.getElementById("detailDesc");
    const btnDelete = document.getElementById("btnDelete");
    const btnEdit = document.getElementById("btnEdit");
    const btnMarkSold = document.getElementById("btnMarkSold");
    const btnMarkBorrowed = document.getElementById("btnMarkBorrowed");
    const btnMarkOff = document.getElementById("btnMarkOff");
    const editPanel = document.getElementById("editPanel");

    cover.src = resolveCover(b.coverImage, "large");
    title.textContent = b.title || "";
    meta.textContent = [b.author, b.publisher, b.publishYear].filter(Boolean).join(" · ");
    if (b.transferType === "FREE") {
      price.textContent = "免费赠送";
    } else if (b.transferType === "BORROW") {
      price.textContent = "只借不卖";
    } else {
      price.textContent = b.price != null ? ("¥" + b.price) : "价格面议";
    }
    extra.textContent = [
      b.courseName ? `适用课程：${b.courseName}` : "",
      b.conditionLevel ? `新旧程度：${b.conditionLevel}` : ""
    ].filter(Boolean).join(" ｜ ");
    desc.textContent = b.description || "暂无补充说明。";

    detailCommentsCtx.textbookId = b.id;
    clearCommentReply();
    showDetailBottom(true);
    updateDetailCommentLoginUi();
    updateDetailReportLoginUi();
    bindDetailBottomOnce();
    refreshDetailComments();

    if (contact) {
      contact.textContent = "";
      try {
        const respContact = await fetch(`${API_BASE.replace('/api','')}/api/user/contact?userId=${b.userId}`);
        if (respContact.ok) {
          const c = await respContact.json();
          const phone = c.phone || "";
          const realName = c.realName || "";
          contact.textContent = `发布者：${realName || "匿名"}${phone ? " ｜ 联系方式：" + phone : ""}`;
        }
      } catch (e) {
        console.error(e);
      }
    }

    const current = localStorage.getItem("currentUser");
    if (current && btnDelete && btnEdit && editPanel) {
      const user = JSON.parse(current);
      if (user.userId === b.userId) {
        btnDelete.style.display = "inline-flex";
        btnEdit.style.display = "inline-flex";
        if (btnMarkSold && btnMarkBorrowed && btnMarkOff) {
          btnMarkSold.style.display = "inline-flex";
          btnMarkBorrowed.style.display = "inline-flex";
          btnMarkOff.style.display = "inline-flex";
          const changeStatus = async (newStatus, label) => {
            if (!confirm(`确定要将该教材标记为“${label}”吗？`)) return;
            try {
              const respStatus = await fetch(`${API_BASE}/textbooks/${b.id}/status?userId=${user.userId}&status=${newStatus}`, {
                method: "PATCH"
              });
              if (respStatus.status === 204) {
                alert("状态已更新");
                await loadDetail();
              } else if (respStatus.status === 403) {
                alert("没有权限修改该教材状态");
              } else {
                alert("状态更新失败，请稍后再试");
              }
            } catch (e) {
              console.error(e);
              alert("无法连接服务器");
            }
          };
          btnMarkSold.onclick = () => changeStatus("SOLD", "已售出");
          btnMarkBorrowed.onclick = () => changeStatus("BORROWED", "已出借");
          btnMarkOff.onclick = () => changeStatus("OFF_SALE", "下架");
        }

        btnDelete.onclick = async () => {
          if (!confirm("确定要删除/下架这本教材吗？")) return;
          try {
            const delResp = await fetch(`${API_BASE}/textbooks/${b.id}?userId=${user.userId}`, {
              method: "DELETE"
            });
            if (delResp.status === 204) {
              alert("删除成功");
              location.href = "index.html";
            } else if (delResp.status === 403) {
              alert("没有权限删除这本教材");
            } else if (delResp.status === 404) {
              alert("教材不存在或已被删除");
            } else {
              alert("删除失败，请稍后再试");
            }
          } catch (e) {
            console.error(e);
            alert("无法连接服务器");
          }
        };

        const form = document.getElementById("editBookForm");
        const msgEl = document.getElementById("editBookMsg");
        const fileInput = document.getElementById("editCoverFile");
        if (form && msgEl) {
          form.title.value = b.title || "";
          form.author.value = b.author || "";
          form.publisher.value = b.publisher || "";
          form.publishYear.value = b.publishYear || "";
          form.courseName.value = b.courseName || "";
          form.conditionLevel.value = b.conditionLevel || "";
          form.transferType.value = b.transferType || "SALE";
          form.price.value = b.price != null ? b.price : "";
          form.description.value = b.description || "";

          btnEdit.onclick = () => {
            editPanel.style.display = editPanel.style.display === "none" ? "block" : "none";
          };

          form.onsubmit = async (ev) => {
            ev.preventDefault();
            msgEl.textContent = "";
            let coverImageUrl = b.coverImage || "";
            if (fileInput && fileInput.files && fileInput.files[0]) {
              const fd = new FormData();
              fd.append("file", fileInput.files[0]);
              try {
                const uploadResp = await fetch(API_BASE + "/upload/cover", {
                  method: "POST",
                  body: fd
                });
                if (uploadResp.ok) {
                  const uploadData = await uploadResp.json();
                  coverImageUrl = uploadData.url || coverImageUrl;
                }
              } catch (e) {
                console.error(e);
              }
            }
            const payload = {
              userId: user.userId,
              title: form.title.value.trim(),
              author: form.author.value.trim(),
              publisher: form.publisher.value.trim(),
              publishYear: form.publishYear.value.trim(),
              courseName: form.courseName.value.trim(),
              conditionLevel: form.conditionLevel.value.trim(),
              transferType: form.transferType.value,
              price: form.price.value ? Number(form.price.value) : null,
              coverImage: coverImageUrl,
              description: form.description.value.trim()
            };
            if (!payload.title) {
              msgEl.textContent = "书名不能为空";
              return;
            }
            try {
              const respUpdate = await fetch(`${API_BASE}/textbooks/${b.id}`, {
                method: "PATCH",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(payload)
              });
              if (respUpdate.status === 204) {
                msgEl.textContent = "保存成功，已更新展示信息";
                await loadDetail();
              } else if (respUpdate.status === 403) {
                msgEl.textContent = "没有权限修改该教材";
              } else {
                msgEl.textContent = "保存失败，请稍后重试";
              }
            } catch (e) {
              console.error(e);
              msgEl.textContent = "无法连接服务器";
            }
          };
        }
      }
    }

    const buyWrap = document.getElementById("buySaleWrap");
    const btnBuySale = document.getElementById("btnBuySale");
    const buySaleHint = document.getElementById("buySaleHint");
    const buySaleOwnerNote = document.getElementById("buySaleOwnerNote");
    if (buyWrap && btnBuySale) {
      buyWrap.style.display = "none";
      btnBuySale.style.display = "";
      btnBuySale.disabled = false;
      btnBuySale.onclick = null;
      if (buySaleOwnerNote) {
        buySaleOwnerNote.style.display = "none";
        buySaleOwnerNote.textContent = "";
      }
      if (buySaleHint) buySaleHint.textContent = "";

      const isSale = b.transferType === "SALE";
      const sellerId = b.userId != null ? Number(b.userId) : NaN;

      if (isSale) {
        buyWrap.style.display = "block";

        if (b.status !== "ON_SALE") {
          btnBuySale.style.display = "none";
          if (buySaleOwnerNote) {
            buySaleOwnerNote.style.display = "block";
            buySaleOwnerNote.textContent =
              b.status === "SOLD"
                ? "该教材已售出，无法再下单。订单请在「个人中心 → 我的订单」查看（买家账号）。"
                : "该教材当前不在售（已下架或已借出等），无法购买。";
          }
        } else {
          const curStr = localStorage.getItem("currentUser");
          if (!curStr) {
            if (buySaleHint) {
              buySaleHint.textContent = "登录后即可购买（演示环境：下单将直接显示为已付款）。";
            }
            btnBuySale.textContent = "登录后购买";
            btnBuySale.onclick = () => {
              location.href = "login.html";
            };
          } else {
            const u = JSON.parse(curStr);
            const buyerId = u.userId != null ? Number(u.userId) : NaN;
            if (buyerId === sellerId) {
              btnBuySale.style.display = "none";
              if (buySaleOwnerNote) {
                buySaleOwnerNote.style.display = "block";
                buySaleOwnerNote.textContent =
                  "这是您自己发布的在售教材，页面不会显示「立即购买」。请使用其他学生账号登录后再打开本页，即可看到购买按钮并完成下单。";
              }
              if (buySaleHint) {
                buySaleHint.textContent = "您可在个人中心查看「我的订单」中他人购买产生的记录（买家视角）。";
              }
            } else {
              if (buySaleHint) {
                buySaleHint.textContent =
                  "演示环境：下单后直接记为已付款，无需真实支付；教材将标记为已售出。";
              }
              btnBuySale.textContent = "立即购买";
              btnBuySale.onclick = async () => {
                btnBuySale.disabled = true;
                try {
                  const respOrder = await fetch(API_BASE + "/transactions/sale-orders", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({ buyerId: u.userId, textbookId: b.id })
                  });
                  if (!respOrder.ok) {
                    btnBuySale.disabled = false;
                    const err = await respOrder.json().catch(() => ({}));
                    alert(err.message || "下单失败，请稍后再试");
                    return;
                  }
                  const order = await respOrder.json();
                  location.href = `order.html?id=${order.orderId}`;
                } catch (err) {
                  console.error(err);
                  btnBuySale.disabled = false;
                  alert("无法连接服务器");
                }
              };
            }
          }
        }
      }
    }
  } catch (e) {
    console.error(e);
    showDetailBottom(false);
    root.innerHTML = "<p>加载详情失败，请稍后重试。</p>";
  }
}

function toggleAdminSystemNav(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  const wrap = document.getElementById("adminNavSystemWrap");
  const btn = document.getElementById("btnSystemManageToggle");
  if (!wrap || !btn) return;
  const open = wrap.classList.toggle("open");
  btn.setAttribute("aria-expanded", open ? "true" : "false");
}

function switchAdminTab(tab) {
  const users = document.getElementById("panelUsers");
  const systemOrders = document.getElementById("panelSystemOrders");
  const students = document.getElementById("panelStudents");
  const books = document.getElementById("panelBooks");
  const announcements = document.getElementById("panelAnnouncements");
  const comments = document.getElementById("panelComments");
  const reports = document.getElementById("panelReports");
  const btnSystemUsers = document.getElementById("tabSystemUsers");
  const btnSystemOrders = document.getElementById("tabSystemOrders");
  const btnStudents = document.getElementById("tabStudents");
  const btnBooks = document.getElementById("tabBooks");
  const btnAnnouncements = document.getElementById("tabAnnouncements");
  const btnComments = document.getElementById("tabComments");
  const btnReports = document.getElementById("tabReports");
  const systemWrap = document.getElementById("adminNavSystemWrap");
  const btnSystemToggle = document.getElementById("btnSystemManageToggle");

  users.style.display = "none";
  if (systemOrders) systemOrders.style.display = "none";
  if (students) students.style.display = "none";
  books.style.display = "none";
  if (announcements) announcements.style.display = "none";
  if (comments) comments.style.display = "none";
  if (reports) reports.style.display = "none";
  if (btnSystemUsers) btnSystemUsers.classList.remove("active");
  if (btnSystemOrders) btnSystemOrders.classList.remove("active");
  if (btnStudents) btnStudents.classList.remove("active");
  btnBooks.classList.remove("active");
  if (btnAnnouncements) btnAnnouncements.classList.remove("active");
  if (btnComments) btnComments.classList.remove("active");
  if (btnReports) btnReports.classList.remove("active");

  if (systemWrap && btnSystemToggle) {
    if (tab === "system-users" || tab === "system-orders") {
      systemWrap.classList.add("has-active-child", "open");
      btnSystemToggle.setAttribute("aria-expanded", "true");
    } else {
      systemWrap.classList.remove("has-active-child", "open");
      btnSystemToggle.setAttribute("aria-expanded", "false");
    }
  }

  if (tab === "system-users") {
    users.style.display = "";
    if (btnSystemUsers) btnSystemUsers.classList.add("active");
    loadAdminUsers();
  } else if (tab === "system-orders" && systemOrders) {
    systemOrders.style.display = "";
    if (btnSystemOrders) btnSystemOrders.classList.add("active");
    loadAdminOrders();
  } else if (tab === "students" && students) {
    students.style.display = "";
    if (btnStudents) btnStudents.classList.add("active");
    loadAdminStudents();
  } else if (tab === "announcements" && announcements) {
    announcements.style.display = "";
    if (btnAnnouncements) btnAnnouncements.classList.add("active");
    loadAdminAnnouncements();
  } else if (tab === "comments" && comments) {
    comments.style.display = "";
    if (btnComments) btnComments.classList.add("active");
    loadAdminComments();
  } else if (tab === "reports" && reports) {
    reports.style.display = "";
    if (btnReports) btnReports.classList.add("active");
    loadAdminReports();
  } else {
    books.style.display = "";
    btnBooks.classList.add("active");
    loadAdminBooks();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", login);
  }

  // index.html: 每页显示数量切换（默认 20）
  const pageSizeSelect = document.getElementById("pageSizeSelect");
  if (pageSizeSelect) {
    pageSize = parseInt(pageSizeSelect.value, 10) || 20;
    pageSizeSelect.addEventListener("change", () => {
      pageSize = parseInt(pageSizeSelect.value, 10) || 20;
      currentPage = 1;
      renderBooks();
    });
  }

  if (document.getElementById("homeAnnouncementList")) {
    loadHomeAnnouncements();
  }

  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    loadBooks();
    let timer = null;
    searchInput.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(() => loadBooks(searchInput.value), 300);
    });
  }

  const btnPrev = document.getElementById("btnPrev");
  const btnNext = document.getElementById("btnNext");
  if (btnPrev && btnNext) {
    btnPrev.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        renderBooks();
      }
    });
    btnNext.addEventListener("click", () => {
      const totalPages = Math.max(1, Math.ceil(currentBooks.length / (pageSize || 8)));
      if (currentPage < totalPages) {
        currentPage++;
        renderBooks();
      }
    });
  }

  if (document.getElementById("panelUsers")) {
    switchAdminTab("system-users");
  }

  const publishForm = document.getElementById("publishForm");
  if (publishForm) {
    publishForm.addEventListener("submit", submitPublish);
  }

  if (document.getElementById("detailRoot")) {
    loadDetail();
  }

  if (document.getElementById("orderRoot")) {
    loadOrderPage();
  }

  const createUserForm = document.getElementById("adminCreateUserForm");
  if (createUserForm) {
    createUserForm.addEventListener("submit", submitAdminCreateUser);
  }

  const createStudentForm = document.getElementById("adminCreateStudentForm");
  if (createStudentForm) {
    createStudentForm.addEventListener("submit", submitAdminCreateStudent);
  }

  const adminAnnouncementForm = document.getElementById("adminAnnouncementForm");
  if (adminAnnouncementForm) {
    adminAnnouncementForm.addEventListener("submit", submitAdminAnnouncement);
  }
  const adminAnnouncementReset = document.getElementById("adminAnnouncementReset");
  if (adminAnnouncementReset) {
    adminAnnouncementReset.addEventListener("click", () => resetAdminAnnouncementForm());
  }

   const profileNameForm = document.getElementById("profileNameForm");
   if (profileNameForm) {
     profileNameForm.addEventListener("submit", submitProfileName);
   }
   const profilePwdForm = document.getElementById("profilePwdForm");
   if (profilePwdForm) {
     profilePwdForm.addEventListener("submit", submitProfilePwd);
   }

  initProfilePage();
});

