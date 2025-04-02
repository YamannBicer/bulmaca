# Bulmaca - Photo Puzzle Game

A client-side web application where you can upload photos and solve them as puzzles, with the ability to share puzzles with friends via shareable links.

## Features

- Upload any image and turn it into a puzzle
- Choose the number of puzzle pieces (4, 9, 16, 25, 36, 49, 64, 81, or 100)
- Click-to-swap puzzle pieces
- Option to hide/show the preview image for added challenge
- Create shareable links to challenge friends with the same puzzle
- Automatic image resizing and processing
- Undo functionality with keyboard shortcut (Ctrl+Z)
- Shuffle button to randomize pieces
- Real-time completion checking
- Responsive design for desktop and mobile
- **Works completely client-side** - no backend required!

## Project Structure

This is a purely client-side application built with:
- React for UI components
- TypeScript for type safety
- Vite as the build tool
- HTML5 Canvas for image processing
- LocalStorage for saving puzzles

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/bulmaca.git
   cd bulmaca
   ```

2. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The application will start at http://localhost:5173 or another available port.

## Deployment to GitHub Pages

This repository is set up to automatically deploy to GitHub Pages when changes are pushed to the main branch.

1. Make sure your repository is set up for GitHub Pages:
   - Go to your repository settings
   - Navigate to "Pages"
   - Set the source to "GitHub Actions"

2. The `base` path in `vite.config.ts` is already set to `/bulmaca/`:
   ```typescript
   base: '/bulmaca/',
   ```

3. Push your changes to the main branch:
   ```bash
   git add .
   git commit -m "Update application"
   git push origin main
   ```

4. GitHub Actions will automatically build and deploy your application.

## How to Use

1. Open the application in your web browser
2. Select the number of pieces for your puzzle
3. Upload an image using the file input
4. The image will be split into the selected number of pieces and shuffled
5. Click on a piece to select it (a black dot will appear)
6. Click on another piece to swap them
7. Use the "Undo" button or press Ctrl+Z to undo moves
8. Use the "Shuffle" button to randomize the pieces
9. Toggle the preview image on/off for added challenge
10. Share the puzzle with friends using the "Copy Shareable Link" button
11. When the puzzle is complete, you'll see a success message

## How Puzzles Are Shared

When you create a puzzle:
1. The image is processed completely in your browser using HTML5 Canvas
2. Puzzle data is stored in your browser's localStorage
3. A unique ID is generated for your puzzle
4. A shareable link is created with this ID

When someone opens a shared link:
- If they have the puzzle stored in their localStorage, it loads immediately
- If not, they'll need to upload the image themselves

## Technologies Used

Shareable links contain the puzzle ID, piece count, and preview settings:
```
https://yourusername.github.io/bulmaca/?id=12345&pieces=16&preview=false
```

- `id`: The unique identifier for the puzzle
- `pieces`: The number of pieces (optional)
- `preview`: Whether to show the preview image (optional, defaults to true)

## License

MIT 