"use strict";

import { user, datapoint } from "../background";
import Price from "./price";

export default class Product {
    id?: number;
    active: boolean = true;
    name?: string;
    prices: Price[] = [];
	sku?: string;
	store: string = "amazon";
	url?: URL;

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
					Authorization: process.env.SERVER_API_KEY ?? "",
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					email,
					name: this.name,
					price: this.prices,
					sku: this.sku,
					store: this.store,
					url: this.url?.href,
				}),
			});
			if (res.ok) {
                const data = await res.json();
                if (data) {
                    user.products?.push(data);
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

    async isBeingTracked(email: string): Promise<boolean> {
        if (!this.sku || !this.store || !email) {
            return false;
        }

        try {
			const res = await fetch(`http://localhost:8080/api/product?email=${email}&store=${this.store}&sku=${this.sku}`, {
				method: "GET",
				headers: {
					Authorization: process.env.SERVER_API_KEY ?? "",
				},
			});
			if (res.ok) {
                const data = await res.json();
                return data.active;
			}
        } catch(err: any) {
			console.error(err);
			datapoint.event = "nicked_ext_error";
			datapoint.location = "product_is_being_tracked";
			datapoint.details = err.message;
			datapoint.send();
        }
        return false;
    }
}
