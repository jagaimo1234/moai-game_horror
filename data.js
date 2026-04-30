// ============================================================
// ▼▼▼ 作品リスト管理エリア ▼▼▼
// ------------------------------------------------------------
// 【フォルダ構成ルール】
//   images/kurima/          ← カバー画像（タイル一覧に使う1枚）をここに置く
//   images/kurima/作品名/   ← 詳細画像（複数枚）をここに置く
//
// 【設定項目】
//   image  : カバー画像パス（タイルに表示される1枚）
//   images : 詳細ページのサムネイルに並べる画像リスト（省略可）
//            → images/kurima/作品フォルダ/ に入れた画像を指定する
//   name   : 作品名（\n で改行）
//   desc   : 説明文
//
// 【詳細画像の追加手順】
//   1. images/kurima/作品名フォルダ/ に画像を入れる
//   2. 対応する作品の images: [...] にパスを追加する
// ============================================================
const EVENTS = {
  kurima: {
    label: '名古屋クリマ',
    products: [
      {
        image: 'images/kurima/moai_robo_mk2_gray.jpg',
        images: [
          'images/kurima/moai_robo_mk2/AQPdrFQDuoxgGlcdm7i4irYeNCUuZsS6m0XHydup6l3ZnFHDMv0uWMsTpp5iOlOBLDrg-uTclRGyNoU3NR_Pmv2smD39VeJnaz8dM70.mp4',
          'images/kurima/moai_robo_mk2_gray.jpg',
          'images/kurima/moai_robo_mk2/hat_01.png',
          'images/kurima/moai_robo_mk2/hat_02.png',
          'images/kurima/moai_robo_mk2/hat_03.png',
          'images/kurima/moai_robo_mk2/hat_04.png',
          'images/kurima/moai_robo_mk2/duo_01.png',
          'images/kurima/moai_robo_mk2/duo_02.png',
          'images/kurima/moai_robo_mk2/parts_01.png',
          'images/kurima/moai_robo_mk2/parts_02.png',
          'images/kurima/moai_robo_mk2/parts_03.png',
          'images/kurima/moai_robo_mk2/parts_04.png',
          'images/kurima/moai_robo_mk2/hand_01.png',
          'images/kurima/moai_robo_mk2/hand_02.png',
          'images/kurima/moai_robo_mk2/laying_01.png',
          'images/kurima/moai_robo_mk2/action_01.png',
          'images/kurima/moai_robo_mk2/action_02.png',
          'images/kurima/moai_robo_mk2/action_03.png',
          'images/kurima/moai_robo_mk2/stand_01.png',
          'images/kurima/moai_robo_mk2/stand_02.png',
          'images/kurima/moai_robo_mk2/stand_03.png',
          'images/kurima/moai_robo_mk2/stand_04.png',
        ],
        name:  'MOAI ROBO MARK 2',
        desc:  '酒よりヨーグルト好きなモアイロボット。組み立て式フィギュア。カラーバリエーションあり。'
      },
      {
        image: 'images/kurima/moai_robo_mk2_blue.png',
        name:  'MOAI ROBO MARK 2\nblue edition',
        desc:  'ブルーカラーの限定カラー版。箱付き。'
      },
      {
        image: 'images/kurima/moai_robo_mk2_pink.png',
        name:  'MOAI ROBO MARK 2\npink edition',
        desc:  'ピンクカラーの限定カラー版。箱付き。'
      },
      {
        image: 'images/kurima/moai_robo_mk2_trio.jpg',
        name:  'MOAI ROBO MARK 2\n- TRIO EDITION -',
        desc:  'ブルー・グレー・ピンクの3体セット。'
      },
      {
        image: 'images/kurima/moai_robo_yogurt_lover.jpg',
        name:  'MOAI ROBO\n-Yogurt Lover-',
        desc:  '初代モアイロボ。1/144スケール。ヨーグルトを持った愛らしいフィギュア。'
      },
      {
        image: 'images/kurima/moai_robo_strawmilk.jpg',
        name:  'MOAI ROBO\n-Strawmilk Lover-',
        desc:  'いちごミルクが大好きなモアイロボ。1/144スケール。'
      },
      {
        image: 'images/kurima/nomidakure_moai_robo.jpg',
        name:  'のみだくれ\nモアイロボ',
        desc:  '-Drunk Moai Robot- ヨーグルト片手に飲んだくれ。'
      },
      {
        image: 'images/kurima/keychain.jpg',
        images: [
          'images/kurima/keychain.jpg',
          'images/kurima/keychain/detail_01.jpg',
          'images/kurima/keychain/detail_02.jpg',
          'images/kurima/keychain/detail_03.png',
          'images/kurima/keychain/detail_04.png',
          'images/kurima/keychain/detail_05.png',
          'images/kurima/keychain/detail_06.png',
          'images/kurima/keychain/detail_07.png',
          'images/kurima/keychain/movie.mp4',
        ],
        name:  'モアイロボ ヨーグルトランEX\nカートリッジキーホルダー',
        desc:  'スマホをかざすと遊べる！AR対応ゲームカートリッジ型キーホルダー。'
      },
      {
        image: 'images/kurima/glasses_stand.jpg',
        images: [
          'images/kurima/glasses_stand.jpg',
          'images/kurima/glasses_stand/movie.mp4',
        ],
        name:  'まちょい モアイな\nメガネスタンド',
        desc:  '頭にはメガネクロス付き。マッチョなモアイがメガネをがっしりホールド。'
      },
      {
        image: 'images/kurima/macho_moai_pen.jpg',
        images: [
          'images/kurima/macho_moai_pen.jpg',
          'images/kurima/macho_moai_pen/detail_01.jpg',
          'images/kurima/macho_moai_pen/detail_02.jpg',
          'images/kurima/macho_moai_pen/detail_03.jpg',
          'images/kurima/macho_moai_pen/detail_04.jpg',
        ],
        name:  'マッチョな\nモアイペン立て',
        desc:  'しがないマッチョ。パワーッ!!!'
      },
      {
        image: 'images/kurima/positive_moai_pen.jpg',
        name:  'ポジティブモアイ\nペン立て ハチマキSP',
        desc:  '見ているだけで力が湧いてくる。ガンバレ..!!!'
      },
      {
        image: 'images/kurima/tegotae_moai_pen.jpg',
        name:  '手応えを掴んだ\nモアイペン立て',
        desc:  '何を掴んだのかはわからない。いける..!!!'
      },
      {
        image: 'images/kurima/osuwari_moai_pen.jpg',
        name:  'おすわり\nモアイペン立て',
        desc:  'ちょこんとあなたの隣で、あなたの行くすえを見守ります。'
      },
      {
        image: 'images/kurima/headphone_moai_vase.jpg',
        name:  'ヘッドホン\nモアイ一輪挿し',
        desc:  'ヘッドホンをつけたモアイが一輪挿しに。インテリアにぴったり。'
      },
      {
        image: 'images/kurima/moai_incense.jpg',
        images: [
          'images/kurima/moai_incense.jpg',
          'images/kurima/moai_incense/detail_01.jpg',
          'images/kurima/moai_incense/detail_02.jpg',
        ],
        name:  'モアイお香立て\n「半グレリーゼント番長」',
        desc:  'タバコのようにお香を嚙む。世の不条理にグレたリーゼント番長。'
      },
      {
        image: 'images/kurima/kangaeru_moai.jpg',
        name:  '考えるモアイ',
        desc:  '植物に相性ピッタリ。モアイなりにあなたのそばで一緒に考えてくれます。'
      },
      {
        image: 'images/kurima/naisho_moai.jpg',
        name:  '内省するモアイ',
        desc:  'モアイなりにあなたのそばで常に内省します。'
      },
      {
        image: 'images/kurima/tasogare_moai.jpg',
        images: [
          'images/kurima/tasogare_moai.jpg',
          'images/kurima/tasogare_moai/detail_01.jpg',
          'images/kurima/tasogare_moai/detail_02.jpg',
          'images/kurima/tasogare_moai/detail_03.jpg',
          'images/kurima/tasogare_moai/detail_04.jpg',
          'images/kurima/tasogare_moai/detail_05.jpg',
          'images/kurima/tasogare_moai/detail_06.jpg',
          'images/kurima/tasogare_moai/detail_07.jpg',
          'images/kurima/tasogare_moai/detail_08.jpg',
          'images/kurima/tasogare_moai/detail_09.jpg',
        ],
        name:  '黄昏れモアイ',
        desc:  '仕事前日の憂鬱さを再現。モアイなりにあなたのそばで一緒に黄昏れてくれます。'
      },
    ]
  },
  designfesta: {
    label: 'デザインフェスタ',
    products: [
      // ↓ デザフェスの作品をここに追加
      // {
      //   image: 'images/designfesta/item1.jpg',
      //   name:  '作品名',
      //   price: '¥1,000',
      //   desc:  '説明文'
      // },
    ]
  },
  history: {
    label: '歴代図鑑',
    heroHtml: `
      <div class="history-epic-story">
        <div class="epic-title">起源 - ORIGIN -</div>
        <img src="images/history/founder.jpg" class="epic-portrait" alt="創業者 モアたろう">
        <div class="epic-text">
          創業者 モアたろうの手により、<br>
          2022年1月1日、金沢にて Kanazawa Moataro は創業された。<br><br>
          雪がちらつくその頃、作者はやるせない葛藤の日々を送る中、<br>
          なぜかモアイにすがるしかなく、<br>
          その末に、3Dプリンターとセメントを組み合わせ、<br>
          初作品となる「モアイお香立て」の開発に成功した。<br><br>
          モアイなんて売れるはずがないという周囲の声にも屈せず、<br>
          2022年2月19日、京都にて販売を開始した。
        </div>
        <div class="epic-footer">※歴代図鑑のコーナーは、過去の作品を随時追加し更新していく予定です！<br>準備中のためもう少々お待ちください。</div>
      </div>
    `,
    products: [
      {
        id: 'first_sold_work',
        image: 'images/history/first_sold_work.jpg',
        name:  'モアイお香たて長男「RYO」',
        desc:  '記念すべき、初めて世に販売した作品です。'
      }
    ]
  }
};

// デフォルトで最初に選択されるイベント
const DEFAULT_EVENT = 'kurima';

// 全ての作品に自動でidを付与（画像パスから生成）
Object.keys(EVENTS).forEach(evKey => {
  EVENTS[evKey].products.forEach(p => {
    if (!p.id && p.image) {
      p.id = p.image.split('/').pop().split('.')[0];
    }
  });
});
