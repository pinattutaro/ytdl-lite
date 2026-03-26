function getVideoIdFromUrl() {
	const params = new URLSearchParams(window.location.search);
	return params.get("v");
}

function waitForElement(selector, timeoutMs = 10000) {
	const immediate = document.querySelector(selector);
	if (immediate) {
		return Promise.resolve(immediate);
	}

	return new Promise((resolve) => {
		const observer = new MutationObserver(() => {
			const node = document.querySelector(selector);
			if (!node) {
				return;
			}

			observer.disconnect();
			clearTimeout(timer);
			resolve(node);
		});

		observer.observe(document.documentElement, { childList: true, subtree: true });

		const timer = setTimeout(() => {
			observer.disconnect();
			resolve(null);
		}, timeoutMs);
	});
}

let isInjectingButton = false;

async function ensureDownloadButton() {
	if (!location.href.includes("youtube.com/watch")) {
		return;
	}

	const existing = document.getElementById("ytdl-lite-download-btn");
	if (existing || isInjectingButton) {
		return;
	}

	isInjectingButton = true;

	const button = document.createElement("button");
	button.id = "ytdl-lite-download-btn";
	button.textContent = "Download Video";
	// button.style.position = "fixed";
	// button.style.right = "16px";
	// button.style.bottom = "16px";
	button.style.zIndex = "99999";
	button.style.padding = "10px 14px";
	button.style.border = "none";
	button.style.borderRadius = "8px";
	button.style.background = "#cc0000";
	button.style.color = "#ffffff";
	button.style.fontWeight = "700";
	button.style.cursor = "pointer";
	button.style.boxShadow = "0 4px 14px rgba(0,0,0,0.25)";

	button.addEventListener("click", () => {
		const videoId = getVideoIdFromUrl();
		if (!videoId) {
			alert("Video IDが取得できませんでした。");
			return;
		}

		button.disabled = true;
		button.textContent = "Requesting...";

		chrome.runtime.sendMessage({ type: "DOWNLOAD_VIDEO", videoId }, (result) => {
			button.disabled = false;
			button.textContent = "Download Video";

			if (!result || !result.ok) {
				const errorMessage = result?.error || "不明なエラー";
				alert(`ダウンロード開始に失敗しました: ${errorMessage}`);
				return;
			}

			alert(`ダウンロードを開始しました: ${result.title}`);
		});
	});

	const menuRenderer = await waitForElement("ytd-menu-renderer");
	if (menuRenderer) {
		menuRenderer.appendChild(button);
		isInjectingButton = false;
		return;
	}

	isInjectingButton = false;

	if (!document.body) {
		return;
	}

	// Fallback when YouTube action menu is not ready yet.
	button.style.position = "fixed";
	button.style.right = "16px";
	button.style.bottom = "16px";
	document.body.appendChild(button);
}

ensureDownloadButton();

// SPA navigation on YouTube requires re-checking periodically.
setInterval(ensureDownloadButton, 1500);
