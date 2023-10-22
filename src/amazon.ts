"use strict";

import Product from "./models/product";
import Price from "./models/price";
import { user, datapoint } from "./background";
import emailModal from "./views/modals/emailModal";

const product = new Product();
product.url = new URL(window.location.href);
product.store = "amazon";
datapoint.page = product.url.href;

const state = {
	loading: false,
	buttonAttempts: 0,
	errorReported: false,
	tracking: false,
};

const btnImageStyles = {
	position: "absolute",
	top: "51%",
	left: "4px",
	transform: "translateY(-50%)",
	width: "25px",
	height: "25px",
};

document.addEventListener("DOMContentLoaded", async () => {
	console.log(user);

	if (product.url?.pathname.includes("/dp/")) {
		const pathParts = product.url.pathname.split("/");
		product.sku = pathParts[pathParts.indexOf("dp") + 1];

		try {
			state.tracking = await product.isBeingTracked();
		} catch (err: any) {
			console.error(err);
			datapoint.event = "nicked_ext_error";
			datapoint.location = "amazon_product_page";
			datapoint.details = err.message;
			datapoint.data1 = "tracking_detection";
			datapoint.send();
		}

		const priceTrackBtn = createBtn();

		watchForBuyButton(priceTrackBtn);
	}
});

function createBtn(): HTMLButtonElement {
	const btn = document.createElement("button");
	const img = document.createElement("img");
	img.src = chrome.runtime.getURL("/images/logo_icon.png");
	Object.assign(img.style, btnImageStyles);
	btn.innerText = state.tracking ? "Tracking Sales" : "Watch For Sales";
	Object.assign(btn.style, {
		position: "relative",
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
		width: "100%",
		padding: "8px",
		marginTop: "-5px",
		marginBottom: "10px",
		backgroundColor: "rgb(55 48 163 / 1)",
		borderColor: "rgb(60 53 168 / 1)",
		borderRadius: "100px",
		color: "#ffffff",
		transition: "all 0.3s ease",
		boxShadow: "0 2px 5px 0 rgba(213,217,217,.5)",
		borderStyle: "solid",
		borderWidth: "1px",
		cursor: "pointer",
		textAlign: "center",
		textDecoration: "none!important",
	});
	Object.assign(img.style, btnImageStyles);
	btn.appendChild(img);
	return btn;
}

export function setTrackBtnReady(btn: HTMLButtonElement) {
	if (btn) {
		state.loading = false;
		console.log(btn);
		const img = document.createElement("img");
		img.src = chrome.runtime.getURL("/images/logo_icon.png");
		Object.assign(img.style, btnImageStyles);
		btn.innerText = "Watch For Sales";
		btn.appendChild(img);
	}
}

function setTrackBtnLoading(btn: HTMLButtonElement) {
	if (btn) {
		state.loading = true;

		btn.innerHTML = `
            Processing
            <span style="opacity:0;">.</span>
            <span style="opacity:0;">.</span>
            <span style="opacity:0;">.</span>
        `;
		let i = 0;

		const animation = setInterval(() => {
			if (!state.loading) {
				clearInterval(animation);
				return;
			}

			const dots = btn.querySelectorAll("span");

			if (i < 3) {
				dots[i].style.opacity = "1";
				i++;
			} else {
				dots.forEach((dot) => (dot.style.opacity = "0"));
				i = 0;
			}
		}, 250);
	}
}

export function setTrackBtnSuccess(btn: HTMLButtonElement) {
	if (btn) {
		state.loading = false;
		const img = document.createElement("img");
		img.src = chrome.runtime.getURL("/images/logo_icon.png");
		Object.assign(img.style, btnImageStyles);
		btn.innerText = "Tracking Sales";
		btn.appendChild(img);
	}
}

export function setTrackBtnError(btn: HTMLButtonElement) {
	if (btn) {
		state.loading = false;
		const img = document.createElement("img");
		img.src = chrome.runtime.getURL("/images/logo_icon.png");
		Object.assign(img.style, btnImageStyles);
		btn.innerText = "Whoops, something's wrong";
		btn.appendChild(img);
	}
}

