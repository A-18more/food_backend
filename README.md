# Food App Backend

This is the backend server for the Food App, built with Node.js and Express. It provides API endpoints for managing food data and integrates with the Spoonacular API.

## Features

- RESTful API endpoints for food data
- PostgreSQL database integration
- Spoonacular API integration
- Automated food data fetching with cron jobs
- Search functionality

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   DATABASE_URL=your_postgresql_connection_string
   SPOONACULAR_API_KEY=your_spoonacular_api_key
   PORT=8080
   ```
4. Start the server:
   ```bash
   npm start
   ```

## API Endpoints

- `GET /foods` - Get all foods
- `GET /api/fetch-foods` - Fetch new foods from Spoonacular
- `GET /api/search-foods?query=searchterm` - Search for foods

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `SPOONACULAR_API_KEY`: API key for Spoonacular
- `PORT`: Server port (defaults to 8080) 