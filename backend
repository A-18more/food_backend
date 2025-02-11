const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 8080; // Pick a totally fresh port
console.log("Loaded API Key:", process.env.SPOONACULAR_API_KEY); // Debugging line

app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// API Route: Fetch All Foods
app.get("/foods", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM foods");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// Start Server With Error Handling
const server = app.listen(port, () => {
    console.log(`✅ Server running on port ${port}`);
});

server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
        console.error(`❌ Port ${port} is already in use. Trying another port...`);
        server.close(() => {
            app.listen(port + 1, () => console.log(`✅ Now running on port ${port + 1}`));
        });
    } else {
        console.error("❌ Unexpected error:", err);
    }
});

const axios = require("axios");

app.get("/api/fetch-foods", async (req, res) => {
    try {
        let offset = 0; // Start from the beginning
        const batchSize = 50; // Spoonacular allows 50 per request
        const maxRequests = 20; // Fetch 20 batches (1000 items total)
        
        for (let i = 0; i < maxRequests; i++) {
            const response = await axios.get(`https://api.spoonacular.com/food/products/search?query=food&number=${batchSize}&offset=${offset}&apiKey=${process.env.SPOONACULAR_API_KEY}`);

            if (!response.data.products || response.data.products.length === 0) {
                console.log("No more products found. Stopping.");
                break;
            }

            console.log(`Fetched batch ${i + 1}: ${response.data.products.length} items`);
            
            for (const item of response.data.products) {
                try {
                    await pool.query(
                        "INSERT INTO foods (name, category) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING",
                        [item.title, item.aisle || "Unknown"]
                    );
                } catch (err) {
                    console.error(`Error inserting item: ${item.title}`, err);
                }
            }

            offset += batchSize; // Move to the next batch
        }

        res.json({ message: "Batch food import completed!" });
    } catch (err) {
        console.error("Error fetching food data:", err);
        res.status(500).send("Error fetching food data");
    }
});


pool.query(`
    CREATE TABLE IF NOT EXISTS foods (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        like_count INT DEFAULT 0
    )
`).then(() => console.log("✅ Table 'foods' is ready"))
  .catch(err => console.error("❌ Error creating table:", err));

  const cron = require("node-cron");

  // Run every 12 hours (adjust as needed)
  cron.schedule("0 */12 * * *", async () => {
      console.log("⏳ Running scheduled food fetch...");
      await fetchFoods();
  });
  
  // Move fetch logic into a function
  async function fetchFoods() {
      let offset = 0;
      const batchSize = 50;
      const maxRequests = 10; // Adjust this to control how much data is added each time
  
      for (let i = 0; i < maxRequests; i++) {
          try {
              const response = await axios.get(`https://api.spoonacular.com/food/products/search?query=food&number=${batchSize}&offset=${offset}&apiKey=${process.env.SPOONACULAR_API_KEY}`);
  
              if (!response.data.products || response.data.products.length === 0) {
                  console.log("No more products found. Stopping.");
                  break;
              }
  
              console.log(`Fetched batch ${i + 1}: ${response.data.products.length} items`);
              
              for (const item of response.data.products) {
                  await pool.query(
                      "INSERT INTO foods (name, category) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING",
                      [item.title, item.aisle || "Unknown"]
                  );
              }
  
              offset += batchSize; // Move to next batch
          } catch (err) {
              console.error("Error fetching food data:", err);
          }
      }
  }
  
  app.get("/api/search-foods", async (req, res) => {
    const { query } = req.query;
    
    if (!query) {
        return res.status(400).json({ message: "Search query is required" });
    }

    try {
        const result = await pool.query(
            "SELECT * FROM foods WHERE name ILIKE $1 LIMIT 20",
            [`%${query}%`]
        );

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error searching foods");
    }
});
