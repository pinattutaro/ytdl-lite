const axios = require('axios');
const path = require('path');
const ytdl = require('youtube-dl-exec').create(path.join(__dirname, 'yt-dlp.exe'));

const apikey = "AIzaSyBNvlPSlZNCQP7cTI0lnfoGUsLzCPAWEDA";

const getVideoDetails = async (ytid) => {
	let url = 'https://www.googleapis.com/youtube/v3/videos';
	url += '?part=snippet'; // レスポンスに含める情報を指定
	url += '&id=' + ytid; // 取得する動画IDを指定
	url += '&key=' + apikey; // APIキーを指定
	console.log(url);

	try {
		const response = await axios.get(url);
		return response.data.items[0];
	} catch (error) {
		console.error('Error fetching video details:', error);
	}
}

const getStream = async (vid) => {
    try {
        const info = await getVideoDetails(vid);
        const snippet = info.snippet;
        console.log("Getting stream URL for:", snippet.title);

        const formats = await ytdl(`https://www.youtube.com/watch?v=${vid}`, {
            dumpJson: true,
        });

        const videoFormat = formats.formats
            .filter(f => f.vcodec && f.acodec) // ビデオとオーディオ両方
            .sort((a, b) => b.height - a.height)[0];

        if (!videoFormat) {
            throw new Error("No suitable format found");
        }

        const title = `${snippet.channelTitle}-${snippet.title}`.replace(/\s/g,"").replace(/[\\/:*?"<>|\0]/g, '');

        return {
            title: title,
            thumbnail: snippet.thumbnails.high.url,
            url: videoFormat.url
        };
    } catch (err) {
        console.error('Error fetching stream URL:', err);
        return {
            title: 'Error',
            thumbnail: '',
            url: ''
        };
    }
}

module.exports = {
    getStream
};