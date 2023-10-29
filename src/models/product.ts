"use strict";

import { user, datapoint } from "../background";
import Price from "./price";
import ProductSetting from "./productSetting";

export default class Product {
    id?: number;
    active: boolean = true;
    imageUrl?: string;
    onSale: boolean = false;
    name?: string;
    prices: Price[] = [];
    sku?: string;
    store: string = "amazon";
    url?: URL;

    /**
     * Parses the Product information to make sure it's ready to submit to the server
     *
     * @returns A boolean based on whether or not the Product is ready for submission
     */
    isReady(): boolean {
        if (this.name && this.sku && this.url) {
            return true;
        }
        return false;
    }

    /**
     * Calls the server to create a new product to be tracked
     *
     * @returns A boolean based on whether or not the Product was submitted successfully
     */
    async submitCreate(email: string): Promise<boolean> {
        try {
            const res = await fetch("http://localhost:8080/api/product", {
                method: "POST",
                headers: {
                    Authorization:
                        "basic " +
                        btoa(process.env.USERNAME + ":" + process.env.PASSWORD),
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: email,
                    name: this.name,
                    imageUrl: this.imageUrl,
                    onSale: this.onSale,
                    price: this.prices,
                    sku: this.sku,
                    store: this.store,
                    url: this.url?.href,
                    userId: user.id,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                if (data) {
                    this.id = data.Id;
                    this.active = data.Active;
                    this.imageUrl = data.ImageUrl;
                    this.onSale = data.OnSale;
                    this.name = data.Name;
                    this.store = data.Store;
                    this.sku = data.Sku;
                    this.url = data.Url;
                    if (data.Prices && data.Prices.length) {
                        data.Prices.forEach((price: any) => {
                            const pr = new Price();
                            pr.id = price.Id;
                            pr.amount = price.Amount;
                            pr.currency = price.Currency;
                        });
                    }
                    user.products?.push(this);
                    return true;
                }
            }
        } catch (err: any) {
            console.error(err);
            datapoint.event = "nicked_ext_error";
            datapoint.location = "product_submit_create";
            datapoint.details = err.message;
            datapoint.send();
        }
        return false;
    }

    /**
     * Parses the user to determine if the current Product is being tracked or not
     *
     * @returns A boolean based on whether or not the Product is being tracked
     */
    async isBeingTracked(): Promise<boolean> {
        let tracking = false;
        if (user.products && user.products.length) {
            user.products.forEach((product) => {
                if (
                    product.sku?.toLowerCase() === this.sku?.toLowerCase() &&
                    product.store.toLowerCase() === this.store.toLowerCase()
                ) {
                    tracking = ProductSetting.isActive(product.id);
                }
            });
        }
        return tracking;
    }

    /**
     * Calls the server to update the product with active: true
     *
     * @returns A boolean based on whether or not the Product was successfully updated
     */
    static async setActive(id: string): Promise<boolean> {
        try {
            const res = await fetch(`http://localhost:8080/api/product/${id}`, {
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
                for (let i = 0; i < user.products.length; i++) {
                    const p = user.products[i];
                    if (p.id === parseInt(id)) {
                        p.active = true;
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
            const res = await fetch(`http://localhost:8080/api/product/${id}`, {
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
                for (let i = 0; i < user.products.length; i++) {
                    const p = user.products[i];
                    if (p.id === parseInt(id)) {
                        p.active = false;
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

    /**
     * Calls the server to delete the product
     *
     * @returns A boolean based on whether or not the Product was successfully deleted
     */
    static async delete(id: string): Promise<boolean> {
        try {
            const res = await fetch(`http://localhost:8080/api/product/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization:
                        "basic " +
                        btoa(process.env.USERNAME + ":" + process.env.PASSWORD),
                    "Content-Type": "application/json",
                },
            });
            if (res.ok) {
                user.products = user.products.filter(
                    (p) => p.id !== parseInt(id),
                );
                await chrome.storage.sync.set({ user: user });
                return true;
            }
        } catch (err: any) {
            console.error(err);
            datapoint.event = "nicked_ext_error";
            datapoint.location = "product_delete";
            datapoint.details = err.message;
            datapoint.send();
        }
        return false;
    }
}
