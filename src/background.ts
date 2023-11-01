"use strict";

import User from "./models/user";
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
        let success = await user.refreshFromLocal();
        if (!success) {
            await user.refreshFromSync();
        }

        success = await user.refreshFromServer();
        if (success) {
            if (user.products.length) {
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
        }
    } catch (err: any) {
        console.error(err);
        datapoint.event = "nicked_ext_error";
        datapoint.location = "failed_to_init_user";
        datapoint.details = err.message;
        datapoint.send();
    }
})();

chrome.alarms.create("refresh_data", { delayInMinutes: 1, periodInMinutes: 1440 })
chrome.alarms.onAlarm.addListener(async (alarm) => {
    switch (alarm.name) {
        case "refresh_data":
            await user.refreshFromServer();
            return;
    }
})

chrome.runtime.onMessage.addListener(messageHandler);

