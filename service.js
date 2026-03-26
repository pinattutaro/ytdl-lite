const axios = require('axios');
const ytdl = require('@distube/ytdl-core');

const apikey = process.env.YOUTUBE_API_KEY;

const getVideoDetails = async (ytid) => {
    if (!apikey) {
        throw new Error('YOUTUBE_API_KEY is not set');
    }

	let url = 'https://www.googleapis.com/youtube/v3/videos';
	url += '?part=snippet'; // レスポンスに含める情報を指定
	url += '&id=' + ytid; // 取得する動画IDを指定
	url += '&key=' + apikey; // APIキーを指定
	console.log(url);

	try {
		const response = await axios.get(url);
        const firstItem = response?.data?.items?.[0];
        if (!firstItem) {
            throw new Error('Video details not found');
        }

        return firstItem;
	} catch (error) {
		console.error('Error fetching video details:', error);
        throw error;
	}
}

const getStream = async (vid) => {
    try {
        const info = await getVideoDetails(vid);
        const snippet = info.snippet;
        console.log("Getting stream URL for:", snippet.title);

        const videoInfo = await ytdl.getInfo(`https://www.youtube.com/watch?v=${vid}`);
        const videoFormat = ytdl.chooseFormat(videoInfo.formats, {
            quality: 'highest',
            filter: 'audioandvideo'
        });

        if (!videoFormat || !videoFormat.url) {
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
            url: '',
            error: String(err && err.message ? err.message : err)
        };
    }
}

module.exports = {
    getStream
};