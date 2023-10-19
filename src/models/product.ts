"use strict";

import { user, datapoint } from "../background";
import Price from "./price";

export default class Product {
    id?: number;
    active: boolean = true;
    imageUrl?: string;
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
                    price: this.prices,
                    sku: this.sku,
                    store: this.store,
                    url: this.url?.href,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                if (data) {
                    this.id = data.Id;
                    this.active = data.Active;
                    this.imageUrl = data.ImageUrl;
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
                if (product.sku === this.sku && product.store === this.store) {
                    tracking = product.active;
                }
            });
        }
        return tracking;
    }
}
