'use strict';

import Product from "./models/product";
import { user, datapoint } from "./background"

(async () => {
    const product = new Product();
    product.url = new URL(window.location.href);

    if (product.url.pathname.includes("/dp/")) {
        const pathParts = product.url.pathname.split("/");
        product.sku = pathParts[pathParts.indexOf("dp") + 1];

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
                await product.submitCreate(user.email);
            } catch (err: any) {
                console.error(err);
                datapoint.event = "nicked_ext_error";
                datapoint.location = "amazon_product_is_ready"
                datapoint.details = err.message;
                datapoint.send();
            }
        }
    }
})();

