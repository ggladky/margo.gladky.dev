// Pug Dash - Level Definitions & Endless Generator

const LEVELS = [
    {
        id: 'park',
        name: 'Уровень 1: Утренний Парк',
        description: 'Тихий солнечный парк. Первые лужицы, собачьи какашки и вкусные сосиски!',
        difficulty: 'Легко ★☆☆',
        theme: 'park',
        musicTrack: 'park',
        baseSpeed: 5.5,
        targetLength: 2200,
        secretBonesTotal: 3,
        // Handcrafted obstacle layout
        // Coordinates: x in world pixels, y relative to ground level (0 = on ground, >0 = above ground)
        objects: [
            // Intro: simple single poop jumps
            { type: 'poop', x: 450, y: 0, width: 36, height: 34 },
            { type: 'bone', x: 600, y: 50, width: 32, height: 24, id: 0 }, // Secret Bone 1
            { type: 'poop', x: 750, y: 0, width: 36, height: 34 },
            
            // Double poop test
            { type: 'double_poop', x: 1050, y: 0, width: 68, height: 34 },

            // First platform staircase
            { type: 'block', x: 1300, y: 38, width: 60, height: 38, variant: 'hedge' },
            { type: 'block', x: 1360, y: 38, width: 60, height: 38, variant: 'hedge' },
            { type: 'poop', x: 1370, y: 0, width: 36, height: 34 }, // trap below

            // Jump Ring tutorial (Floating Sausage)
            { type: 'jump_ring', x: 1600, y: 80, width: 44, height: 44 },
            { type: 'poop', x: 1600, y: 0, width: 36, height: 34 }, // hazard under ring

            // Spring Pad bounce over tall hydrant
            { type: 'jump_pad', x: 1850, y: 0, width: 42, height: 20 },
            { type: 'hydrant', x: 1950, y: 0, width: 38, height: 60 },
            { type: 'bone', x: 1950, y: 120, width: 32, height: 24, id: 1 }, // Secret Bone 2

            // Platform sequence
            { type: 'block', x: 2150, y: 45, width: 50, height: 45, variant: 'brick' },
            { type: 'block', x: 2250, y: 85, width: 50, height: 85, variant: 'brick' },
            { type: 'poop', x: 2255, y: 85, width: 36, height: 34 }, // poop ON the platform!
            { type: 'jump_ring', x: 2400, y: 130, width: 44, height: 44 },

            // Angry neighbor dog barking!
            { type: 'angry_dog', x: 2650, y: 0, width: 48, height: 48 },
            { type: 'bone', x: 2850, y: 60, width: 32, height: 24, id: 2 }, // Secret Bone 3
            { type: 'triple_poop', x: 3000, y: 0, width: 96, height: 34 }
        ],
        endX: 3250
    },
    {
        id: 'city',
        name: 'Уровень 2: Городской Бульвар',
        description: 'Вечерний город: злые доберманы, шипящие коты на заборах и высокие гидранты!',
        difficulty: 'Нормально ★★★',
        theme: 'city',
        musicTrack: 'city',
        baseSpeed: 6.2,
        targetLength: 3500,
        secretBonesTotal: 3,
        objects: [
            // Fast double poop
            { type: 'double_poop', x: 450, y: 0, width: 68, height: 34 },
            { type: 'hydrant', x: 700, y: 0, width: 38, height: 60 },

            // Mud puddle + Jump pad combo
            { type: 'mud', x: 950, y: 0, width: 70, height: 16 },
            { type: 'jump_pad', x: 1040, y: 0, width: 42, height: 20 },
            { type: 'angry_dog', x: 1150, y: 0, width: 48, height: 48 },
            { type: 'bone', x: 1150, y: 120, width: 32, height: 24, id: 0 },

            // High blocks with cats
            { type: 'block', x: 1400, y: 48, width: 60, height: 48, variant: 'brick' },
            { type: 'block', x: 1520, y: 80, width: 60, height: 80, variant: 'brick' },
            { type: 'cat', x: 1530, y: 80, width: 40, height: 38 }, // Cat waiting on wall
            { type: 'jump_ring', x: 1680, y: 120, width: 44, height: 44 },

            // Triple poop challenge
            { type: 'triple_poop', x: 1900, y: 0, width: 96, height: 34 },

            // Double jump rings sequence in mid-air
            { type: 'jump_pad', x: 2200, y: 0, width: 42, height: 20 },
            { type: 'jump_ring', x: 2320, y: 100, width: 44, height: 44 },
            { type: 'jump_ring', x: 2460, y: 130, width: 44, height: 44 },
            { type: 'bone', x: 2460, y: 175, width: 32, height: 24, id: 1 },

            // Pit with angry dog
            { type: 'block', x: 2600, y: 55, width: 80, height: 55, variant: 'brick' },
            { type: 'angry_dog', x: 2750, y: 0, width: 48, height: 48 },
            { type: 'hydrant', x: 2900, y: 0, width: 38, height: 60 },
            { type: 'bone', x: 3100, y: 50, width: 32, height: 24, id: 2 },
            { type: 'double_poop', x: 3300, y: 0, width: 68, height: 34 }
        ],
        endX: 3600
    },
    {
        id: 'night',
        name: 'Уровень 3: Ночные Зумис & Ракета!',
        description: 'Безумный ночной двор! Режим РАКЕТЫ, полёты между котами и супер-скорость!',
        difficulty: 'Демон-Зумис ★★★★★',
        theme: 'night',
        musicTrack: 'night',
        baseSpeed: 7.2,
        targetLength: 4600,
        secretBonesTotal: 3,
        objects: [
            // Fast opening
            { type: 'poop', x: 420, y: 0, width: 36, height: 34 },
            { type: 'jump_pad', x: 650, y: 0, width: 42, height: 20 },
            { type: 'triple_poop', x: 770, y: 0, width: 96, height: 34 },
            { type: 'bone', x: 800, y: 120, width: 32, height: 24, id: 0 },

            // ROCKET PORTAL! Player transforms into flying Cardboard Rocket Pug!
            { type: 'portal_rocket', x: 1100, y: 70, width: 50, height: 80 },

            // Rocket Flight Section: dodge obstacles up & down!
            { type: 'hydrant', x: 1350, y: 0, width: 38, height: 80 },
            { type: 'cat', x: 1450, y: 190, width: 44, height: 42 },
            { type: 'poop', x: 1600, y: 0, width: 36, height: 34 },
            { type: 'cat', x: 1750, y: 220, width: 44, height: 42 },
            { type: 'bone', x: 1850, y: 110, width: 32, height: 24, id: 1 },
            { type: 'hydrant', x: 2000, y: 0, width: 38, height: 80 },
            { type: 'cat', x: 2150, y: 200, width: 44, height: 42 },
            { type: 'angry_dog', x: 2350, y: 0, width: 48, height: 48 },

            // NORMAL PORTAL! Transforms back into running pug
            { type: 'portal_normal', x: 2600, y: 60, width: 50, height: 80 },

            // Intense final run!
            { type: 'jump_pad', x: 2800, y: 0, width: 42, height: 20 },
            { type: 'jump_ring', x: 2950, y: 120, width: 44, height: 44 },
            { type: 'jump_ring', x: 3100, y: 140, width: 44, height: 44 },
            { type: 'bone', x: 3100, y: 190, width: 32, height: 24, id: 2 },
            { type: 'block', x: 3300, y: 60, width: 70, height: 60, variant: 'brick' },
            { type: 'triple_poop', x: 3550, y: 0, width: 96, height: 34 },
            { type: 'angry_dog', x: 3800, y: 0, width: 48, height: 48 }
        ],
        endX: 4100
    }
];

