import confetti from 'canvas-confetti';

/**
 * 服薬完了時の上品でスタイリッシュな祝福エフェクトを発射
 */
export function triggerCelebrationConfetti() {
  const count = 160;
  const defaults = {
    origin: { y: 0.62 },
    zIndex: 9999,
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  // 1. メインのキラキラ粒子（エメラルド・ミント・シャンパンゴールド・ホワイト）
  fire(0.25, {
    spread: 35,
    startVelocity: 55,
    colors: ['#10B981', '#34D399', '#F59E0B', '#FFFFFF', '#6EE7B7'],
  });

  fire(0.2, {
    spread: 75,
    colors: ['#059669', '#34D399', '#FBBF24', '#A7F3D0'],
  });

  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.9,
    colors: ['#10B981', '#F59E0B', '#3B82F6', '#FFFFFF'],
  });

  // 2. 上品に舞う星型シェイプ（ゴールド＆ホワイトスター）
  confetti({
    particleCount: 30,
    spread: 90,
    startVelocity: 42,
    origin: { y: 0.62 },
    shapes: ['star', 'circle'],
    scalar: 1.2,
    colors: ['#F59E0B', '#FBBF24', '#34D399', '#FFFFFF'],
    zIndex: 10000,
  });
}
