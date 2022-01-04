module.exports = function (text) {
    var PF_SRT = function () {
        var pattern = /(\d+)\n([\d:,]+)\s+-{2}\>\s+([\d:,]+)\n([\s\S]*?(?=\n{2}|$))/g;
        var _regExp;

        var init = function () {
            _regExp = new RegExp(pattern);
        };

        var parse = function (f) {
            if (typeof (f) != "string")
                throw "Sorry, Parser accept string only.";

            var result = [];
            if (f == null)
                return _subtitles;

            f = f.replace(/\r\n|\r|\n/g, '\n')

            while ((matches = pattern.exec(f)) != null) {
                result.push(Object.assign(toLineObj(matches), { prevLineEnd: result[result.length - 1]?.endTime || "00:00:00" }));
            }
            return result;
        }

        var toLineObj = function (group) {
            return {
                line: group[1],
                startTime: group[2],
                endTime: group[3],
                text: group[4],
            };
        }

        init();

        return {
            parse: parse
        }
    }();
    return PF_SRT.parse(text)
}
