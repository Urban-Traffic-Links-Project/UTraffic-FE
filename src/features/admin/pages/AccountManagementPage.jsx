import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import LockOpenRoundedIcon from "@mui/icons-material/LockOpenRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import VpnKeyRoundedIcon from "@mui/icons-material/VpnKeyRounded";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";

import styles from "./AccountManagementPage.module.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const roleOptions = [
  { value: "admin", label: "Admin" },
  { value: "user", label: "User" },
];

const statusOptions = [
  { value: "ACTIVE", label: "Active" },
  { value: "LOCKED", label: "Locked" },
];

const emptyForm = {
  full_name: "",
  email: "",
  password: "",
  role: "user",
  status: "ACTIVE",
};

const emptyResetPasswordForm = {
  new_password: "",
  confirm_password: "",
};

function getStatusLabel(isActive) {
  return isActive ? "Active" : "Locked";
}

function getStatusColor(isActive) {
  return isActive ? "success" : "error";
}

function getRoleLabel(role) {
  return roleOptions.find((option) => option.value === role)?.label || role || "--";
}

function normalizeDate(value) {
  if (!value) return "--";

  try {
    return new Date(value).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function getRowNumber(index, page, rowsPerPage) {
  return page * rowsPerPage + index + 1;
}

function findTokenDeep(value, depth = 0) {
  if (!value || depth > 5) return "";

  if (typeof value === "string") {
    if (value.startsWith("eyJ")) return value;
    return "";
  }

  if (typeof value !== "object") return "";

  const directKeys = [
    "access_token",
    "accessToken",
    "token",
    "authToken",
    "jwt",
  ];

  for (const key of directKeys) {
    if (typeof value[key] === "string" && value[key]) {
      return value[key];
    }
  }

  for (const child of Object.values(value)) {
    const found = findTokenDeep(child, depth + 1);
    if (found) return found;
  }

  return "";
}

function getAccessToken() {
  const storages = [window.localStorage, window.sessionStorage];

  for (const storage of storages) {
    for (const key of Object.keys(storage)) {
      const raw = storage.getItem(key);

      if (!raw) continue;
      if (raw.startsWith("eyJ")) return raw;

      try {
        const parsed = JSON.parse(raw);
        const found = findTokenDeep(parsed);
        if (found) return found;
      } catch {
        // Ignore non-JSON storage values.
      }
    }
  }

  return "";
}

async function adminApiRequest(path, options = {}) {
  const token = getAccessToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const detail = Array.isArray(data?.detail)
      ? data.detail.map((item) => item.msg).join(", ")
      : data?.detail;

    throw new Error(detail || data?.message || `Request failed (${response.status})`);
  }

  return data;
}

export function AccountManagementPage() {
  const [accounts, setAccounts] = useState([]);
  const [totalAccountsFromApi, setTotalAccountsFromApi] = useState(0);

  const [keyword, setKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [resetPasswordAccount, setResetPasswordAccount] = useState(null);
  const [resetPasswordForm, setResetPasswordForm] = useState(emptyResetPasswordForm);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg("");

    try {
      const params = new URLSearchParams({
        skip: String(page * rowsPerPage),
        limit: String(rowsPerPage),
      });

      if (keyword.trim()) params.set("search", keyword.trim());
      if (roleFilter !== "ALL") params.set("role", roleFilter);
      if (statusFilter !== "ALL") {
        params.set("is_active", statusFilter === "ACTIVE" ? "true" : "false");
      }

      const data = await adminApiRequest(`/api/v1/auth/admin/users?${params.toString()}`);
      const items = Array.isArray(data) ? data : data?.items || [];

      setAccounts(items);
      setTotalAccountsFromApi(Array.isArray(data) ? items.length : data?.total || 0);
    } catch (error) {
      console.error("LOAD ADMIN USERS ERROR:", error);
      setErrorMsg(error?.message || "Không tải được danh sách tài khoản.");
      setAccounts([]);
      setTotalAccountsFromApi(0);
    } finally {
      setIsLoading(false);
    }
  }, [keyword, page, roleFilter, rowsPerPage, statusFilter]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    setPage(0);
  }, [keyword, roleFilter, statusFilter]);

  const totalAccounts = totalAccountsFromApi || accounts.length;
  const activeAccounts = accounts.filter((account) => account.is_active).length;
  const lockedAccounts = accounts.filter((account) => !account.is_active).length;
  const adminAccounts = accounts.filter((account) => account.role === "admin").length;

  const dialogTitle = editingAccount ? "Update Account" : "Create New Account";

  function clearMessages() {
    setMessage("");
    setErrorMsg("");
  }

  function handleOpenCreate() {
    clearMessages();
    setEditingAccount(null);
    setForm(emptyForm);
    setOpenDialog(true);
  }

  function handleOpenEdit(account) {
    clearMessages();
    setEditingAccount(account);
    setForm({
      full_name: account.full_name || "",
      email: account.email || "",
      password: "",
      role: account.role || "user",
      status: account.is_active ? "ACTIVE" : "LOCKED",
    });
    setOpenDialog(true);
  }

  function handleCloseDialog() {
    if (isSaving) return;

    setOpenDialog(false);
    setEditingAccount(null);
    setForm(emptyForm);
  }

  function handleChange(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function handleSave() {
    clearMessages();

    if (!form.email.trim()) {
      setErrorMsg("Vui lòng nhập email.");
      return;
    }

    if (!editingAccount && form.password.length < 8) {
      setErrorMsg("Mật khẩu tạo mới phải có ít nhất 8 ký tự.");
      return;
    }

    try {
      setIsSaving(true);

      if (editingAccount) {
        await adminApiRequest(`/api/v1/auth/admin/users/${editingAccount.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            full_name: form.full_name.trim() || null,
            role: form.role,
            is_active: form.status === "ACTIVE",
          }),
        });

        setMessage("Cập nhật tài khoản thành công.");
      } else {
        await adminApiRequest("/api/v1/auth/admin/users", {
          method: "POST",
          body: JSON.stringify({
            email: form.email.trim(),
            password: form.password,
            full_name: form.full_name.trim() || null,
            role: form.role,
            is_active: form.status === "ACTIVE",
          }),
        });

        setMessage("Tạo tài khoản thành công.");
      }

      handleCloseDialog();
      await fetchAccounts();
    } catch (error) {
      console.error("SAVE ADMIN USER ERROR:", error);
      setErrorMsg(error?.message || "Không lưu được tài khoản.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleStatus(account) {
    clearMessages();

    const actionText = account.is_active ? "khóa" : "mở khóa";
    const confirmed = window.confirm(`Bạn có chắc muốn ${actionText} tài khoản ${account.email}?`);

    if (!confirmed) return;

    try {
      await adminApiRequest(`/api/v1/auth/admin/users/${account.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          is_active: !account.is_active,
        }),
      });

      setMessage(`${account.is_active ? "Khóa" : "Mở khóa"} tài khoản thành công.`);
      await fetchAccounts();
    } catch (error) {
      console.error("TOGGLE ADMIN USER ERROR:", error);
      setErrorMsg(error?.message || "Không cập nhật được trạng thái tài khoản.");
    }
  }

  function handleOpenResetPassword(account) {
    clearMessages();
    setResetPasswordAccount(account);
    setResetPasswordForm(emptyResetPasswordForm);
  }

  function handleCloseResetPassword() {
    if (isSaving) return;

    setResetPasswordAccount(null);
    setResetPasswordForm(emptyResetPasswordForm);
  }

  async function handleResetPassword() {
    clearMessages();

    if (resetPasswordForm.new_password.length < 8) {
      setErrorMsg("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }

    if (resetPasswordForm.new_password !== resetPasswordForm.confirm_password) {
      setErrorMsg("Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      setIsSaving(true);

      await adminApiRequest(`/api/v1/auth/admin/users/${resetPasswordAccount.id}/reset-password`, {
        method: "POST",
        body: JSON.stringify({
          new_password: resetPasswordForm.new_password,
        }),
      });

      setMessage("Đặt lại mật khẩu thành công.");
      handleCloseResetPassword();
    } catch (error) {
      console.error("RESET ADMIN USER PASSWORD ERROR:", error);
      setErrorMsg(error?.message || "Không đặt lại được mật khẩu.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRevokeSessions(account) {
    clearMessages();

    const confirmed = window.confirm(
      `Đăng xuất tài khoản ${account.email} khỏi tất cả thiết bị?`
    );

    if (!confirmed) return;

    try {
      await adminApiRequest(`/api/v1/auth/admin/users/${account.id}/revoke-sessions`, {
        method: "POST",
      });

      setMessage("Đã revoke toàn bộ phiên đăng nhập của tài khoản.");
    } catch (error) {
      console.error("REVOKE ADMIN USER SESSIONS ERROR:", error);
      setErrorMsg(error?.message || "Không revoke được phiên đăng nhập.");
    }
  }

  return (
    <Box className={styles.page}>
      <Box className={styles.header}>
        <Box>
          <Typography className={styles.title}>Account Management</Typography>
          <Typography className={styles.subtitle}>
            Manage users, assign roles, lock accounts, reset passwords, and revoke sessions.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} className={styles.headerActions}>
          <Button
            variant="outlined"
            startIcon={<RefreshRoundedIcon />}
            onClick={fetchAccounts}
            disabled={isLoading}
            className={styles.refreshButton}
          >
            Refresh
          </Button>

          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={handleOpenCreate}
            className={styles.addButton}
          >
            Add Account
          </Button>
        </Stack>
      </Box>

      {message && (
        <Alert severity="success" className={styles.alertBox} onClose={() => setMessage("")}>
          {message}
        </Alert>
      )}

      {errorMsg && (
        <Alert severity="error" className={styles.alertBox} onClose={() => setErrorMsg("")}>
          {errorMsg}
        </Alert>
      )}

      <Box className={styles.statsGrid}>
        <Paper className={styles.statCard}>
          <Typography className={styles.statLabel}>Total Accounts</Typography>
          <Typography className={styles.statValue}>{totalAccounts}</Typography>
        </Paper>

        <Paper className={styles.statCard}>
          <Typography className={styles.statLabel}>Active on page</Typography>
          <Typography className={styles.statValue}>{activeAccounts}</Typography>
        </Paper>

        <Paper className={styles.statCard}>
          <Typography className={styles.statLabel}>Locked on page</Typography>
          <Typography className={styles.statValue}>{lockedAccounts}</Typography>
        </Paper>

        <Paper className={styles.statCard}>
          <Typography className={styles.statLabel}>Admin on page</Typography>
          <Typography className={styles.statValue}>{adminAccounts}</Typography>
        </Paper>
      </Box>

      <Paper className={styles.panel}>
        <Box className={styles.toolbar}>
          <TextField
            size="small"
            className={styles.searchInput}
            placeholder="Search by name, email..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            select
            size="small"
            label="Role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className={styles.filterInput}
          >
            <MenuItem value="ALL">All</MenuItem>
            {roleOptions.map((role) => (
              <MenuItem key={role.value} value={role.value}>
                {role.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.filterInput}
          >
            <MenuItem value="ALL">All</MenuItem>
            {statusOptions.map((status) => (
              <MenuItem key={status.value} value={status.value}>
                {status.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        <Box className={styles.tableWrap}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>No.</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Last Login</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Box className={styles.loadingState}>
                      <CircularProgress size={24} />
                      <span>Loading accounts...</span>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : null}

              {!isLoading &&
                accounts.map((account, index) => (
                  <TableRow key={account.id} hover>
                    <TableCell>{getRowNumber(index, page, rowsPerPage)}</TableCell>
                    <TableCell>{account.full_name || "--"}</TableCell>
                    <TableCell>{account.email}</TableCell>
                    <TableCell>
                      <Chip label={getRoleLabel(account.role)} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(account.is_active)}
                        color={getStatusColor(account.is_active)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{normalizeDate(account.created_at)}</TableCell>
                    <TableCell>{normalizeDate(account.last_login_at)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit account">
                        <IconButton onClick={() => handleOpenEdit(account)}>
                          <EditRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title={account.is_active ? "Lock account" : "Unlock account"}>
                        <IconButton onClick={() => handleToggleStatus(account)}>
                          {account.is_active ? (
                            <LockRoundedIcon fontSize="small" />
                          ) : (
                            <LockOpenRoundedIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Reset password">
                        <IconButton onClick={() => handleOpenResetPassword(account)}>
                          <VpnKeyRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Revoke sessions">
                        <IconButton onClick={() => handleRevokeSessions(account)}>
                          <LogoutRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}

              {!isLoading && !accounts.length ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Box className={styles.emptyState}>
                      No matching accounts found.
                    </Box>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </Box>

        <TablePagination
          component="div"
          count={totalAccountsFromApi}
          page={page}
          onPageChange={(_, nextPage) => setPage(nextPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(Number(event.target.value));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 20, 50]}
        />

        <Box className={styles.mobileList}>
          {accounts.map((account, index) => (
            <Paper key={account.id} className={styles.mobileCard}>
              <Box className={styles.mobileCardHeader}>
                <Box>
                  <Typography className={styles.mobileName}>
                    {account.full_name || account.email}
                  </Typography>
                  <Typography className={styles.mobileMeta}>
                    {account.email}
                  </Typography>
                </Box>

                <Chip
                  label={getStatusLabel(account.is_active)}
                  color={getStatusColor(account.is_active)}
                  size="small"
                  variant="outlined"
                />
              </Box>

              <Box className={styles.mobileInfo}>
                <Typography>STT: {getRowNumber(index, page, rowsPerPage)}</Typography>
                <Typography>Role: {getRoleLabel(account.role)}</Typography>
                <Typography>Created At: {normalizeDate(account.created_at)}</Typography>
                <Typography>Last Login: {normalizeDate(account.last_login_at)}</Typography>
              </Box>

              <Stack direction="row" spacing={1} className={styles.mobileActions}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<EditRoundedIcon />}
                  onClick={() => handleOpenEdit(account)}
                >
                  Edit
                </Button>

                <Button
                  size="small"
                  variant="outlined"
                  startIcon={account.is_active ? <LockRoundedIcon /> : <LockOpenRoundedIcon />}
                  onClick={() => handleToggleStatus(account)}
                >
                  {account.is_active ? "Lock" : "Unlock"}
                </Button>

                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<VpnKeyRoundedIcon />}
                  onClick={() => handleOpenResetPassword(account)}
                >
                  Reset
                </Button>

                <Button
                  size="small"
                  color="warning"
                  variant="outlined"
                  startIcon={<LogoutRoundedIcon />}
                  onClick={() => handleRevokeSessions(account)}
                >
                  Revoke
                </Button>
              </Stack>
            </Paper>
          ))}

          {!isLoading && !accounts.length ? (
            <Box className={styles.emptyState}>
              No matching accounts found.
            </Box>
          ) : null}
        </Box>
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>{dialogTitle}</DialogTitle>

        <DialogContent>
          <Box className={styles.formGrid}>
            <TextField
              label="Full name"
              value={form.full_name}
              onChange={(e) => handleChange("full_name", e.target.value)}
              fullWidth
            />

            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              fullWidth
              required
              disabled={Boolean(editingAccount)}
              helperText={editingAccount ? "Email cannot be changed from this screen." : ""}
            />

            {!editingAccount && (
              <TextField
                label="Password"
                type="password"
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                fullWidth
                required
                helperText="Minimum 8 characters"
              />
            )}

            <TextField
              select
              label="Role"
              value={form.role}
              onChange={(e) => handleChange("role", e.target.value)}
              fullWidth
            >
              {roleOptions.map((role) => (
                <MenuItem key={role.value} value={role.value}>
                  {role.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Status"
              value={form.status}
              onChange={(e) => handleChange("status", e.target.value)}
              fullWidth
            >
              {statusOptions.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  {status.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>

        <DialogActions className={styles.dialogActions}>
          <Button onClick={handleCloseDialog} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <CircularProgress size={22} color="inherit" /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(resetPasswordAccount)}
        onClose={handleCloseResetPassword}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Reset Password</DialogTitle>

        <DialogContent>
          <Box className={styles.formGrid}>
            <Typography className={styles.resetText}>
              Account: <strong>{resetPasswordAccount?.email}</strong>
            </Typography>

            <TextField
              label="New password"
              type="password"
              value={resetPasswordForm.new_password}
              onChange={(e) =>
                setResetPasswordForm((prev) => ({
                  ...prev,
                  new_password: e.target.value,
                }))
              }
              fullWidth
              required
              helperText="Minimum 8 characters"
            />

            <TextField
              label="Confirm password"
              type="password"
              value={resetPasswordForm.confirm_password}
              onChange={(e) =>
                setResetPasswordForm((prev) => ({
                  ...prev,
                  confirm_password: e.target.value,
                }))
              }
              fullWidth
              required
            />
          </Box>
        </DialogContent>

        <DialogActions className={styles.dialogActions}>
          <Button onClick={handleCloseResetPassword} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleResetPassword} disabled={isSaving}>
            {isSaving ? <CircularProgress size={22} color="inherit" /> : "Reset"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
