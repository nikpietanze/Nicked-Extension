"use strict";

import { datapoint, user } from "../../background";
import Product from "../../models/product";
import {
	setTrackBtnReady,
	setTrackBtnSuccess,
	setTrackBtnError,
} from "../../amazon";

export default function (product: Product, saleTrackBtn: HTMLButtonElement) {
	const modal = document.createElement("div");
	Object.assign(modal.style, {
		position: "fixed",
		top: 0,
		right: 0,
		zIndex: 9999,
		width: "100%",
		maxWidth: "fit-content",
		padding: "16px",
		overflowX: "hidden",
		overflowY: "auto",
		height: "calc(100%-16px)",
		maxHeight: "100%",
	});
	modal.innerHTML = `
        <div style="position:relative;width:100%;max-width:448px;max-height:100%;">
            <div style="position:relative;background-color: rgb(55 65 81);border-radius:8px;box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);">
                <button id="nicked-modal-close" type="button" style="position:absolute;top:12px;right:10px;color:rgb(156 163 175);background-color:transparent;border:none;">
                    <svg style="width:12px;height:12px;" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                    </svg>
                    <span style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0, 0, 0, 0);white-space:nowrap;border-width:0;">Close modal</span>
                </button>
                <div style="padding:24px;">
                    <h3 style="margin-bottom:16px;font-size:18px;line-height:28px;font-weight:500;color:rgb(255 255 255);">Whoops, We don't have your email!</h3>
                    <p style="font-size:14px;line-height:20px;color:rgb(255 255 255);">We need your email to send you alerts when this product goes on sale. Don't worry, we won't send you any spam or marketing emails!</p>
                    <form style="margin-top:16px;">
                        <div>
                            <label for="email" style="display:block;margin-bottom:8px;font-size:14px;line-height:20px;font-weight:500;color:rgb(255 255 255)">Your email</label>
                            <input id="nicked-email" type="email" name="email" style="border-width:1px;font-size:14px;line-height:20px;border-radius:8px;display:block;width:100%;padding:10px;background-color:rgb(75 85 99);border-color:rgb(107 114 128);color:rgb(255 255 255);" placeholder="name@company.com" required>
                        </div>
                        <button id="nicked-email-submit" type="submit" style="width:100%;max-width:100px;margin-top:16px;border:none;color:rgb(255 255 255);font-weight:500;border-radius:8px;font-size:14px;line-height:20px;padding:10px 20px;text-align:center;background-color:rgb(37 99 235);">Submit</button>
                    </form>
                </div>
            </div>
        </div>
    `;

	const closeBtn: HTMLButtonElement | null = modal.querySelector(
		"#nicked-modal-close",
	);
	if (closeBtn) {
		closeBtn.addEventListener("click", () => {
			modal.remove();
			setTrackBtnReady(saleTrackBtn);
		});
	}

	const submitBtn: HTMLButtonElement | null = modal.querySelector(
		"#nicked-email-submit",
	);
	if (submitBtn) {
		submitBtn.addEventListener("click", async (e) => {
			e.preventDefault();
			const emailInput: HTMLInputElement | null =
				modal.querySelector("#nicked-email");

			if (emailInput) {
				const email = emailInput.value.toLowerCase().trim();
				const isValid = user.validateEmail(email);

				if (isValid) {
					user.email = email;
					await user.submit();
					modal.remove();

					try {
						const tracking = await product.isBeingTracked();
						if (!tracking) {
							const success = await product.submitCreate(email);
							if (success) {
								setTrackBtnSuccess(saleTrackBtn);
							} else {
								setTrackBtnError(saleTrackBtn);
							}
						} else {
							setTrackBtnSuccess(saleTrackBtn);
						}
					} catch (err: any) {
						console.error(err);
						datapoint.event = "nicked_ext_error";
						datapoint.location = "email_modal";
						datapoint.details = err.message;
						datapoint.send();
					}
				}
			}
			// TODO: show invalid email alert
		});
	}

	document.body.appendChild(modal);
}
