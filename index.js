const fs = require('fs');
const path = require('path');

const _parser = require('./parser');

require('dotenv').config();

const { LINE_COUNT, DURATION } = process.env;

const _config = {
    filepath: "",
    subtitleText: "",
    subtitleJSON: [],
}

const _populateConfig = (filename) => {
    if (!filename) throw new Error("A valid subtitle filepath is required to populate config");

    _config.filepath = path.isAbsolute(filename) ? filename : path.join(__dirname, filename);
    _config.subtitleText = fs.readFileSync(_config.filepath, 'utf8');
    _config.subtitleJSON = _parser(_config.subtitleText);
    return _config;
}

const ParseTime = (time = "") => {
    if (!time) return null;
    const timeSplit = time.trim().split(",").join(":").split(":").map(e => Number(e.trim()));
    return new Date(2021, 0, 2, timeSplit[0] || 0, timeSplit[1] || 0, timeSplit[2] || 0, timeSplit[3] || 0);
}

const _getWPM = (statement) => {
    const punctuations = [".", ",", "!", " "];
    let string = statement.text;
    for (let punctuation of punctuations) {
        string = string.trim().split(punctuation).map(e => e.trim()).join(" ");
    }
    const wordLength = string.trim().split(" ").map(e => e.trim()).filter(e => e != "" && e).length;
    const duration = ParseTime(statement.endTime) - ParseTime(statement.startTime);
    return Math.floor(((wordLength * 100) / (duration / 1000 * 100) * (60 * 100)) / 100);
}

const _getAverageWPM = () => {
    if (!_config.filepath) throw new Error("Invalid subtitle filepath")

    const _wpmResults = [];

    const isStopDurationReached = () => {
        if (DURATION && _config.subtitleJSON[_wpmResults.length]) {
            const next = _config.subtitleJSON[_wpmResults.length];
            const _start = ParseTime(next.startTime) - ParseTime("00:00:00");
            return _start <= (DURATION * 1000 * 60)
        }
        return true;
    }

    const isMaxCountReached = () => {
        if (LINE_COUNT) {
            return _wpmResults.length < parseInt(LINE_COUNT)
        }
        return true;
    }

    while (_config.subtitleJSON[_wpmResults.length] && isMaxCountReached() && isStopDurationReached()) {
        const next = _config.subtitleJSON[_wpmResults.length];
        const wpm = _getWPM(next);
        _wpmResults.push(wpm);
    }

    const total = _wpmResults.reduce((a, b) => a + b, 0);
    const average = Math.round(total / _wpmResults.length);
    return average;
}

const _getPointsWithWPMMoreThanAverage = (averageWPM) => {
    if (!averageWPM) averageWPM = _getAverageWPM();
    if (!_config.filepath) throw new Error("Invalid subtitle filepath")

    const _results = [];

    for (const statement of _config.subtitleJSON) {
        const wpm = _getWPM(statement);
        if (wpm > averageWPM)
            _results.push(statement);
    }

    return _results;
}

const _isWPMMoreThanAverage = (statement, averageWPM) => {
    if (!averageWPM) averageWPM = _getAverageWPM();
    if (!_config.filepath) throw new Error("Invalid subtitle filepath")

    const wpm = _getWPM(statement);
    return wpm > averageWPM;
}

module.exports = {
    _populateConfig,
    _getWPM,
    _getAverageWPM,
    _getPointsWithWPMMoreThanAverage,
    _isWPMMoreThanAverage
}