function watchForBuyButton(priceTrackBtn: HTMLButtonElement) {
	const buyNowBtn = document.querySelector("#buyNow_feature_div");
	if (buyNowBtn) {
		buyNowBtn.appendChild(priceTrackBtn);

		priceTrackBtn.addEventListener("click", async (e) => {
			e.preventDefault();
			state.loading = true;
			setTrackBtnLoading(priceTrackBtn);

			if (!state.tracking) {
				const price = await parseProduct();
				product.prices.push(price);
				if (product.isReady()) {
					try {
						if (!user.email) {
							emailModal(product, priceTrackBtn);
						} else {
							const success = await product.submitCreate(
								user.email,
							);
							if (success) {
								state.tracking = true;
								setTrackBtnSuccess(priceTrackBtn);
							} else {
								state.tracking = false;
								setTrackBtnError(priceTrackBtn);
							}
						}
					} catch (err: any) {
						console.error(err);
						datapoint.event = "nicked_ext_error";
						datapoint.location = "amazon_product_is_ready";
						datapoint.details = err.message;
						datapoint.send();
					}
				} else {
					setTrackBtnError(priceTrackBtn);
				}
			} else {
				// TODO: stop tracking this product
				// product.stopTracking();
			}
		});
		return;
	} else {
		if (state.buttonAttempts === 10 && !state.errorReported) {
			datapoint.event = "nicked_ext_error";
			datapoint.location = "amazon_buy_now_button_not_found";
			datapoint.details = "";
			datapoint.send().then(() => (state.errorReported = true));
		}
		state.buttonAttempts += 1;
	}

	setTimeout(() => watchForBuyButton(priceTrackBtn), 1000);
}

async function parseProduct(): Promise<Price> {
	const savingsEl: HTMLSpanElement | null = document.querySelector(
		"span.savingsPercentage",
	);
	if (savingsEl && savingsEl.innerText !== "") {
		product.onSale = true;
	}

	const price = new Price();
	const nameEl: HTMLSpanElement | null =
		document.querySelector("#productTitle");
	if (nameEl) {
		product.name = nameEl.innerText.trim();
	}

	const productImage: HTMLImageElement | null = document.querySelector(
		"#imgTagWrapperId img",
	);
	if (productImage) {
		console.log(productImage);
		product.imageUrl = productImage.src;
	}

	const currencySymbolEl: HTMLSpanElement | null = document.querySelector(
		"span.a-price-symbol",
	);
	if (currencySymbolEl) {
		price.currency = price.parseCurrencySymbol(currencySymbolEl.innerText);
	}

	const priceRangeEls: NodeListOf<HTMLSpanElement> =
		document.querySelectorAll("span.a-price-range");
	if (priceRangeEls.length) {
		priceRangeEls.forEach((priceRangeEl) => {
			if (priceRangeEl) {
				const children = priceRangeEl.children;
				if (children) {
					const priceMaxContainer = children[children.length - 1];
					if (priceMaxContainer) {
						try {
							const priceMaxEl = priceMaxContainer.children[0];
							price.currency = price.parseCurrencySymbol(
								priceMaxEl.innerHTML.substring(0, 1),
							);
							price.amount = parseFloat(
								priceMaxEl.innerHTML.substring(1),
							).toFixed(2);
						} catch (err: any) {
							console.error(err);
							datapoint.event = "nicked_ext_error";
							datapoint.location = "amazon_price_range";
							datapoint.details = err.message;
							datapoint.send();
						}
					}
				}
			}
		});
	} else {
		const priceWholeEls: NodeListOf<HTMLSpanElement> =
			document.querySelectorAll("span.a-price-whole");
		const priceFractionEls: NodeListOf<HTMLSpanElement> =
			document.querySelectorAll("span.a-price-fraction");

		if (priceWholeEls.length) {
			try {
				price.amount = priceWholeEls[1].innerText
					.replace(".", "")
					.trim();
			} catch (err: any) {
				console.error(err);
				datapoint.event = "nicked_ext_error";
				datapoint.location = "amazon_whole_price";
				datapoint.details = err.message;
				datapoint.send();
			}
		}
		if (priceFractionEls) {
			try {
				price.amount += "." + priceFractionEls[1].innerText;
			} catch (err: any) {
				console.error(err);
				datapoint.event = "nicked_ext_error";
				datapoint.location = "amazon_fraction_price";
				datapoint.details = err.message;
				datapoint.send();
			}
		}
	}
	return price;
}
