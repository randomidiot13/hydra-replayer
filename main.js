const PIECE_SIZE = 4;
const PC_HEIGHT = 4;
const FIELD_HEIGHT = PIECE_SIZE + PC_HEIGHT;
const FIELD_WIDTH = 10;
const PIECE_SHAPES = 7;
const PC_PIECES = PC_HEIGHT * FIELD_WIDTH / PIECE_SIZE;
const ROT_STATES = 4;
const SEE = 7;

const MINO_TABLE = [
    [
        [[0, -1], [0, 0], [0, 1], [0, 2]],
        [[-1, 1], [0, 1], [1, 1], [2, 1]],
        [[1, 2], [1, 1], [1, 0], [1, -1]],
        [[2, 0], [1, 0], [0, 0], [-1, 0]]
    ],
    [
        [[-1, -1], [0, -1], [0, 0], [0, 1]],
        [[-1, 1], [-1, 0], [0, 0], [1, 0]],
        [[1, 1], [0, 1], [0, 0], [0, -1]],
        [[1, -1], [1, 0], [0, 0], [-1, 0]]
    ],
    [
        [[0, -1], [0, 0], [0, 1], [-1, 1]],
        [[-1, 0], [0, 0], [1, 0], [1, 1]],
        [[0, 1], [0, 0], [0, -1], [1, -1]],
        [[1, 0], [0, 0], [-1, 0], [-1, -1]]
    ],
    [
        [[0, 0], [-1, 0], [-1, 1], [0, 1]],
        [[0, 0], [-1, 0], [-1, 1], [0, 1]],
        [[0, 0], [-1, 0], [-1, 1], [0, 1]],
        [[0, 0], [-1, 0], [-1, 1], [0, 1]]
    ],
    [
        [[0, -1], [0, 0], [-1, 0], [-1, 1]],
        [[-1, 0], [0, 0], [0, 1], [1, 1]],
        [[0, 1], [0, 0], [1, 0], [1, -1]],
        [[1, 0], [0, 0], [0, -1], [-1, -1]]
    ],
    [
        [[0, -1], [0, 0], [-1, 0], [0, 1]],
        [[-1, 0], [0, 0], [0, 1], [1, 0]],
        [[0, 1], [0, 0], [1, 0], [0, -1]],
        [[1, 0], [0, 0], [0, -1], [-1, 0]]
    ],
    [
        [[-1, -1], [-1, 0], [0, 0], [0, 1]],
        [[-1, 1], [0, 1], [0, 0], [1, 0]],
        [[1, 1], [1, 0], [0, 0], [0, -1]],
        [[1, -1], [0, -1], [0, 0], [-1, 0]]
    ]
];

const COLOR_TABLE = [
    "#00ffff",
    "#3040ff",
    "#ffa500",
    "#ffff00",
    "#00ee00",
    "#ff00ff",
    "#ff0000",
    "#d3d3d3",
    "#000000"
];

const GARBAGE = 7;
const EMPTY = 8;

const JSTRIS_PIECES = [0, 3, 5, 2, 1, 4, 6];

function Piece(shape, rot, row, col) {
    this.shape = shape;
    this.rot = rot;
    this.row = row;
    this.col = col;

    this.get_mino = function (mino) {
        return [
            row + MINO_TABLE[this.shape][this.rot][mino][0],
            col + MINO_TABLE[this.shape][this.rot][mino][1]
        ];
    };
}

