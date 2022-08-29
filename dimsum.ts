// dimsum.js
// Copyright (C) 2022 - Present Christian Petty
// MIT License

// Precise floating point operations
import { Decimal } from 'decimal.js';
Decimal.set({
    precision: 20
});

// Maximum decimals to display in console outputs
const decimalPlaces = 4;
const monteCarloIterations = 10000;

class Analysis {
    stack: Stack;
    featureList: Feature[];
    featureCount: number;
    outputSummary: Output[];
    goal: Goal;
    monteCarloFailures: number;

    constructor(stack, goal) {
        this.stack = stack;
        this.featureList = this.stack.featureList;
        this.featureCount = this.featureList.length;
        this.outputSummary = [];
        this.goal = goal;
        this.monteCarloFailures = 0;
    }

    run() {
        console.log(`NAME: ${this.stack.name}`);
        console.log(`UNITS: ${this.stack.units}`);
        console.log(`GOAL: {${this.goal.lowerLimit} - ${this.goal.upperLimit}} ${this.goal.units}`);
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
        this.outputSummary.push(new Output("Worst Case", shift.minus(tolSum), shift, shift.plus(tolSum), this.goal));
        this.outputSummary.push(new Output("RSS", shift.minus(tolRSS), shift, shift.plus(tolRSS), this.goal));
        this.outputSummary.push(new Output("Bender 1.5 * RSS", shift.minus(tolRSS.times(1.5)), shift, shift.plus(tolRSS.times(1.5)), this.goal));
        this.updateContributions(tolSum);
    }

    // Monte Carlo simulation method for fixed number of iterations
    monteCarloMethod(iterations) {
        let monteCarloResults: Decimal[] = [];
        let monteCarloSum: Decimal = new Decimal(0);
        let failureCount: number = 0;
        for (let i = 0; i < iterations; i++) {
            let singleResult = new Decimal(0);
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
            if (singleResult.lessThanOrEqualTo(this.goal.lowerLimit) || singleResult.greaterThanOrEqualTo(this.goal.upperLimit)) {
                failureCount++;
            }
            monteCarloResults.push(singleResult);
            monteCarloSum = monteCarloSum.plus(singleResult)
        }
        let average = monteCarloSum.dividedBy(iterations);
        let minimum = Decimal.min(...monteCarloResults);
        let maximum = Decimal.max(...monteCarloResults);
        this.monteCarloFailures = failureCount;
        this.outputSummary.push(new Output("Monte Carlo", minimum, average, maximum, this.goal))
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
        console.table(this.outputSummary, ["name", "lowerLimit", "center", "upperLimit", "goalMet"]);
        console.log(`MONTE CARLO: ${this.monteCarloFailures} failures in ${monteCarloIterations} iterations.`);
    }

}

class Output {
    name: string;
    goal: Goal;
    center: Decimal;
    upperLimit: Decimal;
    lowerLimit: Decimal;
    goalMet: boolean;

    constructor(name, lowerLimit, center, upperLimit, goal) {
        this.name = name;
        this.goal = goal;
        this.center = center;
        this.upperLimit = upperLimit;
        this.lowerLimit = lowerLimit;

        this.goalMet = this.checkGoal();

        this.center = formatDecimal(this.center);
        this.upperLimit = formatDecimal(this.upperLimit);
        this.lowerLimit = formatDecimal(this.lowerLimit);
    }

    checkGoal() {
        if (this.lowerLimit.greaterThanOrEqualTo(this.goal.lowerLimit) && this.upperLimit.lessThanOrEqualTo(this.goal.upperLimit)) {
            return true;
        } else {
            return false;
        }
    }
}

class Stack {
    name: string;
    units: string;
    featureList: Feature[];
    
    constructor(name, units) {
        this.name = name;
        this.units = units;
        this.featureList = [];
    }

    addFeature(name, dimension, alpha) {
        this.featureList.push(new Feature(name, dimension, alpha));
    }
}

class Goal {
    upperLimit: Decimal;
    lowerLimit: Decimal;
    units: string;

    constructor(boundA, boundB, units) {
        this.upperLimit = Decimal.max(boundA, boundB);
        this.lowerLimit = Decimal.min(boundA, boundB);
        this.units = units;
    }
}

class Feature {
    name: string;
    partNumber: string;
    revision: string;
    source: string;
    dimension: Dim;
    nominal: Decimal;
    tol: Decimal;
    alpha: Decimal
    upperLimit: Decimal;
    lowerLimit: Decimal;
    contribution: Decimal;

    constructor(name, dimension, alpha) {
        this.name = name;
        this.partNumber = "";
        this.revision = "";
        this.source = "";
        this.dimension = dimension;
        this.nominal = dimension.nominal;
        this.tol = dimension.symmetricTolerance;
        this.alpha = alpha;
        this.upperLimit = this.nominal.plus(this.tol);
        this.lowerLimit = this.nominal.minus(this.tol);
    }
}

class Dim {
    nominal: Decimal;
    symmetricTolerance: Decimal;

    constructor(nominal, symmetricTolerance) {
        this.nominal = nominal;
        this.symmetricTolerance = symmetricTolerance;
    }
}

class DimSymmetric extends Dim {
    constructor(nominal, symmetricTolerance) {
        super(new Decimal(nominal), new Decimal(symmetricTolerance));
    }
}

class DimBilateral extends Dim {
    constructor(nominal, tolerance1, tolerance2) {
        let upperLimit = new Decimal(nominal + Math.max(tolerance1, tolerance2));
        let lowerLimit = new Decimal(nominal + Math.min(tolerance1, tolerance2));
        let center = upperLimit.plus(lowerLimit).dividedBy(2);
        let symmetricTolerance = upperLimit.minus(center);

        super(center, symmetricTolerance);
    }
}

class DimLimits extends Dim {
    constructor(upperLimit, lowerLimit) {
        upperLimit = new Decimal(upperLimit);
        lowerLimit = new Decimal(lowerLimit);
        let center = upperLimit.plus(lowerLimit).dividedBy(2);
        let symmetricTolerance = upperLimit.minus(center);

        super(center, symmetricTolerance);
    }
}

class DimBand extends Dim {
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

export default {Analysis, Stack, Goal, DimSymmetric, DimBilateral, DimLimits, DimBand, AssemblyShift};
