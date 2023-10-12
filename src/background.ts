"use strict";

import User from "./models/user";
import type Sync from "./types/sync.d.ts"
import State from "./models/state";
import messageHandler from "./handlers/messageHandler";
import DataPoint from "./models/analytics"

export const user = new User();
export const state = new State();
export const datapoint = new DataPoint();

(async () => {
    if (state.isInstalling) {
        chrome.storage.sync.set(user);
        state.isInstalling = false;
        chrome.storage.sync.set(state);
    }

    try {
        const sync: Sync = await chrome.storage.sync.get() as Sync;
        Object.assign(user, sync.user);
        Object.assign(state, sync.state);
    } catch (err: any) {
        console.error(err);
        datapoint.event = "nicked_ext_error";
        datapoint.location = "failed_to_get_sync";
        datapoint.details = err.message;
        datapoint.send();
    }
})();

chrome.runtime.onMessage.addListener(messageHandler);
