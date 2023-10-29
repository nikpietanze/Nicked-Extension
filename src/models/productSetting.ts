"use strict";

import { user, datapoint } from "../background";

export default class ProductSetting {
    id?: number;
    active: boolean = true;
    productId?: number;

    /**
     * Parses the Product Settings to determine if the product is being tracked
     *
     * @returns A boolean based on whether or not the Product is active
     */
    static isActive(productId: number | undefined): boolean {
        if (user.productSettings && user.productSettings.length) {
            for (let i = 0; i < user.productSettings.length; i++) {
                const setting = user.productSettings[i];
                if (setting.productId == productId) {
                    console.log("product setting found", setting.active)
                    return setting.active;
                }
            }
        }
        return false;
    }

    /**
     * Calls the server to update the product with active: true
     *
     * @returns A boolean based on whether or not the Product was successfully updated
     */
    static async setActive(id: string): Promise<boolean> {
        try {
            const res = await fetch(`http://localhost:8080/api/product-settings/${id}`, {
                method: "PUT",
                headers: {
                    Authorization:
                        "basic " +
                        btoa(process.env.USERNAME + ":" + process.env.PASSWORD),
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    active: true,
                }),
            });
            if (res.ok) {
                for (let i = 0; i < user.productSettings.length; i++) {
                    const s = user.productSettings[i];
                    if (s.id === parseInt(id)) {
                        s.active = true;
                        await chrome.storage.sync.set({ user: user });
                    }
                }
                return true;
            }
        } catch (err: any) {
            console.error(err);
            datapoint.event = "nicked_ext_error";
            datapoint.location = "product_set_active";
            datapoint.details = err.message;
            datapoint.send();
        }
        return false;
    }

    /**
     * Calls the server to update the product with active: false
     *
     * @returns A boolean based on whether or not the Product was successfully updated
     */
    static async setNotActive(id: string): Promise<boolean> {
        try {
            const res = await fetch(`http://localhost:8080/api/product-settings/${id}`, {
                method: "PUT",
                headers: {
                    Authorization:
                        "basic " +
                        btoa(process.env.USERNAME + ":" + process.env.PASSWORD),
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    active: false,
                }),
            });
            if (res.ok) {
                for (let i = 0; i < user.productSettings.length; i++) {
                    const s = user.productSettings[i];
                    if (s.id === parseInt(id)) {
                        s.active = false;
                        await chrome.storage.sync.set({ user: user });
                    }
                }
                return true;
            }
        } catch (err: any) {
            console.error(err);
            datapoint.event = "nicked_ext_error";
            datapoint.location = "product_set_not_active";
            datapoint.details = err.message;
            datapoint.send();
        }
        return false;
    }
}
