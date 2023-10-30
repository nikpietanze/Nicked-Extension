"use strict";

import Product from "./models/product";
import Price from "./models/price";
import { user, datapoint } from "./background";
import {
    btnStyles,
    loaderStyles,
    loaderDotStyles,
    loaderDotBgs,
    loaderDotDelays,
    btnImgStyles
} from "./views/partials/amazonTrackBtn"
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

const elements = {
    buyBtn: document.createElement("button"),
    btn: document.createElement("button"),
    img: document.createElement("img"),
    loader: document.createElement("div"),
    dots: [
        document.createElement("div"),
        document.createElement("div"),
        document.createElement("div"),
        document.createElement("div"),
        document.createElement("div"),
        document.createElement("div"),
    ],
};

(() => {
    initBtn();
    watchForBuyBtn();
})()

document.addEventListener("DOMContentLoaded", async () => {
    try {
        await user.refreshFromSync();
    } catch (err) {
        console.error(err);
    }

    if (product.url?.pathname.includes("/dp/")) {
        const pathParts = product.url.pathname.split("/");
        product.sku = pathParts[pathParts.indexOf("dp") + 1];

        try {
            state.tracking = await product.isBeingTracked();
            if (state.tracking) {
                setBtnTracking();
            } else {
                setBtnReady();
            }
        } catch (err: any) {
            console.error(err);
            datapoint.event = "nicked_ext_error";
            datapoint.location = "amazon_product_page";
            datapoint.details = err.message;
            datapoint.data1 = "tracking_detection";
            datapoint.send();
        }
    }
})

function initBtn(): HTMLButtonElement {
    Object.assign(elements.btn.style, btnStyles);
    Object.assign(elements.loader.style, loaderStyles);
    elements.btn.classList.add("nicked-amazon-track-btn", "a-button-text");
    elements.img.src = chrome.runtime.getURL("/images/logo_icon.png");
    Object.assign(elements.img.style, btnImgStyles);
    elements.btn.appendChild(elements.img);

    elements.loader.classList.add("loader")

    return elements.btn;
}

function setBtnLoading() {
    state.loading = true;
    elements.btn.innerHTML = '';
    if (!elements.loader.childNodes.length) {
        for (let i = 0; i < elements.dots.length; i++) {
            const dot = elements.dots[i];
            dot.classList.add("loader--dot");
            Object.assign(dot.style, loaderDotStyles);
            dot.style.backgroundColor = loaderDotBgs[i];
            dot.animate([
                { transform: "translateX(0)", offset: 0.15 },
                { transform: `translateX(${(elements.buyBtn.offsetWidth - 34) ?? 198}px)`, offset: 0.45 },
                { transform: `translateX(${(elements.buyBtn.offsetWidth -34) ?? 198}px)`, offset: 0.65 },
                { transform: "translateX(0)", offset: 0.95 },
            ], {
                delay: loaderDotDelays[i],
                easing: "ease-in-out",
                duration: 3000,
                iterations: Infinity,
            })
            elements.loader.appendChild(dot);
        }
    }
    elements.btn.appendChild(elements.loader);
}

export function setBtnReady() {
    state.loading = false;
    elements.btn.innerText = "Watch For Sales";
    elements.btn.appendChild(elements.img);
}

export function setBtnTracking() {
    state.loading = false;
    elements.btn.innerText = "Tracking Sales";
    elements.btn.appendChild(elements.img);
}

export function setBtnError() {
    state.loading = false;
    elements.btn.innerText = "Whoops, something's wrong";
    elements.btn.appendChild(elements.img);
}

function watchForBuyBtn() {
    elements.buyBtn = document.querySelector("#buyNow_feature_div") as HTMLButtonElement;
    if (elements.buyBtn) {
        setBtnLoading();
        elements.buyBtn.appendChild(elements.btn);

        elements.btn.addEventListener("click", async (e) => {
            e.preventDefault();
            state.loading = true;
            setBtnLoading();

            if (!state.tracking) {
                const price = await parseProduct();
                product.prices.push(price);
                if (product.isReady()) {
                    try {
                        if (!user.email) {
                            emailModal(product);
                        } else {
                            const success = await product.submitCreate(
                                user.email,
                            );
                            if (success) {
                                state.tracking = true;
                                setBtnTracking();
                            } else {
                                state.tracking = false;
                                setBtnError();
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
                    setBtnError();
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

    setTimeout(() => watchForBuyBtn(), 1000);
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
