class CalculatorDisplay extends HTMLElement {
    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: "open" });

        this.firstNumPool = [];
        this.secondNumPool = [];
        this.currentCalculation = 0;
        this.displayValue = "";

        this.States = {
            addToFirstPool: 1,
            addToSecondPool: 2,
        };
        this.currentState = this.States.addToFirstPool;

        this.calcState = {
            add: 1,
            sub: 2,
            multi: 3,
            divi: 4,
            percent: 5,
            x2: 6,
            root2x: 7,
            invx: 8,
            negate: 9,
        };
        this.currentCalcState = null;
        this.lastResult = null;
        this.newCalc = true;

        this.performBinaryOperation = this.performBinaryOperation.bind(this);
        this.performUnaryOperation = this.performUnaryOperation.bind(this);
    };

    async connectedCallback() {
        const html = await fetch("components/calculatorDisplay.html");
        this.shadow.innerHTML = await html.text();
        this.init();
        this.eventListeners();
    };

    init() {
        this.buttons = this.shadow.querySelector(".button-content");
        this.display = this.shadow.querySelector("#display");
        this.updateDisplay("0");
    };

    updateDisplay(result) {
        this.display.textContent = result;
    };

    resetOperation() {
        this.firstNumPool = [];
        this.secondNumPool = [];
        this.displayValue = "";
        this.currentState = this.States.addToFirstPool;
        this.currentCalcState = null;
        this.currentCalculation = 0;
        this.lastResult = null;
        this.updateDisplay("0");
        this.newCalc = true;
    };

    getCurrentNumberPool() {
        let pool = this.currentState === this.States.addToFirstPool ? this.firstNumPool : this.secondNumPool;
        return pool;
    };

    getCurrentNumber() {
        let pool = this.getCurrentNumberPool();
        return Number(pool.join(""));
    };

    getPoolDataOnState() {
        let number = this.getCurrentNumber();
        this.displayValue = number.toString();
        this.updateDisplay(this.displayValue);
    };

    setOperatorState(input) {
        switch (input) {
            case "+":
                this.setBinaryOperator(this.calcState.add);
                break;
            case "-":
                this.setBinaryOperator(this.calcState.sub);
                break;
            case "X":
                this.setBinaryOperator(this.calcState.multi);
                break;
            case "/":
                this.setBinaryOperator(this.calcState.divi);
                break;
            case "%":
                this.performPercentOperation();
                break;
            case "C":
                this.resetOperation();
                break;
            case "CE":
                this.clearEntry();
                break;
            case "back":
                this.backspace();
                break;
            case "=":
                this.equalOperation();
                break;
            case "1/x":
                this.performUnaryOperation(this.calcState.invx);
                break;
            case "x2":
                this.performUnaryOperation(this.calcState.x2);
                break;
            case "2rootX":
                this.performUnaryOperation(this.calcState.root2x);
                break;
            case "+/-":
                this.performUnaryOperation(this.calcState.negate);
                break;
            case ",":
                this.addDecimalPoint();
                break;
            default:
                break;
        }
    }

    setBinaryOperator(opState) {
        if (this.currentCalcState && this.currentState === this.States.addToFirstPool && this.firstNumPool.length > 0 && this.newCalc === false) {
            this.currentCalcState = opState;
            return;
        };

        if (this.firstNumPool.length > 0) {
            if (this.lastResult !== null && this.newCalc === true) {
                this.firstNumPool = [this.lastResult.toString()];
                this.updateDisplay(this.lastResult.toString());
                this.newCalc = false;
            };

            this.currentCalcState = opState;
            this.currentState = this.States.addToSecondPool;
            this.displayValue = "";
        };
    };

    equalOperation() {
        if (!this.currentCalcState || this.secondNumPool.length === 0) {
            if (this.firstNumPool.length > 0 && this.secondNumPool.length === 0 && this.currentCalcState === null) {
                this.updateDisplay(this.getNumberFromPool(this.firstNumPool));
            };
            return;
        };

        let result = this.performBinaryOperation();
        this.updateDisplay(result.toString());
        this.firstNumPool = [result.toString()];
        this.secondNumPool = [];
        this.currentState = this.States.addToFirstPool;
        this.displayValue = result.toString();
        this.lastResult = result;
        this.newCalc = true;
        this.currentCalcState = null;
    };

    performBinaryOperation() {
        let { num1, num2 } = this.resultOperationOnOperation();
        let result = 0;

        switch (this.currentCalcState) {
            case this.calcState.add:
                result = num1 + num2;
                break;
            case this.calcState.sub:
                result = num1 - num2;
                break;
            case this.calcState.multi:
                result = num1 * num2;
                break;
            case this.calcState.divi:
                if (num2 === 0) {
                    result = "Error";
                } else {
                    result = num1 / num2;
                }
                break;
            default:
                result = num1;
                break;
        };

        return result;
    };

    performUnaryOperation(op) {
        let currentVal = Number(this.display.textContent);
        let result = currentVal;

        switch (op) {
            case this.calcState.invx:
                if (currentVal !== 0) {
                    result = 1 / currentVal;
                } else {
                    result = "Error";
                };
                break;
            case this.calcState.x2:
                result = currentVal * currentVal;
                break;
            case this.calcState.root2x:
                if (currentVal < 0) {
                    result = "Error";
                } else {
                    result = Math.sqrt(currentVal);
                };
                break;
            case this.calcState.negate:
                result = currentVal * (-1);
                break;
        };

        this.updateDisplay(result.toString());

        if (this.currentState === this.States.addToFirstPool) {
            this.firstNumPool = [result.toString()];
        } else {
            this.secondNumPool = [result.toString()];
        };

        this.newCalc = true;
    };

    performPercentOperation() {
        if (this.currentState === this.States.addToSecondPool && this.firstNumPool.length > 0 && this.currentCalcState) {
            let num1 = this.getNumberFromPool(this.firstNumPool);
            let num2 = this.getNumberFromPool(this.secondNumPool);
            let result = (num1 * num2) / 100;
            this.secondNumPool = [result.toString()];
            this.updateDisplay(result.toString());
        } else {
            let currentVal = Number(this.display.textContent);
            let result = currentVal / 100;
            if (this.currentState === this.States.addToFirstPool) {
                this.firstNumPool = [result.toString()];
            } else {
                this.secondNumPool = [result.toString()];
            };
            this.updateDisplay(result.toString());
        };
    };

    clearEntry() {
        if (this.currentState === this.States.addToFirstPool) {
            this.firstNumPool = [];
            this.updateDisplay("0");
        } else {
            this.secondNumPool = [];
            this.updateDisplay("0");
        };
    };

    backspace() {
        let pool = this.getCurrentNumberPool();
        pool.pop();
        if (pool.length === 0) {
            this.updateDisplay("0");
        } else {
            this.updateDisplay(pool.join(""));
        };
    };

    addDecimalPoint() {
        let pool = this.getCurrentNumberPool();
        if (!pool.includes(".")) {
            if (pool.length === 0) {
                pool.push("0");
            }
            pool.push(".");
            this.updateDisplay(pool.join(""));
        };
    };

    resultOperationOnOperation() {
        let numOfFirstPool = this.getNumberFromPool(this.firstNumPool);
        let numOfSecondPool = this.getNumberFromPool(this.secondNumPool);

        let result = {
            num1: numOfFirstPool,
            num2: numOfSecondPool
        };
        return result;
    };

    getNumberFromPool(pool) {
        if (pool.length === 0) return 0;
        let val = pool.join("");
        return Number(val);
    };

    eventListeners() {
        this.buttons.addEventListener("click", (e) => {
            if (e.target.tagName !== "BUTTON") return;
            let classes = e.target.classList;
            let value = e.target.value;

            if (classes.contains("num-button")) {
                if (this.newCalc && this.currentCalcState === null && this.lastResult !== null) {
                    this.resetOperation();
                };

                this.newCalc = false;
                let pool = this.getCurrentNumberPool();
                pool.push(value);
                this.getPoolDataOnState();
            };

            if (classes.contains("func-button")) {
                this.setOperatorState(value);
            };
        });
    };
};

export default CalculatorDisplay;