function Field(fhash = 0, fill = GARBAGE) {
    this.grid = Array(FIELD_HEIGHT).fill().map(
        () => Array(FIELD_WIDTH).fill(EMPTY)
    );
    for (let r = FIELD_HEIGHT - 1; r >= 0; r--) {
        for (let c = FIELD_WIDTH - 1; c >= 0; c--) {
            this.grid[r][c] = ((fhash % 2) ? fill : EMPTY);
            fhash = Math.floor(fhash / 2);
        }
    }
    this.lines = 0;

    this.can_place = function (p) {
        for (let mino = 0; mino < PIECE_SIZE; mino++) {
            let pos = p.get_mino(mino);
            if (pos[0] < 0 || pos[0] >= FIELD_HEIGHT || pos[1] < 0 || pos[1] >= FIELD_WIDTH) {
                return false;
            }
            if (this.grid[pos[0]][pos[1]] != EMPTY) {
                return false;
            }
        }
        return true;
    }

    this.place = function (p) {
        for (let mino = 0; mino < PIECE_SIZE; mino++) {
            let pos = p.get_mino(mino);
            this.grid[pos[0]][pos[1]] = p.shape;
        }
    };

    this.clear_lines = function () {
        let num_cleared = 0;
        let flag;
        for (let r = FIELD_HEIGHT - 1; r >= (PIECE_SIZE - num_cleared); r--) {
            if (r >= PIECE_SIZE) {
                for (let c = 0; c < FIELD_WIDTH; c++) {
                    flag = (this.grid[r][c] == EMPTY);
                    if (flag) {
                        break;
                    }
                }
                if (!flag) {
                    num_cleared++;
                }
                else if (num_cleared > 0) {
                    for (let c = 0; c < FIELD_WIDTH; c++) {
                        this.grid[r + num_cleared][c] = this.grid[r][c];
                    }
                }
            }
            else if (r >= 0) {
                for (let c = 0; c < FIELD_WIDTH; c++) {
                    this.grid[r + num_cleared][c] = this.grid[r][c];
                }
            }
            else {
                for (let c = 0; c < FIELD_WIDTH; c++) {
                    this.grid[r + num_cleared][c] = EMPTY;
                }
            }
        }
        this.lines += num_cleared;
    };

    this.hash = function () {
        let h = 0;
        for (let r = PIECE_SIZE + this.lines; r < FIELD_HEIGHT; r++) {
            for (let c = 0; c < FIELD_WIDTH; c++) {
                h *= 2;
                h += (this.grid[r][c] != EMPTY);
            }
        }
        h *= Math.pow(2, FIELD_WIDTH * this.lines);
        h += Math.pow(2, FIELD_WIDTH * this.lines) - 1;
        return h;
    }
}

function interpolate(f1, f2, shape) {
    for (let r = FIELD_HEIGHT; r >= PIECE_SIZE - 1; r--) {
        for (let c = -1; c <= FIELD_WIDTH; c++) {
            for (let t = 0; t < ROT_STATES; t++) {
                let p = new Piece(shape, t, r, c);
                if (f1.can_place(p)) {
                    let f3 = new Field(f1.hash());
                    f3.clear_lines();
                    f3.place(p);
                    f3.clear_lines();
                    if (f2.hash() == f3.hash()) {
                        return p;
                    }
                }
            }
        }
    }
}

function RNG(seed) {
    this.alea = aleaPRNG(seed);
    this.bag = [...JSTRIS_PIECES];

    this.next = function() {
        if (this.bag.length === 0) {
            this.bag = [...JSTRIS_PIECES];
        }
        let index = Math.floor(this.alea() * this.bag.length);
        let piece = this.bag[index];
        this.bag.splice(index, 1);
        return piece;
    }
}

function update_preview(id, pid) {
    let elem = document.getElementById(id);
    for (let e of [...document.querySelectorAll(`#${id} td`)]) {
        e.style.background = COLOR_TABLE[EMPTY];
    }
    if (pid == -1) return;
    let p = new Piece(pid, 0, 3, 3 + 2*(id == "playing-field"));
    for (let mino = 0; mino < PIECE_SIZE; mino++) {
        let pos = p.get_mino(mino);
        let sq = document.querySelector(`#${id} tr:nth-child(${pos[0]}) td:nth-child(${pos[1]})`);
        sq.style.background = COLOR_TABLE[pid];
    }
}

function update_field(f) {
    for (let r = PIECE_SIZE; r < FIELD_HEIGHT; r++) {
        for (let c = 0; c < FIELD_WIDTH; c++) {
            let sq = document.querySelector(`#playing-field tr:nth-child(${r + 13}) td:nth-child(${c + 1})`);
            sq.style.background = COLOR_TABLE[f.grid[r][c]];
        }
    }
}

