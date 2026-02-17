import {
  ImageList,
  ImageListItem,
  Popover,
  Button,
  TextField,
  Select,
  MenuItem,
} from "@mui/material";
import React, { useState, useMemo } from "react";
import { categories } from "../utils/preload";
import type { Category } from "../models/Category";
import type { Character } from "../models/Character";

interface PickerProps {
  setCharacter: (index: number) => void;
  setCategory: (category: string) => void;
}

export default function Picker({ setCharacter, setCategory }: PickerProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(
    categories && categories.length > 0 ? categories[0].name : ""
  ); // default first category

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? "picker" : undefined;

  // Filter characters by category + search
  const memoizedImageListItems = useMemo(() => {
    const s = search.toLowerCase();

  // Find the selected category object
  const categoryObj: Category | undefined = categories.find((c) => c.name === selectedCategory);
    if (!categoryObj) return [];
  return categoryObj.characters.map((c: Character, index: number) => {
      if (
        s === c.id ||
        c.name.toLowerCase().includes(s) ||
        c.character.toLowerCase().includes(s)
      ) {
        return (
          <ImageListItem
            key={c.id || index}
            onClick={() => {
              handleClose();
              setCharacter(index);
              setCategory(selectedCategory); // update parent with chosen category
            }}
            sx={{
              cursor: "pointer",
              "&:hover": { opacity: 0.5 },
              "&:active": { opacity: 0.8 },
            }}
          >
            <img
              src={`/img/${c.imgPath}`}
              srcSet={`/img/${c.imgPath}`}
              alt={c.name}
              loading="lazy"
            />
          </ImageListItem>
        );
      }
      return null;
    });
  }, [search, selectedCategory, setCharacter, setCategory]);

  return (
    <div>
      <Button
        aria-describedby={id}
        variant="contained"
        color="secondary"
        onClick={handleClick}
      >
        Pick character
      </Button>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        className="modal"
      >
        <div className="picker-search">
          <TextField
            label="Search character"
            size="small"
            color="secondary"
            value={search}
            fullWidth
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Category dropdown */}
        <div className="picker-category">
          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as string)}
            fullWidth
          >
            {categories.map((cat, idx) => (
              <MenuItem key={idx} value={cat.name}>
                {cat.name}
              </MenuItem>
            ))}
          </Select>
        </div>

        <div className="image-grid-wrapper">
          <ImageList
            sx={{
              width: window.innerWidth < 600 ? 300 : 500,
              height: 450,
              overflow: "visible",
            }}
            cols={window.innerWidth < 600 ? 3 : 4}
            rowHeight={140}
            className="image-grid"
          >
            {memoizedImageListItems}
          </ImageList>
        </div>
      </Popover>
    </div>
  );
}
