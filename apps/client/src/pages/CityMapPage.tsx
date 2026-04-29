import { useEffect, useRef } from 'react';
import { CityMapScene } from '../scenes/CityMapScene';
import { useAppSelector } from '../store';

export function CityMapPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const { unlockedDistricts } = useAppSelector((s) => s.progress);

  useEffect(() => {
    let cancelled = false;

    // Lazy-load Phaser only on this page (code splitting)
    import('phaser').then((Phaser) => {
      if (cancelled || !containerRef.current) return;

      gameRef.current = new Phaser.Game({
        type: Phaser.AUTO,
        parent: containerRef.current,
        width: 960,
        height: 640,
        backgroundColor: '#a8d8f0',
        physics: {
          default: 'arcade',
          arcade: { gravity: { x: 0, y: 0 }, debug: false },
        },
        scene: [CityMapScene],
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
      });

      gameRef.current.scene.start('CityMap', { unlockedDistricts });
    });

    return () => {
      cancelled = true;
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [unlockedDistricts]);

  return (
    <section className="city-map-page" aria-label="Карта ФинГорода">
      <h2>ФинГород</h2>
      <p className="hint">Используйте стрелки для перемещения по городу</p>
      <div
        ref={containerRef}
        className="phaser-container"
        role="application"
        aria-label="Интерактивная карта города"
      />
    </section>
  );
}
