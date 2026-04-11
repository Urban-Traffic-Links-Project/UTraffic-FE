/**
 * @typedef {"flow"|"speed"|"density"} Metric
 * @typedef {"pearson"|"spearman"|"crosscorr"} Method
 *
 * @typedef {Object} Filters
 * @property {Metric} metric
 * @property {Method} method
 * @property {string} from ISO date string (YYYY-MM-DD)
 * @property {string} to ISO date string (YYYY-MM-DD)
 * @property {number} threshold Correlation threshold [0..1]
 * @property {number} topN
 *
 * @typedef {Object} Node
 * @property {string} id
 * @property {string} name
 * @property {number} lat
 * @property {number} lng
 * @property {string} zone
 *
 * @typedef {Object} Edge
 * @property {string} source
 * @property {string} target
 * @property {number} corr [-1..1]
 * @property {number} lag minutes (for cross-correlation)
 *
 * @typedef {Object} Matrix
 * @property {string[]} ids
 * @property {number[][]} values
 *
 * @typedef {Object} SeriesPoint
 * @property {number} t unix seconds
 * @property {number} v value
 *
 * @typedef {Object} TimeSeries
 * @property {string} nodeId
 * @property {Metric} metric
 * @property {SeriesPoint[]} points
 */
