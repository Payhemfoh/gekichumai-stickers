import { HexColorPicker } from "react-colorful";import React, { useState, useRef } from "react";
import Button from "@mui/material/Button";
import Popover from "@mui/material/Popover";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";

interface Props {
  value: string;
  onChange: (hex: string) => void;
  label?: string;
  size?: "small" | "medium";
}

export default function ColorPicker({ value, onChange, label, size = "small" }: Props) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement | null>(null);

  return (
    <>
      <Button
        ref={anchorRef}
        onClick={() => setOpen(true)}
        size={size}
        variant="outlined"
        endIcon={
          <span
            style={{
              display: "inline-block",
              width: 18,
              height: 18,
              background: value || "#000",
              border: "1px solid rgba(0,0,0,0.2)",
              borderRadius: 3,
            }}
          />
        }
      >
        {label ?? "Color"}
      </Button>

      <Popover
        open={open}
        anchorEl={anchorRef.current}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <Box sx={{ p: 2, display: "flex", gap: 2, alignItems: "center", maxWidth: 320 }}>
          <Box>
            <HexColorPicker color={value || "#000000"} onChange={(c) => onChange(c)} />
          </Box>
          <Box sx={{ minWidth: 120 }}>
            <TextField
              label="Hex"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              size="small"
              fullWidth
            />
            <Button sx={{ mt: 1 }} variant="contained" onClick={() => setOpen(false)}>
              OK
            </Button>
          </Box>
        </Box>
      </Popover>
    </>
  );
}