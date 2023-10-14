"use strict";

import { datapoint } from "../background";

export default class User {
	email: string;

	constructor(email?: string) {
		this.email = email?.toLowerCase() ?? "";
	}

	validateEmail(email: string): boolean {
		return email.includes("@") && email.includes(".");
	}

	async update(email: string): Promise<boolean> {
		try {
			const res = await fetch("/api/user", {
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
			const res = await fetch("/api/user", {
				method: "POST",
				headers: {
					Authorization: process.env.SERVER_API_KEY ?? "",
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email: this.email }),
			});
			if (res.ok) {
				return true;
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
