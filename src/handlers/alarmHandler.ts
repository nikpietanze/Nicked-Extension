import { user, state } from "../background";

export async function handleRefreshingSales() {
	const currentSales = [];
	for (let i = 0; i < user.products.length; i++) {
		const p = user.products[i];
		if (p.active) {
			currentSales.push(p);
		}
	}

	const newSales = [];
	await user.refresh(user.email, user.id);
	for (let i = 0; i < user.products.length; i++) {
		const p = user.products[i];
		if (p.active) {
			newSales.push(p);
		}
	}

	for (let i = 0; i < newSales.length; i++) {
		const np = newSales[i];
		for (let j = 0; j < currentSales.length; j++) {
			const op = currentSales[j];
			if (op.sku === np.sku) {
				if (np.onSale && !op.onSale) {
					if (np.name && np.url) {
						state.alertQueue.push({
							title: np.name,
							message: np.url.toString(),
						});
					}
				}
			}
		}
	}
}
