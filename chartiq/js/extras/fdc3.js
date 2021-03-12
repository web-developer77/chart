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


/*
	FDC3 Connector
	===============
	Including this file will allow the implementation to register for FDC3 messaging,
	allowing use of the open protocols set forth by the Financial Desktop Connectivity
	and Collaboration Consortium and FINOS for desktop inter-application messaging.
*/
// Whether to respond to a broadcast as one would respond to an intent
const BROADCAST_AS_INTENT = true;
// Maximum number of symbols to load when receiving a list
const MAX_SYMBOLS = 16;
// Colors to cycle through when automatically picking them
const swatchColors = [
	"#8ec648", "#00afed", "#ee652e", "#912a8e", "#fff126", "#e9088c", "#ea1d2c",
	"#00a553", "#00a99c", "#0056a4", "#f4932f", "#0073ba", "#66308f", "#323390"
]; // prettier-ignore
// Meant to be customized to create parameters to pass into addSeries based on symbol
const defaultSeriesParams = (symbol, instrCount) => {
	return {
		chartType: "line",
		color: swatchColors[instrCount % swatchColors.length],
		width: 1,
		pattern: "solid"
	};
};
// Meant to be customized to create periodicity to pass into multiseries chart
const defaultPeriodicity = (isHolding) => {
	if (isHolding)
		return {
			interval: "day"
		};
	return {
		period: 1,
		interval: 5,
		timeUnit: "minute"
	};
};
export default /**
 * Registers the chart with the FDC3 connector.
 *
 * To enable this function, include the *fdc3.js* file (in the *js/extras* folder of the library)
 * in your application. The file provides access to the open protocols established by the
 * Financial Desktop Connectivity and Collaboration Consortium (<a href="https://fdc3.finos.org/"
 * target="_blank">FDC3</a>) and <a href="https://www.finos.org/" target="_blank">FINOS</a> for
 * desktop inter-application messaging.
 *
 * @param {CIQ.ChartEngine} stx The chart engine instance.
 *
 * @since 8.2.0
 */
