import { useState, useEffect, useRef } from 'react';
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageUrl = '/bulmaca/vite.svg';
  const gridSize = 5; // 5x5 grid = 25 pieces
  
  // Load and process the image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    
    img.onload = () => {
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
      }
    };
  }, []);
  
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
    return <div className="loading">Loading puzzle...</div>;
  }
  
  return (
    <div className="puzzle-game">
      <h1>Photo Puzzle Game</h1>
      
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