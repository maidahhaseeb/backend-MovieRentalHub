const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Fairytail1111!!!!',
    database: 'sakila'
});

module.exports = pool.promise();


