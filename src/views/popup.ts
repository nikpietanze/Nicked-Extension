'use strict';

document.addEventListener("DOMContentLoaded", async () => {
    const app = document.querySelector("#app");
    const main = document.createElement("main");

    app?.classList.add("w-80", "h-fit", "bg-indigo-800", "text-white", "p-4");
    main.innerHTML = `
        <h1 class="text-lg text-center w-full">Nicked Browser Extension</h1>
    `;

    app?.appendChild(main);
});

