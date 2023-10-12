"use strict";

import { datapoint } from "../background";

interface Request {
    msg: string;
    data: any | null;
}

interface Response {
    success: boolean;
    error: Error | null;
    data: any | null;
}

export default (
    request: Request,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
): Response | boolean => {
    const { msg } = request;
    const res: Response = {
        success: false,
        error: null,
        data: null,
    };
    res.success = true;

    switch (msg) {
        case 'getCurrentTab':
            chrome.tabs.query({ active: true }).then((tabs) => {
                sendResponse(tabs[0]);
            }).catch((err: any) => {
                datapoint.event = "nicked_ext_error";
                datapoint.location = "message_handler_get_current_tab";
                datapoint.details = err.message;
                datapoint.send();
            });
            return true;
        case 'reloadTabs':
            chrome.tabs.query({}).then((tabs) =>
                tabs.forEach((tab) => {
                    if (tab.id) {
                        chrome.tabs.reload(tab.id);
                    }
                })
            ).catch((err: any) => {
                datapoint.event = "nicked_ext_error";
                datapoint.location = "message_handler_reload_tabs";
                datapoint.details = err.message;
                datapoint.send();
            });
            sendResponse(res);
            return true;
        default:
            res.data = { msg: 'No message provided' };
            sendResponse(res);
            return true;
    }
};
