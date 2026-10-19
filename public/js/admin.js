import { apiGet, apiPatch, clearToken, clearUser } from "./api.js";

const status = document.querySelector("#admin-status");
const userCount = document.querySelector("#user-count");
const pendingPlaceCount = document.querySelector("#pending-place-count");
const usersTableBody = document.querySelector("#users-table-body");

const communityPlacesBody = document.querySelector(
  "#community-places-table-body"
);
const communityPlacesStatus = document.querySelector(
  "#community-places-status"
);

function setStatus(message, isError = false) {
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("status-error", isError);
}

function logout() {
  clearToken();
  clearUser();
  window.location.href = "/login.html";
}

function addCell(row, value) {
  const cell = document.createElement("td");
  cell.textContent = value ?? "";
  row.append(cell);
  return cell;
}

function renderUser(user) {
  const row = document.createElement("tr");

  addCell(row, user.name);
  addCell(row, user.email);

  const roleCell = document.createElement("td");
  const roleBadge = document.createElement("span");
  roleBadge.className = `badge ${user.role === "admin" ? "badge-admin" : "badge-user"}`;
  roleBadge.textContent = user.role;
  roleCell.append(roleBadge);
  row.append(roleCell);

  const actionCell = document.createElement("td");
  const roleSelect = document.createElement("select");
  roleSelect.setAttribute("aria-label", `Role for ${user.name || user.email}`);

  for (const role of ["user", "admin"]) {
    const option = document.createElement("option");
    option.value = role;
    option.textContent = role;
    option.selected = user.role === role;
    roleSelect.append(option);
  }

  const saveButton = document.createElement("button");
  saveButton.type = "button";
  saveButton.className = "button button-sm button-primary";
  saveButton.textContent = "Save role";

  saveButton.addEventListener("click", async () => {
    saveButton.disabled = true;

    try {
      await apiPatch(`/api/admin/users/${encodeURIComponent(user.id)}/role`, {
        role: roleSelect.value,
      });

      setStatus(`${user.name || user.email}'s role was updated.`);
      await loadUsers();
    } catch (error) {
      setStatus(error.message || "Could not update the role.", true);
      saveButton.disabled = false;
    }
  });

  actionCell.append(roleSelect, saveButton);
  row.append(actionCell);
  usersTableBody.append(row);
}

async function loadDashboard() {
  const data = await apiGet("/api/admin/dashboard");

  if (userCount) {
    userCount.textContent = String(data.dashboard?.userCount ?? 0);
  }
  if (pendingPlaceCount) {
    pendingPlaceCount.textContent = String(
      data.dashboard?.pendingPlacesCount ?? 0
    );
  }
}

async function loadUsers() {
  const data = await apiGet("/api/admin/users");

  if (!usersTableBody) return;

  usersTableBody.replaceChildren();

  for (const user of data.users || []) {
    renderUser(user);
  }
}

async function loadCommunityPlaces() {
  if (!communityPlacesBody || !communityPlacesStatus) return;

  communityPlacesStatus.textContent = "Loading place submissions…";
  communityPlacesBody.replaceChildren();

  try {
    const data = await apiGet("/api/admin/community-places");
    const places = Array.isArray(data.places) ? data.places : [];

    if (places.length === 0) {
      communityPlacesStatus.textContent = "No pending place submissions.";
      return;
    }

    communityPlacesStatus.textContent = `${places.length} place submission(s) need review.`;

    for (const place of places) {
      const row = document.createElement("tr");

      addCell(row, place.name);
      addCell(row, place.category);
      addCell(row, place.address || "—");
      addCell(row, `${place.lat}, ${place.lon}`);

      const reviewCell = document.createElement("td");
      const reviewActions = document.createElement("div");
      reviewActions.className = "review-actions";

      const approveButton = document.createElement("button");
      approveButton.type = "button";
      approveButton.className = "button button-sm button-primary";
      approveButton.textContent = "Approve";
      approveButton.addEventListener("click", () => {
        reviewPlace(place.id, "approved");
      });

      const rejectButton = document.createElement("button");
      rejectButton.type = "button";
      rejectButton.className = "button button-sm button-danger";
      rejectButton.textContent = "Reject";
      rejectButton.addEventListener("click", () => {
        reviewPlace(place.id, "rejected");
      });

      reviewActions.append(approveButton, rejectButton);
      reviewCell.append(reviewActions);
      row.append(reviewCell);
      communityPlacesBody.append(row);
    }
  } catch (error) {
    communityPlacesStatus.textContent =
      error.message || "Could not load place submissions.";
  }
}

async function reviewPlace(placeId, reviewStatus) {
  if (communityPlacesStatus) {
    communityPlacesStatus.textContent = "Saving review…";
  }

  try {
    await apiPatch(`/api/admin/community-places/${placeId}`, {
      status: reviewStatus,
    });

    await Promise.all([loadCommunityPlaces(), loadDashboard()]);
  } catch (error) {
    if (communityPlacesStatus) {
      communityPlacesStatus.textContent =
        error.message || "Could not save the review.";
    }
  }
}

async function init() {
  if (!localStorage.getItem("nearhelp_token")) {
    window.location.href = "/login.html?next=/admin.html";
    return;
  }

  setStatus("Loading admin dashboard…");

  try {
    await Promise.all([
      loadDashboard(),
      loadUsers(),
      loadCommunityPlaces(),
    ]);

    setStatus("");
  } catch (error) {
    const message = String(error.message || "").toLowerCase();

    if (message.includes("token") || message.includes("unauthorized")) {
      clearToken();
      clearUser();
      window.location.href = "/login.html?next=/admin.html";
      return;
    }

    if (message.includes("admin") || message.includes("forbidden")) {
      setStatus("Admin access denied. Check your account role and log in again.", true);
      return;
    }

    setStatus(error.message || "Could not load the dashboard.", true);
  }
}

document.querySelector("#logout-button")?.addEventListener("click", logout);

init();
