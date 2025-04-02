import { useState, useEffect, useRef, ChangeEvent } from 'react';
import '../styles/PuzzleGame.css';

// Interface for the puzzle piece
interface PuzzlePiece {
  id: number;
  correctPosition: number;
  currentPosition: number;
  imageUrl: string;
}

const PuzzleGame: React.FC = () => {
  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [uploadedImageName, setUploadedImageName] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Simple colored grid for development
  const createColorGrid = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Draw a colored grid
      const colors = ['#ff6b6b', '#4ecdc4', '#45b7d8', '#f9c80e', '#66bb6a'];
      const cellSize = 100;
      
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          const colorIndex = (x + y) % colors.length;
          ctx.fillStyle = colors[colorIndex];
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
          
          // Add cell number
          ctx.fillStyle = 'white';
          ctx.font = 'bold 24px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${y * 5 + x + 1}`, x * cellSize + cellSize/2, y * cellSize + cellSize/2);
        }
      }
      
      return canvas.toDataURL('image/png');
    }
    
    return '';
  };
  
  // Create a default image
  const defaultImage = createColorGrid();
  const [imageUrl, setImageUrl] = useState<string>(defaultImage);
  const gridSize = 5; // 5x5 grid = 25 pieces
  
  // Handle file upload
  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Reset states
    setImageLoaded(false);
    setImageError(false);
    setUploadedImageName(file.name);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const uploadedImageUrl = e.target?.result as string;
      setUserImage(uploadedImageUrl);
      setImageUrl(uploadedImageUrl);
    };
    
    reader.onerror = () => {
      setImageError(true);
    };
    
    reader.readAsDataURL(file);
  };
  
  // Trigger file input click
  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };
  
  // Load and process the image
  useEffect(() => {
    if (!imageUrl) return;
    
    console.log(`Attempting to load image: ${imageUrl.substring(0, 30)}...`);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    
    img.onload = () => {
      console.log('Image loaded successfully');
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // Set canvas dimensions to match the image
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw the image on the canvas
        ctx.drawImage(img, 0, 0);
        
        // Create puzzle pieces
        const pieceWidth = img.width / gridSize;
        const pieceHeight = img.height / gridSize;
        const newPieces: PuzzlePiece[] = [];
        
        for (let y = 0; y < gridSize; y++) {
          for (let x = 0; x < gridSize; x++) {
            const id = y * gridSize + x;
            
            // Create a new canvas for each piece
            const pieceCanvas = document.createElement('canvas');
            pieceCanvas.width = pieceWidth;
            pieceCanvas.height = pieceHeight;
            const pieceCtx = pieceCanvas.getContext('2d');
            
            if (pieceCtx) {
              // Draw a portion of the original image onto the piece canvas
              pieceCtx.drawImage(
                img,
                x * pieceWidth, y * pieceHeight, pieceWidth, pieceHeight,
                0, 0, pieceWidth, pieceHeight
              );
              
              newPieces.push({
                id,
                correctPosition: id,
                currentPosition: id,
                imageUrl: pieceCanvas.toDataURL('image/jpeg')
              });
            }
          }
        }
        
        // Shuffle the pieces
        const shuffledPieces = [...newPieces];
        shufflePieces(shuffledPieces);
        setPieces(shuffledPieces);
        setImageLoaded(true);
        setImageError(false);
      }
    };
    
    img.onerror = (e) => {
      console.error('Image failed to load:', e);
      setImageError(true);
      setImageLoaded(false);
    };
  }, [imageUrl]);
  
  // Check if the puzzle is complete
  useEffect(() => {
    if (pieces.length === 0) return;
    
    const isComplete = pieces.every(piece => piece.currentPosition === piece.correctPosition);
    setIsComplete(isComplete);
  }, [pieces]);
  
  // Function to shuffle the pieces
  const shufflePieces = (piecesToShuffle: PuzzlePiece[]) => {
    // Fisher-Yates shuffle algorithm
    const currentPositions = piecesToShuffle.map(piece => piece.currentPosition);
    
    for (let i = currentPositions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [currentPositions[i], currentPositions[j]] = [currentPositions[j], currentPositions[i]];
    }
    
    // Make sure it's not already solved
    if (currentPositions.every((pos, idx) => pos === piecesToShuffle[idx].correctPosition)) {
      shufflePieces(piecesToShuffle);
      return;
    }
    
    // Update the pieces with new positions
    for (let i = 0; i < piecesToShuffle.length; i++) {
      piecesToShuffle[i].currentPosition = currentPositions[i];
    }
  };
  
  // Handle piece click
  const handlePieceClick = (index: number) => {
    if (selectedPiece === null) {
      // First piece selected
      setSelectedPiece(index);
    } else {
      // Second piece selected - swap them
      const newPieces = [...pieces];
      const temp = newPieces[selectedPiece].currentPosition;
      newPieces[selectedPiece].currentPosition = newPieces[index].currentPosition;
      newPieces[index].currentPosition = temp;
      
      setPieces(newPieces);
      setSelectedPiece(null);
    }
  };
  
  // Reset the puzzle
  const resetPuzzle = () => {
    const newPieces = [...pieces];
    shufflePieces(newPieces);
    setPieces(newPieces);
    setSelectedPiece(null);
    setIsComplete(false);
  };
  
  // Toggle preview visibility
  const togglePreview = () => {
    setShowPreview(!showPreview);
  };
  
  if (!imageLoaded) {
    return (
      <div className="loading">
        <p>Loading puzzle...</p>
        {imageUrl !== defaultImage && <p>Processing your image...</p>}
        
        {/* Show upload option if no user image yet */}
        {!userImage && (
          <div className="upload-container">
            <h2>Upload an Image</h2>
            <p>Start by uploading a photo to create a puzzle</p>
            <button className="upload-button" onClick={triggerFileUpload}>
              Choose Photo
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              style={{ display: 'none' }}
            />
          </div>
        )}
      </div>
    );
  }
  
  if (imageError) {
    return (
      <div className="error-container">
        <h2>Error Loading Image</h2>
        <p>Unable to load the puzzle image. Please try again later.</p>
      </div>
    );
  }
  
  return (
    <div className="puzzle-game">
      <h1>Photo Puzzle Game</h1>
      
      {import.meta.env.DEV && (
        <div className="debug-info">
          <h3>Debug Information</h3>
          <p>Environment: {import.meta.env.MODE}</p>
          <p>Image Source: {userImage ? 'User uploaded' : 'Default'}</p>
          {uploadedImageName && <p>File: {uploadedImageName}</p>}
        </div>
      )}
      
      <div className="upload-controls">
        <button className="upload-button" onClick={triggerFileUpload}>
          {userImage ? 'Change Photo' : 'Upload Photo'}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*"
          style={{ display: 'none' }}
        />
        {uploadedImageName && <span className="file-name">{uploadedImageName}</span>}
      </div>
      
      <div className="game-container">
        <div className="puzzle-container">
          <div className="puzzle-grid" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
            {Array.from({ length: gridSize * gridSize }).map((_, index) => {
              const piece = pieces.find(p => p.currentPosition === index);
              if (!piece) return null;
              
              return (
                <div
                  key={piece.id}
                  className={`puzzle-piece ${selectedPiece === pieces.indexOf(piece) ? 'selected' : ''}`}
                  onClick={() => handlePieceClick(pieces.indexOf(piece))}
                  style={{ backgroundImage: `url(${piece.imageUrl})` }}
                />
              );
            })}
          </div>
        </div>
        
        {showPreview && (
          <div className="preview-container">
            <h3>Preview</h3>
            <img src={imageUrl} alt="Puzzle preview" className="preview-image" />
          </div>
        )}
      </div>
      
      <div className="controls">
        <button onClick={resetPuzzle}>Shuffle</button>
        <button onClick={togglePreview}>{showPreview ? 'Hide Preview' : 'Show Preview'}</button>
      </div>
      
      {isComplete && (
        <div className="completion-message">
          <h2>Congratulations!</h2>
          <p>You completed the puzzle!</p>
        </div>
      )}
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default PuzzleGame; 