import './App.css'

function App() {
  // Base path will be different in development vs production
  const basePath = import.meta.env.BASE_URL || '';
  const photoPath = `${basePath}/photos/sample1.jpg`;

  return (
    <div className="app-container">
      <h1>My Photo</h1>
      <div className="photo-container">
        <img src={photoPath} alt="My Photo" className="photo" />
      </div>
    </div>
  )
}

export default App
