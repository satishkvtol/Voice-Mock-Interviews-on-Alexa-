export var LogLevel;
(function (LogLevel) {
    LogLevel["INFO"] = "INFO";
    LogLevel["WARN"] = "WARN";
    LogLevel["ERROR"] = "ERROR";
    LogLevel["DEBUG"] = "DEBUG";
})(LogLevel || (LogLevel = {}));
export const logger = {
    info: (message, meta = {}) => {
        console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: LogLevel.INFO, message, ...meta }));
    },
    warn: (message, meta = {}) => {
        console.warn(JSON.stringify({ timestamp: new Date().toISOString(), level: LogLevel.WARN, message, ...meta }));
    },
    error: (message, meta = {}) => {
        console.error(JSON.stringify({ timestamp: new Date().toISOString(), level: LogLevel.ERROR, message, ...meta }));
    },
    debug: (message, meta = {}) => {
        if (process.env.NODE_ENV !== 'production') {
            console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: LogLevel.DEBUG, message, ...meta }));
        }
    },
};
