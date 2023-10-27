"use strict";

import User from "./models/user";
import type Sync from "./types/sync.d.ts";
import State from "./models/state";
import messageHandler from "./handlers/messageHandler";
//import { handleRefreshingSales } from "./handlers/alarmHandler";
//import { handleSalesNotifications } from "./handlers/notificationHandler";
import DataPoint from "./models/analytics";

export const user = new User();
export const state = new State();
export const datapoint = new DataPoint();

(async () => {
	try {
		const sync: Sync = (await chrome.storage.sync.get()) as Sync;

		if (sync.user && sync.user.email) {
			await user.refresh(sync.user);

			for (let i = 0; i < user.products.length; i++) {
				const p = user.products[i];
				if (p.name && p.url && p.onSale) {
					state.alertQueue.push({
						title: p.name,
						message: p.url.toString(),
					});
				}
			}
		}
	} catch (err: any) {
		console.error(err);
		datapoint.event = "nicked_ext_error";
		datapoint.location = "failed_to_get_sync";
		datapoint.details = err.message;
		datapoint.send();
	}

	// TODO: Optimize notifications so they are informative but not annoying

    chrome.runtime.onMessage.addListener(messageHandler);
})();

