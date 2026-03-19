# Google Scholar Publications Scraper

A full-stack web application that allows users to search for academic publications from Google Scholar by author name and retrieve publication metadata with download and redirect capabilities.

## Project Structure

```
google-scraper/
├── client/          # React frontend
├── server/          # Node.js backend
├── README.md
└── package.json     # Root package.json for scripts
```

## Features

- Search publications by author name
- Display comprehensive publication metadata
- Download publications or redirect to source
- Clean, responsive UI
- Error handling and validation

## Tech Stack

### Frontend (React)
- React 18
- React Router
- Axios for API calls
- Tailwind CSS for styling
- Lucide React for icons

### Backend (Node.js)
- Express.js
- Cheerio for web scraping
- Axios for HTTP requests
- CORS for cross-origin requests

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies for both client and server:
   ```bash
   # Install root dependencies
   npm install
   
   # Install client dependencies
   cd client && npm install
   
   # Install server dependencies
   cd ../server && npm install
   ```

### Running the Application

1. Start the backend server:
   ```bash
   npm run server
   ```

2. Start the frontend development server:
   ```bash
   npm run client
   ```

3. Open your browser and navigate to `http://localhost:3000`

## API Endpoints

- `GET /api/search/:authorName` - Search publications by author name
- `GET /api/publication/:id` - Get specific publication details

## Note

This application uses web scraping techniques to extract data from Google Scholar. Please use responsibly and respect Google's terms of service.
