let Horizontal = 0;
let Vertical = 1;

var FindEngine = function() {
    this.checked = null;
    this.tempChecked = null;
    this.result = null;
    this.tempResult = null;
    this.directionVector = [
        [{row: 0, col: -1}, {row: 0, col: 1}],
        [{row: -1, col: 0}, {row: 1, col: 0}],
    ];    
    this.init(true);
    this.tempInit(true);
}

FindEngine.prototype.init = function(is_first = false) {
    if (is_first) {
        this.checked = [];
    }
    for (let i = 0 ; i < ROW ; i++) {
        if (is_first) {
            this.checked.push([]);
        }
        for (let j = 0 ; j < COL ; j++) {
            if (is_first) {
                this.checked[i].push(false);
            } else {
                this.checked[i][j] = false;
            }
        }
    }
}

FindEngine.prototype.tempInit = function(is_first = false) {
    if (is_first) {
        this.tempChecked = [];
    }
    for (let i = 0 ; i < ROW ; i++) {
        if (is_first) {
            this.tempChecked.push([]);
        }
        for (let j = 0 ; j < COL ; j++) {
            if (is_first) {
                this.tempChecked[i].push(false);
            } else {
                this.tempChecked[i][j] = false;
            }
        }
    }
}

FindEngine.prototype.start = function(row, col, index) {
    if (this.checked[row][col]) return [];

    // console.log('start ~ ' + row + ', ' + col);
    this.tempInit();
    this.result = [{row: row, col: col, direct: -1}];
    let counter = 0;
    while (this.result.length > counter) {
        let info = this.result[counter];
        
        if (info.direct == -1 || info.direct == Vertical) {
            // console.log('horizontal');
            this.tempResult = [];
            this.find(info.row, info.col, index, Horizontal);
            this.checkTempResult(info.row, info.col);
        }
        if (info.direct == -1 || info.direct == Horizontal) {
            // console.log('vertical');
            this.tempResult = [];
            this.find(info.row, info.col, index, Vertical);
            this.checkTempResult(info.row, info.col);
        }
        counter++;
    }
    console.log(this.result);
    return this.result;
}

FindEngine.prototype.checkTempResult = function(row, col) {
    console.log(this.tempResult);
    if (this.tempResult.length > 1) {
        this.result = this.result.concat(this.tempResult);
        this.checked[row][col] = true;
        for (let info of this.tempResult) {
            this.checked[info.row][info.col] = true;
        }
    }
    this.tempInit();
}

FindEngine.prototype.find = function(row, col, index, direct) {
    this.tempChecked[row][col] = true;
    for (let i = 0 ; i < 2 ; i++) {
        let vec = this.directionVector[direct][i];
        let _row = row + vec.row;
        let _col = col + vec.col;
        if (GamePlay.inMatrix(_row, _col)) {
            if (!this.tempChecked[_row][_col] && !this.checked[_row][_col]) {
                if (GamePlay.arrCandies[_row][_col].index == index) {
                    console.log(_row + ', ' + _col);
                    this.tempResult.push({row: _row, col: _col, direct: direct});
                    this.find(_row, _col, index, direct);
                }
            }
        }
    }    
}