// Endless Level Generator for infinite replayability!
class EndlessGenerator {
    constructor() {
        this.nextX = 450;
        this.boneCount = 0;
    }

    reset() {
        this.nextX = 450;
        this.boneCount = 0;
    }

    generateChunk(targetX) {
        const objects = [];
        const patterns = [
            'single_poop',
            'double_poop',
            'triple_poop',
            'hydrant',
            'angry_dog',
            'pad_and_hazard',
            'block_stair',
            'ring_jump'
        ];

        while (this.nextX < targetX) {
            const p = patterns[Math.floor(Math.random() * patterns.length)];
            const dist = 240 + Math.random() * 140;

            switch (p) {
                case 'single_poop':
                    objects.push({ type: 'poop', x: this.nextX, y: 0, width: 36, height: 34 });
                    break;
                case 'double_poop':
                    objects.push({ type: 'double_poop', x: this.nextX, y: 0, width: 68, height: 34 });
                    break;
                case 'triple_poop':
                    objects.push({ type: 'triple_poop', x: this.nextX, y: 0, width: 96, height: 34 });
                    break;
                case 'hydrant':
                    objects.push({ type: 'hydrant', x: this.nextX, y: 0, width: 38, height: 60 });
                    break;
                case 'angry_dog':
                    objects.push({ type: 'angry_dog', x: this.nextX, y: 0, width: 48, height: 48 });
                    break;
                case 'pad_and_hazard':
                    objects.push({ type: 'jump_pad', x: this.nextX, y: 0, width: 42, height: 20 });
                    objects.push({ type: 'hydrant', x: this.nextX + 110, y: 0, width: 38, height: 60 });
                    this.nextX += 130;
                    break;
                case 'block_stair':
                    objects.push({ type: 'block', x: this.nextX, y: 45, width: 60, height: 45, variant: 'brick' });
                    objects.push({ type: 'poop', x: this.nextX + 10, y: 0, width: 36, height: 34 });
                    break;
                case 'ring_jump':
                    objects.push({ type: 'jump_ring', x: this.nextX, y: 90, width: 44, height: 44 });
                    objects.push({ type: 'poop', x: this.nextX, y: 0, width: 36, height: 34 });
                    break;
            }

            // Spawn bone treat occasionally
            if (Math.random() < 0.25) {
                objects.push({
                    type: 'bone',
                    x: this.nextX + 70,
                    y: 60 + Math.random() * 50,
                    width: 32,
                    height: 24,
                    id: this.boneCount++
                });
            }

            this.nextX += dist;
        }

        return objects;
    }
}

window.LEVELS = LEVELS;
window.EndlessGenerator = EndlessGenerator;
