const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser'); // Add this line

const app = express();

// Parse JSON and urlencoded request bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Create a MySQL connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'reg_and_log',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Define a route for handling registration form submissions
app.post('/register', (req, res) => {
  // Extract the submitted form data
  const {nameInput, emailInput, passwordInput} = req.body;

  // Insert the form data into the "users" table
  const sql = "INSERT INTO users (name_node, email_node, password_node) VALUES (?, ?, ?)";
  pool.query(
    sql, 
    [nameInput, emailInput, passwordInput],
    (error, results, fields) => {
      if (error) {
        console.error(error);
        res.status(500).send('Internal server error');
      } else {
        console.log('User registered:', nameInput, emailInput);
        res.status(200).send('Registration successful');
      }
    }
  );
});

// Define a route for handling login form submissions
app.post('/login', (req, res) => {
  // Extract the submitted form data
  const { login_name, login_password } = req.body;

  // Check if the user with the given name and password exists
  pool.query(
    'SELECT * FROM users WHERE name_node = ? AND password_node = ?',
    [login_name, login_password],
    (error, results, fields) => {
      if (error) {
        console.error(error);
        res.status(500).send('Internal server error');
      } else if (results.length === 0) {
        console.log('Login failed:', login_name, login_password);
        res.status(401).send('Invalid username or password');
      } else {
        console.log('User logged in:', login_name);
        res.status(200).send('Login successful');
      }
    }
  );
});

// Start the server on port 9999
app.listen(9999, () => {
  console.log('Server started on port 9999');
});



// DATABASE database: 'reg_and_log   users (name_node, email_node, password_node)

//  C:\xampp\htdocs\aldas\RegiLogiNode\RegANDLog> node RegLogServer.js
