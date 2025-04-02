from fastapi import FastAPI, UploadFile, File, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
import os
import base64
from typing import List, Optional
import random
import math
import uuid
import json
from datetime import datetime

app = FastAPI()

# Configure CORS for all origins (needed for GitHub Pages)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directory for storing uploaded images
UPLOAD_DIR = "uploads"
METADATA_FILE = os.path.join(UPLOAD_DIR, "metadata.json")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Initialize metadata file if it doesn't exist
if not os.path.exists(METADATA_FILE):
    with open(METADATA_FILE, "w") as f:
        json.dump({}, f)

def load_metadata():
    with open(METADATA_FILE, "r") as f:
        return json.load(f)

def save_metadata(metadata):
    with open(METADATA_FILE, "w") as f:
        json.dump(metadata, f)

def encode_image_to_base64(image: Image.Image) -> str:
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode('utf-8')

def split_image(image: Image.Image, piece_count: int) -> tuple:
    width, height = image.size
    
    # Calculate the grid size (rows and columns)
    grid_size = int(math.sqrt(piece_count))
    
    # Ensure we have exactly the right number of pieces
    rows = grid_size
    cols = grid_size
    
    piece_width = width // cols
    piece_height = height // rows
    
    pieces_list = []
    for i in range(rows):
        for j in range(cols):
            left = j * piece_width
            top = i * piece_height
            right = min(left + piece_width, width)
            bottom = min(top + piece_height, height)
            
            piece = image.crop((left, top, right, bottom))
            piece_base64 = encode_image_to_base64(piece)
            
            pieces_list.append({
                "id": f"piece_{i}_{j}",
                "image": piece_base64,
                "correctPosition": {"row": i, "col": j},
            })
    
    # Shuffle pieces
    random.shuffle(pieces_list)
    return pieces_list, rows, cols

@app.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    piece_count: int = Query(default=9, ge=4, le=100)
):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))
    
    # Make the image square to ensure square puzzle pieces
    max_size = 800
    width, height = image.size
    if width > height:
        new_size = (max_size, int(height * max_size / width))
    else:
        new_size = (int(width * max_size / height), max_size)
    
    image = image.resize(new_size, Image.Resampling.LANCZOS)
    
    # Generate a unique ID for this puzzle
    puzzle_id = str(uuid.uuid4())
    
    # Save original image
    image_path = os.path.join(UPLOAD_DIR, f"{puzzle_id}.png")
    image.save(image_path)
    
    # Get original image as base64
    original_base64 = encode_image_to_base64(image)
    
    # Adjust piece_count to be a perfect square
    perfect_square_piece_count = int(math.sqrt(piece_count)) ** 2
    
    # Split image into pieces
    pieces, rows, cols = split_image(image, perfect_square_piece_count)
    
    # Add metadata
    metadata = load_metadata()
    metadata[puzzle_id] = {
        "filename": f"{puzzle_id}.png",
        "piece_count": perfect_square_piece_count,
        "rows": rows,
        "cols": cols,
        "created_at": datetime.now().isoformat(),
        "original_filename": file.filename
    }
    save_metadata(metadata)
    
    return {
        "puzzle_id": puzzle_id,
        "pieces": pieces,
        "originalImage": original_base64,
        "rows": rows,
        "cols": cols,
        "pieceCount": len(pieces)
    }

@app.get("/puzzle/{puzzle_id}")
async def get_puzzle(
    puzzle_id: str, 
    piece_count: Optional[int] = None,
    show_preview: bool = True
):
    metadata = load_metadata()
    
    if puzzle_id not in metadata:
        raise HTTPException(status_code=404, detail="Puzzle not found")
    
    # Load the original image
    image_path = os.path.join(UPLOAD_DIR, f"{puzzle_id}.png")
    if not os.path.exists(image_path):
        raise HTTPException(status_code=404, detail="Puzzle image not found")
    
    image = Image.open(image_path)
    
    # Determine piece count
    actual_piece_count = piece_count if piece_count else metadata[puzzle_id]["piece_count"]
    
    # Ensure piece count is a perfect square
    actual_piece_count = int(math.sqrt(actual_piece_count)) ** 2
    
    # Get original image as base64 (if preview is enabled)
    original_base64 = None
    if show_preview:
        original_base64 = encode_image_to_base64(image)
    
    # Split image into pieces
    pieces, rows, cols = split_image(image, actual_piece_count)
    
    return {
        "puzzle_id": puzzle_id,
        "pieces": pieces,
        "originalImage": original_base64,
        "rows": rows,
        "cols": cols,
        "pieceCount": len(pieces),
        "showPreview": show_preview
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 