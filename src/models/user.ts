"use strict";

import { datapoint } from "../background";
import Product from "./product";
import Price from "./price";

export default class User {
	id?: number;
	email: string;
	products: Product[] = [];

	constructor(email?: string) {
		this.email = email?.toLowerCase() ?? "";
	}

	validateEmail(email: string): boolean {
		return email.includes("@") && email.includes(".");
	}

	/**
	 * Refrehes the user data and saves in sync storage
	 *
	 * @param email - The user's email address (required)
	 * @param id - The user's id (optional)
	 * @returns The current user instance if successful
	 */
	async refresh(email: string, id?: number): Promise<User | null> {
		if (!id && !email) {
			return null;
		}

		try {
			if (id) {
				const res = await fetch(
					"http://localhost:8080/api/user/" + id,
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

						if (data.Products && data.Products.length) {
							data.Products.forEach((product: any) => {
								const p = new Product();
								p.id = product.Id;
								p.active = product.Active;
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
					"http://localhost:8080/api/user?email=" + email,
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

						if (data.Products && data.Products.length) {
							data.Products.forEach((product: any) => {
								const p = new Product();
								p.id = product.Id;
								p.active = product.Active;
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
	async updateEmail(email: string): Promise<boolean> {
		try {
			this.email = email;
			chrome.storage.sync.set({ user: this });

			const res = await fetch("http://localhost:8080/api/user", {
				method: "PUT",
				headers: {
					Authorization:
						"basic " +
						btoa(process.env.USERNAME + ":" + process.env.PASSWORD),
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email }),
			});
			if (res.ok) {
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
