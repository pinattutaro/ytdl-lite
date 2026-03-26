const express = require('express');
const app = express();

const PORT = 9600;
const HOST = "192.168.1.2";

const { getStream } = require('./service');

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

getStream("GjC4SznBD_A")
    .then(info => console.log("Stream info:", info))
    .catch(err => console.error("Error:", err));