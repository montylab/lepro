import {Vector} from "@/types";

const maxRandomDeviation = 1
const gridDiagonalDistance =
    (this.gridSize.x ** 2 + this.gridSize.y ** 2) ** 0.5

// initial 4 points
for (let x = 0; x < this.gridSize.x; x++) {
    this.grid[x] = this.grid[x] || []
    for (let y = 0; y < this.gridSize.y; y++) {
        this.grid[x][y] = {
            position: { x, y },
            level: 0,
            population: 0,
            humidity: 0,
            type: 'land',
            temperature: 0
        }
    }
}
this.grid[0][0].level = 0.4
this.grid[this.gridSize.x - 1][0].level = 0.2
this.grid[this.gridSize.x - 1][this.gridSize.y - 1].level = 0.8
this.grid[0][this.gridSize.y - 1].level = 0.6

const averageVector = (pArray: Vector[]): Vector => {
    const sum = pArray.reduce(
        (acc, p) => {
            acc.x += p.x
            acc.y += p.y
            return acc
        },
        { x: 0, y: 0 }
    )

    return {
        x: Math.floor(sum.x / pArray.length),
        y: Math.floor(sum.y / pArray.length)
    }
}

// first relative to second
const oppositeVector = (p: Vector, relative: Vector): Vector => {
    const op = {
        x: Math.floor(relative.x + (relative.x - p.x)),
        y: Math.floor(relative.y + (relative.y - p.y))
    }
    op.x = Math.max(0, Math.min(this.gridSize.x - 1, op.x))
    op.y = Math.max(0, Math.min(this.gridSize.y - 1, op.y))

    return op
}

const averageLevel = (pArray: Vector[]): number => {
    return (
        pArray.reduce((acc, p) => {
            acc += this.grid[p.x][p.y].level
            return acc
        }, 0) / pArray.length
    )
}

const vectorDistance = (p1: Vector, p2: Vector) => {
    return ((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2) ** 0.5
}

const diamond = (
    grid: Cell[][],
    p1: Vector,
    p2: Vector,
    p3: Vector,
    p4: Vector
) => {
    const p5 = averageVector([p1, p3])
    if (p1.x + 1 === p2.x) return
    grid[p5.x][p5.y].level =
        averageLevel([p1, p2, p3, p4]) +
        maxRandomDeviation *
        Math.min(
            1,
            vectorDistance(p1, p2) / gridDiagonalDistance / 7
        )

    // setTimeout(() => {
    square(grid, p1, p2, p3, p4, p5)
    // }, 0)
}

const normalize = (n: number) => Math.min(Math.max(0, n), 1)
const randomPlusMinus = () => 0.5 - Math.random()

const square = (
    grid: Cell[][],
    p1: Vector,
    p2: Vector,
    p3: Vector,
    p4: Vector,
    p5: Vector
) => {
    const p6 = averageVector([p1, p2])
    const p7 = averageVector([p2, p3])
    const p8 = averageVector([p3, p4])
    const p9 = averageVector([p4, p1])

    const op6 = oppositeVector(p5, p6)
    const op7 = oppositeVector(p5, p7)
    const op8 = oppositeVector(p5, p8)
    const op9 = oppositeVector(p5, p9)

    grid[p6.x][p6.y].level = normalize(
        averageLevel([p1, p2, p5, op6]) +
        randomPlusMinus() *
        maxRandomDeviation *
        Math.min(
            1,
            vectorDistance(p1, p2) / gridDiagonalDistance / 7
        )
    )
    grid[p7.x][p7.y].level = normalize(
        averageLevel([p2, p3, p5, op7]) +
        randomPlusMinus() *
        maxRandomDeviation *
        Math.min(
            1,
            vectorDistance(p2, p3) / gridDiagonalDistance / 7
        )
    )
    grid[p8.x][p8.y].level = normalize(
        averageLevel([p3, p4, p5, op8]) +
        randomPlusMinus() *
        maxRandomDeviation *
        Math.min(
            1,
            vectorDistance(p3, p4) / gridDiagonalDistance / 7
        )
    )
    grid[p9.x][p9.y].level = normalize(
        averageLevel([p4, p1, p5, op9]) +
        randomPlusMinus() *
        maxRandomDeviation *
        Math.min(
            1,
            vectorDistance(p4, p1) / gridDiagonalDistance / 7
        )
    )

    diamond(grid, p1, p6, p5, p9)
    diamond(grid, p6, p2, p7, p5)
    diamond(grid, p5, p7, p3, p8)
    diamond(grid, p9, p5, p8, p4)
}

console.time('map')
diamond(
    this.grid,
    { x: 0, y: 0 },
    { x: this.gridSize.x - 1, y: 0 },
    { x: this.gridSize.x - 1, y: this.gridSize.y - 1 },
    { x: 0, y: this.gridSize.y - 1 }
)
console.timeEnd('map')

this.vectorMap((cell: Cell) => {
    cell.level = cell.level ** 1.5
    return cell
})

//this.waterify(0.25)