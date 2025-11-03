// src/pages/Appeals.jsx
import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { exportToCSV } from "../utils/csv";
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
  IconButton,
  InputAdornment,
  MenuItem,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import SearchIcon from "@mui/icons-material/Search";

const COLS = [
  { key: "id", label: "ID", width: 80 },
  { key: "applicant_name", label: "Murojaatchi", width: 180 },
  { key: "address", label: "Manzil", width: 200 },
  { key: "phone", label: "Tel", width: 140 },
  { key: "source_org", label: "Tashkilot", width: 180 },
  { key: "source_system", label: "Tizim", width: 140 },
  { key: "subject", label: "Predmet", width: 200 },
  { key: "direction", label: "Yo‘nalish", width: 160 },
  { key: "client_code", label: "Mijoz kodi", width: 130 },
  { key: "card", label: "Karta", width: 160 },
  { key: "appeal_date", label: "Sana", width: 120, type: "date" },
  { key: "damage_amount", label: "Zarar", width: 120 },
  { key: "comment", label: "Izoh", width: 220 },
  { key: "creator_username", label: "Kim kiritdi", width: 130 },
  { key: "created_at", label: "Yaratilgan", width: 140, type: "date" },
  { key: "updated_by_username", label: "Yangilagan", width: 140 },
  { key: "updated_at", label: "Yangilangan", width: 140, type: "date" },
];

const ORG_OPTIONS = [
  "Markaziy bank",
  "Tijorat banklari",
  "Portal",
  "Vazirliklar",
  "O'zsanoatqurilishbank",
  "Boshqa",
];

const DIRECTION_OPTIONS = ["Karta", "Kredit", "Depozit", "Boshqa"];

const d10 = (v) => (v || "").toString().slice(0, 10);
const lc = (v) => (v ?? "").toString().toLowerCase();

