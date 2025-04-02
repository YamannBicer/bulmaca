import { useState, useEffect } from 'react'
import './App.css'

// Helper function to generate UUID for puzzles
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

interface PuzzlePiece {
  id: string
  image: string
  correctPosition: {
    row: number
    col: number
  }
}

interface Move {
  fromIndex: number;
  toIndex: number;
  fromPiece: PuzzlePiece;
  toPiece: PuzzlePiece;
}

interface PuzzleData {
  pieces: PuzzlePiece[];
  originalImage: string;
  rows: number;
  cols: number;
  pieceCount: number;
  showPreview: boolean;
  puzzle_id: string;
}

// These are perfect squares to ensure grid layout works properly
const PIECE_COUNT_OPTIONS = [4, 9, 16, 25, 36, 49, 64, 81, 100]

// Local storage key for storing puzzles
const STORAGE_KEY = 'bulmaca_puzzles';

function PuzzlePiece({ piece, isSelected, onClick }: { 
  piece: PuzzlePiece; 
  isSelected: boolean; 
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`puzzle-piece ${isSelected ? 'selected' : ''}`}
    >
      <img
        src={`${piece.image}`}
        alt={`Puzzle piece ${piece.id}`}
      />
      {isSelected && <div className="selection-dot" />}
    </div>
  )
}

