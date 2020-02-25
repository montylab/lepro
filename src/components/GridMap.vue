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
    type: 'water' | 'land'
    population: number
    temperature: number
    humidity: number
}

@Component
export default class GridMap extends Vue {
    grid: Array<Array<Cell>> = [[]]
    //@ts-ignore
    ctx: CanvasRenderingContext2D
    gridSize = {
        x: 190,
        y: 160
    }

    cellSize = {
        x: 10,
        y: 10
    }

    interval = -1
    infectedPeople: Array<Patient> = []

    maxPopulation = 23000000

    controls = {
        cellType: 'land'
    }

    disease = {
        // 1 per 1000 died per illness
        lethality: 0.001,

        // 1 patient can infect 2.5 healthy man per day
        contagiousness: 2.5,

        //illness period is 7 days
        illnessPeriod: 7
    }

    mounted() {
        this.generateGridLevel2()
        //@ts-ignore

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

        this.$refs.canvas.width = w
        this.$refs.canvas.height = h
        this.cellSize = {
            x: Math.floor(w / this.gridSize.x),
            y: Math.floor(h / this.gridSize.y)
        }
        this.ctx = (this.$refs.canvas as HTMLCanvasElement).getContext('2d')
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
        const b = (255 - (cell.population / this.maxPopulation) * 255).toFixed(
            0
        )
        this.ctx.fillStyle = `rgb(${b}, ${b}, ${b})`
        this.ctx.fillRect(
            cell.position.x * this.cellSize.x,
            cell.position.y * this.cellSize.y,
            this.cellSize.x - 1,
            this.cellSize.y - 1
        )
    }

    destroyed() {
        clearInterval(this.interval)
    }

    cellFabric(
        cell: Partial<Cell & { position: { x: number; y: number } }>
    ): Cell {
        return {
            position: cell.position,
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
