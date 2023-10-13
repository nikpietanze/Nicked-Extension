'use strict';

import Product from "./models/product";
import { user, datapoint } from "./background"

const product = new Product();
product.url = new URL(window.location.href);
product.store = "amazon";
datapoint.page = product.url.href;

const state = {
    buttonAttempts: 0,
    errorReported: false,
}

function watchForBuyButton(priceTrackBtn: HTMLButtonElement) {
    const buyNowBtn = document.querySelector("#buyNow_feature_div");
    if (buyNowBtn) {
        buyNowBtn.appendChild(priceTrackBtn);
        priceTrackBtn.addEventListener("click", (e) => {
            e.preventDefault();
            parseProduct()
        });
        return;
    } else {
        if (state.buttonAttempts === 10 && !state.errorReported) {
            datapoint.event = "nicked_ext_error";
            datapoint.location = "amazon_buy_now_button_not_found"
            datapoint.details = "";
            datapoint.send().then(() => state.errorReported = true);
        }
        state.buttonAttempts += 1;
    }

    setTimeout(() => watchForBuyButton(priceTrackBtn), 1000);
}

async function parseProduct() {
    const nameEl: HTMLSpanElement | null = document.querySelector("#productTitle");
    if (nameEl) {
        product.name = nameEl.innerText.trim();
    }

    const currencySymbolEl: HTMLSpanElement | null = document.querySelector("span.a-price-symbol");
    if (currencySymbolEl) {
        product.currency = product.parseCurrencySymbol(currencySymbolEl.innerText);
    }

    const priceRangeEls: NodeListOf<HTMLSpanElement> = document.querySelectorAll("span.a-price-range");
    if (priceRangeEls.length) {
        priceRangeEls.forEach((priceRangeEl) => {
            if (priceRangeEl) {
                const children = priceRangeEl.children;
                if (children) {
                    const priceMaxContainer = children[children.length - 1];
                    if (priceMaxContainer) {
                        try {
                            const priceMaxEl = priceMaxContainer.children[0];
                            product.currency = product.parseCurrencySymbol(priceMaxEl.innerHTML.substring(0, 1));
                            product.price = parseFloat(priceMaxEl.innerHTML.substring(1)).toFixed(2);
                        } catch (err: any) {
                            console.error(err);
                            datapoint.event = "nicked_ext_error";
                            datapoint.location = "amazon_price_range"
                            datapoint.details = err.message;
                            datapoint.send();
                        }
                    }
                }
            }
        })
    } else {
        const priceWholeEls: NodeListOf<HTMLSpanElement> = document.querySelectorAll("span.a-price-whole");
        const priceFractionEls: NodeListOf<HTMLSpanElement> = document.querySelectorAll("span.a-price-fraction");

        if (priceWholeEls.length) {
            try {
                product.price = priceWholeEls[1].innerText.replace(".", "").trim();
            } catch (err: any) {
                console.error(err);
                datapoint.event = "nicked_ext_error";
                datapoint.location = "amazon_whole_price"
                datapoint.details = err.message;
                datapoint.send();
            }
        };
        if (priceFractionEls) {
            try {
                product.price += "." + priceFractionEls[1].innerText;
            } catch (err: any) {
                console.error(err);
                datapoint.event = "nicked_ext_error";
                datapoint.location = "amazon_fraction_price"
                datapoint.details = err.message;
                datapoint.send();
            }
        };
    }

    if (product.isReady()) {
        try {
            if (!user.email) {
                console.log("firing email modal");
                // TODO: fire email collection modal
            } else {
                const success = await product.submitCreate(user.email);
                if (!success) {
                    // TODO: handle a failed create
                }
            }
        } catch (err: any) {
            console.error(err);
            datapoint.event = "nicked_ext_error";
            datapoint.location = "amazon_product_is_ready"
            datapoint.details = err.message;
            datapoint.send();
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (product.url?.pathname.includes("/dp/")) {
        const pathParts = product.url.pathname.split("/");
        product.sku = pathParts[pathParts.indexOf("dp") + 1];

        const priceTrackBtn = document.createElement("button");
        priceTrackBtn.innerText = "Watch For Sales";
        Object.assign(priceTrackBtn.style, {
            "width": "100%",
            "padding": "8px",
            "marginTop": "-5px",
            "marginBottom": "10px",
            "backgroundColor": "rgb(55 48 163 / 1)",
            "borderColor": "rgb(60 53 168 / 1)",
            "borderRadius": "100px",
            "color": "#ffffff",
            "transition": "all 0.3s ease",
            "boxShadow": "0 2px 5px 0 rgba(213,217,217,.5)",
            "borderStyle": "solid",
            "borderWidth": "1px",
            "cursor": "pointer",
            "display": "inline-block",
            "textAlign": "center",
            "textDecoration": "none!important",
            "verticalAlign": "middle",
        });

        watchForBuyButton(priceTrackBtn);
    }
})

