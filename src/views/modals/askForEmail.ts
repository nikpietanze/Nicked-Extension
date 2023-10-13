import { user } from "../../background";
import Product from "../../models/product";

export default function(product: Product) {
    const emailModal = document.querySelector(".n-ask-for-email");
    if (!emailModal) {
        const modal = document.createElement("div");
        modal.id = "n-ask-for-email";
        modal.classList.add("modal")
        Object.assign(modal.style, {
            width: "500px",
            zIndex: 999999,
            borderRadius: "10px",
            boxShadow: "10px 5px rbga(0,0,0,0.25)",
            padding: "16px",
        });

        modal.innerHTML = ``;

        document.body.appendChild(modal);
    }

    const submitBtn: HTMLButtonElement | null = document.querySelector("button#submit-email");
    const emailInput: HTMLInputElement | null = document.querySelector("input#nicked-email");

    submitBtn?.addEventListener("click", async () => {
        if (!emailInput) {
            // TODO: show modal error
            return;
        }

        const isValidEmail = user.validateEmail(emailInput?.value);
        if (!isValidEmail) {
            // TODO: show modal error
            return;
        }

        user.email = emailInput?.value.toLowerCase();

        if (product.isReady()) {
            const success = await product.submitCreate(user.email);
            if (!success) {
                // TODO: handle create failed
            }
        }
    })
}
