const express = require('express');
const app = express();

const PORT = Number(process.env.PORT || 9600);
const HOST = process.env.HOST || '0.0.0.0';

const { getStream } = require('./service');

app.get('/', (_req, res) => {
    res.status(200).send('ok');
});

app.get("/ytdl/:id", async (req, res) => {
    const id = req.params.id;
    
    const streamInfo = await getStream(id);
    console.log("Stream info:", streamInfo);

    res.json({
        ...streamInfo,
        // Keep aliases for extension-side compatibility.
        videoStream: streamInfo.url || "",
        tittle: streamInfo.title || ""
    });
});

app.listen(PORT, HOST, () => {
    console.log(`Server is running at http://${HOST}:${PORT}`);
});