export default function Appeals() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // toolbar filters
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // comment view
  const [openView, setOpenView] = useState(false);
  const [viewComment, setViewComment] = useState("");

  // add modal
  const [openAdd, setOpenAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    applicant_name: "",
    address: "",
    phone: "",
    source_org: "",
    source_system: "",
    subject: "",
    direction: "",
    client_code: "",
    card: "",
    appeal_date: new Date().toISOString().slice(0, 10),
    damage_amount: "",
    comment: "",
  });

  // edit modal
  const [openEdit, setOpenEdit] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [editForm, setEditForm] = useState({
    applicant_name: "",
    address: "",
    phone: "",
    source_org: "",
    source_system: "",
    subject: "",
    direction: "",
    client_code: "",
    card: "",
    appeal_date: "",
    damage_amount: "",
    comment: "",
  });

  useEffect(() => {
    load();
  }, []);
  async function load() {
    setLoading(true);
    try {
      const res = await api.listAppeals("", 1, 200);
      setRows(res.rows || []);
    } catch (e) {
      alert(e.message || "Yuklash xatosi");
    } finally {
      setLoading(false);
    }
  }

  const columns = useMemo(
    () => [
      ...COLS.map((c) => ({
        field: c.key,
        headerName: c.label,
        width: c.width,
      })),
      {
        field: "__actions",
        headerName: "Amal",
        width: 140,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Stack direction="row" spacing={1}>
            <IconButton size="small" onClick={() => onViewComment(params.row)}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => onEdit(params.row)}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={() => onDelete(params.row)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Stack>
        ),
      },
    ],
    []
  );

  // front filtering
  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (q) {
        const hit = COLS.some((c) => lc(r[c.key]).includes(lc(q)));
        if (!hit) return false;
      }
      const d = d10(r.appeal_date);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [rows, q, from, to]);

  // comment view handlers
  function onViewComment(row) {
    setViewComment(row.comment || "");
    setOpenView(true);
  }

  // add
  function openAddModal() {
    setAddForm({
      applicant_name: "",
      address: "",
      phone: "",
      source_org: "",
      source_system: "",
      subject: "",
      direction: "",
      client_code: "",
      card: "",
      appeal_date: new Date().toISOString().slice(0, 10),
      damage_amount: "",
      comment: "",
    });
    setOpenAdd(true);
  }
  async function onAddSave() {
    try {
      await api.createAppeal({
        applicant_name: addForm.applicant_name,
        address: addForm.address || null,
        phone: addForm.phone || null,
        source_org: addForm.source_org || null,
        source_system: addForm.source_system || null,
        subject: addForm.subject || null,
        direction: addForm.direction || null,
        client_code: addForm.client_code || null,
        card: addForm.card || null,
        appeal_date: addForm.appeal_date,
        damage_amount:
          addForm.damage_amount === "" ? null : Number(addForm.damage_amount),
        comment: addForm.comment || null,
      });
      setOpenAdd(false);
      await load();
    } catch (e) {
      alert(e.message || "Saqlash xatosi");
    }
  }

  // edit
  function onEdit(row) {
    setEditRow(row);
    setEditForm({
      applicant_name: row.applicant_name || "",
      address: row.address || "",
      phone: row.phone || "",
      source_org: row.source_org || "",
      source_system: row.source_system || "",
      subject: row.subject || "",
      direction: row.direction || "",
      client_code: row.client_code || "",
      card: row.card || "",
      appeal_date: d10(row.appeal_date),
      damage_amount: row.damage_amount ?? "",
      comment: row.comment || "",
    });
    setOpenEdit(true);
  }
  async function onEditSave() {
    if (!editRow) return;
    try {
      const patch = {
        applicant_name: editForm.applicant_name || null,
        address: editForm.address || null,
        phone: editForm.phone || null,
        source_org: editForm.source_org || null,
        source_system: editForm.source_system || null,
        subject: editForm.subject || null,
        direction: editForm.direction || null,
        client_code: editForm.client_code || null,
        card: editForm.card || null,
        appeal_date: editForm.appeal_date || null,
        damage_amount:
          editForm.damage_amount === "" ? null : Number(editForm.damage_amount),
        comment: editForm.comment || null,
      };
      await api.updateAppeal(editRow.id, patch);
      setOpenEdit(false);
      setEditRow(null);
      await load();
    } catch (e) {
      alert(e.message || "Saqlash xatosi");
    }
  }

  // delete
  async function onDelete(row) {
    if (!confirm(`O‘chirishni tasdiqlang (ID: ${row.id})`)) return;
    try {
      await api.deleteAppeal(row.id);
      setRows((prev) => prev.filter((x) => x.id !== row.id));
    } catch (e) {
      alert(e.message || "O‘chirish xatosi");
    }
  }

  // import
  async function onImportCSV(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!/\.csv$/i.test(file.name)) {
      alert("Faqat .csv fayl");
      return;
    }
    try {
      const { inserted } = await api.importAppealsCsv(file);
      alert(`Import OK: ${inserted} qator`);
      await load();
    } catch (err) {
      alert(err.message || "Import xatosi");
    }
  }

  // export
  function onExportCSV() {
    const out = filtered.map((r) => {
      const o = {};
      for (const c of COLS)
        o[c.key] = c.type === "date" ? d10(r[c.key]) : r[c.key];
      return o;
    });
    exportToCSV(out, "appeals.csv");
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" mb={2}>
        Murojaatlar
      </Typography>

      {/* toolbar */}
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
              onClick={() => openAddModal()}
            >
              Yangi qo‘shish
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* grid */}
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

      {/* comment view */}
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

      {/* add modal */}
      <Dialog
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Yangi murojaat</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} mt={1}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Murojaatchi"
                size="small"
                fullWidth
                required
                value={addForm.applicant_name}
                onChange={(e) =>
                  setAddForm((s) => ({ ...s, applicant_name: e.target.value }))
                }
              />
              <TextField
                label="Tel"
                size="small"
                fullWidth
                value={addForm.phone}
                onChange={(e) =>
                  setAddForm((s) => ({ ...s, phone: e.target.value }))
                }
              />
            </Stack>
            <TextField
              label="Manzil"
              size="small"
              fullWidth
              value={addForm.address}
              onChange={(e) =>
                setAddForm((s) => ({ ...s, address: e.target.value }))
              }
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Tashkilot"
                size="small"
                fullWidth
                select
                value={addForm.source_org}
                onChange={(e) =>
                  setAddForm((s) => ({ ...s, source_org: e.target.value }))
                }
              >
                {ORG_OPTIONS.map((opt) => (
                  <MenuItem key={opt} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Tizim"
                size="small"
                fullWidth
                value={addForm.source_system}
                onChange={(e) =>
                  setAddForm((s) => ({ ...s, source_system: e.target.value }))
                }
              />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Predmet"
                size="small"
                fullWidth
                value={addForm.subject}
                onChange={(e) =>
                  setAddForm((s) => ({ ...s, subject: e.target.value }))
                }
              />
              <TextField
                label="Yo‘nalish"
                size="small"
                fullWidth
                select
                value={addForm.direction}
                onChange={(e) =>
                  setAddForm((s) => ({ ...s, direction: e.target.value }))
                }
              >
                {DIRECTION_OPTIONS.map((opt) => (
                  <MenuItem key={opt} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Mijoz kodi"
                size="small"
                fullWidth
                value={addForm.client_code}
                onChange={(e) =>
                  setAddForm((s) => ({ ...s, client_code: e.target.value }))
                }
              />
              <TextField
                label="Karta"
                size="small"
                fullWidth
                value={addForm.card}
                onChange={(e) =>
                  setAddForm((s) => ({ ...s, card: e.target.value }))
                }
              />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Sana"
                size="small"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={addForm.appeal_date}
                onChange={(e) =>
                  setAddForm((s) => ({ ...s, appeal_date: e.target.value }))
                }
              />
              <TextField
                label="Zarar"
                size="small"
                type="number"
                value={addForm.damage_amount}
                onChange={(e) =>
                  setAddForm((s) => ({ ...s, damage_amount: e.target.value }))
                }
              />
            </Stack>
            <TextField
              label="Izoh"
              size="small"
              fullWidth
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
          <Button onClick={() => setOpenAdd(false)}>Bekor</Button>
          <Button variant="contained" onClick={onAddSave}>
            Saqlash
          </Button>
        </DialogActions>
      </Dialog>

      {/* edit modal */}
      <Dialog
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Murojaatni tahrirlash</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} mt={1}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Murojaatchi"
                size="small"
                fullWidth
                required
                value={editForm.applicant_name}
                onChange={(e) =>
                  setEditForm((s) => ({ ...s, applicant_name: e.target.value }))
                }
              />
              <TextField
                label="Tel"
                size="small"
                fullWidth
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm((s) => ({ ...s, phone: e.target.value }))
                }
              />
            </Stack>
            <TextField
              label="Manzil"
              size="small"
              fullWidth
              value={editForm.address}
              onChange={(e) =>
                setEditForm((s) => ({ ...s, address: e.target.value }))
              }
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Tashkilot"
                size="small"
                fullWidth
                select
                value={editForm.source_org}
                onChange={(e) =>
                  setEditForm((s) => ({ ...s, source_org: e.target.value }))
                }
              >
                {ORG_OPTIONS.map((opt) => (
                  <MenuItem key={opt} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Tizim"
                size="small"
                fullWidth
                value={editForm.source_system}
                onChange={(e) =>
                  setEditForm((s) => ({ ...s, source_system: e.target.value }))
                }
              />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Predmet"
                size="small"
                fullWidth
                value={editForm.subject}
                onChange={(e) =>
                  setEditForm((s) => ({ ...s, subject: e.target.value }))
                }
              />
              <TextField
                label="Yo‘nalish"
                size="small"
                fullWidth
                select
                value={editForm.direction}
                onChange={(e) =>
                  setEditForm((s) => ({ ...s, direction: e.target.value }))
                }
              >
                {DIRECTION_OPTIONS.map((opt) => (
                  <MenuItem key={opt} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Mijoz kodi"
                size="small"
                fullWidth
                value={editForm.client_code}
                onChange={(e) =>
                  setEditForm((s) => ({ ...s, client_code: e.target.value }))
                }
              />
              <TextField
                label="Karta"
                size="small"
                fullWidth
                value={editForm.card}
                onChange={(e) =>
                  setEditForm((s) => ({ ...s, card: e.target.value }))
                }
              />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Sana"
                size="small"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={editForm.appeal_date}
                onChange={(e) =>
                  setEditForm((s) => ({ ...s, appeal_date: e.target.value }))
                }
              />
              <TextField
                label="Zarar"
                size="small"
                type="number"
                value={editForm.damage_amount}
                onChange={(e) =>
                  setEditForm((s) => ({ ...s, damage_amount: e.target.value }))
                }
              />
            </Stack>
            <TextField
              label="Izoh"
              size="small"
              fullWidth
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
          <Button onClick={() => setOpenEdit(false)}>Bekor</Button>
          <Button variant="contained" onClick={onEditSave}>
            Saqlash
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