function App() {
  const [pieces, setPieces] = useState<PuzzlePiece[]>([])
  const [selectedPieceIndex, setSelectedPieceIndex] = useState<number | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [pieceCount, setPieceCount] = useState(9)
  const [showInstructions, setShowInstructions] = useState(true)
  const [gridCols, setGridCols] = useState(3)
  const [actualPieceCount, setActualPieceCount] = useState(9)
  const [moveHistory, setMoveHistory] = useState<Move[]>([])
  const [puzzleId, setPuzzleId] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(true)
  const [shareLink, setShareLink] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Parse URL parameters on page load
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const id = searchParams.get('id');
    const pieces = searchParams.get('pieces');
    const preview = searchParams.get('preview');
    
    if (id) {
      const pieceCount = pieces ? parseInt(pieces, 10) : undefined;
      const showPreview = preview === 'false' ? false : true;
      
      loadPuzzleFromId(id, pieceCount, showPreview);
    }
  }, []);

  // Store puzzles in local storage
  const storePuzzle = (puzzleData: PuzzleData) => {
    try {
      const storedPuzzles = localStorage.getItem(STORAGE_KEY);
      const puzzles = storedPuzzles ? JSON.parse(storedPuzzles) : {};
      
      // Store only the necessary data, avoid duplicate storage of pieces
      puzzles[puzzleData.puzzle_id] = {
        originalImage: puzzleData.originalImage,
        rows: puzzleData.rows,
        cols: puzzleData.cols,
        pieceCount: puzzleData.pieceCount,
        pieces: puzzleData.pieces
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(puzzles));
    } catch (error) {
      console.error('Error storing puzzle in local storage:', error);
    }
  };

  // Load puzzle from ID when receiving a shared link
  const loadPuzzleFromId = async (id: string, pieceCount?: number, showPreview: boolean = true) => {
    setLoading(true);
    setError(null);
    
    try {
      // Get puzzle from local storage
      const storedPuzzles = localStorage.getItem(STORAGE_KEY);
      if (!storedPuzzles) {
        throw new Error('No puzzles found');
      }
      
      const puzzles = JSON.parse(storedPuzzles);
      const puzzleData = puzzles[id];
      
      if (!puzzleData) {
        throw new Error('Puzzle not found');
      }
      
      // Use stored pieces or regenerate if piece count is different
      let pieces = puzzleData.pieces;
      let rows = puzzleData.rows;
      let cols = puzzleData.cols;
      
      if (pieceCount && pieceCount !== puzzleData.pieceCount) {
        // Load the original image for resplitting
        const img = new Image();
        img.src = puzzleData.originalImage;
        
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
        });
        
        const result = splitImage(img, pieceCount);
        pieces = result.pieces;
        rows = result.rows;
        cols = result.cols;
      }
      
      // Set state with the loaded data
      setPieces(pieces);
      setOriginalImage(showPreview ? puzzleData.originalImage : null);
      setGridCols(cols);
      setActualPieceCount(pieces.length);
      setPuzzleId(id);
      setShowPreview(showPreview);
      setIsComplete(false);
      setShowInstructions(true);
      setSelectedPieceIndex(null);
      setMoveHistory([]);
      
      // Generate share link
      generateShareLink(id, pieces.length, showPreview);
    } catch (error) {
      console.error('Error loading puzzle:', error);
      setError('Failed to load the puzzle. The link might be invalid or the puzzle has been removed.');
    } finally {
      setLoading(false);
    }
  };

  // Split an image into puzzle pieces
  const splitImage = (image: HTMLImageElement, pieceCount: number) => {
    // Calculate grid size
    const gridSize = Math.sqrt(pieceCount);
    const rows = gridSize;
    const cols = gridSize;
    
    // Create a canvas to draw the image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    // Set canvas size to match image
    canvas.width = image.width;
    canvas.height = image.height;
    
    // Draw the image on the canvas
    ctx.drawImage(image, 0, 0);
    
    // Calculate piece dimensions
    const pieceWidth = Math.floor(image.width / cols);
    const pieceHeight = Math.floor(image.height / rows);
    
    // Create pieces
    const pieces: PuzzlePiece[] = [];
    
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        // Create a new canvas for each piece
        const pieceCanvas = document.createElement('canvas');
        pieceCanvas.width = pieceWidth;
        pieceCanvas.height = pieceHeight;
        const pieceCtx = pieceCanvas.getContext('2d')!;
        
        // Draw the piece on the canvas
        pieceCtx.drawImage(
          canvas,
          j * pieceWidth,
          i * pieceHeight,
          pieceWidth,
          pieceHeight,
          0,
          0,
          pieceWidth,
          pieceHeight
        );
        
        // Get the piece as a data URL
        const pieceImage = pieceCanvas.toDataURL('image/png');
        
        // Add the piece to the array
        pieces.push({
          id: `piece_${i}_${j}`,
          image: pieceImage,
          correctPosition: { row: i, col: j }
        });
      }
    }
    
    // Shuffle the pieces
    const shuffledPieces = [...pieces];
    for (let i = shuffledPieces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledPieces[i], shuffledPieces[j]] = [shuffledPieces[j], shuffledPieces[i]];
    }
    
    return { pieces: shuffledPieces, rows, cols };
  };

  // Generate shareable link based on puzzle parameters
  const generateShareLink = (id: string, pieces: number, preview: boolean) => {
    const url = new URL(window.location.href);
    url.search = ''; // Clear existing query params
    
    url.searchParams.set('id', id);
    url.searchParams.set('pieces', pieces.toString());
    if (!preview) {
      url.searchParams.set('preview', 'false');
    }
    
    setShareLink(url.toString());
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true);
    setError(null);

    try {
      // Read the file as a data URL
      const reader = new FileReader();
      
      const imageLoaded = new Promise<string>((resolve, reject) => {
        reader.onload = (e) => {
          if (e.target?.result) {
            resolve(e.target.result as string);
          } else {
            reject(new Error('Failed to read image'));
          }
        };
        reader.onerror = () => reject(reader.error);
      });
      
      reader.readAsDataURL(file);
      
      // Wait for the image to load
      const imageDataUrl = await imageLoaded;
      
      // Create an image element to get dimensions
      const img = new Image();
      img.src = imageDataUrl;
      
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
      });
      
      // Resize the image if needed
      const maxSize = 800;
      let width = img.width;
      let height = img.height;
      
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = Math.floor(height * (maxSize / width));
          width = maxSize;
        } else {
          width = Math.floor(width * (maxSize / height));
          height = maxSize;
        }
        
        // Create a canvas to resize the image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        
        img.src = canvas.toDataURL('image/png');
        
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
        });
      }
      
      // Ensure piece count is a perfect square
      const perfectSquareCount = Math.pow(Math.round(Math.sqrt(pieceCount)), 2);
      
      // Split the image into pieces
      const { pieces, rows, cols } = splitImage(img, perfectSquareCount);
      
      // Generate a unique ID for this puzzle
      const newPuzzleId = generateUUID();
      
      // Create puzzle data
      const puzzleData: PuzzleData = {
        puzzle_id: newPuzzleId,
        pieces,
        originalImage: img.src,
        rows,
        cols,
        pieceCount: pieces.length,
        showPreview: true
      };
      
      // Store the puzzle in local storage
      storePuzzle(puzzleData);
      
      // Update state
      setPieces(pieces);
      setOriginalImage(img.src);
      setGridCols(cols);
      setActualPieceCount(pieces.length);
      setPuzzleId(newPuzzleId);
      setShowPreview(true);
      setIsComplete(false);
      setShowInstructions(true);
      setSelectedPieceIndex(null);
      setMoveHistory([]);
      
      // Generate share link
      generateShareLink(newPuzzleId, pieces.length, true);
    } catch (error) {
      console.error('Error processing image:', error);
      setError('Failed to process the image. Please try again with a different image.');
    } finally {
      setLoading(false);
    }
  }

  const shufflePieces = () => {
    if (pieces.length === 0) return
    
    setSelectedPieceIndex(null)
    setIsComplete(false)
    
    // Create a new array with shuffled pieces
    setPieces(prevPieces => {
      const newPieces = [...prevPieces]
      
      // Fisher-Yates shuffle algorithm
      for (let i = newPieces.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        // Swap elements
        const temp = newPieces[i]
        newPieces[i] = newPieces[j]
        newPieces[j] = temp
      }
      
      return newPieces
    })
    
    // Clear move history after shuffling
    setMoveHistory([])
  }

  const handlePieceClick = (index: number) => {
    // If no piece is selected, select this one
    if (selectedPieceIndex === null) {
      setSelectedPieceIndex(index)
      return
    }
    
    // If the same piece is clicked again, deselect it
    if (selectedPieceIndex === index) {
      setSelectedPieceIndex(null)
      return
    }
    
    // Otherwise, swap the two pieces
    setPieces((prevPieces) => {
      const newPieces = [...prevPieces]
      
      // Record this move for undo functionality
      setMoveHistory(prev => [
        ...prev, 
        {
          fromIndex: selectedPieceIndex,
          toIndex: index,
          fromPiece: prevPieces[selectedPieceIndex],
          toPiece: prevPieces[index]
        }
      ])
      
      // Swap the pieces
      const temp = newPieces[selectedPieceIndex]
      newPieces[selectedPieceIndex] = newPieces[index]
      newPieces[index] = temp
      
      // Check if the puzzle is complete
      const isComplete = newPieces.every((piece, idx) => {
        const [row, col] = piece.id.split('_').slice(1).map(Number)
        const correctIndex = row * gridCols + col
        return idx === correctIndex
      })
      
      setIsComplete(isComplete)
      return newPieces
    })
    
    // Clear the selection
    setSelectedPieceIndex(null)
    // Hide instructions after the first move
    if (showInstructions) {
      setShowInstructions(false)
    }
  }

  const handleUndo = () => {
    if (moveHistory.length === 0) return
    
    const lastMove = moveHistory[moveHistory.length - 1]
    
    setPieces(prevPieces => {
      const newPieces = [...prevPieces]
      newPieces[lastMove.fromIndex] = lastMove.fromPiece
      newPieces[lastMove.toIndex] = lastMove.toPiece
      return newPieces
    })
    
    setMoveHistory(prev => prev.slice(0, -1))
    setIsComplete(false)
  }
  
  const togglePreview = () => {
    setShowPreview(prev => !prev);
    if (puzzleId) {
      generateShareLink(puzzleId, actualPieceCount, !showPreview);
    }
  }

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink)
      .then(() => {
        alert('Link copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  }

  // Add keyboard shortcut for undo (Ctrl+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        handleUndo()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [moveHistory])

  return (
    <div className="container">
      <div className="content">
        <h1 className="title">Photo Puzzle</h1>
        
        {loading && <div className="loading">Processing image...</div>}
        {error && <div className="error-message">{error}</div>}
        
        <div className="controls">
          <div className="upload-section">
            <label className="piece-count-label">
              Number of Pieces:
              <select 
                value={pieceCount} 
                onChange={(e) => setPieceCount(Number(e.target.value))}
                className="piece-count-select"
              >
                {PIECE_COUNT_OPTIONS.map(count => (
                  <option key={count} value={count}>{count} pieces</option>
                ))}
              </select>
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="file-input"
            />
            {actualPieceCount > 0 && (
              <div className="piece-count-info">
                Current puzzle: {actualPieceCount} pieces ({gridCols}×{gridCols} grid)
              </div>
            )}
            
            {puzzleId && (
              <div className="share-section">
                <div className="share-options">
                  <label className="preview-toggle">
                    <input 
                      type="checkbox" 
                      checked={showPreview}
                      onChange={togglePreview}
                    />
                    Show preview image
                  </label>
                </div>
                <div className="share-link">
                  <button onClick={copyShareLink} className="copy-link-button">
                    Copy Shareable Link
                  </button>
                  <div className="link-info">
                    Share this puzzle with friends!
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {originalImage && showPreview && (
            <div className="preview-container">
              <img 
                src={originalImage} 
                alt="Original" 
                className="preview-image"
              />
            </div>
          )}
        </div>

        {showInstructions && pieces.length > 0 && (
          <div className="instructions">
            <h3>How to Play:</h3>
            <ol>
              <li>Click on a puzzle piece to select it (a black dot will appear)</li>
              <li>Click on another piece to swap them</li>
              <li>Click a selected piece again to deselect it</li>
              <li>Use the "Undo Move" button or press Ctrl+Z to take back moves</li>
              <li>Click "Shuffle" to randomly redistribute the pieces</li>
              <li>Share the puzzle with friends using the shareable link</li>
              <li>Arrange all pieces in the correct order to win!</li>
            </ol>
          </div>
        )}

        {pieces.length > 0 && (
          <div className="puzzle-container">
            <div className="puzzle-actions">
              <button 
                onClick={handleUndo} 
                disabled={moveHistory.length === 0}
                className="undo-button"
              >
                Undo Move ({moveHistory.length})
              </button>
              <button 
                onClick={shufflePieces}
                className="shuffle-button"
              >
                Shuffle
              </button>
            </div>
            
            <div 
              className="puzzle-grid"
              style={{
                gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
                aspectRatio: '1 / 1'
              }}
            >
              {pieces.map((piece, index) => (
                <PuzzlePiece
                  key={piece.id}
                  piece={piece}
                  isSelected={selectedPieceIndex === index}
                  onClick={() => handlePieceClick(index)}
                />
              ))}
            </div>
          </div>
        )}

        {isComplete && (
          <div className="success-message">
            Congratulations! You've completed the puzzle in {moveHistory.length} moves! 🎉
          </div>
        )}
      </div>
    </div>
  )
}

export default App