function registerFDC3(stx) {
	const { CIQ } = stx.getCreatingLibrary();
	const checkAndReg = () => {
		const fdc3 = window.fdc3;
		if (!fdc3) return;
		clearInterval(fdc3Check);
		const doNotRespond = new Map();
		const subscriptions = [];
		let suppressSymbolChange = false;
		// Debug logger
		const log = (isIntent, contextType, customMessage) => {
			if (fdc3.log) {
				fdc3.log(
					customMessage ||
						` - executing ${
							isIntent ? "intent" : "context"
						} listener for ${contextType} from chart`
				);
			}
		};
		// Get the ticker symbols from an array containing instruments
		const getSymbols = (context, chartSymbol) => {
			let array = [];
			switch (context.type) {
				case "fdc3.instrument":
					array = [context];
					break;
				case "fdc3.instrumentList":
				case "fdc3.chart":
					array = context.instruments.slice();
					break;
				case "fdc3.position":
					array = [context.instrument];
					break;
				case "fdc3.portfolio":
					array = context.positions.slice();
					array.unshift({ symbol: chartSymbol, forceNull: true });
					break;
			}
			let list = [];
			array.forEach((item) => {
				if (item.type === "fdc3.position") item = item.instrument;
				let symbol = (item.id && item.id.ticker) || item.symbol;
				if (symbol || item.forceNull) list.push(symbol);
			});
			return list.slice(0, MAX_SYMBOLS);
		};
		// Get the range and periodicity to use in loadChart
		const getRangePeriodicity = (range, isHolding) => {
			if (!range)
				return {
					periodicity: defaultPeriodicity(isHolding)
				};
			let { start: dtLeft, end: dtRight } = range;
			if (dtLeft) dtLeft = new Date(dtLeft);
			if (dtRight) dtRight = new Date(dtRight);
			if (dtRight) {
				if (dtLeft)
					return {
						range: { dtLeft, dtRight }
					};
				return {
					range: { dtRight },
					periodicity: defaultPeriodicity(isHolding)
				};
			} else if (dtLeft)
				return {
					range: { dtLeft }
				};
			return {
				periodicity: defaultPeriodicity(isHolding)
			};
		};
		// Normalize to CIQ study definitions
		const normalizeIndicator = (fdc3Indicator) => {
			const {
				name,
				type,
				parameters: {
					period: Period,
					field: Field,
					matype: Type,
					instrument,
					custom
				} = {}
			} = fdc3Indicator;
			if (type !== "fdc3.indicator" || !name) return;
			let ret = {};
			switch (name) {
				case "ma":
					ret = {
						type: "ma",
						inputs: { Period, Field, Type }
					};
					break;
				case "stddev":
				case "bollbands":
					ret = {
						type: name == "stddev" ? "STD Dev" : "Bollinger Bands",
						inputs: {
							Period,
							Field,
							"Moving Average Type": Type
						}
					};
					break;
				case "atr":
					ret = { type: "ATR", inputs: { Period } };
					break;
				case "volume":
					ret = { type: "volume" };
					break;
				case "pricerel":
					ret = {
						type: "P Rel",
						inputs: { "Comparison Symbol": instrument.id.ticker }
					};
					break;
				default:
					let inputs = {};
					ret = {
						type: name,
						inputs: { Period, Field, "Moving Average Type": Type }
					};
					if (custom && custom.vendor == "chartiq") {
						CIQ.extend(inputs, custom.fields);
					}
					break;
			}
			if (ret.inputs) CIQ.scrub(ret.inputs);
			if (ret.inputs && !Object.keys(ret.inputs).length) delete ret.inputs;
			return ret;
		};
		// Adds an indicator to the chart
		const addIndicator = (stx, fdc3Indicator) => {
			let ciqStudy = normalizeIndicator(fdc3Indicator);
			if (ciqStudy) {
				if (ciqStudy.inputs && ciqStudy.inputs.Field) {
					const studies = stx.layout.studies;
					for (let study in studies) {
						if (studies[study].fdc3id == ciqStudy.inputs.Field)
							ciqStudy.inputs.Field = Object.keys(studies[study].outputMap)[0];
					}
				}
				let sd = CIQ.Studies.addStudy(stx, ciqStudy.type, ciqStudy.inputs);
				if (fdc3Indicator.refid) sd.fdc3id = fdc3Indicator.refid;
			}
		};
		// Determine if action needs to be taken or there is no material change.
		const changeDetected = (stx, symbols) => {
			if (symbols instanceof Array) {
				return !symbols.includes(stx.chart.symbol); // checks if symbol is anywhere in chart
			}
			return false;
		};
		// Prevent action on a broadcast which originated from here
		const echoPrevent = (context) => {
			for (let [ctx, date] of doNotRespond.entries()) {
				if (date < Date.now() - 3000) doNotRespond.delete(ctx);
			}
			return doNotRespond.has(context);
		};
		// Rebroadcasting function called after a raiseIntent or a symbol change from within chart.
		const notify = (obj, context) => {
			// Rebroadcast the context being processed
			if (context) {
				doNotRespond.set(context, Date.now());
				fdc3.broadcast(context);
			}
			// send out basic instrument message in case an app doesn't understand the context
			if (obj) {
				let instrumentContext = {
					type: "fdc3.instrument",
					name: obj.name,
					id: {
						ticker: obj.symbol
					}
				};
				doNotRespond.set(instrumentContext, Date.now());
				fdc3.broadcast(instrumentContext);
			}
		};
		// Get individualized callback function for loadChart on raiseIntent
		const getLoadChartCallback = (context, isIntent, stx, symbols) => {
			switch (context.type) {
				case "fdc3.instrument":
					return () => {
						if (isIntent) {
							notify(null, context);
							stx.setChartType("candle");
						}
					};
				case "fdc3.instrumentList":
					return () => {
						if (isIntent) notify(null, context);
						stx.setChartType("line");
						(symbols || []).forEach((sym, s) => {
							stx.addSeries(
								sym,
								CIQ.ensureDefaults(defaultSeriesParams(sym, s), {
									shareYAxis: true
								})
							);
						});
					};
				case "fdc3.position":
					return () => {
						if (isIntent) notify(null, context);
						stx.setChartType("line");
						stx.setChartScale("percent");
					};
				case "fdc3.portfolio":
					return () => {
						if (isIntent) notify(null, context);
						stx.setChartType("line");
						(symbols || []).forEach((sym, s) => {
							stx.addSeries(
								sym,
								CIQ.ensureDefaults(defaultSeriesParams(sym, s), {
									isComparison: true
								})
							);
						});
					};
				case "fdc3.chart":
					return () => {
						if (isIntent) notify(stx.chart.symbolObject, context);
						stx.setChartType(context.style);
						for (var id in stx.layout.studies) {
							CIQ.Studies.removeStudy(stx, stx.layout.studies[id]);
						}
						(context.indicators || []).forEach((i) => {
							addIndicator(stx, i);
						});
						(symbols || []).forEach((sym, s) => {
							stx.addSeries(
								sym,
								CIQ.ensureDefaults(defaultSeriesParams(sym, s), {
									isComparison: true
								})
							);
						});
					};
			}
		};
		// common listener for most contexts which bear instruments
		const commonInstrumentContextListener = (isIntent) => {
			return (context) => {
				if (echoPrevent(context)) return;
				let symbols = getSymbols(context, stx.chart.symbol);
				if (
					isIntent ||
					(context.type !== "fdc3.instrument" && BROADCAST_AS_INTENT) ||
					changeDetected(stx, symbols)
				) {
					log(isIntent, context.type);
					let params, cb;
					if (isIntent || BROADCAST_AS_INTENT) {
						Object.values(stx.chart.series).forEach((series) =>
							stx.removeSeries(series.id)
						);
						stx.setChartScale("linear");
						params = getRangePeriodicity(
							context.range,
							["fdc3.position", "fdc3.portfolio"].includes(context.type)
						);
						cb = getLoadChartCallback(context, isIntent, stx, symbols.slice(1));
					}
					suppressSymbolChange = true;
					stx.loadChart(symbols[0], params, () => {
						cb();
						suppressSymbolChange = false;
					});
				}
			};
		};
		const listeners = {
			"fdc3.instrument": commonInstrumentContextListener,
			"fdc3.instrumentList": commonInstrumentContextListener,
			"fdc3.position": commonInstrumentContextListener,
			"fdc3.portfolio": commonInstrumentContextListener,
			"fdc3.chart": commonInstrumentContextListener,
			"fdc3.dateRange": (isIntent) => {
				return (context) => {
					if (echoPrevent(context)) return;
					if (isIntent || BROADCAST_AS_INTENT) {
						log(isIntent, context.type);
						if (isIntent) notify(null, context);
						let { range } = getRangePeriodicity(context);
						stx.setRange(range);
					}
				};
			},
			"fdc3.indicator": (isIntent) => {
				return (context) => {
					if (echoPrevent(context)) return;
					if (isIntent || BROADCAST_AS_INTENT) {
						log(isIntent, context.type);
						if (isIntent) notify(null, context);
						addIndicator(stx, context);
					}
				};
			},
			// This can contain anything supported in ChartIQ layout or drawings.
			"cosaic.chartiq.state": (isIntent) => {
				return (context) => {
					if (echoPrevent(context)) return;
					if (isIntent || BROADCAST_AS_INTENT) {
						log(isIntent, context.type);
						Object.values(stx.chart.series).forEach((series) =>
							stx.removeSeries(series.id)
						);
						stx.setChartScale("linear");
						suppressSymbolChange = true;
						stx.importLayout(context.layout, {
							managePeriodicity: context.layout.interval,
							cb: (err) => {
								if (err) return;
								stx.importDrawings(context.drawings || []);
								if (isIntent) notify(stx.chart.symbolObject, context);
								suppressSymbolChange = false;
							}
						});
					} else if (changeDetected(stx, getSymbols(context.layout.symbols))) {
						log(false, context.type);
						suppressSymbolChange = true;
						stx.loadChart(
							context.layout.symbols[0].symbol,
							{},
							() => (suppressSymbolChange = false)
						);
					}
				};
			}
		};
		// add context listeners
		for (let l in listeners)
			subscriptions.push(fdc3.addContextListener(l, listeners[l]()));
		// add intent listener
		subscriptions.push(
			fdc3.addIntentListener("ViewChart", (context) => {
				const { type } = context;
				if (listeners[type]) {
					listeners[type](true)(context);
					return;
				}
				log(null, null, ` - unable to locate listener for context ${type}`);
			})
		);
		// Send a broadcast when symbol is changed from within the chart.
		const symbolChangeListenerObj = stx.addEventListener(
			"symbolChange",
			(obj) => {
				if (!suppressSymbolChange && obj.action == "master") {
					if (obj.prevSymbol !== obj.symbol) {
						notify(obj.symbolObject);
					}
				}
			}
		);
		const stxDestroy = stx.destroy.bind(stx);
		stx.destroy = () => {
			subscriptions.forEach((c) => {
				if (c.unsubscribe) c.unsubscribe();
			});
			subscriptions.length = 0;
			stx.removeEventListener(symbolChangeListenerObj);
			stxDestroy();
		};
	};
	// Unfortunate polling requirement to see if fdc3 is initialized on the chart.
	const fdc3Check = setInterval(checkAndReg, 50);
}
