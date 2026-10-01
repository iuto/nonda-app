import confetti from 'canvas-confetti';

/**
 * 服薬完了時の華やかでおしゃれな🎉演出（紙吹雪＋絵文字エモーション）を発射
 */
export function triggerCelebrationConfetti() {
  const count = 180;
  const defaults = {
    origin: { y: 0.65 },
    zIndex: 9999,
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  // カラフルで爽やかなエメラルド＆ゴールド調の紙吹雪
  fire(0.25, {
    spread: 30,
    startVelocity: 50,
    colors: ['#10B981', '#34D399', '#F59E0B', '#3B82F6', '#EC4899'],
  });
  fire(0.2, {
    spread: 70,
    colors: ['#10B981', '#6EE7B7', '#FBBF24', '#A855F7'],
  });
  fire(0.35, {
    spread: 110,
    decay: 0.91,
    scalar: 0.9,
    colors: ['#059669', '#10B981', '#F59E0B', '#60A5FA'],
  });
  fire(0.1, {
    spread: 130,
    startVelocity: 25,
    decay: 0.92,
    colors: ['#34D399', '#FBBF24', '#F472B6'],
  });

  // 🎉, 💊, ✨, 🌸, 🌟 などの絵文字エモーションを発射
  try {
    const scalar = 2.2;
    const shapes: confetti.Shape[] = [
      confetti.shapeFromText({ text: '🎉', scalar }),
      confetti.shapeFromText({ text: '✨', scalar }),
      confetti.shapeFromText({ text: '💊', scalar }),
      confetti.shapeFromText({ text: '🌸', scalar }),
      confetti.shapeFromText({ text: '🌟', scalar }),
    ];

    confetti({
      particleCount: 24,
      spread: 90,
      startVelocity: 40,
      origin: { y: 0.65 },
      shapes,
      scalar,
      zIndex: 10000,
    });
  } catch (e) {
    // フォールバック（絵文字シェイプ非対応環境向け）
    console.log('Emoji confetti fallback', e);
  }
}
