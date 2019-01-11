var GamePlay = {
    game: controller.game,
    
    // ui variables
    sprGameBoard:       null,
    lblScore:           null,
    lblScoreMultiply:   null,
    lblHighScore:       null,
    sprGirl:            null,
    sprMedal:           null,
    lblNextMedal:       null,
    lblTimer:           null,
    btnSound:           null,

    // game variables
    paused:             false,
    isSoundOn:          1,
    iGoalCandyIndex:    -1,
    iHighScore:         0,
    iScore:             0,
    iMedal:             0,
    iGameTime:          0,
    music:              null,
    iScoreMultiply:     1,
    isScoreMultiplyAvailable: false,
    existScoreMultiply: false,

    arrCandies:     [],
    CANDY1:         null,
    CANDY2:         null,
    cnt_candies_move_animation_status: 0,

    arrChecked:             [],
    arrFoundCandies:        [],
    arrTempFoundCandies:    [],
    iCounter:       0,
    arrDirection:           [{x: -1, y: 0}, {x: 1, y: 0}, {x: 0, y: -1}, {x: 0, y: 1}],
    cnt_continuous_find:    0,
    arrNewPowerups:         [],
    matHint:                null,
    sprHint:                null,

    init: function() {
        this.game.renderer.renderSession.roundPixels = true;
        this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.game.scale.pageAlignHorizontally = true;
    },
    
    preload: function() {
        
    },
    
    create: function() {
        // init variables
        this.paused = false;
        this.iScore = 0;
        this.iScoreMultiply = 1;
        this.isScoreMultiplyAvailable = false;
        this.existScoreMultiply = false;
        this.iHighScore = readGameData('highscore', 0);
        this.iGameTime = GAME_TIME;
        this.CANDY1 = null;
        this.CANDY2 = null;
        this.cnt_candies_move_animation_status = 0;
        this.cnt_continuous_find = 0;
        this.iGoalCandyIndex = Math.floor(Math.random() * 100) % 3;
        this.isSoundOn = readGameData('sound', 1);
        playSound('music', 0.5, true);
        Howler.mute(1-this.isSoundOn);
        
        // create ui
        this.createUI();

        // init ui
        this.updateScore();
        this.updateMove();

        this.arrangeCandies();
        this.checkIsAvailableMatch();
    },

    createUI: function() {
        let me = this;

        // bg
        var sprMainBg   = newSprite('bg',  0, 0, 0, 0, 0, this.game);

        // score board
        var sprMainBg   = newSprite('sprScoreboard', 77, 121, 0.5, 0.5, 1, this.game);
        var scoreboard_1   = newSprite('sprScoreboard_1', 77, 47, 0.5, 0.5, 2, this.game);
        var scoreboard_2   = newSprite('sprScoreboard_2', 77, 236, 0.5, 0.5, 1, this.game);
        this.lblScore = newLabel('000000', 15, 'Arial', 'white', 77, 44, 0.5, 0.5, 1, this.game);
        newLabel('SCORE', 12, 'Arial', 'white', 53, 68, 0.5, 0.5, 1, this.game);
        this.lblScoreMultiply = newLabel('x ' + this.iScoreMultiply.toString(), 15, 'Arial', 'white', 106, 68, 0.5, 0.5, 1, this.game);
        this.sprMedal   = newSprite('medal', 77, 131, 0.5, 0.5, 2, this.game);
        this.lblNextMedal = newLabel('', 10, 'Arial', 'white', 77, 190, 0.5, 0.5, 1, this.game);
        this.updateMedal();

        // highscore
        newLabel('HIGH SCORE', 10, 'Arial', 'white', 77, 230, 0.5, 0.5, 1, this.game);
        this.lblHighScore = newLabel(this.iHighScore.toString(), 15, 'Arial', 'white', 77, 248, 0.5, 0.5, 1, this.game);
            
        if (this.isSoundOn == 1)
                this.btnSound = newButton('btnSound', 77, 295, 0.5, 0.5, this.onClickSound, this, this.game, false, null, 1, 0, 2);
        else
            this.btnSound = newButton('btnSound', 77, 295, 0.5, 0.5, this.onClickSound, this, this.game, false, null, 3, 2, 0);

        newButton('btnHint', 77, 350, 0.5, 0.5, this.onClickHint, this, this.game);

        // game board
        this.sprGameBoard   = newSprite('gameboard',  322, 192, 0.5, 0.5, 1, this.game);

        // timer
        this.lblTimer = newLabel(convertSecondToMinute(this.iGameTime), 120, 'Arial', 'white', 322, 192, 0.5, 0.5, 1, this.game, true, false, null, '#00c8fb', 0, 0, 5);
        let tween = this.game.add.tween(this.lblTimer).to({fontSize: 20, y: 360}, 1000, Phaser.Easing.Linear.None, true, 500);
        tween.onComplete.add(function() {
            me.gameTimer();
            me.game.input.onDown.add(me.onDown, me);
            me.game.input.onUp.add(me.onUp, me);

            playSound('go', 1, false);
            me.addMessage('GO!', 10, 50);
        });
    },

    addMessage: function(text, start_font_size, end_font_size) {
        let self = this;
        this.paused = true;
        let label = newLabel(text, start_font_size, 'Arial', 'white', this.sprGameBoard.width/2, this.sprGameBoard.height/2, 0.5, 0.5, 1000, this.game, true, true, this.sprGameBoard, 'black', 0, 0, 5);
        label.stroke = '#ff7e00';
        label.strokeThickness = 6;
        let tween = this.game.add.tween(label).to( {fontSize: end_font_size}, 1000, Phaser.Easing.Linear.None, true, 0);
        tween.onComplete.add(function() {
            setTimeout(() => {
                label.destroy();
                self.paused = false;
            }, 500);
        });
    },

    gameTimer: function() {
        if (this.iGameTime < 10) {
            playSound('warning', 1, false);
        }
        setTimeout(() => {
            if (this.iGameTime == 0) {
                this.input.onDown.removeAll();
                this.input.onUp.removeAll();
                this.gameOver();
                return;
            }
            if (!this.paused)
                this.iGameTime--;
            this.lblTimer.text = convertSecondToMinute(this.iGameTime);
            this.gameTimer();
        }, 1000);
    },

    gameOver: function() {
        playSound('timeup', 1, false);
        if (this.iHighScore < this.iScore) {
            saveGameData('highscore', this.iScore);
        }
        $(controller).trigger('post_message', {
            status: 'complete',
            score: this.iScore,
        });
        setTimeout(() => {
            location.reload();
        }, 2000);
    },

    gameOverAnimation: function() {

    },

    hideHint: function() {
        if (this.sprHint)
        this.sprHint.destroy();
    },

    showHint: function() {
        this.checkIsAvailableMatch();

        let pos = this.convertRCtoXY(matHint.row, matHint.col);
        pos.y -= GAP_Y/2;
        this.sprHint = newSprite('sprHint', pos.x, pos.y, 0.5, 0.5, ROW*COL, this.game, true, this.sprGameBoard);
        this.game.add.tween(this.sprHint).to({y: '+10'}, 500, Phaser.Easing.Linear.None, true, 0).loop(true);
    },

    onClickHint: function() {
        playSound('click', 1, false);
        if (!this.CANDY1 && !this.CANDY2 && this.iGameTime>0) {
            this.hideHint();
            this.showHint();
        }
    },

    onClickSound: function() {
        playSound('click', 1, false);
        Howler.mute(this.isSoundOn==0 ? false : true);
        
        this.isSoundOn = (this.isSoundOn == 1 ? 0 : 1);
        saveGameData('sound', this.isSoundOn);

        if (this.isSoundOn == 1) {
            this.btnSound.setFrames(1, 0, 2);
        } else {
            this.btnSound.setFrames(3, 2, 0);
        }
    },

    updateMedal: function() {
        this.sprMedal.frame = this.iMedal;
        this.sprMedal.scale.setTo(2);
        let tween = this.game.add.tween(this.sprMedal.scale).to( {x: 1, y: 1}, 300, Phaser.Easing.Bounce.Out, true, 0);

        if (this.iMedal == MEDAL.length-1) {
            this.lblNextMedal.text = "Achieved All Medals";
        } else {
            this.lblNextMedal.text = "NEXT MEDAL - " + MEDAL[this.iMedal+1] + "k";
        }
    },

    updateScoreMultiply: function() {
        this.lblScoreMultiply.text = 'x ' + this.iScoreMultiply.toString();
    },

    addScore: function(row, col, _score) {
        _score *= this.iScoreMultiply;

        let pos = this.convertRCtoXY(row, col);
        let lblScoreFloat = newLabel('+' + _score, 15, 'Arial', 'white', pos.x, pos.y, 0.5, 0.5, 1000, this.game, true, true, this.sprGameBoard);
        let tween = this.game.add.tween(lblScoreFloat).to( {y: '-50'}, 500, Phaser.Easing.Linear.None, true, 0);
        tween.onComplete.add(function() {
            lblScoreFloat.destroy();
        });

        this.iScore += _score;
        this.updateScore();
    },

    updateScore: function() {
        this.lblScore.text = this.iScore.toString();
        if (this.iMedal < MEDAL.length-1) {
            if (this.iScore >= MEDAL[this.iMedal+1]*1000) {
                this.iMedal++;
                this.updateMedal();

                this.iGameTime += TIME_BONUS[this.iMedal];
                    
                this.addMessage('Time Bonus: +' + TIME_BONUS[this.iMedal] + 's', 10, 40);
            }
        }
    },

    updateMove: function() {
        // this.lblMove.text = this.iMoves.toString();
    },
    
    updateGoalCount: function() {
        // this.lblGoal.text = ': ' + this.iGoalCandyCount.toString();
    },

    arrangeCandies: function() {
        this.arrCandies = [];
        for (let i = 0 ; i < ROW ; i++) {
            this.arrCandies.push([]);
            for (let j = 0 ; j < COL ; j++) {
                let nCandy = Math.floor(Math.random()*100) % CNT_CANDIES;
                while (this.checkThreeForStart(i, j, nCandy)) {
                    nCandy = Math.floor(Math.random()*100) % CNT_CANDIES;
                }
                let candy = new Candy(nCandy, i, j, this.sprGameBoard, this.game);
                this.arrCandies[i].push(candy);
            }
        }
    },

    convertRCtoXY: function(_row, _col) {
        let xx = POS_START_X + _col * GAP_X;
        let yy = POS_START_Y + _row * GAP_Y;
        return {x: xx, y: yy};
    },

    convertXYtoRC: function(_x, _y) {
        let _col = Math.floor((_x - POS_START_X + CANDY_WIDTH/2) / GAP_X);
        let _row = Math.floor((_y - POS_START_Y + CANDY_HEIGHT/2) / GAP_Y);
        return {row: _row, col: _col};
    },

    checkThreeForStart: function(_row, _col, _index) {
        // <-
        let row1 = _row, col1 = _col - 1;
        let row2 = _row, col2 = _col - 2;
        if (this.inMatrix(row1, col1) && this.inMatrix(row2, col2)) {
            if (this.arrCandies[row1][col1].index == _index && this.arrCandies[row2][col2].index == _index) {
                return true;
            }
        }
        // ^
        row1 = _row - 1, col1 = _col;
        row2 = _row - 2, col2 = _col;
        if (this.inMatrix(row1, col1) && this.inMatrix(row2, col2)) {
            if (this.arrCandies[row1][col1].index == _index && this.arrCandies[row2][col2].index == _index) {
                return true;
            }
        }
        return false;
    },

    inMatrix: function(_row, _col) {
        return (_row > -1 && _row < ROW && _col > -1 && _col < COL);
    },

    releasedCandy: function() {
        if (this.CANDY1) this.arrCandies[this.CANDY1.row][this.CANDY1.col].released();
        if (this.CANDY2) this.arrCandies[this.CANDY2.row][this.CANDY2.col].released();
        this.CANDY1 = null;
        this.CANDY2 = null;
    },

    onDown: function(pointer) {
        this.hideHint();
        if (!this.CANDY1 && !this.CANDY2) {
            let pos = convertToNodeSpace(pointer.x, pointer.y, this.sprGameBoard);
            let newRC = this.convertXYtoRC(pos.x, pos.y);
            if (this.inMatrix(newRC.row, newRC.col)) { 
                this.CANDY1 = {row: newRC.row, col: newRC.col, index: this.arrCandies[newRC.row][newRC.col].index};
                this.arrCandies[this.CANDY1.row][this.CANDY1.col].selected();
            }
        }
    },

    onUp: function(pointer) {
        if (this.CANDY1 && !this.CANDY2) {
            this.arrCandies[this.CANDY1.row][this.CANDY1.col].released();
            this.CANDY1 = null;
        }
    },

    swapCandies: function() {
        let r1 = this.CANDY1.row;
        let c1 = this.CANDY1.col;
        let r2 = this.CANDY2.row;
        let c2 = this.CANDY2.col;

        let temp = this.arrCandies[r1][c1];
        this.arrCandies[r1][c1] = this.arrCandies[r2][c2];
        this.arrCandies[r2][c2] = temp;

        this.CANDY1.row = r2;
        this.CANDY1.col = c2;
        this.CANDY2.row = r1;
        this.CANDY2.col = c1;
    },

    showCandies: function() {
        for (let i = 0 ; i < ROW ; i++) {
            let str = '';
            for (let j = 0 ; j < COL ; j++) {
                str += (this.arrCandies[i][j] == null ? ' ' : this.arrCandies[i][j].index) + ", ";
            }
        }
    },

    checkIsAvailableMatch: function() {
        let flag = false;
        matHint = null;

        for (let i = 0 ; i < ROW ; i++) {
            for (let j = 0 ; j < COL-1 ; j++) {
                let i1 = i + 1;
                let i2 = i - 1;
                let j1 = j + 1;
                let j2 = j + 2;
                let j3 = j - 1;
                let j4 = j + 3;
                let j5 = j - 2;
                // --\
                if (this.inMatrix(i, j) && this.inMatrix(i, j1) && this.inMatrix(i1, j2)) {
                    if (this.checkCandyIndex(i, j, i, j1, i1, j2)) {
                        matHint = {row: i1, col: j2};
                        flag = true;
                        break;
                    }
                }
                // --/
                if (this.inMatrix(i, j) && this.inMatrix(i, j1) && this.inMatrix(i2, j2)) {
                    if (this.checkCandyIndex(i, j, i, j1, i2, j2)) {
                        matHint = {row: i2, col: j2};
                        flag = true;
                        break;
                    }
                }
                // \--
                if (this.inMatrix(i, j) && this.inMatrix(i, j1) && this.inMatrix(i2, j3)) {
                    if (this.checkCandyIndex(i, j, i, j1, i2, j3)) {
                        matHint = {row: i2, col: j3};
                        flag = true;
                        break;
                    }
                }
                // /--
                if (this.inMatrix(i, j) && this.inMatrix(i, j1) && this.inMatrix(i1, j3)) {
                    if (this.checkCandyIndex(i, j, i, j1, i1, j3)) {
                        matHint = {row: i1, col: j3};
                        flag = true;
                        break;
                    }
                }
                // -- -
                if (this.inMatrix(i, j) && this.inMatrix(i, j1) && this.inMatrix(i, j4)) {
                    if (this.checkCandyIndex(i, j, i, j1, i, j4)) {
                        matHint = {row: i, col: j4};
                        flag = true;
                        break;
                    }
                }
                // - --
                if (this.inMatrix(i, j) && this.inMatrix(i, j1) && this.inMatrix(i, j5)) {
                    if (this.checkCandyIndex(i, j, i, j1, i, j5)) {
                        matHint = {row: i, col: j5};
                        flag = true;
                        break;
                    }
                }
                // -^-
                if (this.inMatrix(i, j) && this.inMatrix(i2, j1) && this.inMatrix(i, j2)) {
                    if (this.checkCandyIndex(i, j, i2, j1, i, j2)) {
                        matHint = {row: i2, col: j1};
                        flag = true;
                        break;
                    }
                }
                // -v-
                if (this.inMatrix(i, j) && this.inMatrix(i1, j1) && this.inMatrix(i, j2)) {
                    if (this.checkCandyIndex(i, j, i1, j1, i, j2)) {
                        matHint = {row: i1, col: j1};
                        flag = true;
                        break;
                    }
                }
            }
        }

        if (!flag) {
            for (let i = 0 ; i < ROW ; i++) {
                for (let j = 0 ; j < COL-1 ; j++) {
                    let i1 = i + 1;
                    let i2 = i + 2;
                    let i3 = i - 1;
                    let i4 = i + 3;
                    let i5 = i - 2;
                    let j1 = j - 1;
                    let j2 = j + 1;
                    // `|
                    if (this.inMatrix(i, j) && this.inMatrix(i1, j) && this.inMatrix(i3, j1)) {
                        if (this.checkCandyIndex(i, j, i1, j, i3, j1)) {
                            matHint = {row: i3, col: j1};
                            flag = true;
                            break;
                        }
                    }
                    // |'
                    if (this.inMatrix(i, j) && this.inMatrix(i1, j) && this.inMatrix(i3, j2)) {
                        if (this.checkCandyIndex(i, j, i1, j, i3, j2)) {
                            matHint = {row: i3, col: j2};
                            flag = true;
                            break;
                        }
                    }
                    // |-
                    if (this.inMatrix(i, j) && this.inMatrix(i1, j2) && this.inMatrix(i2, j)) {
                        if (this.checkCandyIndex(i, j, i1, j2, i2, j)) {
                            matHint = {row: i1, col: j2};
                            flag = true;
                            break;
                        }
                    }
                    // -|
                    if (this.inMatrix(i, j) && this.inMatrix(i1, j1) && this.inMatrix(i2, j)) {
                        if (this.checkCandyIndex(i, j, i1, j1, i2, j)) {
                            matHint = {row: i1, col: j1};
                            flag = true;
                            break;
                        }
                    }
                    // i
                    if (this.inMatrix(i, j) && this.inMatrix(i1, j) && this.inMatrix(i4, j)) {
                        if (this.checkCandyIndex(i, j, i1, j, i4, j)) {
                            matHint = {row: i4, col: j};
                            flag = true;
                            break;
                        }
                    }
                    // !
                    if (this.inMatrix(i, j) && this.inMatrix(i1, j) && this.inMatrix(i5, j)) {
                        if (this.checkCandyIndex(i, j, i1, j, i5, j)) {
                            matHint = {row: i5, col: j};
                            flag = true;
                            break;
                        }
                    }
                    // ,|
                    if (this.inMatrix(i, j) && this.inMatrix(i1, j) && this.inMatrix(i2, j1)) {
                        if (this.checkCandyIndex(i, j, i1, j, i2, j1)) {
                            matHint = {row: i2, col: j1};
                            flag = true;
                            break;
                        }
                    }
                    // |.
                    if (this.inMatrix(i, j) && this.inMatrix(i1, j) && this.inMatrix(i2, j2)) {
                        if (this.checkCandyIndex(i, j, i1, j, i2, j2)) {
                            matHint = {row: i2, col: j2};
                            flag = true;
                            break;
                        }
                    }
                }
            }
        }
        return flag;
    },

    checkCandyIndex: function(i, j, i1, j1, i2, j2) {
        return this.arrCandies[i][j].index == this.arrCandies[i1][j1].index && this.arrCandies[i][j].index == this.arrCandies[i2][j2].index;
    },

    reArrangeCandies: function() {
        this.addMessage('No more possible matches!\nShuffling...', 10, 20);

        for (let i = 0 ; i < ROW ; i++) {
            for (let j = 0 ; j < COL ; j++) {
                let i1 = Math.floor(Math.random()*100) % ROW;
                let j1 = Math.floor(Math.random()*100) % COL;
                let temp = this.arrCandies[i][j];
                this.arrCandies[i][j] = this.arrCandies[i1][j1];
                this.arrCandies[i1][j1] = temp;
            }
        }

        this.cnt_candies_move_animation_status = ROW * COL;
        for (let i = 0 ; i < ROW ; i++) {
            for (let j = 0 ; j < COL ; j++) {
                let pos = this.convertRCtoXY(i, j);
                pos.x -= (this.sprGameBoard.width * this.sprGameBoard.anchor.x);
                pos.y -= (this.sprGameBoard.height * this.sprGameBoard.anchor.y);
                this.arrCandies[i][j].moveTo(pos, this.reArrangeFinished);
            }
        }
    },

    reArrangeFinished: function() {
        this.cnt_candies_move_animation_status--;
        if (this.cnt_candies_move_animation_status == 0) {
            this.isScoreMultiplyAvailable = false;
            this.refillFinished();
        }
    },

    findSameCandy: function(row, col, index) {
        this.arrChecked[row][col] = true;
        this.arrTempFoundCandies.push({row: row, col: col});

        // horizontal
        let arrTemp1 = [];
        let i = row;
        for (let j = col-1 ; j > -1 ; j--) {
            if (!this.arrChecked[i][j] && (index == this.arrCandies[i][j].index)) {
                arrTemp1.push({row: i, col: j});
            } else {
                break;
            }
        }
        for (let j = col + 1 ; j < COL ; j++) {
            if (!this.arrChecked[i][j] && (index == this.arrCandies[i][j].index)) {
                arrTemp1.push({row: i, col: j});
            } else {
                break;
            }
        }

        // vertical
        let arrTemp2 = [];
        let j = col;
        for (let i = row-1 ; i > -1 ; i--) {
            if (!this.arrChecked[i][j] && (index == this.arrCandies[i][j].index)) {
                arrTemp2.push({row: i, col: j});
            } else {
                break;
            }
        }
        for (let i = row + 1 ; i < ROW ; i++) {
            if (!this.arrChecked[i][j] && (index == this.arrCandies[i][j].index)) {
                arrTemp2.push({row: i, col: j});
            } else {
                break;
            }
        }

        let arrTemp = [];
        if (arrTemp1.length > 1) arrTemp = arrTemp.concat(arrTemp1);
        if (arrTemp2.length > 1) arrTemp = arrTemp.concat(arrTemp2);

        if (arrTemp.length > 1) {
            // new powerup is available?
            let newPowerup = -1;
            if (arrTemp.length > 2) {
                if (arrTemp.length % 2 == 1)
                    newPowerup = 1;
                else
                    newPowerup = 2;
            }

            if (newPowerup > 0) this.arrNewPowerups.push({row: row, col: col, powerup_id: newPowerup});

            // check if has special candy
            let mat_powerups = [];

            let flag = this.arrCandies[row][col].powerup;
            if (flag == 1)
                mat_powerups.push({row: row, col: col});

            for (let mat of arrTemp) {
                if (this.arrCandies[mat.row][mat.col].powerup == 1) { 
                    mat_powerups.push({row: mat.row, col: mat.col});
                }
            }
            // if is special candy, remove row
            if (mat_powerups.length > 0) {
                for (let _mat of mat_powerups) {
                    for (let _row = _mat.row - 1 ; _row < _mat.row + 2 ; _row++) {
                        for (let _col = _mat.col - 1 ; _col < _mat.col + 2 ; _col++) {
                            if (this.inMatrix(_row, _col)) {
                                let mat = {row: _row, col: _col, explode: true};
                                this.arrChecked[mat.row][mat.col] = true;
                                this.arrTempFoundCandies.push(mat);
                            }
                        }
                    }
                }
                this.arrTempFoundCandies = this.arrTempFoundCandies.concat(arrTemp);
            } else {
                for (let mat of arrTemp)
                    this.arrChecked[mat.row][mat.col] = true;
                this.arrTempFoundCandies = this.arrTempFoundCandies.concat(arrTemp);
            }
        }
    },

    swapFinished: function() {
        this.cnt_candies_move_animation_status++;
        if (this.cnt_candies_move_animation_status == 2) {
            this.arrChecked = [];
            for (let i = 0 ; i < ROW ; i++) {
                this.arrChecked.push([]);
                for (let j = 0 ; j < COL ; j++) {
                    this.arrChecked[i].push(false);
                }
            }
            // swap before executing find algorithm.
            this.swapCandies();

            // initialize variables
            this.arrFoundCandies = [];
            this.arrTempFoundCandies = [];
            this.arrNewPowerups = [];

            // if powerup2
            if (this.CANDY1.index == CNT_CANDIES + 1 || this.CANDY2.index == CNT_CANDIES + 1) {
                let _index = this.CANDY1.index;
                let _row = this.CANDY1.row;
                let _col = this.CANDY1.col;
                if (_index == CNT_CANDIES + 1) {
                    this.arrFoundCandies.push({row: this.CANDY1.row, col: this.CANDY1.col});
                    _index = this.CANDY2.index;
                } else {
                    _row = this.CANDY2.row;
                    _col = this.CANDY2.col;
                    this.arrFoundCandies.push({row: this.CANDY2.row, col: this.CANDY2.col});
                }

                for (let i = 0 ; i < ROW ; i++) {
                    for (let j = 0 ; j < COL ; j++) {
                        if (this.arrCandies[i][j].index == _index && this.arrCandies[i][j].powerup != 2) {
                            this.arrFoundCandies.push({row: i, col: j, explode: true});
                        }
                    }
                }
                this.iCounter = this.arrFoundCandies.length;

                if (this.iCounter == 0) {
                    this.blastFoundCandies();
                } else {
                    playSound('thunder', 1, false);
                    let ii = 0;
                    for (let mat of this.arrFoundCandies) {
                        new Thunder(_index, _row, _col, mat.row, mat.col, this.game, this.sprGameBoard, this.thunderFinished, this, ii);
                        ii++;
                    }
                }

                return;
            } else { // execute find algorithm
                // check first candy
                this.findSameCandy(this.CANDY1.row, this.CANDY1.col, this.CANDY1.index);

                if (this.arrTempFoundCandies.length > 2) {
                    this.arrFoundCandies = this.arrFoundCandies.concat(this.arrTempFoundCandies);
                }
                this.arrTempFoundCandies = [];

                // check second candy, if indexs are same, not check
                if (this.CANDY1.index != this.CANDY2.index) {
                    this.findSameCandy(this.CANDY2.row, this.CANDY2.col, this.CANDY2.index);

                    if (this.arrTempFoundCandies.length > 2) {
                        this.arrFoundCandies = this.arrFoundCandies.concat(this.arrTempFoundCandies);
                    }
                }
            }

            // remove duplicate
            this.arrFoundCandies = this.removeDuplicate(this.arrFoundCandies);

            if (this.arrFoundCandies.length == 0) {
                playSound("bad", 1, false);
                // if not found, re-swap candies and return to original position
                this.swapCandies();

                let pos = this.convertRCtoXY(this.CANDY1.row, this.CANDY1.col);
                pos.x -= (this.sprGameBoard.width * this.sprGameBoard.anchor.x);
                pos.y -= (this.sprGameBoard.height * this.sprGameBoard.anchor.y);
                this.arrCandies[this.CANDY1.row][this.CANDY1.col].moveTo(pos, this.releaseCandies);

                pos = this.convertRCtoXY(this.CANDY2.row, this.CANDY2.col);
                pos.x -= (this.sprGameBoard.width * this.sprGameBoard.anchor.x);
                pos.y -= (this.sprGameBoard.height * this.sprGameBoard.anchor.y);
                this.arrCandies[this.CANDY2.row][this.CANDY2.col].moveTo(pos, this.releaseCandies);

                this.cnt_continuous_find = 0;
                this.isScoreMultiplyAvailable = false;
            } else {
                this.blastFoundCandies();
            }
        }
    },

    blastFoundCandies: function() {
        this.arrNewPowerups = this.removeDuplicate(this.arrNewPowerups);
        this.iCounter = this.arrFoundCandies.length;
        if (this.cnt_continuous_find < 13)
            playSound('matched_'+this.cnt_continuous_find, 1, false);
        else
            playSound('matched_12', 1, false);
            
        this.cnt_continuous_find++;
        this.checkReward();

        for (let mat of this.arrFoundCandies) {
            let powerupinfo = this.arrNewPowerups.find((el) => {return el.row == mat.row && el.col == mat.col});
            if (powerupinfo === undefined) {
                if (this.arrCandies[mat.row][mat.col].powerup == 3) {
                    this.existScoreMultiply = false;
                    this.iScoreMultiply++;
                    this.addScore(mat.row, mat.col, POWERUP_SCORE_3);
                    this.createScoreMultiplyLabel(mat.row, mat.col);
                }
                if (mat.hasOwnProperty('explode')) {
                    this.addScore(mat.row, mat.col, GEM_SCORE[this.arrCandies[mat.row][mat.col].index]);
                    this.arrCandies[mat.row][mat.col].explodeAnimation(this.blastFinished, this);
                } else {
                    this.addScore(mat.row, mat.col, GEM_SCORE[this.arrCandies[mat.row][mat.col].index]);
                    this.arrCandies[mat.row][mat.col].blastAnimation(this.blastFinished, this);
                }

                this.arrCandies[mat.row][mat.col] = null;
            } else {
                let addScoreAmount = 0;
                if (this.arrCandies[mat.row][mat.col].powerup == 3) {
                    this.existScoreMultiply = false;
                    this.iScoreMultiply++;
                    addScoreAmount = POWERUP_SCORE_1;
                    this.createScoreMultiplyLabel(mat.row, mat.col);
                } else {
                    if (powerupinfo.powerup_id == 1) {
                        addScoreAmount = POWERUP_SCORE_2;
                        playSound('odd_matched', 1, false);
                    } else {
                        addScoreAmount = POWERUP_SCORE_3;
                        playSound('even_matched', 1, false);
                    }
                }
                this.arrCandies[mat.row][mat.col].changeToPowerup(mat.row, mat.col, powerupinfo.powerup_id); //powerupinfo.powerup_id
                this.addScore(mat.row, mat.col, addScoreAmount);
                this.iCounter--;
            }
        }
    },

    createScoreMultiplyLabel: function(row, col) {
        playSound('scoremultiply', 1, false);
        this.updateScoreMultiply();

        this.addMessage('x' + this.iScoreMultiply, 15, 50);
    },

    removeDuplicate: function(arr) {
        let newArr = [];
        for (let mat of arr) {
            if (newArr.find((el) => {return el.row == mat.row && el.col == mat.col}) === undefined)
                newArr.push(mat);
        }
        return newArr;
    },

    thunderFinished: function() {
        this.iCounter--;
        if (this.iCounter < 1) {
            this.blastFoundCandies();
        }
    },

    refillFinished: function() {
        this.arrChecked = [];
        for (let i = 0 ; i < ROW ; i++) {
            this.arrChecked.push([]);
            for (let j = 0 ; j < COL ; j++) {
                this.arrChecked[i].push(false);
            }
        }

        // execute find algorithm
        this.arrFoundCandies = [];
        this.arrTempFoundCandies = [];
        this.arrNewPowerups = [];

        for (let i = 0 ; i < ROW ; i++) {
            for (let j = 0 ; j < COL ; j++) {
                if (!this.arrChecked[i][j]) {
                    this.arrTempFoundCandies = [];
                    this.findSameCandy(i, j, this.arrCandies[i][j].index);
                    if (this.arrTempFoundCandies.length > 2) {
                        this.arrFoundCandies = this.arrFoundCandies.concat(this.arrTempFoundCandies);
                    }
                }
            }
        }

        // remove duplicate
        this.arrFoundCandies = this.removeDuplicate(this.arrFoundCandies);

        if (this.arrFoundCandies.length == 0) {
            if (this.checkIsAvailableMatch()) {
                this.releasedCandy();
            } else {
                this.reArrangeCandies();
            }
        } else {
            this.blastFoundCandies();
        }
    },

    checkReward: function() {
        this.arrCandies[this.CANDY1.row][this.CANDY1.col].released();
        this.arrCandies[this.CANDY2.row][this.CANDY2.col].released();
        if (this.cnt_continuous_find % CNT_CONTINUOUS_FIND_FOR_SCORE_MULTILY == 0 && this.cnt_continuous_find > 0) {
            this.isScoreMultiplyAvailable = true;
        }
    },

    blastFinished: function() {
        this.iCounter--;
        if (this.iCounter < 1) {
            this.refillCandies();
        }
    },

    refillCandies: function() {
        let arrReposCandies = [];
        let m = 0;
        for (let j = 0 ; j < COL ; j++) {
            let n = 0;
            for (let i = ROW-1 ; i > -1 ; i--) {
                if (!this.arrCandies[i][j]) {
                    n++;
                } else {
                    if (n > 0) {
                        this.arrCandies[i+n][j] = this.arrCandies[i][j];
                        arrReposCandies.push({row: i+n, col: j});
                        this.arrCandies[i][j] = null;
                    }
                }
            }
            m += n;
        }
        this.cnt_candies_move_animation_status = arrReposCandies.length;
        if (arrReposCandies.length == 0 && m > 0) {
            this.cnt_candies_move_animation_status = 1;
            this.reposFinished();
        } else {
            for (let rc of arrReposCandies) {
                let pos = this.convertRCtoXY(rc.row, rc.col);
                pos.x -= (this.sprGameBoard.width * this.sprGameBoard.anchor.x);
                pos.y -= (this.sprGameBoard.height * this.sprGameBoard.anchor.y);
                this.arrCandies[rc.row][rc.col].moveTo(pos, this.reposFinished, true);
                this.arrCandies[rc.row][rc.col].position = pos;
            }
        }
    },

    reposFinished: function() {
        this.cnt_candies_move_animation_status--;
        if (this.cnt_candies_move_animation_status < 1) {
            this.cnt_candies_move_animation_status = 0;
            for (let i = 0 ; i < ROW ; i++) {
                for (let j = 0 ; j < COL ; j++) {
                    if (!this.arrCandies[i][j]) {
                        this.cnt_candies_move_animation_status++;
                        let nCandy = Math.floor(Math.random()*100) % CNT_CANDIES;
                        let powerup_id = 0;
                        if (this.isScoreMultiplyAvailable && !this.existScoreMultiply) {
                            powerup_id = 3;
                            this.existScoreMultiply = true;
                            this.isScoreMultiplyAvailable = false;
                        }
                        this.arrCandies[i][j] = new Candy(nCandy, i, j, this.sprGameBoard, this.game, this.createFinished, powerup_id);
                    }
                }
            }
        }
    },

    createFinished: function() {
        this.cnt_candies_move_animation_status--;
        if (this.cnt_candies_move_animation_status < 1) {
            this.refillFinished();
        }
    },

    releaseCandies: function() {
        this.cnt_candies_move_animation_status--;
        if (this.cnt_candies_move_animation_status == 0) {
            this.releasedCandy();
        }
    },

    update: function() {
        if (this.CANDY1 && !this.CANDY2) {
            let pos = convertToNodeSpace(this.game.input.x, this.game.input.y, this.sprGameBoard);
            let newRC = this.convertXYtoRC(pos.x, pos.y);
            if (this.inMatrix(newRC.row, newRC.col)) {
                let diffRow = Math.abs(newRC.row - this.CANDY1.row),
                    diffCol = Math.abs(newRC.col - this.CANDY1.col);
                
                if ((diffRow == 1 && diffCol == 1) || (diffRow > 1 || diffCol > 1)) {
                    this.arrCandies[this.CANDY1.row][this.CANDY1.col].released();
                    this.CANDY1 = null;
                    this.cnt_continuous_find = 0;
                    this.isScoreMultiplyAvailable = false;
                    return;
                }

                if ((diffRow == 1 && diffCol == 0) || (diffCol == 1 && diffRow == 0)) {
                    this.CANDY2 = {row: newRC.row, col: newRC.col, index: this.arrCandies[newRC.row][newRC.col].index};
                    this.arrCandies[this.CANDY2.row][this.CANDY2.col].selected();

                    this.cnt_candies_move_animation_status = 0;
                    
                    let pos = this.convertRCtoXY(this.CANDY2.row, this.CANDY2.col);
                    pos.x -= (this.sprGameBoard.width * this.sprGameBoard.anchor.x);
                    pos.y -= (this.sprGameBoard.height * this.sprGameBoard.anchor.y);
                    this.arrCandies[this.CANDY1.row][this.CANDY1.col].moveTo(pos, this.swapFinished);
                    
                    pos = this.convertRCtoXY(this.CANDY1.row, this.CANDY1.col);
                    pos.x -= (this.sprGameBoard.width * this.sprGameBoard.anchor.x);
                    pos.y -= (this.sprGameBoard.height * this.sprGameBoard.anchor.y);
                    this.arrCandies[this.CANDY2.row][this.CANDY2.col].moveTo(pos, this.swapFinished);
                } else {
                    if (diffRow == 0 && diffCol == 0) return;
                    this.arrCandies[this.CANDY1.row][this.CANDY1.col].released();
                    this.CANDY1 = null;
                    this.cnt_continuous_find = 0;
                    this.isScoreMultiplyAvailable = false;
                }
            }
        }
    },

};
