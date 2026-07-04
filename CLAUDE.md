# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A sticker-maker web app for Sega rhythm games (Ongeki, Chunithm, MaiMai). Users pick a character, customize a text overlay (color, position, rotation, size, letter spacing, optional curve), then download the sticker as PNG or copy it to the clipboard. A small backend logs each sticker creation and powers a global/per-user counter. Adapted from the Project Sekai and Arcaea sticker makers.

## Commands

- `npm start` — CRA dev server for the React frontend (port 3000)
- `npm run build` — production frontend build into `build/`
- `npm test` — Jest via react-scripts (watch mode); run a single file with `npm test -- Canvas`
- `npm run start:server` — Express backend (`server/index.js`, port 8080); in production it also serves the built frontend from `build/`
- `npm install --legacy-peer-deps` — the `--legacy-peer-deps` flag is required (peer-dependency conflicts; the Dockerfile uses it too)
- `docker-compose up` — full production stack: `web-app` (Node backend, not publicly exposed), `nginx` (80/443, HTTP→HTTPS redirect, reverse proxy), `certbot` (Let's Encrypt renewal)

There is no separate lint script; ESLint runs through react-scripts with the `react-app` config.

## Architecture

Two-part app in one repo:

**Frontend (`src/`)** — CRA + TypeScript + MUI v5:
- `App.tsx` holds all sticker state (selected character, `SubtitleParameter` text settings) and orchestrates the UI
- `components/Canvas.tsx` draws the character image + text overlay on an HTML5 canvas; download/copy exports read from this canvas
- `components/Picker.tsx` (character/category selection), `ColorPicker.tsx`, `Info.tsx` (info modal + sticker counters)
- `src/characters.json` (~180 KB) is the character database: every character's name, image path, and default subtitle parameters (text, fill/stroke colors, x/y offset, rotation, font size, letter spacing). Character images live in `public/img/<series>/` (e.g. `ongeki/`, `chunithm/`, `maimai/`, plus variants like `ongeki_2`, `maimai_derakkuma`). Adding a character = add the PNG under `public/img/` + an entry in `characters.json`.
- Text overlays use the custom font `src/fonts/ShangShouFangTangTi.woff2`, preloaded in `src/utils/preload.ts` — canvas rendering depends on it being loaded first
- `src/config.json` sets `apiUrl` to the production domain; the backend's CORS whitelist (`server/index.js`) covers the production domains and `localhost:3000` for dev

**Backend (`server/index.js`)** — plain Express, no framework beyond that:
- `POST /log` — record a sticker creation (`id`, `name`, `type` in body; `x-key` header identifies the user, generated server-side if absent)
- `GET /logs` — all log entries
- `GET /config` — returns `key`, `serverTime`, `global` count, and per-key `total` count
- Storage is a flat JSON file at `server/logs.json` (read/rewritten whole on each log)
- `GET *` catch-all serves the built React app from `build/` (SPA fallback to `index.html`)
- `trust proxy` is enabled because Nginx forwards client IPs

**Deployment** — 3-stage `dockerfile` (note lowercase filename): stage 1 builds the frontend, stage 2 installs production-only backend deps (deliberately sequenced after stage 1 via a sentinel file to limit build memory), stage 3 is a minimal Alpine runtime with `server/`, `build/`, and prod `node_modules` only. Nginx config is `nginx.conf`; SSL artifacts (`certbot-etc/`, `webroot/`) are gitignored.
