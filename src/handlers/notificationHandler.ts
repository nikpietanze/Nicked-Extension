import { state } from "../background";

export function handleSalesNotifications() {
	if (state.alertQueue.length > 0) {
		chrome.notifications.create(
			"sale_alert",
			{
				iconUrl: chrome.runtime.getURL("/images/logo.png"),
				title: "Current Sales",
				message:
					"Don't miss out on your favorite products going on sale!",
				contextMessage: "Click to view your products",
				items: state.alertQueue,
				type: "list",
			},
			() => (state.alertQueue = []),
		);

		chrome.notifications.onClicked.addListener(() => {
			chrome.runtime.openOptionsPage();
		});
	}
}
