const API_BASE_URL = "http://192.168.1.2:9600";

function sanitizeFileName(name) {
	return String(name || "video")
		.replace(/[\\/:*?"<>|\0]/g, "")
		.replace(/\s+/g, " ")
		.trim();
}

function getVideoIdFromTab(tab) {
	if (!tab?.url) {
		return null;
	}

	try {
		const url = new URL(tab.url);
		if (url.hostname !== "www.youtube.com" || url.pathname !== "/watch") {
			return null;
		}

		return url.searchParams.get("v");
	} catch (_error) {
		return null;
	}
}

async function downloadByVideoId(videoId) {
	const response = await fetch(`${API_BASE_URL}/ytdl/${videoId}`);
	if (!response.ok) {
		throw new Error(`Server returned ${response.status}`);
	}

	const data = await response.json();
	const videoStream = data.videoStream || data.url;
	const title = data.tittle || data.title || `youtube-${videoId}`;

	if (!videoStream) {
		throw new Error("videoStream/url is empty");
	}

	const filename = `${sanitizeFileName(title)}.mp4`;

	await new Promise((resolve, reject) => {
		chrome.downloads.download(
			{
				url: videoStream,
				filename,
				saveAs: true,
			},
			() => {
				if (chrome.runtime.lastError) {
					reject(new Error(chrome.runtime.lastError.message));
					return;
				}

				resolve();
			}
		);
	});
}

chrome.action.onClicked.addListener(async (tab) => {
	const videoId = getVideoIdFromTab(tab);
	if (!videoId) {
		console.warn("Open a YouTube watch page before clicking the extension.");
		return;
	}

	try {
		await downloadByVideoId(videoId);
		console.log(`Download started for ${videoId}`);
	} catch (error) {
		console.error("Failed to start download:", error);
	}
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
	if (message?.type !== "DOWNLOAD_VIDEO") {
		return false;
	}

	const videoId = message.videoId;
	if (!videoId) {
		sendResponse({ ok: false, error: "videoId is required" });
		return false;
	}

	(async () => {
		try {
			await downloadByVideoId(videoId);
			sendResponse({ ok: true });
		} catch (error) {
			sendResponse({ ok: false, error: String(error.message || error) });
		}
	})();

	return true;
});
