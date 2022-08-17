# Dim Sum

## Purpose
The purpose of this project is to create a library for performing mechanical tolerance stack analyses, and associated graphical tools for creating, manipulating, and reporting them.

## Features

- ASME/ISO dimension definitions
    - Symmetric
    - Bilateral
    - Limits
    - Profile
- Simultaneous analyses
    - Arithmetic mean
    - RSS
    - Bender 1.5 * RSS
    - Monte Carlo
- CLI
    - Output dimension table and results to console

## Tolerance Stack Analysis
A tolerance stack analysis is a means of investigating how parts fit when real-world variability is considered. The possibilities can quickly become infinite if you begin considering how things fit in 3D space. This tool focuses on 1D analyses as a start. Part of the design process is reconsidering how things are dimensioned and controlled to produce simpler and cheaper designs. If you truly need a multi-dimensional and it cannot be broken down into separate 1D analyses, please refer to the alternate proprietary tools below.

## Appendix

### Terminology

- LSL - Lower Service Limit
- USL - Upper Service Limit

### Methods

#### Arithmetic worst case method
This method sums the tolerances of all components in a tolerance stack without regard for probability. If you have the freedom to, assemblies that show positive clearances under this condition will function for the entire range of actual manufacturing tolerances. Under this method, tolerances are overestimated because it assumes all components are at their limit.[^1]

$$T_{assy}^{arith} = |a_1|T_1+|a_2|T_2+...+|a_n|T_n$$

#### Root sum square method (RSS)
The RSS method is a rudimentary statistical method assuming a normal centered distribution on a $±3σ$ interval.[^1] It is conservative for a few number of features, and likely conservative with larger stacks.

$$T^{RSS}_{assy} = \sqrt{T_1^2+T_2^2+...+T_n^2}$$

#### Inflation factors
In cases where the assumed tolerances of the manufacturing process are understated or unknown using $±2σ$, a correction factor can be applied. This is regarded as a more realistic middle ground for estimating tolerances. High-risk assemblies should resort to more refined methods.[^1]

$$T_{assy}^{RSS}\text{(Bender 1968)}=1.5\cdot{}T^{RSS}_{assy}$$

#### Monte Carlo
The [Monte Carlo method](https://en.wikipedia.org/wiki/Monte_Carlo_method) injects unlinked pseudo-randomness between the final tolerances of each individual part. In other words, it's unlikely that all parts in a stack are at their extremes, let alone all biased toward either the LSL or USL.

### State of the Art
Several tolerance analysis tools exist on the market, but none are perfect.

#### Excel
Excel-based templates may be the most common tool for tolerance analyses. Due to the widespread use of Excel, anyone can open and edit the document. Although these templates are error prone, data validation, conditional formatting, VBA, and other tricks can be used to create a robust interface.

One issue especially prevalent in Excel templates is the lack of flexibility in entering dimensions. Most templates force you to convert all dimensions to symmetric ones, which increases errors and makes reviews more difficult. My tolerance stack template allows for many types of entries including GD&T bands.

A version of this template is maintained as part of this project.

#### Embedded CAD tools
Many CAD tools include their own tolerance analysis capabilities. Some are custom and some are adaptations of other popular 3rd party tools.
- SOLIDWORKS TolAnalyst
- Creo EZ Tolerance Analysis (EZtol adaptation)
- Autodesk Inventor Tolerance Analysis (EZtol adaptation)
- NX

#### Alternate Software
- Sigmetrix EZtol - standalone 3D CAD 1D analysis tool
- Sigmetrix CETOL 6σ - most extensive tool on the market (expensive)
- Other various companies offering their bespoke tolerance software

### Example
This CAD is referenced as an example.

https://cad.onshape.com/documents/2cdf3ec9a48d2dc333b071db/w/962d4b694777873f554dd56f/e/e47ffd0abc92078010ae7423

[^1]: Scholz, Fritz. Boeing Information & Support Services, 1995, _Tolerance Stack Analysis Methods.pdf|Tolerance Stack Analysis Methods_.
