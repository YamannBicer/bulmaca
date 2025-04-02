# Bulmaca - Photo Puzzle Game

A simple client-side web application where you can solve a photo puzzle by swapping pieces. This implementation uses React, TypeScript, and Vite.

## How to Play

1. The game loads a default image and splits it into 25 pieces (5x5 grid)
2. Click on a piece to select it (a black dot will appear)
3. Click on another piece to swap positions
4. Continue swapping pieces until the image is correctly arranged
5. Toggle the preview image on/off with the "Hide Preview" button for added challenge
6. The "Shuffle" button randomizes the pieces if you want to restart

## Features

* Image splitting into a 5x5 grid (25 pieces)
* Click-to-swap puzzle pieces
* Option to hide/show the preview image for reference
* Shuffle button to randomize pieces
* Real-time completion checking
* Responsive design for desktop and mobile
* Completely client-side - no backend required!

## Development

This is a React application built with:
* React for UI components
* TypeScript for type safety
* Vite as the build tool
* HTML5 Canvas for image processing

### Setup

1. Clone the repository:
```
git clone https://github.com/yamannbicer/bulmaca.git
cd bulmaca
```

2. Install dependencies:
```
npm install
```

3. Start the development server:
```
npm run dev
```

The application will start at http://localhost:5173 or another available port.

### Adding Custom Images

To use custom images:
1. Add your image to the `public/photos` directory
2. Update the `imageUrl` in `src/components/PuzzleGame.tsx` to point to your image:
```tsx
const imageUrl = '/bulmaca/photos/your-image.jpg';
```

## Deployment to GitHub Pages

This project is configured to automatically deploy to GitHub Pages when changes are pushed to the main branch.

1. Make sure your repository is set up for GitHub Pages:
   * Go to your repository settings
   * Navigate to "Pages"
   * Set the source to "GitHub Actions"

2. Push your changes to the main branch:
```
git add .
git commit -m "Update application"
git push origin main
```

3. GitHub Actions will automatically build and deploy your application to `https://yamannbicer.github.io/bulmaca/`

## License

MIT
