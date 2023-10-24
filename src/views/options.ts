"use strict";

import { datapoint, user } from "../background";
import Product from "../models/product";

interface Elements {
	app: HTMLDivElement | null;
	products: HTMLDivElement | null;
}

const state = {
	loading: false,
};
const elements: Elements = {
	app: null,
	products: null,
};

async function parseProducts() {
	if (user.products && !user.products.length) {
		setTimeout(parseProducts, 100);
		return;
	}

	for (let i = 0; i < user.products.length; i++) {
		const product = user.products[i];
		const productTr = document.createElement("tr");
		productTr.classList.add("transtion", "hover:bg-gray-50");

		productTr.id = product.id?.toString() ?? "";

		productTr.innerHTML = `
                        <th class="flex items-center gap-3 px-6 py-4 font-normal text-gray-900">
                            <div class="relative h-10 w-10">
                                <img class="h-full w-full"
                                    src="${product.imageUrl}"
                                    alt="" /> </div>
                            <div class="font-medium text-gray-700 max-w-xs truncate" x-tooltip="${
								product.name
							}">${product.name}</div>
                        </th>
                        <td class="px-6 py-4 text-center">${product.store}</td>
                        <td class="state px-6 py-4">
                            <span
                                class="w-full max-w-fit m-auto flex justify-center items-center gap-1 rounded-full ${
									product.active
										? "bg-green-50 text-green-600"
										: "bg-red-50 text-red-600"
								} px-2 py-1 text-xs font-semibold">
                                <span class="h-1.5 w-1.5 rounded-full ${
									product.active
										? "bg-green-600"
										: "bg-red-600"
								}"></span>
                                ${product.active ? "Active" : "Inactive"}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-center">
                            <input type="checkbox" class="active-checkbox bg-indigo-50 border-gray-300 cursor-pointer focus:ring-3 focus:ring-indigo-300 h-4 w-4 rounded" checked="${
								product.active
							}">
                        </td>
                        <td class="px-6 py-4">
                            <a class="inline-flex items-center gap-1 rounded-full transition bg-blue-50 hover:bg-blue-200 px-4 py-2 text-md font-semibold text-blue-600" href="${
								product.url
							}" target="_blank">View Product</a>
                        </td>
                        <td class="px-6 py-4">
                            <button class="delete-button" x-data="{ tooltip: 'Delete' }">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                    stroke-width="1.5" stroke="currentColor" class="h-6 w-6" x-tooltip="tooltip">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                            </button>
                        </td>
        `;

		elements.products?.appendChild(productTr);
	}
}

function handleTrackingCheckboxes() {
	const checkboxes: NodeListOf<HTMLInputElement> =
		document.querySelectorAll(".active-checkbox");

	for (let i = 0; i < checkboxes.length; i++) {
		const checkbox: HTMLInputElement = checkboxes[i];
		const id = checkbox.parentElement?.parentElement?.id;
		const product = document.getElementById(id ?? "");

		if (id && product) {
			const state: HTMLDivElement | null =
				product.querySelector(".state span");

			checkbox.addEventListener("click", async () => {
				if (!checkbox.checked) {
                    try {
                        const success = await Product.setNotActive(id);
                        if (success && state) {
                            state.classList.remove("bg-green-50", "text-green-600");
                            state.classList.add("bg-red-50", "text-red-600");
                            state.innerHTML = `
                            <span class="h-1.5 w-1.5 rounded-full bg-red-600"></span>
                            Inactive
                            `;
                        }
                    } catch (err: any) {
                        datapoint.event = "nicked_ext_error";
                        datapoint.location = "options_set_not_active";
                        datapoint.details = err.message;
                        datapoint.send();
                    }
				} else {
                    try {
                        const success = await Product.setActive(id);
                        if (success && state) {
                            state.classList.remove("bg-red-50", "text-red-600");
                            state.classList.add("bg-green-50", "text-green-600");
                            state.innerHTML = `
                            <span class="h-1.5 w-1.5 rounded-full bg-green-600"></span>
                            Active
                            `;
                        }
                    } catch (err: any) {
                        datapoint.event = "nicked_ext_error";
                        datapoint.location = "options_set_active";
                        datapoint.details = err.message;
                        datapoint.send();
                    }
				}
			});
		}
	}
}

function handleDelete() {
	const deleteBtns: NodeListOf<HTMLButtonElement> =
		document.querySelectorAll(".delete-button");

	for (let i = 0; i < deleteBtns.length; i++) {
		const btn = deleteBtns[i];
		btn.addEventListener("click", async () => {
			const id = btn.parentElement?.parentElement?.id;
			if (id) {
                try {
                    const success = await Product.delete(id);
                    if (success) {
                        document.getElementById(id)?.remove();
                    }
                } catch (err: any) {
                    console.error(err)
                    datapoint.event = "nicked_ext_error";
                    datapoint.location = "options_handle_delete";
                    datapoint.details = err.message;
                    datapoint.send();
                }
			}
		});
	}
}

document.addEventListener("DOMContentLoaded", async () => {
	state.loading = true;

	elements.app = document.querySelector("#app");
	elements.products = document.querySelector("#products");

	setTimeout(async () => {
		if (user.products.length) {
            try {
                await parseProducts();
                handleTrackingCheckboxes();
                handleDelete();
            } catch (err: any) {
                datapoint.event = "nicked_ext_error";
                datapoint.location = "options_init";
                datapoint.details = err.message;
                datapoint.send();
            }
		} else {
			// TODO: handle no products
		}
	}, 100);

	state.loading = false;
});
