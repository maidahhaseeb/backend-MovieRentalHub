const express = require('express');
const cors = require('cors'); //importing the cors middleware
const app = express();
const port = process.env.PORT || 3001;

//use cors middleware to allow cross-origin requests from all origins
app.use(cors());

app.get('/health', (req, res) => {
  res.send('Hello from BackEnd!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
