import { useEffect, useState } from "react";
import { Button, Snackbar, Alert, IconButton } from "@mui/material";
import {
  InstallMobile as InstallIcon,
  Close as CloseIcon,
} from "@mui/icons-material";

// Chrome/Edge/Samsung fire `beforeinstallprompt` when the app qualifies for
// installation; holding on to that event lets us offer it inside the app rather
// than relying on people finding "Add to home screen" in a browser menu.
// Safari/iOS never fires it — there, the browser's own Share > Add to Home
// Screen is the only route, so we simply stay quiet.

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "splitzy.installPromptDismissed";

export const InstallPrompt = () => {
  const [promptEvent, setPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const alreadyInstalled = window.matchMedia(
      "(display-mode: standalone)"
    ).matches;
    if (alreadyInstalled) return;
    try {
      if (localStorage.getItem(DISMISSED_KEY)) return;
    } catch {
      // Blocked storage: fall through and offer the install anyway.
    }

    const onPrompt = (e: Event) => {
      e.preventDefault(); // stop the browser's own mini-infobar
      setPromptEvent(e as BeforeInstallPromptEvent);
      setOpen(true);
    };
    const onInstalled = () => {
      setOpen(false);
      setPromptEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!promptEvent) return;
    setOpen(false);
    await promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
  };

  const handleDismiss = () => {
    setOpen(false);
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Private mode / blocked storage: just close it for this session.
    }
  };

  if (!promptEvent) return null;

  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      sx={{ mb: { xs: 1, sm: 2 } }}
    >
      <Alert
        severity="info"
        icon={<InstallIcon />}
        sx={{ width: "100%", alignItems: "center", borderRadius: 3 }}
        action={
          <>
            <Button color="inherit" size="small" onClick={handleInstall}>
              ຕິດຕັ້ງ
            </Button>
            <IconButton size="small" color="inherit" onClick={handleDismiss}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </>
        }
      >
        ຕິດຕັ້ງ Splitzy ໄວ້ໜ້າຈໍ ໃຊ້ໄດ້ໄວ ແລະ ເປີດແບບອອບໄລນ໌ໄດ້
      </Alert>
    </Snackbar>
  );
};

export default InstallPrompt;
