"use strict";

export default class State {
	isInstalling: boolean = true;
	isEnabled: boolean = true;
	isPinned: boolean = false;
    alertQueue: chrome.notifications.ItemOptions[] = [];
}
