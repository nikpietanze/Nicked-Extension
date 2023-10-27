"use strict";

import { datapoint } from "../background";
import Product from "./product";
import Price from "./price";
import Sync from "../types/sync";

export default class User {
	id?: number;
	email: string;
	products: Product[] = [];
    emailAlerts: boolean = true;
    browserAlerts: boolean = true;

	constructor(email?: string) {
		this.email = email?.toLowerCase() ?? "";
	}

	validateEmail(email: string): boolean {
		return email.includes("@") && email.includes(".");
	}

	/**
	 * Refrehes the user data from sync storage
	 *
	 * @returns The current user instance if successful
	 */
	async refreshFromSync(): Promise<User | null> {
        try {
            const sync: Sync = await chrome.storage.sync.get("user") as Sync;
            if (sync && sync.user) {
                if (sync.user.id) {
                    this.id = sync.user.id;
                }
                if (sync.user.email) {
                    this.email = sync.user.email;
                }
                if (sync.user.products) {
                    this.products = sync.user.products;
                }
                if (sync.user.emailAlerts) {
                    this.emailAlerts = sync.user.emailAlerts;
                }
                if (sync.user.browserAlerts) {
                    this.browserAlerts = sync.user.browserAlerts;
                }
            }
        } catch(err: any) {
            console.error(err);
			datapoint.event = "nicked_ext_error";
			datapoint.location = "user_refresh_from_sync";
			datapoint.details = err.message;
			datapoint.send();
        }
		return null;
	}

	/**
	 * Refrehes the user data and saves in sync storage
	 *
	 * @param email - The user's email address (required)
	 * @param id - The user's id (optional)
	 * @returns The current user instance if successful
	 */
	async refresh(user: User): Promise<User | null> {
		if (!user.id && !user.email) {
			return null;
		}

		try {
			if (user.id) {
				const res = await fetch(
					"http://localhost:8080/api/user/" + user.id,
					{
						method: "GET",
						headers: {
							Authorization:
								"basic " +
								btoa(
									process.env.USERNAME +
										":" +
										process.env.PASSWORD,
								),
						},
					},
				);
				if (res.ok) {
					const data = await res.json();
					if (data) {
						this.id = data.Id;
						this.email = data.Email;
                        this.emailAlerts = user.emailAlerts;
                        this.browserAlerts = user.browserAlerts;

						if (data.Products && data.Products.length) {
							data.Products.forEach((product: any) => {
								const p = new Product();
								p.id = product.Id;
								p.active = product.Active;
								p.imageUrl = product.ImageUrl;
								p.onSale = product.OnSale;
								p.name = product.Name;
								p.store = product.Store;
								p.sku = product.Sku;
								p.url = product.Url;

								if (product.Prices && product.Prices.length) {
									product.Prices.forEach((price: any) => {
										const pr = new Price();
										pr.id = price.Id;
										pr.amount = price.Amount;
										pr.currency = price.Currency;
										p.prices.push(pr);
									});
								}

								this.products.push(p);
							});
						}

						await chrome.storage.sync.set({ user: this });
						return this;
					}
				}
			} else {
				const res = await fetch(
					"http://localhost:8080/api/user?email=" + user.email,
					{
						method: "GET",
						headers: {
							Authorization:
								"basic " +
								btoa(
									process.env.USERNAME +
										":" +
										process.env.PASSWORD,
								),
						},
					},
				);
				if (res.ok) {
					const data = await res.json();
					if (data) {
						this.id = data.Id;
						this.email = data.Email;
                        this.emailAlerts = user.emailAlerts;
                        this.browserAlerts = user.browserAlerts;

						if (data.Products && data.Products.length) {
							data.Products.forEach((product: any) => {
								const p = new Product();
								p.id = product.Id;
								p.active = product.Active;
								p.imageUrl = product.ImageUrl;
								p.onSale = product.OnSale;
								p.name = product.Name;
								p.store = product.Store;
								p.sku = product.Sku;
								p.url = product.Url;

								if (product.Prices && product.Prices.length) {
									product.Prices.forEach((price: any) => {
										const pr = new Price();
										pr.id = price.Id;
										pr.amount = price.Amount;
										pr.currency = price.Currency;
										p.prices.push(pr);
									});
								}

								this.products.push(p);
							});
						}

						await chrome.storage.sync.set({ user: this });
						return this;
					}
				}
			}
		} catch (err: any) {
			console.error(err);
			datapoint.event = "nicked_ext_error";
			datapoint.location = "user_refresh";
			datapoint.details = err.message;
			datapoint.send();
		}
		return null;
	}

	/**
	 * Sends a request to the server to update the user's email address
	 * and saves in sync storage
	 *
	 * @param email - The user's email address (required)
	 * @returns A boolean based on the success of the update
	 */
	async updateUser(): Promise<boolean> {
		try {
			const res = await fetch(`http://localhost:8080/api/user/${this.id}`, {
				method: "PUT",
				headers: {
					Authorization:
						"basic " +
						btoa(process.env.USERNAME + ":" + process.env.PASSWORD),
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
                    id: this.id,
                    email: this.email,
                    emailAlerts: this.emailAlerts,
                }),
			});
			if (res.ok) {
			    chrome.storage.sync.set({ user: this });
				return true;
			}
		} catch (err: any) {
			console.error(err);
			datapoint.event = "nicked_ext_error";
			datapoint.location = "user_update_email";
			datapoint.details = err.message;
			datapoint.send();
		}
		return false;
	}

	/**
	 * Sends a request to the server to create the user's account
	 * and saves in sync storage
	 *
	 * @returns The current user instance if successful
	 */
	async submit(): Promise<User | null> {
		try {
			const res = await fetch("http://localhost:8080/api/user", {
				method: "POST",
				headers: {
					Authorization:
						"basic " +
						btoa(process.env.USERNAME + ":" + process.env.PASSWORD),
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email: this.email }),
			});
			if (res.ok) {
				const data = await res.json();
				this.id = data.Id;
				this.email = data.Email;
				if (data.Products && data.Products.length) {
					data.Products.forEach((product: any) => {
						const p = new Product();
						p.id = product.Id;
						p.active = product.Active;
						p.imageUrl = product.ImageUrl;
						p.onSale = product.OnSale;
						p.name = product.Name;
						p.store = product.Store;
						p.sku = product.Sku;
						p.url = product.Url;
						if (product.Prices && product.Prices.length) {
							product.Prices.forEach((price: any) => {
								const pr = new Price();
								pr.id = price.Id;
								pr.amount = price.Amount;
								pr.currency = price.Currency;
								p.prices.push(pr);
							});
						}
						this.products.push(p);
					});
				}
				await chrome.storage.sync.set({ user: this });
				return this;
			}
		} catch (err: any) {
			console.error(err);
			datapoint.event = "nicked_ext_error";
			datapoint.location = "user_submit_email";
			datapoint.details = err.message;
			datapoint.send();
		}
		return null;
	}
}
