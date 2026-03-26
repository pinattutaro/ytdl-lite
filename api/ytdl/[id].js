const { getStream } = require('../../service');

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const id = req.query.id;
    if (!id) {
        return res.status(400).json({ error: 'id is required' });
    }

    try {
        const streamInfo = await getStream(id);

        return res.status(200).json({
            ...streamInfo,
            videoStream: streamInfo.url || '',
            tittle: streamInfo.title || ''
        });
    } catch (error) {
        console.error('API error:', error);
        return res.status(500).json({
            title: 'Error',
            thumbnail: '',
            url: '',
            videoStream: '',
            tittle: '',
            error: 'Failed to fetch stream info'
        });
    }
};
