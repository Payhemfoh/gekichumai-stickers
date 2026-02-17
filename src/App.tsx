import SSFangTangTi from "./fonts/ShangShouFangTangTi.woff2";
import "./App.css";
import Canvas from "./components/Canvas";
import { useState, useEffect, useRef } from "react";
import Slider from "@mui/material/Slider";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Switch from "@mui/material/Switch";
import Snackbar from "@mui/material/Snackbar";
import Picker from "./components/Picker";
import Info from "./components/Info";
import getConfiguration from "./utils/config";
import log from "./utils/log";
import { preloadFont, categories } from "./utils/preload";
import { SubtitleParameter } from "./models/SubtitleParameter";
import type { Character } from "./models/Character";

const ClipboardItem = (window as any).ClipboardItem;

function App() {
  const [config, setConfig] = useState<any | null>(null);

  // using this to trigger the useEffect because lazy to think of a better way
  const [rand, setRand] = useState<number>(0);
  useEffect(() => {
    async function doGetConfiguration() {
      try {
        const res = await getConfiguration();
        setConfig(res);
      } catch (error) {
        console.log(error);
      }
    }
    doGetConfiguration();
  }, [rand]);

  useEffect(() => {
    async function doPreloadFont() {
      const controller = new AbortController();
      try {
        await preloadFont("SSFangTangTi", SSFangTangTi, controller.signal);
      } catch (error) {
        console.error(error);
      } finally {
        return () => {
          controller.abort();
        };
      }
    }
    doPreloadFont();
  }, []);

  const [infoOpen, setInfoOpen] = useState<boolean>(false);
  const handleClickOpen = () => {
    setInfoOpen(true);
  };
  const handleClose = () => {
    setInfoOpen(false);
  };

  const [openCopySnackbar, setOpenCopySnackbar] = useState<boolean>(false);
  const handleSnackClose = (_e?: React.SyntheticEvent | Event, _r?: string) => {
    setOpenCopySnackbar(false);
  };

  const [categoryIndex, setSelectedCategory] = useState<number>(0);
  const [characterIndex, setSelectedCharacter] = useState<number>(0);
  const [selectedCharacter, setCharacter] = useState<Character | null>(
    categories && categories.length > 0 && categories[0].characters.length > 0
      ? categories[0].characters[0]
      : null
  );

  const [subtitle, setSubtitle] = useState<SubtitleParameter>(
    selectedCharacter
      ? new SubtitleParameter(
          selectedCharacter.defaultParam.text,
          selectedCharacter.defaultParam.x,
          selectedCharacter.defaultParam.y,
          selectedCharacter.defaultParam.r,
          selectedCharacter.defaultParam.s,
          selectedCharacter.defaultParam.spaceSize ?? 50
        )
      : new SubtitleParameter("", 0, 0, 0, 16, 50)
  );

  // spacing is now part of SubtitleParameter
  const [curve, setCurve] = useState<boolean>(false);
  const [loaded, setLoaded] = useState<boolean>(false);
  const imgRef = useRef<HTMLImageElement>(new Image());

  useEffect(() => {
    if (selectedCharacter) {
      setSubtitle(selectedCharacter.defaultParam);
      setLoaded(false);
    }
  }, [selectedCharacter]);

  useEffect(() => {
    if (
      categoryIndex < 0 ||
      categoryIndex >= categories.length ||
      characterIndex < 0 ||
      characterIndex >= categories[categoryIndex].characters.length
    )
      return;

    setCharacter(categories[categoryIndex].characters[characterIndex]);
  }, [categoryIndex, characterIndex]);

  // update image src whenever selectedCharacter changes
  useEffect(() => {
    const img = imgRef.current;
    if (!selectedCharacter) return;
    img.src = "/img/" + (selectedCharacter.imgPath ?? "");
    img.onload = () => setLoaded(true);
  }, [selectedCharacter]);

  const draw = (ctx: CanvasRenderingContext2D) => {
    ctx.canvas.width = 296;
    ctx.canvas.height = 256;

    const img = imgRef.current;

    if (loaded && document.fonts.check("12px YurukaStd") && img.width) {
      const hRatio = ctx.canvas.width / img.width;
      const vRatio = ctx.canvas.height / img.height;
      const ratio = Math.min(hRatio, vRatio);
      const centerShiftX = (ctx.canvas.width - img.width * ratio) / 2;
      const centerShiftY = (ctx.canvas.height - img.height * ratio) / 2;
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.drawImage(
        img,
        0,
        0,
        img.width,
        img.height,
        centerShiftX,
        centerShiftY,
        img.width * ratio,
        img.height * ratio
      );
      const fontSize = subtitle.s;
      const rotate = subtitle.r;
      const text = subtitle.text || "";

      ctx.font = `${fontSize}px YurukaStd, SSFangTangTi`;
      ctx.miterLimit = 2.5;
      ctx.save();

  ctx.translate(subtitle.x ?? 0, subtitle.y ?? 0);
      ctx.rotate((rotate as number) / 10);
  ctx.textAlign = "center";
  if (!selectedCharacter) return;
  ctx.fillStyle = selectedCharacter.fillColor ?? "black";
      const lines = text.split("\n");
      if (curve) {
        ctx.save();
        for (let line of lines) {
          const lineAngle = (Math.PI * line.length) / 7;
          for (let pass = 0; pass < 2; pass++) {
            ctx.save();
            for (let i = 0; i < line.length; i++) {
              ctx.rotate(lineAngle / line.length / 2.2);
              ctx.save();
              ctx.translate(0, -1 * fontSize * 3.5);
              if (pass === 0) {
                ctx.strokeStyle = "white";
                ctx.lineWidth = 15;
                ctx.strokeText(line[i], 0, 0);
                } else {
                ctx.strokeStyle = selectedCharacter.strokeColor;
                ctx.lineWidth = 5;
                ctx.strokeText(line[i], 0, 0);
                ctx.fillText(line[i], 0, 0);
              }
              ctx.restore();
            }
            ctx.restore();
          }
            ctx.translate(0, ((subtitle.spaceSize - 50) / 50 + 1) * fontSize);
        }
        ctx.restore();
      } else {
        // Draw per-character so spacing between characters can be controlled
        // Use substring measurements (ctx.measureText on substrings) which respects kerning
        const letterSpacing = ((subtitle.spaceSize - 50) / 50) * (fontSize * 0.15);
        for (let pass = 0; pass < 2; pass++) {
          for (let i = 0, k = 0; i < lines.length; i++) {
            const line = lines[i];
            const rawLineWidth = ctx.measureText(line).width;
            const totalWidth = rawLineWidth + Math.max(0, line.length - 1) * letterSpacing;
            // center start
            const startX = -totalWidth / 2;

            for (let ci = 0; ci < line.length; ci++) {
              const ch = line[ci];
              // cumulative width of substring before this char (kerning-aware)
              const before = ci > 0 ? ctx.measureText(line.substring(0, ci)).width : 0;
              const chWidth = ctx.measureText(ch).width;
              // center of this glyph
              const cx = startX + before + ci * letterSpacing + chWidth / 2;

              if (pass === 0) {
                ctx.strokeStyle = "white";
                ctx.lineWidth = 15;
                ctx.strokeText(ch, cx, k);
              } else {
                ctx.strokeStyle = selectedCharacter?.strokeColor ?? "black";
                ctx.lineWidth = 5;
                ctx.strokeText(ch, cx, k);
                ctx.fillText(ch, cx, k);
              }
            }

            k += ((subtitle.spaceSize - 50) / 50 + 1) * fontSize;
          }
        }

        ctx.restore();
      }
    }
  };

  const download = async () => {
  if (!selectedCharacter) return;
  const canvas = document.getElementsByTagName("canvas")[0];
    const link = document.createElement("a");
    link.download = `${selectedCharacter.name}_gekichumai_sticker_maker.png`;
    link.href = canvas.toDataURL();
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    await log(selectedCharacter.id, selectedCharacter.name, "download");
    setRand(rand + 1);
  };

  function b64toBlob(b64Data: string, contentType = "image/png", sliceSize = 512): Blob {
    const byteCharacters = atob(b64Data);
    const byteArrays: Uint8Array[] = [];
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array<number>(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
  const parts = byteArrays.map((u) => u.buffer as unknown as ArrayBuffer);
  return new Blob(parts, { type: contentType });
  }

  const copy = async () => {
    const canvas = document.getElementsByTagName("canvas")[0];
      if (!selectedCharacter) return;
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": b64toBlob(canvas.toDataURL().split(",")[1]),
        }),
      ]);
    setOpenCopySnackbar(true);
    await log(selectedCharacter.id, selectedCharacter.name, "copy");
    setRand(rand + 1);
  };

  const handleSetCategory = (categoryName: string) => {
    const idx = categories.findIndex((c) => c.name === categoryName);
    if (idx >= 0) setSelectedCategory(idx);
  };

  return (
    <div className="App">
      <Info open={infoOpen} handleClose={handleClose} config={config} />
      <div className="counter">
        Total Stickers you made: {config?.total || "Not available"}
      </div>
      <div className="container">
        <div className="vertical">
          <div className="canvas">
            <Canvas draw={draw} />
          </div>
          <Slider
            value={curve ? 256 - subtitle.y + subtitle.s * 3 : 256 - subtitle.y}
            onChange={(_e, v) =>
              setSubtitle(subtitle.update({ y: curve ? 256 + subtitle.s * 3 - (v as number) : 256 - (v as number) }))
            }
            min={0}
            max={256}
            step={1}
            orientation="vertical"
            track={false}
            color="secondary"
          />
        </div>
        <div className="horizontal">
          <Slider
            className="slider-horizontal"
            value={subtitle.x}
            onChange={(_e, v) => setSubtitle(subtitle.update({ x: v as number }))}
            min={0}
            max={296}
            step={1}
            track={false}
            color="secondary"
          />
          <div className="settings">
            <div>
              <label>Rotate: </label>
              <Slider
                value={subtitle.r}
                onChange={(_e, v) => setSubtitle(subtitle.update({ r: v as number }))}
                min={-31.5}
                max={31.5}
                step={0.1}
                track={false}
                color="secondary"
              />
            </div>
            <div>
              <label>
                <span style={{ whiteSpace: "nowrap" }}>Font size: </span>
              </label>
              <Slider
                value={subtitle.s}
                onChange={(_e, v) => setSubtitle(subtitle.update({ s: v as number }))}
                min={10}
                max={100}
                step={1}
                track={false}
                color="secondary"
              />
            </div>
            <div>
              <label>
                <span style={{ whiteSpace: "nowrap" }}>Spacing: </span>
              </label>
              <Slider
                value={subtitle.spaceSize}
                onChange={(_e, v) => setSubtitle(subtitle.update({ spaceSize: v as number }))}
                min={0}
                max={100}
                step={1}
                track={false}
                color="secondary"
              />
            </div>
            <div>
              <label>Curve (Beta): </label>
              <Switch
                checked={curve}
                onChange={(e) => setCurve(e.target.checked)}
                color="secondary"
              />
            </div>
          </div>
          <div className="text">
            <TextField
              label="Text"
              size="small"
              color="secondary"
              value={subtitle.text}
              multiline={true}
              fullWidth
              onChange={(e) => setSubtitle(subtitle.update({ text: e.target.value }))}
            />
          </div>
          <div className="picker">
            <Picker setCharacter={setSelectedCharacter} setCategory={handleSetCategory} />
          </div>
          <div className="buttons">
            <Button color="secondary" onClick={copy}>
              copy
            </Button>
            <Button color="secondary" onClick={download}>
              download
            </Button>
          </div>
        </div>
        <div className="footer">
          <Button color="secondary" onClick={handleClickOpen}>
            About
          </Button>
        </div>
      </div>
      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        open={openCopySnackbar}
        onClose={handleSnackClose}
        message="Copied image to clipboard."
        key="copy"
        autoHideDuration={1500}
      />
    </div>
  );
}

export default App;
