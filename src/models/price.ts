"use strict";

export default class Price {
	id?: number;
	amount?: string;
	currency: string = "USD";

	/**
	 * Parses the currency symbol to determine the currency
	 *
	 * @returns A string with the currency abbreviation
	 */
	parseCurrencySymbol(symbol: string): string {
		if (symbol === "$") {
			return "USD";
		}
		return "USD";
	}
}
