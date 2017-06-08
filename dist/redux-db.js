define("querySet", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var QuerySet = (function () {
        function QuerySet() {
        }
        return QuerySet;
    }());
    exports.QuerySet = QuerySet;
});
define("index", ["require", "exports", "querySet"], function (require, exports, querySet_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.QuerySet = querySet_1.QuerySet;
});
//# sourceMappingURL=redux-db.js.map