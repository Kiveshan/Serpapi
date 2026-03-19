# Google Scholar Publications Scraper - Setup Instructions

## Quick Start

### 1. Install Dependencies
```bash
# From the root directory
npm run install-all

# Or manually:
npm install
cd client && npm install
cd ../server && npm install
```

### 2. Start the Application

**Option 1: Start both servers simultaneously**
```bash
npm run dev
```

**Option 2: Start servers separately**
```bash
# Terminal 1 - Start backend server
npm run server

# Terminal 2 - Start frontend server
npm run client
```

### 3. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001
- Health Check: http://localhost:5001/api/health

## Features

✅ **Search by Author Name**: Enter any academic's name to find their publications
✅ **Rich Metadata**: Extract title, authors, year, venue, abstract snippets, and citations
✅ **Download Support**: Direct PDF download when available
✅ **Source Links**: Redirect to original Google Scholar publication page
✅ **Responsive Design**: Clean, modern UI using Tailwind CSS
✅ **Search Within Results**: Filter publications by title, author, or venue
✅ **Error Handling**: Graceful handling of network issues and rate limits

## API Endpoints

- `GET /api/search/:authorName` - Search publications by author name
- `GET /api/health` - Health check endpoint

## Important Notes

⚠️ **Rate Limiting**: Google Scholar may temporarily block requests if too many are made in a short period. The server includes delays and error handling for this.

⚠️ **Web Scraping**: This application uses web scraping techniques. Use responsibly and respect Google's terms of service.

⚠️ **PDF Availability**: Not all publications have PDF links available. The "Download" button only appears when a PDF URL is detected.

## Troubleshooting

### Common Issues

1. **"Failed to fetch publications" error**
   - Check if the backend server is running on port 5001
   - Try again after a few minutes (rate limiting)
   - Check your internet connection

2. **Tailwind CSS not working**
   - Make sure you've installed all dependencies in the client directory
   - Restart the development server

3. **CORS errors**
   - The backend includes CORS middleware
   - Ensure both servers are running

### Development Tips

- The backend logs search queries and results count to the console
- Use the health check endpoint to verify the backend is running
- The frontend includes loading states and error handling

## Project Structure

```
google-scraper/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── App.tsx        # Main app component
│   │   └── index.css      # Tailwind CSS setup
│   ├── package.json
│   └── tailwind.config.js
├── server/                # Node.js backend
│   ├── index.js          # Express server with scraping logic
│   └── package.json
├── package.json          # Root package.json with scripts
└── README.md
```
