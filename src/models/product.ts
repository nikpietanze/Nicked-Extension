"use strict"

import { datapoint } from "../background";
import "dotenv/config"

export default class Product {
    currency?: string;
    name?: string;
    price?: string;
    sku?: string;
    store?: string;
    url?: URL;

    constructor(
        currency?: string,
        name?: string,
        price?: string,
        sku?: string,
        url?: URL
    ) {
        this.currency = currency;
        this.name = name;
        this.price = price;
        this.sku = sku;
        this.store = "amazon";
        this.url = url;
    }

    parseCurrencySymbol(symbol: string): string {
        if (symbol === "$") {
            return "USD";
        }
        return "USD";
    }

    isReady(): boolean {
        return this.currency !== "" &&
            this.name !== "" &&
            this.price !== "" &&
            this.sku !== "" &&
            this.url !== null;
    }

    async submitCreate(email: string): Promise<boolean> {
        console.log(this);
        return false;
        try {
            const res = await fetch("/api/price", {
                method: "POST",
                headers: {
                    "Authorization": process.env.SERVER_API_KEY ?? "",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    name: this.name,
                    price: this.price,
                    sku: this.sku,
                    store: this.store,
                    url: this.url?.href,
                }),
            });
            if (res.ok) {
                return true;
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
}
