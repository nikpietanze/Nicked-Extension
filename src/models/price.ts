"use strict";

export default class Price {
    id?: number;
    amount?: string;
    currency: string = "USD";

	parseCurrencySymbol(symbol: string): string {
		if (symbol === "$") {
			return "USD";
		}
		return "USD";
	}
}
