// src/pages/Drops.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  IconButton,
  Divider,
  InputAdornment,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";

// Agar sendagi api wrapper bo'lsa, undan foydalan. Bo'lmasa fetch'lar to'g'ri URL bilan ishlaydi
import { api } from "../api";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:3000/api";

const COL_DEFS = [
  { key: "id", label: "ID", width: 90 },
  { key: "card_number", label: "Karta", width: 180 },
  { key: "blocked_at", label: "Blok sana", width: 130, type: "date" },
  { key: "balance", label: "Qoldiq", width: 120, type: "number" },
  { key: "comment", label: "Izoh", width: 220 },
  { key: "blocked_by_username", label: "Bloklagan", width: 150 },
  { key: "created_at", label: "Yaratilgan", width: 140, type: "date" },
  { key: "updated_at", label: "Yangilangan", width: 140, type: "date" },
];

const date10 = (v) => (v || "").toString().slice(0, 10);
const toStr = (v) => (v ?? "").toString().toLowerCase();

export default function Drops() {
  const token = getToken();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // filterlar
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // modallar
  const [openView, setOpenView] = useState(false);
  const [viewComment, setViewComment] = useState("");
  const [openAdd, setOpenAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    card_number: "",
    blocked_at: new Date().toISOString().slice(0, 10),
    balance: "",
    comment: "",
  });
  const [openEdit, setOpenEdit] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [editForm, setEditForm] = useState({
    blocked_at: "",
    balance: "",
    comment: "",
  });

  // DataGrid columnlar
  const columns = useMemo(
    () => [
      ...COL_DEFS.map((col) => ({
        field: col.key,
        headerName: col.label,
        width: col.width,
      })),
      {
        field: "__actions",
        headerName: "Amal",
        width: 140,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Stack direction="row" spacing={1}>
            <Tooltip title="Izohni ko‘rish">
              <IconButton
                size="small"
                onClick={() => onViewComment(params.row)}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Tahrirlash">
              <IconButton size="small" onClick={() => onEdit(params.row)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="O‘chirish">
              <IconButton
                size="small"
                color="error"
                onClick={() => onDelete(params.row)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    []
  );

  // Ma'lumot yuklash
  useEffect(() => {
    load();
  }, []);
  async function load() {
    setLoading(true);
    try {
      // api.js wrapper ishlatiladi — token va params api.request ichida hal qilinadi
      const data = await api.listDrops(q || "", 1, 200);
      setRows(data?.rows || []);
    } catch (e) {
      console.error(e);
      alert(e?.message || "Yuklab bo‘lmadi");
    } finally {
      setLoading(false);
    }
  }

  // Frontda qo'shimcha filter (global qidiruv + sana)
  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const hitQ =
        !q ||
        [r.card_number, r.comment, r.blocked_by_username].some((v) =>
          toStr(v).includes(toStr(q))
        );
      if (!hitQ) return false;

      const d = date10(r.blocked_at);
      if (from && d < from) return false;
      if (to && d > to) return false;

      return true;
    });
  }, [rows, q, from, to]);

  // Comment ko'rish
  function onViewComment(row) {
    setViewComment(row.comment || "");
    setOpenView(true);
  }

  // Yangi qo'shish
  function openAddModal() {
    setAddForm({
      card_number: "",
      blocked_at: new Date().toISOString().slice(0, 10),
      balance: "",
      comment: "",
    });
    setOpenAdd(true);
  }
  async function onAddSave() {
    try {
      const payload = {
        card_number: addForm.card_number,
        blocked_at: addForm.blocked_at || null,
        balance: addForm.balance === "" ? null : Number(addForm.balance),
        comment: addForm.comment || null,
      };
      // api.js wrapper ishlatilyapti
      await api.createDrop(payload);
      setOpenAdd(false);
      await load();
    } catch (e) {
      console.error(e);
      alert(e?.message || "Saqlash xatosi");
    }
  }

  // Edit
  function onEdit(row) {
    setEditRow(row);
    setEditForm({
      blocked_at: date10(row.blocked_at),
      balance: row.balance ?? "",
      comment: row.comment || "",
    });
    setOpenEdit(true);
  }
  async function onEditSave() {
    if (!editRow) return;
    try {
      const payload = {
        blocked_at: editForm.blocked_at || null,
        balance: editForm.balance === "" ? null : Number(editForm.balance),
        comment: editForm.comment || null,
      };
      // api.js wrapper ishlatilyapti
      await api.updateDrop(editRow.id, payload);
      setOpenEdit(false);
      setEditRow(null);
      await load();
    } catch (e) {
      console.error(e);
      alert(e?.message || "Saqlash xatosi");
    }
  }

  // Delete
  async function onDelete(row) {
    if (!confirm(`O‘chirishni tasdiqlang (ID: ${row.id})`)) return;
    try {
      // api.js wrapper ishlatilyapti
      await api.deleteDrop(row.id);
      // optimistik yangilash
      setRows((prev) => prev.filter((x) => x.id !== row.id));
    } catch (e) {
      console.error(e);
      alert(e?.message || "O‘chirish xatosi");
    }
  }

  // CSV import
  async function onImportCSV(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // bir xil faylni qayta tanlash uchun reset
    if (!file) return;
    if (!/\.csv$/i.test(file.name)) {
      alert("Faqat .csv fayl");
      return;
    }
    try {
      const data = await api.importDropsCsv(file);
      // backend turlicha maydon qaytarishi mumkin
      const inserted = data?.inserted ?? data?.insertedCount ?? 0;
      alert(`Import OK: ${inserted} qator`);
      await load();
    } catch (e) {
      console.error(e);
      alert(e?.message || "Import xatosi");
    }
  }

  // CSV export (faqat kerakli ustunlar)
  function onExportCSV() {
    const out = filtered.map((r) => ({
      card_number: r.card_number ?? "",
      balance: r.balance ?? "",
      blocked_at: date10(r.blocked_at),
      comment: (r.comment ?? "").replace(/\r?\n/g, " "),
    }));
    const csv = toCSV(out, ["card_number", "balance", "blocked_at", "comment"]);
    downloadText(csv, "drops.csv", "text/csv;charset=utf-8;");
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" mb={2}>
        Drop kartalar
      </Typography>

      {/* Toolbar */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems="center"
          >
            <TextField
              size="small"
              placeholder="Qidiruv"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <Stack direction="row" spacing={1}>
              <TextField
                size="small"
                type="date"
                label="Boshlanish"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                size="small"
                type="date"
                label="Tugash"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FileUploadIcon />}
              component="label"
            >
              CSV import
              <input type="file" hidden accept=".csv" onChange={onImportCSV} />
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FileDownloadIcon />}
              onClick={onExportCSV}
            >
              CSV export
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={openAddModal}
            >
              Yangi qo‘shish
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Jadval */}
      <Paper sx={{ width: "100%", height: 560 }}>
        <DataGrid
          rows={filtered}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.id}
          disableRowSelectionOnClick
          pageSizeOptions={[25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 50, page: 0 } },
          }}
        />
      </Paper>

      {/* Comment view modal */}
      <Dialog
        open={openView}
        onClose={() => setOpenView(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Izoh</DialogTitle>
        <DialogContent dividers>
          <Typography whiteSpace="pre-wrap">{viewComment || "—"}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenView(false)}>Yopish</Button>
        </DialogActions>
      </Dialog>

      {/* Add modal */}
      <Dialog
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Yangi drop karta</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Karta (to‘liq)"
              size="small"
              value={addForm.card_number}
              onChange={(e) =>
                setAddForm((s) => ({ ...s, card_number: e.target.value }))
              }
              required
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Blok sana"
                size="small"
                type="date"
                value={addForm.blocked_at}
                onChange={(e) =>
                  setAddForm((s) => ({ ...s, blocked_at: e.target.value }))
                }
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Qoldiq"
                size="small"
                type="number"
                value={addForm.balance}
                onChange={(e) =>
                  setAddForm((s) => ({ ...s, balance: e.target.value }))
                }
              />
            </Stack>
            <TextField
              label="Izoh"
              size="small"
              multiline
              minRows={2}
              value={addForm.comment}
              onChange={(e) =>
                setAddForm((s) => ({ ...s, comment: e.target.value }))
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>Bekor qilish</Button>
          <Button variant="contained" onClick={onAddSave}>
            Saqlash
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit modal */}
      <Dialog
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Drop kartani tahrirlash</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Blok sana"
              size="small"
              type="date"
              value={editForm.blocked_at}
              onChange={(e) =>
                setEditForm((s) => ({ ...s, blocked_at: e.target.value }))
              }
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Qoldiq"
              size="small"
              type="number"
              value={editForm.balance}
              onChange={(e) =>
                setEditForm((s) => ({ ...s, balance: e.target.value }))
              }
            />
            <TextField
              label="Izoh"
              size="small"
              multiline
              minRows={2}
              value={editForm.comment}
              onChange={(e) =>
                setEditForm((s) => ({ ...s, comment: e.target.value }))
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Bekor qilish</Button>
          <Button variant="contained" onClick={onEditSave}>
            Saqlash
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

/* -------------------- yordamchi funksiyalar -------------------- */

function getToken() {
  try {
    const auth = JSON.parse(localStorage.getItem("auth"));
    if (auth?.token) return auth.token;
  } catch {}
  return localStorage.getItem("token") || "";
}

function authHeader(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function toCSV(rows, headersOrder) {
  const esc = (s) => {
    const v = (s ?? "").toString();
    return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  };
  const header = headersOrder.join(",");
  const lines = rows.map((r) => headersOrder.map((h) => esc(r[h])).join(","));
  return [header, ...lines].join("\n");
}

function downloadText(text, filename, mime = "text/plain;charset=utf-8;") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
