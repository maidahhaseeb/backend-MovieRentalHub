const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());

// Endpoint to fetch top 5 rented movies
app.get('/top-rented-movies', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                f.title AS film_title,
                COUNT(*) AS times_rented
            FROM
                film AS f
            INNER JOIN
                inventory AS i ON f.film_id = i.film_id
            INNER JOIN
                rental AS r ON i.inventory_id = r.inventory_id
            GROUP BY
                f.title
            ORDER BY
                times_rented DESC
            LIMIT 5;
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// Endpoint to fetch movie details by ID including category name
app.get('/movie/:id', async (req, res) => {
  try {
    console.log('Received request for /movie/:id with ID:', req.params.id); // Log incoming request
      const [rows] = await db.query(`
          SELECT
              f.film_id,
              f.title,
              f.release_year,
              f.language_id,
              f.rental_duration,
              f.rental_rate,
              f.length,
              f.replacement_cost,
              f.rating,
              f.special_features,
              c.name AS category_name
          FROM
              film AS f
          INNER JOIN
              film_category AS fc ON f.film_id = fc.film_id
          INNER JOIN
              category AS c ON fc.category_id = c.category_id
          WHERE
              f.title = ?
      `, [req.params.id]);
      if (!rows || rows.length === 0){
        console.error('No data found for ID:', req.params.id);
        return res.status(404).send('Movie not found');
      }
      console.log('Sending response:', rows[0]);
      res.json(rows[0]);
  } catch (err) {
      console.error('Error fetching movie details:', err);
      res.status(500).send('Server error');
  }
});


// Endpoint to fetch top 5 actors
app.get('/top-actors', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                a.actor_id,
                CONCAT(a.first_name, ' ', a.last_name) AS actor_name,
                COUNT(fa.film_id) AS movie_count
            FROM
                actor AS a
            LEFT JOIN
                film_actor AS fa ON a.actor_id = fa.actor_id
            GROUP BY
                a.actor_id
            ORDER BY
                movie_count DESC
            LIMIT 5;
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// Endpoint to fetch actor details and their top 5 rented movies
// Note: You may need to define the criteria for 'top 5 rented movies' of an actor and adjust the query accordingly.
app.get('/actor/:id', async (req, res) => {
    try {
        // Example: Fetching actor details
        const [actorDetails] = await db.query(`
            SELECT *
            FROM actor
            WHERE actor_id = ?
        `, [req.params.id]);
        
        if (actorDetails.length === 0) return res.status(404).send('Actor not found');

        // Example: Fetching actor's movies (Adjust the query to fetch top 5 rented movies)
        const [movies] = await db.query(`
            SELECT f.film_id, f.title
            FROM film AS f
            INNER JOIN film_actor AS fa ON f.film_id = fa.film_id
            WHERE fa.actor_id = ?
        `, [req.params.id]);

        res.json({
            actor: actorDetails[0],
            movies: movies
        });
    } catch (err) {
        res.status(500).send('Server error');
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));


app.get('/test-db-connection', async (req, res) => {
  try {
      await db.query('SELECT 1+1 AS result'); // Simple query to test the connection
      res.send('Database connection successful');
  } catch (error) {
      console.error('Database connection error:', error);
      res.status(500).send('Database connection error');
  }
});

