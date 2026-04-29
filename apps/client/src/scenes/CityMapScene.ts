import Phaser from 'phaser';

interface District {
  key: string;
  name: string;
  x: number;
  y: number;
  color: number;
}

const DISTRICTS: District[] = [
  { key: 'money_functions', name: 'Монетный двор', x: 200, y: 200, color: 0xfdd835 },
  { key: 'purchases_prices', name: 'Торговая площадь', x: 480, y: 200, color: 0xef5350 },
  { key: 'family_budget', name: 'Жилой квартал', x: 760, y: 200, color: 0x66bb6a },
  { key: 'income_expenses', name: 'Деловой центр', x: 200, y: 440, color: 0x42a5f5 },
  { key: 'savings', name: 'Сберегательный парк', x: 480, y: 440, color: 0x8d6e63 },
  { key: 'banking_services', name: 'Банковский проспект', x: 760, y: 440, color: 0xab47bc },
];

interface SceneInitData {
  unlockedDistricts: string[];
}

/**
 * CityMap scene (section 2.3 of thesis).
 * Top-down navigation through 6 districts of FinGorod.
 *
 * In production: uses Tiled tilemap with separate background/objects/collision layers.
 * In this MVP: simplified primitive shapes for clear demonstration.
 */
export class CityMapScene extends Phaser.Scene {
  private avatar!: Phaser.Physics.Arcade.Sprite | Phaser.GameObjects.Arc;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private unlockedDistricts: Set<string> = new Set();

  constructor() {
    super({ key: 'CityMap' });
  }

  init(data: SceneInitData) {
    this.unlockedDistricts = new Set(data.unlockedDistricts ?? ['money_functions']);
  }

  create() {
    // Background grass
    this.add.rectangle(480, 320, 960, 640, 0xa8d8f0);

    // Roads
    this.add.rectangle(480, 200, 960, 60, 0xbdbdbd);
    this.add.rectangle(480, 440, 960, 60, 0xbdbdbd);
    this.add.rectangle(200, 320, 60, 640, 0xbdbdbd);
    this.add.rectangle(480, 320, 60, 640, 0xbdbdbd);
    this.add.rectangle(760, 320, 60, 640, 0xbdbdbd);

    // Districts
    DISTRICTS.forEach((d) => {
      const isUnlocked = this.unlockedDistricts.has(d.key);
      const fillColor = isUnlocked ? d.color : 0x555555;

      const building = this.add.rectangle(d.x, d.y, 100, 80, fillColor);
      building.setStrokeStyle(3, 0x000000);

      const label = this.add.text(d.x, d.y + 60, d.name, {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#000000',
        backgroundColor: '#ffffffaa',
        padding: { x: 4, y: 2 },
      });
      label.setOrigin(0.5);

      if (!isUnlocked) {
        const lock = this.add.text(d.x, d.y, '🔒', { fontSize: '32px' });
        lock.setOrigin(0.5);
      } else {
        // Make zone interactive
        building.setInteractive({ useHandCursor: true });
        building.on('pointerdown', () => this.enterDistrict(d.key));
      }
    });

    // Avatar (simple circle as placeholder for sprite)
    this.avatar = this.add.circle(100, 100, 16, 0xff5722) as never;
    this.physics.add.existing(this.avatar);
    const body = (this.avatar as Phaser.GameObjects.Arc).body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);

    // Input
    this.cursors = this.input.keyboard!.createCursorKeys();

    // Title
    this.add
      .text(480, 30, 'Карта ФинГорода', {
        fontFamily: 'Arial',
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#000000',
      })
      .setOrigin(0.5);

    this.add
      .text(480, 600, 'Стрелки — движение • ЛКМ по району — войти', {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#333333',
      })
      .setOrigin(0.5);
  }

  update() {
    if (!this.avatar) return;
    const body = (this.avatar as Phaser.GameObjects.Arc).body as Phaser.Physics.Arcade.Body;
    if (!body) return;

    const speed = 200;
    body.setVelocity(0);

    if (this.cursors.left?.isDown) body.setVelocityX(-speed);
    else if (this.cursors.right?.isDown) body.setVelocityX(speed);

    if (this.cursors.up?.isDown) body.setVelocityY(-speed);
    else if (this.cursors.down?.isDown) body.setVelocityY(speed);
  }

  private enterDistrict(key: string) {
    // In full implementation: navigate to lesson list filtered by topic_category
    console.log('Enter district:', key);
    window.dispatchEvent(new CustomEvent('district:enter', { detail: { key } }));
  }
}
