const axios = require('axios');
const { Client } = require('pg');

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'foodapp',  
    password: 'Caramel2007.',
    port: 5432,
});

const API_KEY = '2Alwwq0eHrvjrdttm4nwU9u1TuaAw2YeoZHz23S6';
const BASE_URL = 'https://api.nal.usda.gov/fdc/v1/foods/list';
const PAGE_SIZE = 200; 

// Delay function for throttling requests
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getLastInsertedPage = async () => {
    try {
        const result = await client.query(`
            SELECT name FROM food ORDER BY name DESC LIMIT 1;
        `);
        if (result.rows.length > 0) {
            const lastFood = result.rows[0].name;
            console.log(`🔍 Last inserted food: ${lastFood}`);
            return estimatePageFromFoodName(lastFood);
        }
    } catch (error) {
        console.error("❌ Error fetching last inserted food:", error);
    }
    return 1; // Default to page 1 if no previous entries
};

const estimatePageFromFoodName = (foodName) => {
    const firstLetter = foodName[0].toLowerCase();
    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    const letterIndex = alphabet.indexOf(firstLetter);
    if (letterIndex === -1) return 1;
    return Math.max(1, Math.floor((letterIndex / 26) * 250));
};

// Function to clean and simplify food names while checking for potential duplicates
const normalizeName = async (name) => {
    let normalized = name.toLowerCase();

    // Remove descriptors inside parentheses
    normalized = normalized.replace(/\s*\(.*?\)\s*/g, '');

    // Remove extra spaces and capitalize first letter
    normalized = normalized.trim();
    normalized = normalized.charAt(0).toUpperCase() + normalized.slice(1);

    // Check if a simplified version already exists in the database
    const duplicateCheck = await client.query(
        `SELECT name FROM food WHERE name = $1 LIMIT 1;`,
        [normalized]
    );

    if (duplicateCheck.rows.length > 0) {
        console.warn(`⚠️ Duplicate detected: "${name}" simplified to "${normalized}" but already exists. Skipping...`);
        return null; // Return null to indicate that this should not be inserted
    }

    return normalized;
};

const fetchAndInsertFoodData = async () => {
    try {
        await client.connect();
        
        let pageNumber = await getLastInsertedPage();
        let totalFetched = 0;

        while (true) {
            console.log(`🔍 Fetching page ${pageNumber}...`);

            const response = await axios.get(BASE_URL, {
                params: {
                    api_key: API_KEY,
                    pageSize: PAGE_SIZE,
                    pageNumber: pageNumber,
                },
            });

            const foods = response.data;
            if (foods.length === 0) {
                console.log("✅ No more food items to fetch. Finished!");
                break;
            }

            for (const food of foods) {
                const normalizedName = await normalizeName(food.description);
                if (!normalizedName) continue; // Skip duplicates

                const category = food.foodCategory || 'Unknown';

                const query = `
                    INSERT INTO food (name, category)
                    VALUES ($1, $2)
                    ON CONFLICT (name) DO NOTHING;
                `;
                await client.query(query, [normalizedName, category]);
            }

            totalFetched += foods.length;
            console.log(`✅ Inserted ${foods.length} items. Total: ${totalFetched}`);

            pageNumber++;
            await delay(1000);
        }

    } catch (error) {
        console.error('❌ Error fetching or inserting food data:', error);
    } finally {
        await client.end();
    }
};

fetchAndInsertFoodData();