function draw_frame(f) {
    if (f < 1) f = 1;
    
    let parity = f % 2;
    let fnum = Math.ceil(f / 2);
    let pcs = Math.floor((fnum - 1) / 10);

    if (fnum >= replay_data.length) {
        draw_frame(2 * (replay_data.length - 1));
        for (let r = 20 - PC_HEIGHT; r < 20; r++) {
            for (let c = 0; c < FIELD_WIDTH; c++) {
                let sq = document.querySelector(`#playing-field tr:nth-child(${r + 1}) td:nth-child(${c + 1})`);
                if (sq.style.background != "rgb(0, 0, 0)") {
                    sq.style.background = COLOR_TABLE[GARBAGE];
                }
            }
        }
        return 1;
    }

    let field = new Field();
    for (let i = 10*pcs + 1; i < fnum; i++) {
        let f2 = new Field(replay_data[i][1]);
        field.place(interpolate(field, f2, replay_data[i][0]));
        field.clear_lines();
    }
    field.place(interpolate(field, new Field(replay_data[fnum][1]), replay_data[fnum][0]));
    
    if (parity) {
        update_preview("playing-field", -1);
        update_field(field);
        update_preview("hold", held_pieces[fnum]);
        for (let i = 0; i < 5; i++) {
            update_preview(`next${i}`, all_pieces[fnum + 1 + i]);
        }
    }
    else {
        field.clear_lines();
        update_preview("playing-field", all_pieces[fnum + 1]);
        update_field(field);
        update_preview("hold", held_pieces[fnum]);
        for (let i = 0; i < 5; i++) {
            update_preview(`next${i}`, all_pieces[fnum + 2 + i]);
        }
    }

    document.getElementById("pc-count").innerHTML = Math.floor(f / 20);
    return 0;
}

async function main() {
    try {
        let replay_id = window.location.href.match(/.*\?(.*)/)[1];
        replay_id = parseInt(replay_id);
        if (isNaN(replay_id) || replay_id < 0) throw 1;
        t = await (await fetch(`replays/${replay_id}.txt`)).text();
        replay_data = t.split("\n");
        replay_data.pop();
        for (let i = 1; i < replay_data.length; i++) {
            replay_data[i] = replay_data[i].split(",").map(parseFloat);
        }
    }
    catch {
        document.getElementById("player").innerHTML = "Invalid replay";
        return;
    }
    let r = new RNG(replay_data[0]);
    all_pieces = [];
    for (let i = 0; i < replay_data.length - 1 + SEE; i++) {
        all_pieces.push(r.next());
    }
    held_pieces = [-1];
    let held = all_pieces[0];
    for (let i = 1; i < replay_data.length; i++) {
        let active = all_pieces[i];
        if (replay_data[i][0] == held) {
            held = active;
        }
        held_pieces.push(held);
    }

    let ids = ["hold", "next0", "next1", "next2", "next3", "next4"];
    for (let id of ids) {
        document.getElementById(id).innerHTML = (
            Array(4).fill().map(
                () => `<tr>` + Array(6).fill().map(
                    () => `<td style="background:${COLOR_TABLE[EMPTY]}"></td>`
                ).join("") + `</tr>`
            ).join("")
        );
    }
    document.getElementById("playing-field").innerHTML = (
        Array(20).fill().map(
            () => `<tr>` + Array(10).fill().map(
                () => `<td style="background:${COLOR_TABLE[EMPTY]}"></td>`
            ).join("") + `</tr>`
        ).join("")
    );
    for (let i = 0; i < 5; i++) {
        update_preview(`next${i}`, all_pieces[i]);
    }
    document.getElementById("pc-count").innerHTML = "0";
}

let running = false;

function worker(i, t) {
    if (!running) return;
    if (isNaN(i) || i < 1) i = 1;
    i = Math.min(i, 2 * replay_data.length - 1);
    if (isNaN(t) || t <= 0) t = 250;
    document.getElementById("start").value = i;
    if (draw_frame(i)) {
        stop();
        return;
    }
    setTimeout(() => worker(i+1, t), t);
}

function start() {
    document.getElementById("startstop").innerHTML = "Stop";
    document.getElementById("startstop").onclick = stop;
    running = true;
    worker(
        parseInt(document.getElementById("start").value) + 1,
        parseInt(document.getElementById("timeout").value)
    );
}

function stop() {
    document.getElementById("startstop").innerHTML = "Start";
    document.getElementById("startstop").onclick = start;
    running = false;
}

function go_back() {
    let i = parseInt(document.getElementById("start").value);
    if (isNaN(i) || i < 1) i = 1;
    i = Math.min(i, 2 * replay_data.length - 1);
    if (i > 1) i--;
    document.getElementById("start").value = i;
    draw_frame(i);
}

function go_forward() {
    let i = parseInt(document.getElementById("start").value);
    if (isNaN(i) || i < 0) i = 0;
    i = Math.min(i, 2 * replay_data.length - 1);
    if (i < 2 * replay_data.length - 1) i++;
    document.getElementById("start").value = i;
    draw_frame(i);
}
