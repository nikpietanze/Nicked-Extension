"use strict";

import { datapoint } from "../background";
import Price from "./price";
import Product from "./product";
import ProductSetting from "./productSetting";
import { Local, Sync } from "../types/storage";

export default class User {
    id?: number;
    email: string;
    products: Product[] = [];
    productSettings: ProductSetting[] = [];
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
     * @returns a bool if updating the user instance was successful
     */
    async refreshFromSync(): Promise<boolean> {
        try {
            const sync: Sync = await chrome.storage.sync.get() as Sync;
            if (sync && sync.user) {
                if (sync.user.id) {
                    this.id = sync.user.id;
                }
                if (sync.user.email) {
                    this.email = sync.user.email;
                }
                return true;
            }
        } catch (err: any) {
            console.error(err);
            datapoint.event = "nicked_ext_error";
            datapoint.location = "user_refresh_from_sync";
            datapoint.details = err.message;
            datapoint.send();
        }
        return false;
    }

    /**
     * Refrehes the user data from local storage
     *
     * @returns a bool if updating the user instance was successful
     */
    async refreshFromLocal(): Promise<boolean> {
        try {
            const local: Local = await chrome.storage.local.get() as Local;
            if (local && local.user) {
                if (local.user.id) {
                    this.id = local.user.id;
                }
                if (local.user.email) {
                    this.email = local.user.email;
                }
                if (local.user.products) {
                    this.products = local.user.products;
                }
                if (local.user.emailAlerts) {
                    this.emailAlerts = local.user.emailAlerts;
                }
                if (local.user.browserAlerts) {
                    this.browserAlerts = local.user.browserAlerts;
                }
                return true;
            }
        } catch (err: any) {
            console.error(err);
            datapoint.event = "nicked_ext_error";
            datapoint.location = "user_refresh_from_local";
            datapoint.details = err.message;
            datapoint.send();
        }
        return false;
    }

    /**
     * Refrehes the user data and saves in storage
     *
     * @param email - The user's email address (required)
     * @param id - The user's id (optional)
     * @returns The current user instance if successful
     */
    async refreshFromServer(): Promise<boolean> {
        if (!this.id && !this.email) {
            return false;
        }

        try {
            const url = "http://localhost:8080/api/user" +
                (this.id ? `/${this.id}` : `?email=${this.email}`);
            const res = await fetch(url, {
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
                    this.emailAlerts = data.EmailAlerts;

                    if (data.Products && data.Products.length) {
                        data.Products.forEach((product: any) => {
                            let exists = false;
                            for (let i = 0; i < this.products.length; i++) {
                                const p = this.products[i];
                                if (p.id === product.Id) {
                                    exists = true;
                                }
                            }

                            if (!exists) {
                                const p = new Product();
                                p.id = product.Id;
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
                            }
                        });
                    }

                    if (data.ProductSettings && data.ProductSettings.length) {
                        data.ProductSettings.forEach((setting: any) => {
                            const s = new ProductSetting();
                            s.id = setting.Id;
                            s.active = setting.Active;
                            s.productId = setting.ProductId;
                            this.productSettings.push(s);
                        })
                    }

                    await chrome.storage.sync.set({
                        user: {
                            id: this.id,
                            email: this.email,
                        }
                    })
                    await chrome.storage.local.set({ user: this });
                    return true;
                }
            }
        } catch (err: any) {
            console.error(err);
            datapoint.event = "nicked_ext_error";
            datapoint.location = "user_refresh";
            datapoint.details = err.message;
            datapoint.send();
        }
        return false;
    }

    /**
     * Sends a request to the server to update the user's email address
     * and saves in storage
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
                chrome.storage.sync.set({
                    user: {
                        id: this.id,
                        email: this.email,
                    }
                })
                chrome.storage.local.set({ user: this });
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
     * and saves in storage
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
                        let exists = false;
                        for (let i = 0; i < this.products.length; i++) {
                            const p = this.products[i];
                            if (p.id === product.Id) {
                                exists = true;
                            }
                        }

                        if (!exists) {
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
                        }
                    });
                }
                chrome.storage.sync.set({
                    user: {
                        id: this.id,
                        email: this.email,
                    }
                })
                await chrome.storage.local.set({ user: this });
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
