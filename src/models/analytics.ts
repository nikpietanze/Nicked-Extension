"use strict"

export default class DataPoint {
    event?: string;
    location?: string;
    page?: string;
    details?: string;
    data1?: string;
    data2?: string;

    constructor(
        event?: string,
        location?: string,
        page?: string,
        details?: string,
        data1?: string,
        data2?: string
    ) {
        this.event = event;
        this.location = location;
        this.page = page;
        this.details = details;
        this.data1 = data1;
        this.data2 = data2;
    }

    isReady(): boolean {
        if (this.event && this.page) {
            return true;
        }
        return false;
    }

    async send(): Promise<boolean> {
        if (!this.isReady) {
            return false;
        }

        try {
            const res = await fetch("/api/analytics", {
                method: "POST",
                headers: {
                    "Authorization": process.env.SERVER_API_KEY ?? "",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    event: this.event,
                    page: this.page,
                    data1: this.data1,
                    data2: this.data2,
                })
            })

            if (res.ok) {
                return true;
            }
        } catch (err) {
            console.error(err);
        }
        return false;
    }
}
