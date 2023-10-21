"use strict";

import { user } from "../background";
import Product from "../models/product";

interface Elements {
    app: HTMLDivElement | null,
    main: HTMLElement | null,
    products: HTMLDivElement | null,
    saleProducts: HTMLDivElement | null,
}

const state = {
    loading: false,
}
const elements: Elements = {
    app: null,
    main: null,
    products: null,
    saleProducts: null,
};

function generateIconUrl(active: boolean): string {
    return active ? "/images/checkmark.svg" : "/images/delete.svg";
}

function parseProducts() {
    if (user.products && !user.products.length) {
        setTimeout(parseProducts, 100);
        return;
    }

    for (let i = 0; i < user.products.length; i++) {
        const product = user.products[i];
        const iconUrl = generateIconUrl(product.active);
        const productEl = document.createElement("a");

        productEl.href = product.url?.toString() ?? "#!";
        productEl.target = "_blank";
        productEl.id = product.id?.toString() ?? "";
        productEl.classList.add(
            "flex",
            "justify-between",
            "items-center",
            "gap-2",
            "h-14",
            "p-3",
            "rounded",
            "transition",
            "hover:bg-indigo-700"
        );

        productEl.innerHTML = `
            <img class="w-8" src="${product.imageUrl}" alt="" />
            <span class="flex-auto text-stone-200 text-md font-semibold truncate">${product.name}</span>
            <img class="icon ${product.active} w-6" src="${chrome.runtime.getURL(iconUrl)}" alt="" />
        `

        productEl.addEventListener("click", (e) => {
            // @ts-ignore
            if (e.target.classList.contains("icon")) {
                e.preventDefault();
            }
        })

        // TODO: if (product.activeSale) elements.saleProducts.appendChild(productEl)
        elements.products?.appendChild(productEl);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    state.loading = true;

    console.log(user);

    elements.app = document.querySelector("#app");
    elements.app?.classList.add("font-['Gabarito']", "w-80", "h-fit", "bg-indigo-800", "text-white", "p-3");

    elements.main = document.createElement("main");
    elements.main.innerHTML = `
        <nav class="mb-8">
            <img class="w-24" src="${chrome.runtime.getURL('/images/logo.webp')}" alt="Nicked" />
        </nav>
    `;

    elements.saleProducts = document.createElement("div");
    elements.saleProducts.classList.add(
        "flex",
        "flex-col",
        "gap-2",
        "rounded-xl",
        "bg-indigo-950",
        "border-2",
        "border-green-400/50",
        "shadow-lg",
        "shadow-indigo-950",
        "mb-3",
        "p-3",
        "max-h-80",
        "overflow-y-scroll"
    );
    elements.saleProducts.innerHTML = `
        <h2 class="text-xl text-indigo-500 text-center font-semibold mb-4">Active Sales</h2>
        <div class="flex justify-between items-center gap-2 px-3 border-b border-b-indigo-400 text-indigo-400">
            <span class="basis-8"></span>
            <span class="flex-auto text-center">Name</span>
            <span class="basis-6 text-center">Tracking</span>
        </div>
    `;

    elements.products = document.createElement("div");
    elements.products.classList.add(
        "flex",
        "flex-col",
        "gap-2",
        "rounded-xl",
        "bg-indigo-950",
        "shadow-lg",
        "shadow-indigo-950",
        "p-3",
        "max-h-80",
        "overflow-y-scroll"
    );
    elements.products.innerHTML = `
        <h2 class="text-xl text-indigo-500 text-center font-semibold mb-2">Watching</h2>
        <div class="flex justify-between items-center gap-2 px-3 border-b border-b-indigo-400 text-indigo-400">
            <span class="basis-8"></span>
            <span class="flex-auto text-center">Name</span>
            <span class="basis-6 text-center">Tracking</span>
        </div>
    `;

    if (elements.saleProducts.children.length === 2) {
        const msgEl = document.createElement("span");
        msgEl.classList.add("text-stone-200", "text-center");
        msgEl.innerText = "No active sales yet";
        elements.saleProducts.appendChild(msgEl);
    }

    if (user.products) {
        parseProducts();
    } else {
        elements.products.innerHTML = "<h2>Whoops</h2><span>It doesn't look like you're tracking any products yet.</span>";
    }

    elements.main.appendChild(elements.saleProducts);
    elements.main.appendChild(elements.products);
    elements.app?.appendChild(elements.main);

    // TODO: if is loading, show spinner

    setTimeout(() => {
        const iconEls: NodeListOf<HTMLImageElement> = document.querySelectorAll("img.icon");

        for (let i = 0; i < iconEls.length; i++) {
            const iconEl = iconEls[i];

            iconEl.addEventListener("click", async () => {
                const productId = iconEl.parentElement?.id ?? "";

                let active = iconEl.classList.contains("true");
                if (active) {
                    const success = await Product.setNotActive(productId);
                    if (success) {
                        iconEl.src = generateIconUrl(false);
                        iconEl.classList.remove("true");
                        iconEl.classList.add("false");
                    }
                } else {
                    const success = await Product.setActive(productId);
                    if (success) {
                        iconEl.src = generateIconUrl(true);
                        iconEl.classList.add("true");
                        iconEl.classList.remove("false");
                    }
                }
            })
        }
    }, 500);

    state.loading = false;
});
