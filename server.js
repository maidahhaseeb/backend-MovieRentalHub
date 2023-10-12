const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const port = process.env.PORT ||5000;
app.use(cors());
app.use(express.json());

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
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Endpoint to fetch movie details by ID including category name
app.get('/movie/:id', async (req, res) => {
  try {
    console.log('Received request for /movie/:id with ID:', req.params.id);
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
        f.film_id = ?
    `, [req.params.id]);
    if (!rows || rows.length === 0) {
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
    console.error(err);
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

    // Fetching actor's movies (Adjust the query to fetch top 5 rented movies)
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
    console.error('Error fetching actor details:', err);
    res.status(500).send('Server error');
  }
});

// Handling Customers Page from here onwards

// Endpoint to fetch a list of customers
app.get('/api/customers', async (req, res) => {
  try {
    const query = 'SELECT * FROM customer';
    const [results] = await db.query(query);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
// Search for customers
app.get('/api/customers/search', async(req, res) => {
    const searchTerm = req.query.searchTerm || ''; // Get the search term from the query parameter
    const searchField = req.query.searchField || 'first_name'; // Get the search field from the query parameter
    try {
        let query = 'SELECT * FROM customer';
    
        // Check the searchField and add a WHERE clause to the query based on the selected field
        if (searchField === 'customer_id') {
          query += ` WHERE customer_id LIKE '%${searchTerm}%'`;
        } else if (searchField === 'first_name') {
          query += ` WHERE first_name LIKE '%${searchTerm}%'`;
        } else if (searchField === 'last_name') {
          query += ` WHERE last_name LIKE '%${searchTerm}%'`;
        }
    
        const [results] = await db.query(query);
        res.json(results);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });
// Endpoint to add a new customer
app.post('/api/customers', async (req, res) => {
  try {
    const { customer_id, store_id, first_name, last_name, email } = req.body;
    const query = 'INSERT INTO customer (customer_id, store_id, first_name, last_name, email) VALUES (?, ?, ?, ?, ?)';
    await db.query(query, [customer_id, store_id, first_name, last_name, email]);
    res.json({ message: 'Customer added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to edit customer details
app.put('/api/customers/:customer_id', async (req, res) => {
  try {
    const { customer_id, store_id, first_name, last_name, email } = req.body;
    const { customer_id: customerId } = req.params;
    const query = 'UPDATE customer SET store_id = ? first_name = ?, last_name = ?, email = ? WHERE customer_id = ?';
    await db.query(query, [store_id, first_name, last_name, email, customerId]);
    res.json({ message: 'Customer updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to delete a customer by customer_id
app.delete('/api/customers/:customer_id', async (req, res) => {
  try {
    const { customer_id } = req.params;
    const query = 'DELETE FROM customer WHERE customer_id = ?';
    await db.query(query, customer_id);
    res.json({ message: 'Customer deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to view customer details by customer_id
app.get('/api/customers/details/:customer_id', async (req, res) => {
  try {
    const { customer_id } = req.params;
    const query = 'SELECT * FROM customer WHERE customer_id = ?';
    const [results] = await db.query(query, customer_id);

    if (results.length === 0) {
      res.status(404).json({ error: 'Customer not found' });
    } else {
      res.json(results[0]);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to mark movie return for a customer
app.put('/api/customers/return/:customer_id/:movie_id', async (req, res) => {
  try {
    const { customer_id, movie_id } = req.params;
    const query = 'UPDATE rental SET return_date = NOW() WHERE customer_id = ? AND inventory_id = ?';
    await db.query(query, [customer_id, movie_id]);
    res.json({ message: 'Movie marked as returned' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to unmark movie return for a customer
app.put('/api/customers/unreturn/:customer_id/:movie_id', async (req, res) => {
    try {
      const { customer_id, movie_id } = req.params;
      const query = 'UPDATE rental SET return_date = NULL WHERE customer_id = ? AND inventory_id = ?';
      await db.query(query, [customer_id, movie_id]);
      res.json({ message: 'Movie marked as not returned' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
// Test database connection
app.get('/test-db-connection', async (req, res) => {
  try {
    await db.query('SELECT 1+1 AS result'); // Simple query to test the connection
    res.send('Database connection successful');
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).send('Database connection error');
  }
});

app.listen(port, () => console.log(`Server is running on port ${port}}`));

    



