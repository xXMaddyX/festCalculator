import CalculatorDisplay from "./components/calculatorDisplay.js";


document.addEventListener("DOMContentLoaded", () => {
    customElements.define("calculator-display", CalculatorDisplay)

    const app = document.querySelector("#app");
    const display = document.createElement("calculator-display");
    app.append(display);
});