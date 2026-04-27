import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import LockOpenRoundedIcon from "@mui/icons-material/LockOpenRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import {
    Box,
    Button,
    Chip,
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
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import { useMemo, useState } from "react";

import styles from "./AccountManagementPage.module.css";

const roles = ["Admin", "Manager", "Staff", "Viewer"];

const statusOptions = [
  { value: "ACTIVE", label: "Active" },
  { value: "LOCKED", label: "Locked" },
];

const initialAccounts = [
  {
    id: "U001",
    username: "annv",
    email: "annv@example.com",
    role: "Admin",
    status: "ACTIVE",
    createdAt: "2026-04-01",
  },
  {
    id: "U002",
    username: "binhtt",
    email: "binhtt@example.com",
    role: "Manager",
    status: "ACTIVE",
    createdAt: "2026-04-05",
  },
  {
    id: "U003",
    username: "cuonglm",
    email: "cuonglm@example.com",
    role: "Staff",
    status: "LOCKED",
    createdAt: "2026-04-12",
  },
];

const emptyForm = {
  username: "",
  email: "",
  role: "Staff",
  status: "ACTIVE",
};

function getStatusLabel(status) {
  return status === "ACTIVE" ? "Active" : "Locked";
}

function getStatusColor(status) {
  return status === "ACTIVE" ? "success" : "error";
}

function normalizeText(value = "") {
  return String(value).toLowerCase().trim();
}

