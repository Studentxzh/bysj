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
  const url = new URL(API_BASE + "/textbooks");
  if (keyword && keyword.trim() !== "") {
    url.searchParams.set("keyword", keyword.trim());
  }
  try {
    const resp = await fetch(url.toString());
    currentBooks = await resp.json();
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
        <td>${u.role || ""}</td>
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

async function submitAdminCreateUser(event) {
  event.preventDefault();
  const form = event.target;
  const msgEl = document.getElementById("adminCreateUserMsg");
  msgEl.textContent = "";
  const username = form.username.value.trim();
  const password = form.password.value.trim();
  const realName = form.realName.value.trim();
  const role = form.role.value;
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
        realName,
        role
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

async function loadAdminBooks() {
  const tbody = document.getElementById("adminBookTbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  try {
    const resp = await fetch(API_BASE + "/textbooks");
    const books = await resp.json();
    books.forEach(b => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${b.id}</td>
        <td>${b.title || ""}</td>
        <td>${b.transferType || ""}</td>
        <td>${b.price != null ? ("¥" + b.price) : ""}</td>
        <td>${b.status || ""}</td>
        <td>
          <button class="btn btn-danger" style="padding:4px 10px;font-size:12px;"
            data-id="${b.id}">
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
      if (!confirm(`确定要删除ID为 ${id} 的教材吗？`)) return;
      try {
        const respDel = await fetch(`${API_BASE}/admin/textbooks/${id}`, {
          method: "DELETE"
        });
        if (respDel.status === 204) {
          await loadAdminBooks();
        } else {
          alert("删除失败，请稍后再试");
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
    root.innerHTML = "<p>未找到该教材，请从列表页重新进入。</p>";
    return;
  }
  try {
    const resp = await fetch(`${API_BASE}/textbooks/${id}`);
    if (!resp.ok) {
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
    root.innerHTML = "<p>加载详情失败，请稍后重试。</p>";
  }
}

function switchAdminTab(tab) {
  const users = document.getElementById("panelUsers");
  const books = document.getElementById("panelBooks");
  const btnUsers = document.getElementById("tabUsers");
  const btnBooks = document.getElementById("tabBooks");

  if (tab === "users") {
    users.style.display = "";
    books.style.display = "none";
    btnUsers.classList.add("active");
    btnBooks.classList.remove("active");
    loadAdminUsers();
  } else {
    users.style.display = "none";
    books.style.display = "";
    btnUsers.classList.remove("active");
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
    switchAdminTab("users");
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

