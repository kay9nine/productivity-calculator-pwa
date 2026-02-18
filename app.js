// PWA: サービスワーカーの登録
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// ===================================
// 生産性計算ロジック
// ===================================

function calculate() {
    // --- 1. 入力値の取得と変換 ---
    const amountStr = document.getElementById('amount').value;
    const hoursStr = document.getElementById('hours').value || '0';
    const minutesStr = document.getElementById('minutes').value || '0';
    const countStr = document.getElementById('count').value;

    const amount = parseFloat(amountStr);
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    const count = parseFloat(countStr);

    // 総作業時間 (時間単位)
    const totalTime = hours + (minutes / 60);

    // --- 2. バリデーション（入力チェック） ---
    let errorMessage = "";

    if (isNaN(amount) || amount < 0) {
        errorMessage += "・金額を正しく入力してください。\n";
    }
    if (totalTime <= 0) {
        errorMessage += "・作業時間（hとmin）は、合計で0時間より大きい必要があります。\n";
    }
    if (isNaN(count) || count < 0) {
        errorMessage += "・件数を正しく入力してください。\n";
    }

    if (errorMessage) {
        alert("入力エラー:\n" + errorMessage);
        return;
    }

    // --- 3. 計算処理 ---
    // 時給 (小数点以下切り捨て)
    const hourlyEarnings = Math.floor(amount / totalTime);
    // 時間当たり件数 (小数点第1位まで)
    const hourlyCount = (count / totalTime).toFixed(1);

    let unitPrice = 0;
    let unitPriceText = "--- 円";

    if (count > 0) {
        // 単価 (小数点以下切り捨て)
        unitPrice = Math.floor(amount / count);
        unitPriceText = unitPrice.toLocaleString() + " 円";
    } else {
        unitPriceText = "--- (件数0)";
    }

    // --- 4. 結果の表示 ---
    document.getElementById('result-earnings').textContent = hourlyEarnings.toLocaleString() + " 円";
    document.getElementById('result-count').textContent = hourlyCount + " 件";
    document.getElementById('result-unit-price').textContent = unitPriceText;
}


// ===================================
// iPhone PWA 向け 独自プル・トゥ・リフレッシュ機能
// ===================================

let startY = 0;
const PULL_THRESHOLD = 150; // しきい値を上げて意図しない更新を防ぐ（150px）
const indicator = document.getElementById('refresh-indicator');

document.addEventListener('touchstart', (e) => {
    // スクロール位置が一番上の場合のみ動作させる
    if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
        indicator.style.opacity = '0'; // 初期化
    } else {
        startY = 0; // スクロール中の場合は無効にする
    }
}, { passive: true }); // パフォーマンス向上のため passive: true を使用

document.addEventListener('touchmove', (e) => {
    if (startY === 0) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - startY;

    if (distance > 0 && window.scrollY === 0) {
        // 下方向へのスワイプ
        e.preventDefault(); // ブラウザ標準の動作を抑止（iOS PWAでは効かない可能性もあるが念のため）

        // インジケーターの表示/非表示を切り替え
        const opacity = Math.min(distance / PULL_THRESHOLD, 1);
        indicator.style.opacity = opacity;

        // 少し引っ張っただけでは反応させない工夫
        if (distance > PULL_THRESHOLD) {
            indicator.textContent = '離すと更新';
            indicator.style.backgroundColor = '#28a745'; // 色を変えて通知
        } else {
            indicator.textContent = '下に引いて更新';
            indicator.style.backgroundColor = '#007bff';
        }
    }
}, { passive: false }); // preventDefaultを使う可能性があるため passive: false

document.addEventListener('touchend', (e) => {
    if (startY === 0) return;

    const endY = e.changedTouches[0].clientY;
    const distance = endY - startY;

    // インジケーターを非表示に戻す
    indicator.style.opacity = '0';

    // 規定の距離以上引っ張られていたらページをリロードする
    if (distance > PULL_THRESHOLD) {
        window.location.reload();
    }

    startY = 0;
}, { passive: true });

// ===================================
// 入力値の自動保存 (LocalStorage)
// ===================================

const inputIds = ['amount', 'hours', 'minutes', 'count'];

// 入力が変わるたびに保存
inputIds.forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
        const val = document.getElementById(id).value;
        localStorage.setItem(`productivity_${id}`, val);
    });
});

// ページ読み込み時に復元
window.addEventListener('load', () => {
    inputIds.forEach(id => {
        const savedVal = localStorage.getItem(`productivity_${id}`);
        if (savedVal !== null) {
            document.getElementById(id).value = savedVal;
        }
    });
    // 復元後に一度計算を実行（値がある場合）
    if (localStorage.getItem('productivity_amount')) {
        calculate();
    }
});