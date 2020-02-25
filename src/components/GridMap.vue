<template>
    <div class="p_map">
        <div id="info">&nbsp;</div>
        <div class="controls"></div>
        <canvas ref="canvas" class="map"></canvas>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { Vector } from '@/types'

type Patient = {
    coordinates: Array<number>
    dayOfSickness: number
    strength: number
}

type Cell = {
    position: { x: number; y: number }
    level: number
    type: 'water' | 'land'
    population: number
    temperature: number
    humidity: number
}

@Component
export default class GridMap extends Vue {
    grid: Cell[][] = [[]]
    //@ts-ignore
    ctx: CanvasRenderingContext2D
    gridSize = {
        x: 600,
        y: 450
    }

    cellSize = {
        x: 5,
        y: 5
    }

    interval = -1
    infectedPeople: Array<Patient> = []

    maxPopulation = 23000000

    disease = {
        // 1 per 1000 died per illness
        lethality: 0.001,

        // 1 patient can infect 2.5 healthy man per day
        contagiousness: 2.5,

        //illness period is 7 days
        illnessPeriod: 7
    }

    mounted() {
        // 4x3
        const ratio = 4 / 3

        let w = this.$el.clientWidth
        let h = this.$el.clientHeight

        if (h * ratio < w) {
            h = Math.floor(h / this.gridSize.y) * this.gridSize.y
            w = h * ratio
        } else {
            w = Math.floor(w / this.gridSize.x) * this.gridSize.x
            h = w / ratio
            //h = Math.floor(h / this.gridSize.y) * this.gridSize.y
        }

        ;(this.$refs.canvas as HTMLCanvasElement).width = w
        ;(this.$refs.canvas as HTMLCanvasElement).height = h
        this.cellSize = {
            x: Math.floor(w / this.gridSize.x),
            y: Math.floor(h / this.gridSize.y)
        }

        this.ctx = (this.$refs.canvas as HTMLCanvasElement).getContext(
            '2d'
        ) as CanvasRenderingContext2D

        //this.generateGridLevel2()
        this.generateGridLevel3()

        this.interval = setInterval(this.gameloop.bind(this), 1000 / 60)
    }

    drawGrid() {
        for (let x = 0; x < this.gridSize.x; x++) {
            for (let y = 0; y < this.gridSize.y; y++) {
                this.drawCell(this.grid[x][y])
            }
        }
    }

    drawCell(cell: Cell) {
        // this.ctx.fillStyle = cell.type === 'land' ? '#fff9d4' : '#5782ff'
        const b = Math.round(255 * (1 - cell.level))
        if (cell.type === 'water') {
            this.ctx.fillStyle = `#4378ff`
        } else {
            this.ctx.fillStyle = `rgb(${b}, ${b}, ${b})`
        }

        this.ctx.fillRect(
            cell.position.x * this.cellSize.x,
            cell.position.y * this.cellSize.y,
            this.cellSize.x - 0,
            this.cellSize.y - 0
        )
    }

    destroyed() {
        clearInterval(this.interval)
    }

    cellFabric(cell: Partial<Cell>): Cell {
        return {
            position: cell.position || { x: -1, y: -1 },
            level: cell.level || Math.random(),
            type: cell.type || Math.random() < 0.1 ? 'water' : 'land',
            population:
                cell.population ||
                Math.round(Math.random() * this.maxPopulation),
            temperature: cell.temperature || Math.round(Math.random() * 9),
            humidity: cell.humidity || Math.round(Math.random() * 9)
        }
    }

    generateGridLevel() {
        for (let x = 0; x < this.gridSize.x; x++) {
            this.grid[x] = this.grid[x] || []
            for (let y = 0; y < this.gridSize.y; y++) {
                this.grid[x][y] = this.cellFabric({ position: { x, y } })
            }
        }
    }

    generateGridLevel2() {
        const buildCity = (v: Vector) => {
            this.grid[v.x][v.y].population =
                this.maxPopulation * (0.5 + Math.random() / 2)
        }

        for (let x = 0; x < this.gridSize.x; x++) {
            this.grid[x] = this.grid[x] || []
            for (let y = 0; y < this.gridSize.y; y++) {
                this.grid[x][y] = this.cellFabric({ position: { x, y } })
                this.grid[x][y].population = Math.floor(
                    this.grid[x][y].population / 5
                )
            }
        }
    }

    waterify(level = 0.33) {
        this.vectorMap((cell: Cell) => {
            if (cell.level < level) {
                cell.type = 'water'
            }
            return cell
        })
    }

    vectorMap(f: Function) {
        for (let x = 0; x < this.gridSize.x; x++) {
            for (let y = 0; y < this.gridSize.y; y++) {
                this.grid[x][y] = f(this.grid[x][y], x, y)
            }
        }
    }

    // square-diamond
    generateGridLevel3() {
        const maxRandomDeviation = 0.125

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
                randomPlusMinus() * maxRandomDeviation

            //setTimeout(() => {
            square(grid, p1, p2, p3, p4, p5)
            //}, 100)
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
                    randomPlusMinus() * maxRandomDeviation
            )
            grid[p7.x][p7.y].level = normalize(
                averageLevel([p2, p3, p5, op7]) +
                    randomPlusMinus() * maxRandomDeviation
            )
            grid[p8.x][p8.y].level = normalize(
                averageLevel([p3, p4, p5, op8]) +
                    randomPlusMinus() * maxRandomDeviation
            )
            grid[p9.x][p9.y].level = normalize(
                averageLevel([p4, p1, p5, op9]) +
                    randomPlusMinus() * maxRandomDeviation
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
    }

    gameloop() {
        console.log('tick')
        this.drawGrid()
    }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.p_map {
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
}

.map {
    margin: auto;
}

#info {
    position: fixed;
    top: 20px;
    right: 20px;
}
</style>
