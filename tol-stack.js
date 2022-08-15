// Tolerance Stack Analysis Tool
// Copyright (C) 2022 - Present Christian Petty
// MIT License

// Precise floating point operations
const Decimal = require('decimal.js');
Decimal.set({
    precision: 20
});

// Maximum decimals to display in console outputs
const decimalPlaces = 4;
const monteCarloIterations = 1000;

class Analysis {

    constructor(stack) {
        this.stack = stack;
        this.featureList = this.stack.featureList;
        this.featureCount = this.featureList.length;
        this.outputSummary = [];
    }

    run() {
        console.log(`NAME: ${this.stack.name}`);
        console.log(`UNITS: ${this.stack.units}`);
        this.arithmeticMethod();
        this.monteCarloMethod(monteCarloIterations);
        this.displayResults();
    }

    // Arithmetic method (worst-case, RSS, Bender)
    arithmeticMethod() {
        let tolSquaredSum = new Decimal(0); 
        let shift = new Decimal(0);
        let tolSum = new Decimal(0);
        let tolRSS = new Decimal(0);
        for (let i = 0; i < this.featureList.length; i++) {
            let dim = this.featureList[i].dimension;
            let nominal = dim.nominal;
            let alpha = this.featureList[i].alpha;
            let tol = dim.symmetricTolerance.times(Decimal.abs(alpha));
            shift = shift.plus(nominal.times(alpha));
            tolSum = tolSum.plus(tol);
            tolSquaredSum = tolSquaredSum.plus(Decimal.pow(tol,2));
        }
        tolRSS = Decimal.sqrt(tolSquaredSum);
        this.outputSummary.push(new Output("Worst Case", shift.minus(tolSum), shift, shift.plus(tolSum)));
        this.outputSummary.push(new Output("RSS", shift.minus(tolRSS), shift, shift.plus(tolRSS)));
        this.outputSummary.push(new Output("Bender 1.5 * RSS", shift.minus(tolRSS.times(1.5)), shift, shift.plus(tolRSS.times(1.5))));
        this.updateContributions(tolSum);
    }

    // Monte Carlo simulation method for fixed number of iterations
    monteCarloMethod(iterations) {
        let monteCarloResults = [];
        let monteCarloSum = new Decimal(0);
        for (let i = 0; i < iterations; i++) {
            let singleResult = Decimal(0);
            for (let j = 0; j < this.featureList.length; j++) {
                let dim = this.featureList[j].dimension;
                let nominal = dim.nominal;
                let alpha = this.featureList[j].alpha;
                let tol = dim.symmetricTolerance.times(Decimal.abs(alpha));
                let lowerServiceLimit = nominal.minus(tol);
                let upperServiceLimit = nominal.plus(tol);
                
                let randomNumber = Decimal.random(decimalPlaces);
                let randomDim = lowerServiceLimit.plus(randomNumber.times(upperServiceLimit.minus(lowerServiceLimit)));
                singleResult = singleResult.plus(randomDim.times(alpha));
            }
            monteCarloResults.push(singleResult);
            monteCarloSum = monteCarloSum.plus(singleResult)
        }
        let average = monteCarloSum.dividedBy(iterations);
        let minimum = Decimal.min(...monteCarloResults);
        let maximum = Decimal.max(...monteCarloResults);
        this.outputSummary.push(new Output("Monte Carlo", minimum, average, maximum))
    }
    
    // Update contribution property for each feature
    updateContributions(tolSum) {
        for (let i = 0; i < this.featureList.length; i++) {
            let contribution = this.featureList[i].dimension.symmetricTolerance.dividedBy(tolSum).toDP(decimalPlaces);
            this.featureList[i].contribution = contribution;
        }
    }

