"use strict";

import { datapoint } from "../background";
import Product from "./product"

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

    async refresh(email: string, id?: number): Promise<User | null> {
        if (!id && !email) {
            throw new Error("invalid id & email");
        }

        try {
            if (id) {
                const res = await fetch("http://localhost:8080/api/user/" + id, {
                    method: "GET",
                    headers: {
                        Authorization: process.env.SERVER_API_KEY ?? "",
                    },
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data) {
                        return data;
                    }
                }
            } else {
                const res = await fetch("http://localhost:8080/api/user?email=" + email, {
                    method: "GET",
                    headers: {
                        Authorization: process.env.SERVER_API_KEY ?? "",
                    },
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data) {
                        return data;
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

    async updateEmail(email: string): Promise<boolean> {
        try {
            this.email = email;
            chrome.storage.sync.set({ user: this });

            const res = await fetch("http://localhost:8080/api/user", {
                method: "PUT",
                headers: {
                    Authorization: process.env.SERVER_API_KEY ?? "",
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

    async submit(): Promise<boolean> {
        try {
            const res = await fetch("http://localhost:8080/api/user", {
                method: "POST",
                headers: {
                    Authorization: process.env.SERVER_API_KEY ?? "",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email: this.email }),
            });
            if (res.ok) {
                const data = await res.json();
                await chrome.storage.sync.set({ user: data })
            }
        } catch (err: any) {
            console.error(err);
            datapoint.event = "nicked_ext_error";
            datapoint.location = "user_submit_email";
            datapoint.details = err.message;
            datapoint.send();
        }
        return false;
    }
}
