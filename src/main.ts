const CANVAS_WIDTH = 600
const CENTER = CANVAS_WIDTH / 2
const BASE_RADIUS = 150
const RADIUS_OFFSET = 10
const TWO_PI = Math.PI * 2
const NUM_POSITIONS = 12
const GOAL_RADIUS_OFFSET = 20
const GOAL_RADIUS = 10
const LINE_RADIUS = 8
const GOAL_RADIUS_COLOR = 'blue'
const WALL_RADIUS_COLOR = '#bc4b51'
const GOAL_FILLED_COLOR = '#90BE6D'
const GOAL_UNFILLED_COLOR = '#EA9010'

import wallImage from './wall.png'
import levels from './levels.json'

let wallImageHtml = new Image()
wallImageHtml.src = wallImage

wallImageHtml.onload = () => loadCanvas()

const getOppositePosition = (position: number) => (position + 6) % NUM_POSITIONS

const renderContent = (ctx: CanvasRenderingContext2D) => {
    let gameElementsLevelPosition = new Set(
        levels.elements.flatMap((list, i) =>
            list.map((element) => `${i}-${element.position}`)
        )
    )

    const activeGoals = new Set<number>()

    // Reset canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_WIDTH)
    ctx.fillStyle = '#FBFBFB'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_WIDTH)

    // Draw three circles (structure of the game)
    for (let i = 0; i <= 2; i++) {
        const radius = getCircleRadius(i)
        drawGameCircle(ctx, radius, activeLine === i)
    }

    // For every circle
    for (let i = 2; i >= 0; i--) {
        // For every element in that circle
        for (const gameElement of levels.elements[i]) {
            if (gameElement.type === 'line') {
                // Calculate where the line ending
                const endLevelPosition = getLineReach(
                    gameElement,
                    i - 1,
                    gameElementsLevelPosition
                )
                // Calculate where the line should end
                const oppositePosition = getOppositePosition(
                    gameElement.position
                )
                let color = ''
                // If the line end where it should end (No objects on the path)
                if (
                    endLevelPosition.endLevel === 3 &&
                    endLevelPosition.endPosition === oppositePosition
                ) {
                    // If the end is a goal
                    if (goalGates.has(oppositePosition)) {
                        activeGoals.add(oppositePosition)
                        color = GOAL_FILLED_COLOR
                    } else color = GOAL_UNFILLED_COLOR
                } else {
                    color = WALL_RADIUS_COLOR
                }

                drawLine(
                    ctx,
                    i,
                    gameElement.position,
                    // Even tho the line is ending in the goal circle,
                    // we want to draw it only till the last normal circle
                    endLevelPosition.endLevel === 3
                        ? 2
                        : endLevelPosition.endLevel,
                    endLevelPosition.endPosition,
                    color
                )
            } else {
                drawWall(ctx, i, gameElement.position)
            }
        }
        drawGoals(ctx, getCircleRadius(2) + RADIUS_OFFSET, activeGoals)
        // To check if user won, we compare the completed goals with all the goals array
        if (
            [...activeGoals].toSorted().join(',') ===
            [...goalGates].toSorted().join(',')
        ) {
            console.log('YOU won')
        }
    }
}

const drawGameCircle = (
    ctx: CanvasRenderingContext2D,
    radius: number,
    isActive: boolean
) => {
    ctx.beginPath()
    ctx.arc(CENTER, CENTER, radius, 0, TWO_PI)
    ctx.lineWidth = 3
    ctx.strokeStyle = isActive ? '#7EB2DD' : 'black'
    ctx.stroke()
    ctx.strokeStyle = 'black'
    ctx.lineWidth = 1
}

function drawGoals(
    ctx: CanvasRenderingContext2D,
    radius: number,
    activeGoals: Set<number>
) {
    for (let i = 0; i < NUM_POSITIONS; i++) {
        const angle = ((i * Math.PI) / NUM_POSITIONS) * 2
        ctx.lineWidth = 1
        ctx.beginPath()

        const x = CENTER + Math.cos(angle) * (radius + GOAL_RADIUS_OFFSET)
        const y = CENTER + Math.sin(angle) * (radius + GOAL_RADIUS_OFFSET)

        ctx.beginPath()
        ctx.arc(x, y, GOAL_RADIUS, 0, 2 * Math.PI)
        if (goalGates.has(i) && activeGoals.has(i)) {
            ctx.fillStyle = GOAL_FILLED_COLOR
            ctx.fill()
        } else if (goalGates.has(i)) {
            ctx.fillStyle = GOAL_UNFILLED_COLOR
            ctx.fill()
        } else ctx.stroke()
    }
}

