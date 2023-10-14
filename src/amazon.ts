"use strict";

import Product from "./models/product";
import { user, datapoint } from "./background";
import submitEmailModal from "./views/modals/submitEmailModal";

const product = new Product();
product.url = new URL(window.location.href);
product.store = "amazon";
datapoint.page = product.url.href;

const state = {
	loading: false,
	buttonAttempts: 0,
	errorReported: false,
};

function setTrackBtnLoading(btn: HTMLButtonElement) {
	if (btn) {
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

function setTrackBtnSuccess(btn: HTMLButtonElement) {
	console.log("setting button to success");
	if (btn) {
		state.loading = false;
		btn.innerText = "Tracking Sales!";
	}
}

function setTrackBtnError(btn: HTMLButtonElement) {
	console.log("setting button to error");
	if (btn) {
		state.loading = false;
		btn.innerText = "Whoops, something's wrong";
	}
}

function watchForBuyButton(priceTrackBtn: HTMLButtonElement) {
	const buyNowBtn = document.querySelector("#buyNow_feature_div");
	if (buyNowBtn) {
		buyNowBtn.appendChild(priceTrackBtn);
		priceTrackBtn.addEventListener("click", async (e) => {
			console.log("btn clicked");
			e.preventDefault();
			state.loading = true;
			setTrackBtnLoading(priceTrackBtn);

			const success = await parseProduct();
			if (success) {
				setTrackBtnSuccess(priceTrackBtn);
			} else {
				setTrackBtnError(priceTrackBtn);
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

async function parseProduct(): Promise<boolean> {
	const nameEl: HTMLSpanElement | null =
		document.querySelector("#productTitle");
	if (nameEl) {
		product.name = nameEl.innerText.trim();
	}

	const currencySymbolEl: HTMLSpanElement | null = document.querySelector(
		"span.a-price-symbol",
	);
	if (currencySymbolEl) {
		product.currency = product.parseCurrencySymbol(
			currencySymbolEl.innerText,
		);
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
							product.currency = product.parseCurrencySymbol(
								priceMaxEl.innerHTML.substring(0, 1),
							);
							product.price = parseFloat(
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
				product.price = priceWholeEls[1].innerText
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
				product.price += "." + priceFractionEls[1].innerText;
			} catch (err: any) {
				console.error(err);
				datapoint.event = "nicked_ext_error";
				datapoint.location = "amazon_fraction_price";
				datapoint.details = err.message;
				datapoint.send();
			}
		}
	}

	if (product.isReady()) {
		try {
			if (!user.email) {
				console.log("firing email modal");
			} else {
				const success = await product.submitCreate(user.email);
				if (!success) {
					return false;
				} else {
					return true;
				}
			}
		} catch (err: any) {
			console.error(err);
			datapoint.event = "nicked_ext_error";
			datapoint.location = "amazon_product_is_ready";
			datapoint.details = err.message;
			datapoint.send();
		}
	}
	return false;
}

document.addEventListener("DOMContentLoaded", () => {
	if (product.url?.pathname.includes("/dp/")) {
		const pathParts = product.url.pathname.split("/");
		product.sku = pathParts[pathParts.indexOf("dp") + 1];

		const priceTrackBtn = document.createElement("button");
		priceTrackBtn.innerText = "Watch For Sales";
		Object.assign(priceTrackBtn.style, {
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

		watchForBuyButton(priceTrackBtn);
	}
});
