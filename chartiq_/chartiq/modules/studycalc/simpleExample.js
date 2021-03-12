/**
 *	8.2.0
 *	Generation date: 2021-03-01T14:52:45.664Z
 *	Client name: feel option
 *	Package Type: Technical Analysis 8.2
 *	License type: trial
 *	Expiration date: "2021/04/01"
 *	iFrame lock: true
 */

/***********************************************************
 * Copyright by ChartIQ, Inc.
 * Licensed under the ChartIQ, Inc. Developer License Agreement https://www.chartiq.com/developer-license-agreement
*************************************************************/
/*************************************** DO NOT MAKE CHANGES TO THIS LIBRARY FILE!! **************************************/
/* If you wish to overwrite default functionality, create a separate file with a copy of the methods you are overwriting */
/* and load that file right after the library has been loaded, but before the chart engine is instantiated.              */
/* Directly modifying library files will prevent upgrades and the ability for ChartIQ to support your solution.          */
/*************************************************************************************************************************/
/* eslint-disable no-extra-parens */


////////////////////////////////////////////////////////////////////////////////////////////
//
// ChartIQ Study Calculator Module Simple Example
//
// Demonstrates running ChartIQ studies in Node.js. Uses ES6 module import syntax.
//
// To run this example:
// 1. Extract the contents of your zipped ChartIQ library package
// 2. Adjust the path to the tarball from the extracted library package (.tgz file)
//    in the dependencies section of the package.json in the chartiq/modules/studycalc directory
// 3. Run the following commands from the chartiq/modules/studycalc directory:
//    - "npm install" to install the ChartIQ library
//    - "npm run simple" to run this file (simpleExample.js) in Node.js
//
//    On Node.js versions prior to v13 (which do not support ES6 import syntax), run:
//    - "npm run simple:old"
//
////////////////////////////////////////////////////////////////////////////////////////////

import { CIQ as ciq } from "chartiq/js/standard.js";
import StudyCalculator from "chartiq/modules/studycalc/study-calculator.js";

const sampledata = [
	{ DT: new Date("2015-04-16 16:00"), Close: 152.11 },
	{ DT: new Date("2015-04-17 09:30"), Close: 151.79 },
	{ DT: new Date("2015-04-17 09:35"), Close: 151.75 },
	{ DT: new Date("2015-04-17 09:40"), Close: 151.84 },
	{ DT: new Date("2015-04-17 09:45"), Close: 151.95 },
	{ DT: new Date("2015-04-17 09:50"), Close: 152.07 },
	{ DT: new Date("2015-04-17 09:55"), Close: 151.91 },
	{ DT: new Date("2015-04-17 10:00"), Close: 151.95 },
	{ DT: new Date("2015-04-17 10:05"), Close: 151.98 },
	{ DT: new Date("2015-04-17 10:10"), Close: 151.73 },
	{ DT: new Date("2015-04-17 10:15"), Close: 151.82 },
	{ DT: new Date("2015-04-17 10:20"), Close: 151.75 },
	{ DT: new Date("2015-04-17 10:25"), Close: 151.73 },
	{ DT: new Date("2015-04-17 10:30"), Close: 151.82 },
	{ DT: new Date("2015-04-17 10:35"), Close: 151.84 },
	{ DT: new Date("2015-04-17 10:40"), Close: 151.95 },
	{ DT: new Date("2015-04-17 10:45"), Close: 152.03 },
	{ DT: new Date("2015-04-17 10:50"), Close: 152.03 }
];

const studyCalculator = new StudyCalculator(ciq, {
	interval: 5,
	symbolObject: { symbol: "IBM" }
});
const maHandle = studyCalculator.addStudy("ma", { Period: 5 });

studyCalculator.addData(sampledata);
studyCalculator.calculate();

for (let record = 0; record < sampledata.length; record++) {
	const results = studyCalculator.getResults(record, maHandle);
	for (let f in results)
		console.log(
			sampledata[record].DT.toISOString() + "   " + f + ":  " + results[f]
		);
}