type GameElement = {
    readonly type: string
    position: number
}

let activeLine = 2

const getCircleRadius = (level: number) => {
    return BASE_RADIUS + 30 * level
}

const drawLine = (
    ctx: CanvasRenderingContext2D,
    level: number,
    position: number,
    endLevel: number,
    endPosition: number,

    color: string
) => {
    const angle = (position * (Math.PI * 2)) / NUM_POSITIONS

    const direction = (endPosition * (Math.PI * 2)) / NUM_POSITIONS

    const startRadius = getCircleRadius(level)
    const endRadius = getCircleRadius(endLevel)

    const x1 = CENTER + Math.cos(angle) * startRadius
    const y1 = CENTER + Math.sin(angle) * startRadius

    const x2 = CENTER + Math.cos(direction) * endRadius
    const y2 = CENTER + Math.sin(direction) * endRadius

    ctx.beginPath()
    ctx.arc(x1, y1, LINE_RADIUS, 0, 2 * Math.PI)
    ctx.fillStyle = GOAL_RADIUS_COLOR

    ctx.fill()

    ctx.beginPath()

    // place the cursor from the point the line should be started
    ctx.moveTo(x1, y1)
    ctx.strokeStyle = color
    ctx.lineWidth = 6
    // draw a line from current cursor position to the provided x,y coordinate
    ctx.lineTo(x2, y2)
    ctx.stroke()
    ctx.strokeStyle = 'black'
    ctx.lineWidth = 1
}

const drawWall = (
    ctx: CanvasRenderingContext2D,
    level: number,
    position: number
) => {
    // The image is pointing down by default so we need to offset the angle by 90 degree
    const angleOffset = Math.PI / 2

    const angle = (position * (Math.PI * 2)) / NUM_POSITIONS
    const startRadius = getCircleRadius(level)

    const x = CENTER + Math.cos(angle) * startRadius
    const y = CENTER + Math.sin(angle) * startRadius

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angleOffset + angle)
    ctx.drawImage(wallImageHtml, -20, -20, 40, 40)
    ctx.restore()
}

const loadCanvas = () => {
    const canvas = document.getElementById('rc_canvas')
    if (!canvas) throw new Error('Something went wrong')

    const ctx = (canvas as HTMLCanvasElement).getContext('2d')!

    renderContent(ctx)

    document.addEventListener('keydown', (event) => {
        if (event.key == 'ArrowLeft') {
            for (const gameElement of levels.elements[activeLine])
                gameElement.position =
                    gameElement.position - 1 < 0
                        ? NUM_POSITIONS - 1
                        : gameElement.position - 1
        } else if (event.key == 'ArrowRight') {
            for (const gameElement of levels.elements[activeLine])
                gameElement.position =
                    (gameElement.position + 1) % NUM_POSITIONS
        } else if (event.key == 'ArrowUp') {
            if (activeLine < 2) activeLine += 1
        } else if (event.key == 'ArrowDown') {
            if (activeLine > 0) activeLine -= 1
        }
        renderContent(ctx)
    })
}

const getLineReach = (
    gameElement: GameElement,
    level: number,
    gamePositions: Set<string>
) => {
    for (let j = level; j >= -3; j--) {
        const isOpposite = j < 0

        const { endLevel, endPosition } = {
            endLevel: isOpposite ? Math.abs(j + 1) : j,
            endPosition: isOpposite
                ? getOppositePosition(gameElement.position)
                : gameElement.position,
        }

        if (gamePositions.has(`${endLevel}-${endPosition}`)) {
            return { endLevel, endPosition }
        }
    }

    return {
        endPosition: getOppositePosition(gameElement.position),
        endLevel: 3,
    }
}

const goalGates = new Set(levels.goals)
