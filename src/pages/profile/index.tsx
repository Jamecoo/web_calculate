import { useRef, useState } from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  TextField,
  Button,
  Avatar,
  IconButton,
  Chip,
  Divider,
  CircularProgress,
} from "@mui/material";
import {
  PhotoCamera as PhotoCameraIcon,
  Save as SaveIcon,
  AdminPanelSettings as AdminIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import Swal from "sweetalert2";
import useAuth from "../../context/auth";
import { uploadAvatar, updateUserProfile } from "../../services/auth.services";
import { STORAGE_ENABLED } from "../../constants/features";

export const ProfilePage = () => {
  const { user, isAdmin, refreshUser } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const currentPhoto = photoPreview || user?.photoURL || undefined;
  const initial = (user?.displayName || user?.email || "?")
    .charAt(0)
    .toUpperCase();

  const handlePickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      Swal.fire({
        icon: "error",
        title: "ຂໍ້ຜິດພາດ",
        text: "ກະລຸນາເລືອກໄຟລ໌ຮູບພາບ",
        confirmButtonText: "ຕົກລົງ",
      });
      return;
    }
    // 5 MB guard
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: "error",
        title: "ຂໍ້ຜິດພາດ",
        text: "ຮູບພາບຕ້ອງນ້ອຍກວ່າ 5MB",
        confirmButtonText: "ຕົກລົງ",
      });
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const hasChanges =
    displayName.trim() !== (user?.displayName ?? "") || photoFile !== null;

  const handleSave = async () => {
    if (!user) return;
    if (!displayName.trim()) {
      Swal.fire({
        icon: "warning",
        title: "ແຈ້ງເຕືອນ",
        text: "ກະລຸນາປ້ອນຊື່",
        confirmButtonText: "ຕົກລົງ",
      });
      return;
    }

    setSaving(true);
    try {
      let photoURL = user.photoURL ?? undefined;
      if (photoFile) {
        photoURL = await uploadAvatar(user.uid, photoFile);
      }

      await updateUserProfile({
        displayName: displayName.trim(),
        photoURL,
      });
      await refreshUser();

      setPhotoFile(null);
      setPhotoPreview(null);

      await Swal.fire({
        icon: "success",
        title: "ສຳເລັດ",
        text: "ອັບເດດຂໍ້ມູນສ່ວນຕົວສຳເລັດແລ້ວ",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Error updating profile:", err);
      await Swal.fire({
        icon: "error",
        title: "ຂໍ້ຜິດພາດ",
        text: "ບໍ່ສາມາດອັບເດດຂໍ້ມູນໄດ້",
        confirmButtonText: "ຕົກລົງ",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 640, mx: "auto", py: 4 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ fontWeight: "bold", mb: 4, textAlign: "center" }}
      >
        👤 ຂໍ້ມູນສ່ວນຕົວ
      </Typography>

      <Paper elevation={0} sx={{ p: { xs: 3, sm: 4 }, borderRadius: 4, border: "1px solid", borderColor: "divider" }}>
        <Stack spacing={3} alignItems="center">
          <Box sx={{ position: "relative" }}>
            <Avatar
              src={currentPhoto}
              sx={{ width: 110, height: 110, bgcolor: "primary.main", fontSize: 44 }}
            >
              {initial}
            </Avatar>
            {STORAGE_ENABLED && (
              <>
                <IconButton
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    position: "absolute",
                    right: -4,
                    bottom: -4,
                    bgcolor: "primary.main",
                    color: "white",
                    "&:hover": { bgcolor: "primary.dark" },
                  }}
                  size="small"
                >
                  <PhotoCameraIcon fontSize="small" />
                </IconButton>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handlePickPhoto}
                />
              </>
            )}
          </Box>

          <Chip
            color={isAdmin ? "secondary" : "default"}
            icon={isAdmin ? <AdminIcon /> : <PersonIcon />}
            label={isAdmin ? "Admin" : "User"}
          />

          <Divider flexItem />

          <TextField
            label="ຊື່ທີ່ສະແດງ"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            fullWidth
            placeholder="ປ້ອນຊື່ຂອງທ່ານ"
            helperText="ຊື່ນີ້ຈະສະແດງແທນອີເມວໃນເມນູ ແລະ ປະຫວັດ"
          />

          <TextField
            label="ອີເມວ"
            value={user?.email ?? ""}
            fullWidth
            disabled
          />

          <Button
            variant="contained"
            size="large"
            fullWidth
            startIcon={
              saving ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <SaveIcon />
              )
            }
            disabled={saving || !hasChanges}
            onClick={handleSave}
          >
            ບັນທຶກ
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default ProfilePage;