export function AccountManagementPage() {
  const [accounts, setAccounts] = useState(initialAccounts);

  const [keyword, setKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [openDialog, setOpenDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const filteredAccounts = useMemo(() => {
    const search = normalizeText(keyword);

    return accounts.filter((account) => {
      const matchKeyword =
        normalizeText(account.username).includes(search) ||
        normalizeText(account.email).includes(search);

      const matchRole = roleFilter === "ALL" || account.role === roleFilter;
      const matchStatus =
        statusFilter === "ALL" || account.status === statusFilter;

      return matchKeyword && matchRole && matchStatus;
    });
  }, [accounts, keyword, roleFilter, statusFilter]);

  const totalAccounts = accounts.length;
  const activeAccounts = accounts.filter((x) => x.status === "ACTIVE").length;
  const lockedAccounts = accounts.filter((x) => x.status === "LOCKED").length;
  const adminAccounts = accounts.filter((x) => x.role === "Admin").length;

  function handleOpenCreate() {
    setEditingAccount(null);
    setForm(emptyForm);
    setOpenDialog(true);
  }

  function handleOpenEdit(account) {
    setEditingAccount(account);
    setForm({
      username: account.username,
      email: account.email,
      role: account.role,
      status: account.status,
    });
    setOpenDialog(true);
  }

  function handleCloseDialog() {
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

  function handleSave() {
    if (!form.username.trim() || !form.email.trim()) {
      alert("Please fill in all required fields.");
      return;
    }

    if (editingAccount) {
      setAccounts((prev) =>
        prev.map((account) =>
          account.id === editingAccount.id
            ? {
                ...account,
                ...form,
              }
            : account
        )
      );
    } else {
      const newAccount = {
        id: `U${Date.now()}`,
        ...form,
        createdAt: new Date().toISOString().slice(0, 10),
      };

      setAccounts((prev) => [newAccount, ...prev]);
    }

    handleCloseDialog();
  }

  function handleDelete(accountId) {
    const confirmDelete = window.confirm("Bạn có chắc muốn xóa tài khoản này?");
    if (!confirmDelete) return;

    setAccounts((prev) => prev.filter((account) => account.id !== accountId));
  }

  function handleToggleStatus(accountId) {
    setAccounts((prev) =>
      prev.map((account) =>
        account.id === accountId
          ? {
              ...account,
              status: account.status === "ACTIVE" ? "LOCKED" : "ACTIVE",
            }
          : account
      )
    );
  }

  return (
    <Box className={styles.page}>
      <Box className={styles.header}>
        <Box>
          <Typography className={styles.title}>Quản lí tài khoản</Typography>
          <Typography className={styles.subtitle}>
            Quản lí người dùng, phân quyền và trạng thái hoạt động của tài khoản.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={handleOpenCreate}
          className={styles.addButton}
        >
          Thêm tài khoản
        </Button>
      </Box>

      <Box className={styles.statsGrid}>
        <Paper className={styles.statCard}>
          <Typography className={styles.statLabel}>Tổng tài khoản</Typography>
          <Typography className={styles.statValue}>{totalAccounts}</Typography>
        </Paper>

        <Paper className={styles.statCard}>
          <Typography className={styles.statLabel}>Đang hoạt động</Typography>
          <Typography className={styles.statValue}>{activeAccounts}</Typography>
        </Paper>

        <Paper className={styles.statCard}>
          <Typography className={styles.statLabel}>Đã khóa</Typography>
          <Typography className={styles.statValue}>{lockedAccounts}</Typography>
        </Paper>

        <Paper className={styles.statCard}>
          <Typography className={styles.statLabel}>Admin</Typography>
          <Typography className={styles.statValue}>{adminAccounts}</Typography>
        </Paper>
      </Box>

      <Paper className={styles.panel}>
        <Box className={styles.toolbar}>
          <TextField
            size="small"
            className={styles.searchInput}
            placeholder="Tìm theo họ tên, username, email..."
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
            label="Vai trò"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className={styles.filterInput}
          >
            <MenuItem value="ALL">Tất cả</MenuItem>
            {roles.map((role) => (
              <MenuItem key={role} value={role}>
                {role}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="Trạng thái"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.filterInput}
          >
            <MenuItem value="ALL">Tất cả</MenuItem>
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
                <TableCell>Mã</TableCell>
                <TableCell>Họ tên</TableCell>
                <TableCell>Tên đăng nhập</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Vai trò</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Ngày tạo</TableCell>
                <TableCell align="right">Thao tác</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredAccounts.map((account) => (
                <TableRow key={account.id} hover>
                  <TableCell>{account.id}</TableCell>
                  <TableCell>{account.username}</TableCell>
                  <TableCell>{account.email}</TableCell>
                  <TableCell>
                    <Chip label={account.role} size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(account.status)}
                      color={getStatusColor(account.status)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{account.createdAt}</TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleOpenEdit(account)}>
                      <EditRoundedIcon fontSize="small" />
                    </IconButton>

                    <IconButton onClick={() => handleToggleStatus(account.id)}>
                      {account.status === "ACTIVE" ? (
                        <LockRoundedIcon fontSize="small" />
                      ) : (
                        <LockOpenRoundedIcon fontSize="small" />
                      )}
                    </IconButton>

                    <IconButton
                      color="error"
                      onClick={() => handleDelete(account.id)}
                    >
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}

              {!filteredAccounts.length ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Box className={styles.emptyState}>
                      Không tìm thấy tài khoản phù hợp.
                    </Box>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </Box>

        <Box className={styles.mobileList}>
          {filteredAccounts.map((account) => (
            <Paper key={account.id} className={styles.mobileCard}>
              <Box className={styles.mobileCardHeader}>
                <Box>
                  <Typography className={styles.mobileMeta}>
                    @{account.username}
                  </Typography>
                </Box>

                <Chip
                  label={getStatusLabel(account.status)}
                  color={getStatusColor(account.status)}
                  size="small"
                  variant="outlined"
                />
              </Box>

              <Box className={styles.mobileInfo}>
                <Typography>Email: {account.email}</Typography>
                <Typography>Vai trò: {account.role}</Typography>
                <Typography>Ngày tạo: {account.createdAt}</Typography>
              </Box>

              <Stack direction="row" spacing={1} className={styles.mobileActions}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<EditRoundedIcon />}
                  onClick={() => handleOpenEdit(account)}
                >
                  Sửa
                </Button>

                <Button
                  size="small"
                  variant="outlined"
                  startIcon={
                    account.status === "ACTIVE" ? (
                      <LockRoundedIcon />
                    ) : (
                      <LockOpenRoundedIcon />
                    )
                  }
                  onClick={() => handleToggleStatus(account.id)}
                >
                  {account.status === "ACTIVE" ? "Khóa" : "Mở khóa"}
                </Button>

                <Button
                  size="small"
                  color="error"
                  variant="outlined"
                  startIcon={<DeleteOutlineRoundedIcon />}
                  onClick={() => handleDelete(account.id)}
                >
                  Xóa
                </Button>
              </Stack>
            </Paper>
          ))}

          {!filteredAccounts.length ? (
            <Box className={styles.emptyState}>
              Không tìm thấy tài khoản phù hợp.
            </Box>
          ) : null}
        </Box>
      </Paper>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editingAccount ? "Cập nhật tài khoản" : "Thêm tài khoản mới"}
        </DialogTitle>

        <DialogContent>
          <Box className={styles.formGrid}>

            <TextField
              label="Tên đăng nhập"
              value={form.username}
              onChange={(e) => handleChange("username", e.target.value)}
              fullWidth
              required
            />

            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              fullWidth
              required
            />

            <TextField
              select
              label="Vai trò"
              value={form.role}
              onChange={(e) => handleChange("role", e.target.value)}
              fullWidth
            >
              {roles.map((role) => (
                <MenuItem key={role} value={role}>
                  {role}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Trạng thái"
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
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button variant="contained" onClick={handleSave}>
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}