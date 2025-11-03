// src/pages/Users.jsx
import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Modal,
  TextField,
  Paper,
  Typography,
  Grid,
  IconButton,
  Stack,
  Alert,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { api } from "../api";

export default function Users() {
  const [rows, setRows] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ username: "", password: "" });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const columns = [
    { field: "id", headerName: "ID", width: 90 },
    { field: "username", headerName: "Username", width: 200 },
    {
      field: "is_admin",
      headerName: "Admin",
      width: 130,
      valueFormatter: (params) => (Boolean(params) ? "Ha" : "Yo'q"),
    },
    {
      field: "actions",
      headerName: "Amallar",
      width: 100,
      renderCell: (params) =>
        !params.row.is_admin && (
          <IconButton
            onClick={() => del(params.row.id)}
            color="error"
            size="small"
          >
            <DeleteIcon />
          </IconButton>
        ),
    },
  ];

  const modalStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    bgcolor: "background.paper",
    boxShadow: 24,
    p: 4,
    borderRadius: 2,
  };

  async function load() {
    setLoading(true);
    setMsg("");
    try {
      const response = await fetch("http://localhost:3000/api/users", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      console.log("Fetched users:", data); // Debug log
      setRows(Array.isArray(data) ? data : []); // Handle array response directly
    } catch (e) {
      console.error("Error loading users:", e);
      setMsg(e.message || "Error loading users");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function add(e) {
    e.preventDefault();
    setMsg("");
    try {
      await api.createUser(form);
      setForm({ username: "", password: "" });
      await load();
    } catch (e) {
      setMsg(e.message);
    }
  }

  async function del(id) {
    if (!confirm("Userni o‘chirishni xohlaysizmi?")) return;
    try {
      await api.deleteUser(id);
      await load();
    } catch (e) {
      setMsg(e.message);
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5">Foydalanuvchilar</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowModal(true)}
        >
          Yangi qo'shish
        </Button>
      </Stack>

      {msg && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {msg}
        </Alert>
      )}

      <Paper sx={{ width: "100%", mb: 2, height: 400 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          loading={loading}
          getRowId={(row) => row.id}
          autoHeight // Add this prop
          sx={{
            "& .MuiDataGrid-cell:focus": {
              outline: "none",
            },
          }}
        />
      </Paper>

      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <Box sx={modalStyle}>
          <Typography variant="h6" mb={3}>
            Yangi foydalanuvchi qo'shish
          </Typography>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              add(e);
              setShowModal(false);
            }}
          >
            <Grid container spacing={2}>
              <Grid xs={12}>
                <TextField
                  fullWidth
                  label="Username"
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                  required
                />
              </Grid>
              <Grid xs={12}>
                <TextField
                  fullWidth
                  type="password"
                  label="Parol"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required
                />
              </Grid>
            </Grid>
            <Box
              sx={{
                mt: 3,
                display: "flex",
                justifyContent: "flex-end",
                gap: 2,
              }}
            >
              <Button onClick={() => setShowModal(false)}>Bekor qilish</Button>
              <Button type="submit" variant="contained">
                Saqlash
              </Button>
            </Box>
          </form>
        </Box>
      </Modal>
    </Box>
  );
}
