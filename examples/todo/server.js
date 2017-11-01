const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());

app.get("/tasks", (req, res) => {
    res.send([]);
});

app.get('/', (req, res) => {
    res.sendFile("index.html", {
        root: __dirname
    });
});

const server = app.listen(3000, () => {
    const host = server.address().address;
    const port = server.address().port;

    console.log(`Example api listening at http://${host}:${port}`);
});