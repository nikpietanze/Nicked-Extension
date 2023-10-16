"use strict";

import config from "../../config/config";

export default class DataPoint {
	event?: string;
	location?: string;
	page?: string;
	details?: string;
	data1?: string;
	data2?: string;

	/**
	 * Parses the DataPoint information to make sure it's ready to submit to the server
	 *
	 * @returns A boolean based on whether or not the DataPoint is ready to submit
	 */
	isReady(): boolean {
		if (this.event && this.page) {
			return true;
		}
		return false;
	}

	/**
	 * Resets the DataPoint's non static values
	 */
	reset(): void {
		this.event = "";
		this.location = "";
		this.details = "";
		this.data1 = "";
		this.data2 = "";
	}

	/**
	 * Sends a request to the server to create the DataPoint
	 *
	 * @returns A boolean showing whether or not the call was successful
	 */
	async send(): Promise<boolean> {
		if (!this.isReady) {
			return false;
		}

		try {
			const res = await fetch("http://localhost:8080/api/analytics", {
				method: "POST",
				headers: {
					Authorization:
						"Basic " +
						btoa(config.AUTH_USERNAME + ":" + config.AUTH_PASSWORD),
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					event: this.event,
					location: this.location,
					page: this.page,
					details: this.details,
					data1: this.data1,
					data2: this.data2,
				}),
			});

			if (res.ok) {
				this.reset();
				return true;
			}
		} catch (err) {
			console.error(err);
		}
		this.reset();
		return false;
	}
}