    displayResults() {
        console.log(`INPUTS: ${this.featureList.length}`);
        console.table(this.featureList, ["name", "alpha", "tol", "lowerLimit", "nominal", "upperLimit", "contribution"]);
        console.log(`OUTPUTS: ${this.outputSummary.length}`);
        console.table(this.outputSummary, ["name", "lowerLimit", "center", "upperLimit"]);
        console.log(`Monte Carlo Iterations: ${monteCarloIterations}`);
    }

}

class Output {
    constructor(name, lowerLimit, center, upperLimit) {
        this.name = name;
        this.lowerLimit = formatDecimal(lowerLimit);
        this.center = formatDecimal(center);
        this.upperLimit = formatDecimal(upperLimit);
    }
}

class Stack {
    constructor(name, units) {
        this.name = name;
        this.units = units;
        this.featureList = [];
    }

    addFeature(name, dimension, alpha) {
        this.featureList.push(new Feature(name, dimension, alpha));
    }
}

class Feature {
    constructor(name, dimension, alpha) {
        this.name = name;
        this.partNumber = "";
        this.revision = "";
        this.source = "";
        this.dimension = dimension;
        this.nominal = dimension.nominal;
        this.tol = dimension.symmetricTolerance;
        this.alpha = new Decimal(alpha);
        this.upperLimit = this.nominal.plus(this.tol);
        this.lowerLimit = this.nominal.minus(this.tol);
        this.contribution = new Decimal(0);
    }
}

class Dim {
    constructor(nominal, symmetricTolerance) {
        this.nominal = new Decimal(nominal);
        this.symmetricTolerance = new Decimal(symmetricTolerance);
    }
}

class SymmetricDim extends Dim {
    constructor(nominal, symmetricTolerance) {
        super(new Decimal(nominal), new Decimal(symmetricTolerance));
    }
}

class BilateralDim extends Dim {
    constructor(nominal, tolerance1, tolerance2) {
        let upperLimit = new Decimal(nominal + Math.max(tolerance1, tolerance2));
        let lowerLimit = new Decimal(nominal + Math.min(tolerance1, tolerance2));
        let center = upperLimit.plus(lowerLimit).dividedBy(2);
        let symmetricTolerance = upperLimit.minus(center);

        super(center, symmetricTolerance);
    }
}

class LimitsDim extends Dim {
    constructor(upperLimit, lowerLimit) {
        upperLimit = new Decimal(upperLimit);
        lowerLimit = new Decimal(lowerLimit);
        let center = upperLimit.plus(lowerLimit).dividedBy(2);
        let symmetricTolerance = upperLimit.minus(center);

        super(center, symmetricTolerance);
    }
}

class BandDim extends Dim {
    constructor(nominal, band) {
        super(new Decimal(nominal), new Decimal(band).dividedBy(2));
    }
}

class AssemblyShift extends Dim {
    constructor(insideDimension, outsideDimension) {
        let innerLMC = insideDimension.nominal.minus(insideDimension.symmetricTolerance);
        let outerLMC = outsideDimension.nominal.plus(outsideDimension.symmetricTolerance);
        super(new Decimal(0), outerLMC.minus(innerLMC).dividedBy(2));
    }
}

function formatDecimal(decimal) {
    return decimal.toDP(decimalPlaces);
}

var stack1 = new Stack("Stack 1", "in");

stack1.addFeature("Pedestal to datum A", new BilateralDim(.750, +.010, -.015), -1);
stack1.addFeature("Datum A to boss", new BandDim(3.25, .005), 1);
stack1.addFeature("Boss in hole", new AssemblyShift(new BilateralDim(.625, +0, -0.010), new SymmetricDim(.750, .010)), 1);
stack1.addFeature("Distance from hole to edge", new SymmetricDim(1.75, .015), -1);
stack1.addFeature("Thickness of lug", new SymmetricDim(0.75, .005), 1);
stack1.addFeature("Thickness of washer", new LimitsDim(.135, .120), 1);
stack1.addFeature("Length of fastener", new SymmetricDim(1.25, .005), -1);

var analysis1 = new Analysis(stack1);

analysis1.run();