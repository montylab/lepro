import { __decorate, __extends } from "tslib";
import { Component, Vue } from 'vue-property-decorator';
var GridMap = /** @class */ (function (_super) {
    __extends(GridMap, _super);
    function GridMap() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.grid = [[]];
        _this.gridSize = {
            x: 200,
            y: 150
        };
        _this.cellSize = {
            x: 10,
            y: 10
        };
        _this.interval = -1;
        _this.infectedPeople = [];
        _this.maxPopulation = 23000000;
        _this.controls = {
            cellType: 'land'
        };
        _this.disease = {
            // 1 per 1000 died per illness
            lethality: 0.001,
            // 1 patient can infect 2.5 healthy man per day
            contagiousness: 2.5,
            //illness period is 7 days
            illnessPeriod: 7
        };
        return _this;
    }
    GridMap.prototype.mounted = function () {
        // 4x3
        var ratio = 4 / 3;
        var w = this.$el.clientWidth;
        var h = this.$el.clientHeight;
        if (h * ratio < w) {
            h = Math.floor(h / this.gridSize.y) * this.gridSize.y;
            w = h * ratio;
        }
        else {
            w = Math.floor(w / this.gridSize.x) * this.gridSize.x;
            h = w / ratio;
            //h = Math.floor(h / this.gridSize.y) * this.gridSize.y
        }
        ;
        this.$refs.canvas.width = w;
        this.$refs.canvas.height = h;
        this.cellSize = {
            x: Math.floor(w / this.gridSize.x),
            y: Math.floor(h / this.gridSize.y)
        };
        this.ctx = this.$refs.canvas.getContext('2d');
        //this.generateGridLevel2()
        this.generateGridLevel3();
        //this.interval = setInterval(this.gameloop.bind(this), 1000 / 60)
    };
    GridMap.prototype.drawGrid = function () {
        for (var x = 0; x < this.gridSize.x; x++) {
            for (var y = 0; y < this.gridSize.y; y++) {
                this.drawCell(this.grid[x][y]);
            }
        }
    };
    GridMap.prototype.drawCell = function (cell) {
        // this.ctx.fillStyle = cell.type === 'land' ? '#fff9d4' : '#5782ff'
        var b = Math.round(255 * (1 - cell.level));
        this.ctx.fillStyle = "rgb(" + b + ", " + b + ", " + b + ")";
        this.ctx.fillRect(cell.position.x * this.cellSize.x, cell.position.y * this.cellSize.y, this.cellSize.x - 1, this.cellSize.y - 1);
    };
    GridMap.prototype.destroyed = function () {
        clearInterval(this.interval);
    };
    GridMap.prototype.cellFabric = function (cell) {
        return {
            position: cell.position || { x: -1, y: -1 },
            level: cell.level || Math.random(),
            type: cell.type || Math.random() < 0.1 ? 'water' : 'land',
            population: cell.population ||
                Math.round(Math.random() * this.maxPopulation),
            temperature: cell.temperature || Math.round(Math.random() * 9),
            humidity: cell.humidity || Math.round(Math.random() * 9)
        };
    };
    GridMap.prototype.generateGridLevel = function () {
        for (var x = 0; x < this.gridSize.x; x++) {
            this.grid[x] = this.grid[x] || [];
            for (var y = 0; y < this.gridSize.y; y++) {
                this.grid[x][y] = this.cellFabric({ position: { x: x, y: y } });
            }
        }
    };
    GridMap.prototype.generateGridLevel2 = function () {
        var _this = this;
        var buildCity = function (v) {
            _this.grid[v.x][v.y].population =
                _this.maxPopulation * (0.5 + Math.random() / 2);
        };
        for (var x = 0; x < this.gridSize.x; x++) {
            this.grid[x] = this.grid[x] || [];
            for (var y = 0; y < this.gridSize.y; y++) {
                this.grid[x][y] = this.cellFabric({ position: { x: x, y: y } });
                this.grid[x][y].population = Math.floor(this.grid[x][y].population / 5);
            }
        }
    };
    // square-diamond
    GridMap.prototype.generateGridLevel3 = function () {
        var _this = this;
        // initial 4 points
        for (var x = 0; x < this.gridSize.x; x++) {
            this.grid[x] = this.grid[x] || [];
            for (var y = 0; y < this.gridSize.y; y++) {
                this.grid[x][y] = {
                    position: { x: x, y: y },
                    level: 0,
                    population: 0,
                    humidity: 0,
                    type: 'land',
                    temperature: 0
                };
            }
        }
        this.grid[0][0].level = 0;
        this.grid[this.gridSize.x - 1][0].level = 0.334;
        this.grid[this.gridSize.x - 1][this.gridSize.y - 1].level = 0.667;
        this.grid[0][this.gridSize.y - 1].level = 1;
        var averageVector = function (pArray) {
            return pArray.reduce(function (acc, p) {
                acc.x += p.x / pArray.length;
                acc.y += p.y / pArray.length;
                return acc;
            }, { x: 0, y: 0 });
        };
        var averageLevel = function (pArray) {
            return (pArray.reduce(function (acc, p) {
                acc += _this.grid[p.x][p.y].level;
                return acc;
            }, 0) / pArray.length);
        };
        function diamond(grid, p1, p2, p3, p4) {
            var p5 = averageVector([p1, p3]);
            grid[p5.x][p5.y].level = averageLevel([p1, p2, p3, p4]);
            //@ts-ignore
            square(grid, p1, p2, p3, p4, p5);
        }
        function square(grid, p1, p2, p3, p4, p5) {
            var p6 = averageVector([p1, p2]);
            var p7 = averageVector([p2, p3]);
            var p8 = averageVector([p3, p4]);
            var p9 = averageVector([p4, p1]);
            grid[p6.x][p6.y].level = averageLevel([p1, p2]);
            grid[p7.x][p7.y].level = averageLevel([p2, p3]);
            grid[p8.x][p8.y].level = averageLevel([p3, p4]);
            grid[p9.x][p9.y].level = averageLevel([p4, p1]);
            diamond(grid, p1, p6, p5, p9);
            diamond(grid, p6, p2, p7, p5);
            diamond(grid, p5, p7, p3, p8);
            diamond(grid, p9, p5, p8, p4);
            debugger;
        }
        diamond(this.grid, { x: 0, y: 0 }, { x: this.gridSize.x - 1, y: 0 }, { x: this.gridSize.x - 1, y: this.gridSize.y - 1 }, { x: 0, y: this.gridSize.y - 1 });
        this.drawGrid();
    };
    GridMap.prototype.gameloop = function () {
        console.log('tick');
        this.drawGrid();
    };
    GridMap = __decorate([
        Component
    ], GridMap);
    return GridMap;
}(Vue));
export default GridMap;
//# sourceMappingURL=GridMap.vue.js.map