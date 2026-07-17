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
// ============================================================

// 全作品のマスターリスト
const MASTER_PRODUCTS = [
  {
    image: 'images/kurima/moai_robo_mk2_gray.jpg',
    images: [
      'images/kurima/moai_robo_mk2/movie.mp4',
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
      'images/kurima/moai_robo_mk2/moai_robo_mk2_23.png',
      'images/kurima/moai_robo_mk2/moai_robo_mk2_24.png',
      'images/kurima/moai_robo_mk2/moai_robo_mk2_25.png',
      'images/kurima/moai_robo_mk2/moai_robo_mk2_26.png',
      'images/kurima/moai_robo_mk2/moai_robo_mk2_27.png',
      'images/kurima/moai_robo_mk2/moai_robo_mk2_28.png',
      'images/kurima/moai_robo_mk2/moai_robo_mk2_29.png',
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
    image: 'images/kurima/moai_robo_mk2_gold.jpg?v=20260520_3',
    images: [
      'images/kurima/moai_robo_mk2_gold.jpg?v=20260520_3',
      'images/kurima/moai_robo_mk2_gold/moai_robo_mk2_gold_01.png',
      'images/kurima/moai_robo_mk2_gold/moai_robo_mk2_gold_02.png',
      'images/kurima/moai_robo_mk2_gold/moai_robo_mk2_gold_03.png',
      'images/kurima/moai_robo_mk2_gold/moai_robo_mk2_gold_04.png',
      'images/kurima/moai_robo_mk2_gold/moai_robo_mk2_gold_05.png',
      'images/kurima/moai_robo_mk2_gold/moai_robo_mk2_gold_06.png',
      'images/kurima/moai_robo_mk2_gold/moai_robo_mk2_gold_07.png',
      'images/kurima/moai_robo_mk2_gold/moai_robo_mk2_gold_08.png',
      'images/kurima/moai_robo_mk2_gold/moai_robo_mk2_gold_09.png',
      'images/kurima/moai_robo_mk2_gold/moai_robo_mk2_gold_10.png',
      'images/kurima/moai_robo_mk2_gold/moai_robo_mk2_gold_11.png',
    ],
    name:  'ヨーグルト好きモアイロボ\nmark2 EXゴールド',
    desc:  '黄金に輝く特別なモアイロボ。'
  },
  {
    image: 'images/kurima/moai_robo_mk2_gold/moai_robo_stand.png?v=20260520',
    images: [
      'images/kurima/moai_robo_stand/movie.mp4',
      'images/kurima/moai_robo_mk2_gold/moai_robo_stand.png?v=20260520',
      'images/kurima/moai_robo_stand/stand_01.jpg',
      'images/kurima/moai_robo_stand/IMG_9547_studio.png',
      'images/kurima/moai_robo_stand/IMG_9553_studio.png',
      'images/kurima/moai_robo_stand/IMG_9556_studio.png',
      'images/kurima/moai_robo_stand/IMG_9560_studio.png',
      'images/kurima/moai_robo_stand/IMG_9561_studio.png',
      'images/kurima/moai_robo_stand/IMG_9562_studio.png',
      'images/kurima/moai_robo_stand/IMG_9564_studio.png',
      'images/kurima/moai_robo_stand/moai_robo_mk2_gold_01.png',
      'images/kurima/moai_robo_stand/moai_robo_mk2_gold_03.png',
      'images/kurima/moai_robo_stand/moai_robo_mk2_gold_09.png',
    ],
    name:  'モアイロボMark2専用スタンド',
    desc:  'モアイロボMark2専用スタンドは、\nMoataro博士により試験開発された支援装備（試作機）です。\n\n好きな角度で浮かせて飾れる、\n可変スタンド。\n\n空中浮遊、\nジャンプ、\n大気圏突入、\n撃墜シーンまで。\n\n思いつくまま、\nさまざまな場面を再現できます。\n\n立たせるだけじゃない、\n遊べるモアイロボへ。\n確実にニヤけます🗿\n\n以下いずれかの条件達成で、\nスタンド1基を特典支給します。\n\n・モアイロボシリーズを2体以上ご購入\n・モアイロボ EX Gold Edition MARK2購入\n　かつヨーグルトランEXの秘密のアクセスキー所持\n・「モアイを避けろゲーム」\n　岩田モア夫の最高スコア（現時点1087）更新\n\n条件外の方は、\n単体500円（予定）にて購入可能です。\n（一人1個まで）\n\n数量限定のため、\nなくなり次第終了です。\n\n※デザフェス会場当日購入者対象\n※過去購入者・今後フリマ購入者向け条件も順次対応予定'
  },
  {
    image: 'images/kurima/moai_robo_yogurt_lover.jpg',
    images: [
      'images/kurima/moai_robo_yogurt_lover/movie.mp4',
      'images/kurima/moai_robo_yogurt_lover.jpg',
      'images/kurima/moai_robo_yogurt_lover/yogurt_01.png',
      'images/kurima/moai_robo_yogurt_lover/yogurt_02.png',
      'images/kurima/moai_robo_yogurt_lover/yogurt_03.png',
      'images/kurima/moai_robo_yogurt_lover/yogurt_04.jpg',
      'images/kurima/moai_robo_yogurt_lover/yogurt_05.png',
      'images/kurima/moai_robo_yogurt_lover/yogurt_06.png',
      'images/kurima/moai_robo_yogurt_lover/yogurt_07.png',
      'images/kurima/moai_robo_yogurt_lover/yogurt_08.png',
      'images/kurima/moai_robo_yogurt_lover/moai_robo_yogurt_lover_11.png',
      'images/kurima/moai_robo_yogurt_lover/moai_robo_yogurt_lover_12.png',
    ],
    name:  'MOAI ROBO\n-Yogurt Lover-',
    desc:  '初代モアイロボ。1/144スケール。ヨーグルトを持った愛らしいフィギュア。'
  },
  {
    image: 'images/kurima/moai_robo_strawmilk.jpg',
    images: [
      'images/kurima/moai_robo_strawmilk/movie.mp4',
      'images/kurima/moai_robo_strawmilk.jpg',
      'images/kurima/moai_robo_strawmilk/strawmilk_01.png',
      'images/kurima/moai_robo_strawmilk/strawmilk_02.png',
      'images/kurima/moai_robo_strawmilk/strawmilk_03.png',
      // Duo画像など関連しそうなものもMk2フォルダから参照可能にする
      'images/kurima/moai_robo_mk2/moai_robo_mk2_26.png',
      'images/kurima/moai_robo_mk2/moai_robo_mk2_27.png',
      'images/kurima/moai_robo_mk2/moai_robo_mk2_28.png',
      'images/kurima/moai_robo_mk2/moai_robo_mk2_29.png',
    ],
    name:  'MOAI ROBO\n-Strawmilk Lover-',
    desc:  'いちごミルクが大好きなモアイロボ。1/144スケール。'
  },
  {
    image: 'images/kurima/nomidakure_moai_robo.jpg',
    images: [
      'images/kurima/nomidakure_moai_robo.jpg',
      'images/kurima/nomidakure_moai_robo/nomidakure_01.png',
      'images/kurima/nomidakure_moai_robo/nomidakure_02.png',
      'images/kurima/nomidakure_moai_robo/nomidakure_03.png',
    ],
    name:  'のみだくれ\nモアイロボ',
    desc:  '-Drunk Moai Robot- ヨーグルト片手に飲んだくれ。'
  },
  {
    image: 'images/kurima/keychain.jpg',
    images: [
      'images/kurima/keychain/movie.mp4',
      'images/kurima/keychain.jpg',
      'images/kurima/keychain/detail_01.jpg',
      'images/kurima/keychain/detail_02.jpg',
      'images/kurima/keychain/detail_03.png',
      'images/kurima/keychain/detail_04.png',
      'images/kurima/keychain/detail_05.png',
      'images/kurima/keychain/detail_06.png',
      'images/kurima/keychain/detail_07.png',
    ],
    name:  'モアイロボ ヨーグルトランEX\nカートリッジキーホルダー',
    desc:  'スマホをかざすと遊べる！(NFC対応スマホのみ)\nゲームカートリッジ型キーホルダー。\n\n5/17 メジャーアップデート実施！！！🗿\nモアイロボmk2が参戦！！難易度が爆上がりました。\n\nヨーグルトが大好きなモアイロボがひたすら走ります。\nラストステージは、おすわりモアイをぶん投げる作者(私)と戦えます。',
    demoUrl: 'https://moai-demo-game.vercel.app/'
  },
  {
    image: 'images/kurima/glasses_stand.jpg',
    images: [
      'images/kurima/glasses_stand/movie.mp4',
      'images/kurima/glasses_stand.jpg',
    ],
    name:  'まちょい モアイな\nメガネスタンド',
    desc:  '頭にはメガネクロス付き。マッチョなモアイがメガネをがっしりホールド。'
  },
  {
    image: 'images/kurima/macho_moai_pen.png',
    images: [
      'images/kurima/macho_moai_pen.png',
      'images/kurima/macho_moai_pen/detail_01.png',
      'images/kurima/macho_moai_pen/detail_02.png',
      'images/kurima/macho_moai_pen/detail_03.png',
      'images/kurima/macho_moai_pen/detail_04.png',
    ],
    name:  'マッチョな\nモアイペン立て',
    desc:  'しがないマッチョ。パワーッ!!!'
  },
  {
    image: 'images/kurima/nukayorokobi_moai_pen.jpg',
    images: [
      'images/kurima/nukayorokobi_moai_pen.jpg',
      'images/kurima/nukayorokobi_moai_pen/nukayorokobi_01.png',
      'images/kurima/nukayorokobi_moai_pen/nukayorokobi_02.png',
      'images/kurima/nukayorokobi_moai_pen/nukayorokobi_03.png',
      'images/kurima/nukayorokobi_moai_pen/nukayorokobi_04.png',
      'images/kurima/nukayorokobi_moai_pen/nukayorokobi_05.jpg',
    ],
    name:  'ぬか喜び\nモアイペン立て',
    desc:  '作者のクリスマスの悲劇を再現。ゲームカートリッジ付き。スマホをかざすと遊べます。'
  },
  {
    image: 'images/kurima/positive_moai_pen.jpg',
    images: [
      'images/kurima/positive_moai_pen.jpg',
      'images/kurima/positive_moai_pen/positive_moai_hachimaki.png',
      'images/kurima/positive_moai_pen/positive_moai_pen_4.png',
      'images/kurima/positive_moai_pen/positive_sub_01.png',
    ],
    name:  'ポジティブモアイ\nペン立て ハチマキSP',
    desc:  '見ているだけで力が湧いてくる。ガンバレ..!!!'
  },
  {
    image: 'images/kurima/tegotae_moai_pen.jpg',
    images: [
      'images/kurima/tegotae_moai_pen.jpg',
      'images/kurima/tegotae_moai_pen/tegotae_01.png',
      'images/kurima/tegotae_moai_pen/tegotae_02.png',
    ],
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
    images: [
      'images/kurima/kangaeru_moai.jpg',
      'images/kurima/kangaeru_moai/kangaeru_01.jpg',
    ],
    name:  '考えるモアイ',
    desc:  '植物に相性ピッタリ。モアイなりにあなたのそばで一緒に考えてくれます。'
  },
  {
    image: 'images/kurima/naisho_moai.jpg',
    images: [
      'images/kurima/naisho_moai.jpg',
      'images/kurima/naisho_moai/naisho_01.jpg',
      'images/kurima/naisho_moai/naisho_02.jpg',
      'images/kurima/naisho_moai/naisho_03.jpg',
      'images/kurima/naisho_moai/naisho_05.jpg',
      'images/kurima/naisho_moai/naisho_moai_6.png',
    ],
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
  {
    image: 'images/kurima/mob_moai_robo.jpg',
    images: [
      'images/kurima/mob_moai_robo.jpg',
      'images/kurima/mob_moai_robo.png',
      'images/kurima/mob_moai_robo/main.jpg',
      'images/kurima/mob_moai_robo/mobmoai_01.png',
      'images/kurima/mob_moai_robo/mobmoai_04.png',
      'images/kurima/mob_moai_robo/mobmoai_05.png',
      'images/kurima/mob_moai_robo/mobmoai_06.png',
      'images/kurima/mob_moai_robo/mobmoai_07.png',
      'images/kurima/mob_moai_robo/mobmoai_08.png',
    ],
    name:  'モブモアイロボ',
    desc:  'スタジオ背景で撮影された、スタイリッシュなモアイロボのポートレートシリーズ。'
  },
  {
    image: 'images/kurima/mini_osuwari_keychain.jpg',
    images: [
      'images/kurima/mini_osuwari_keychain.jpg',
      'images/kurima/mini_osuwari_keychain/1_studio.png',
      'images/kurima/mini_osuwari_keychain/2_studio.png',
      'images/kurima/mini_osuwari_keychain/3_studio.png',
      'images/kurima/mini_osuwari_keychain/4_studio.png',
      'images/kurima/mini_osuwari_keychain/5_studio.png',
      'images/kurima/mini_osuwari_keychain/IMG_9406_studio.png',
      'images/kurima/mini_osuwari_keychain/IMG_9407_studio.png',
      'images/kurima/mini_osuwari_keychain/IMG_9411_studio.png',
    ],
    name:  'ミニおすわりモアイの\nキーホルダー',
    desc:  'ちょこんとお座りするミニモアイのキーホルダー。どこへでも一緒に連れて行けます。'
  },
  {
    id: 'moai_lure_stand',
    image: 'images/kurima/machoi_moai_lure_stand.jpg',
    images: [
      'images/kurima/machoi_moai_lure_stand.jpg',
      'images/kurima/machoi_moai_lure_stand/IMG_0841_studio.png',
      'images/kurima/machoi_moai_lure_stand/IMG_0843_studio.png',
      'images/kurima/machoi_moai_lure_stand/IMG_0844_studio.png',
      'images/kurima/machoi_moai_lure_stand/IMG_0845_studio.png',
      'images/kurima/machoi_moai_lure_stand/IMG_0846_studio.png',
      'images/kurima/machoi_moai_lure_stand/IMG_0851_studio.png',
      'images/kurima/machoi_moai_lure_stand/IMG_0852_studio.png',
      'images/kurima/machoi_moai_lure_stand/IMG_0853_studio.png',
      'images/kurima/machoi_moai_lure_stand/IMG_0858_studio.png',
      'images/kurima/machoi_moai_lure_stand/IMG_0861_studio.png',
      'images/kurima/machoi_moai_lure_stand/IMG_08248_studio.png',
      'images/kurima/machoi_moai_lure_stand/IMG_08245558_studio.png',
    ],
    name:  'まちょいモアイルアースタンド',
    desc:  'モアイがあなたの大切なルアー（釣具）をがっちりホールドする、釣り人必見の専用ディスプレイスタンド。お気に入りのルアーをおしゃれにディスプレイして、次の釣行へのモチベーションを高めましょう！'
  },
  {
    id: 'yatta_moai',
    image: 'images/kurima/yatta_moai.jpg',
    images: [
      'images/kurima/yatta_moai.jpg',
    ],
    name:  'やったー\nモアイペン立て',
    desc:  '表情は変わらない。でも、うれしい。両手を広げて全身で喜びを表現するモアイのペン立て。デスクを明るく彩ります。'
  },
  {
    id: 'doyagao_moai',
    image: 'images/kurima/doyagao_moai.jpg',
    images: [
      'images/kurima/doyagao_moai.jpg',
    ],
    name:  'どやがお\nモアイペン立て',
    desc:  'ちょっとジムリーダーっぽい、腕組みをしてドヤ顔を決めるモアイのペン立て。自信に満ち溢れた佇まいでペンをしっかりホールドします。'
  },
  {
    id: 'red_moairobo',
    image: 'images/kurima/red_moairobo.jpg',
    images: [
      'images/kurima/red_moairobo.jpg',
    ],
    name:  'MOAI ROBO MARK 2\nRed prototype',
    desc:  'ヨーグルト大好きなモアイロボ MARK 2のレッドカラー試作機（プロトタイプ）。軽井沢で満喫中の作者から強奪したと言われる特別な仕様です。組み立て式フィギュア。'
  },
];

const EVENTS = {
  kurima: {
    label: '名古屋クリマ',
    defaultStatus: 'hidden',
    products: []
  },
  designfesta: {
    label: 'デザインフェスタ',
    defaultStatus: 'hidden',
    products: [
      ...MASTER_PRODUCTS
    ]
  },
  hmj: {
    label: 'HMJ 7/11,12',
    heroHtml: `
      <div class="topics-container">
        <div class="topics-header">
          <span class="topics-icon">🔥</span>
          <span class="topics-title">HOT TOPICS & NEWS</span>
        </div>
        <div class="topics-body">
          <div class="topic-item">
            <div class="topic-bullet">🆕</div>
            <div class="topic-content">
              <div class="topic-headline">ミニおすわりモアイのキーホルダーが登場！！</div>
              <div class="topic-sub">ちょこんとお座りする愛らしいミニモアイ。どこへでも一緒に連れて行けます。</div>
              <div style="margin-top: 8px;">
                <button onclick="window.openProductById('mini_osuwari_keychain')" class="btn-topic-detail">作品詳細を見る 🔍</button>
              </div>
            </div>
          </div>
          <div class="topic-item">
            <div class="topic-bullet">⚡</div>
            <div class="topic-content">
              <div class="topic-headline">ヨーグルトランEX メジャーアップデート実施！</div>
              <div class="topic-sub">モアイロボMk-IIが参戦し難易度が爆上がり！スマホをかざして遊べるNFC対応キーホルダー。</div>
              <div style="margin-top: 8px; display: flex; gap: 8px; flex-wrap: wrap;">
                <a href="https://moai-demo-game.vercel.app/" target="_blank" rel="noopener noreferrer" class="btn-topic-demo">
                  🎮 WEB体験版をプレイ！ →
                </a>
                <button onclick="window.openProductById('keychain')" class="btn-topic-detail">作品詳細を見る 🔍</button>
              </div>
            </div>
          </div>
          <div class="topic-item">
            <div class="topic-bullet">🆕</div>
            <div class="topic-content">
              <div class="topic-headline">ゴールドモアイロボ登場！！</div>
              <div class="topic-sub">黄金に輝く特別なモアイロボ。秘密のアクセスキーで限定特典も解放できる！</div>
              <div style="margin-top: 8px;">
                <button onclick="window.openProductById('moai_robo_mk2_gold')" class="btn-topic-detail">作品詳細を見る 🔍</button>
              </div>
            </div>
          </div>
          <div class="topic-item">
            <div class="topic-bullet">🆕</div>
            <div class="topic-content">
              <div class="topic-headline">モアイロボMark2専用スタンド登場！</div>
              <div class="topic-sub">空中浮遊、ジャンプ、撃墜シーンまで再現できる可変式ディスプレイスタンド。</div>
              <div style="margin-top: 8px;">
                <button onclick="window.openProductById('moai_robo_stand')" class="btn-topic-detail">作品詳細を見る 🔍</button>
              </div>
            </div>
          </div>
          <div class="topic-item">
            <div class="topic-bullet">🆕</div>
            <div class="topic-content">
              <div class="topic-headline">おすわりモアイカスタムパーツ登場！</div>
              <div class="topic-sub">Mk-IIに装着できる、レトロ可愛いおすわりモアイのカスタム追加パーツ。</div>
            </div>
          </div>
        </div>
      </div>
    `,
    products: [
      ...MASTER_PRODUCTS
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
  },
  moairoom: {
    label: '🗿 モアイの部屋',
    products: [],
    defaultStatus: 'hidden'
  }
};

// デフォルトで最初に選択されるイベント
const DEFAULT_EVENT = 'hmj';

// 全ての作品に自動でidを付与（画像パスから生成）
function assignIds(list) {
  list.forEach(p => {
    if (!p.id && p.image) {
      p.id = p.image.split('/').pop().split('.')[0];
    }
  });
}

assignIds(MASTER_PRODUCTS);
Object.keys(EVENTS).forEach(evKey => {
  assignIds(EVENTS[evKey].products);
});

// Firestoreのevent_configと既存EVENTSをマージして全イベント一覧を返すヘルパー
window.getAllEvents = function(configData) {
  const merged = { ...EVENTS };
  if (configData) {
    Object.entries(configData).forEach(([key, config]) => {
      if (config.label) {
        merged[key] = {
          ...merged[key],
          label: config.label,
          date: config.date || null,
          products: merged[key]?.products || []
        };
      }
    });
  }
  return merged;
};

// Firestoreのcustom_productsをマージして全作品マスターリストを返すヘルパー
window.getFullMasterProducts = function(customProductsData) {
  // MASTER_PRODUCTSのコピーを作成し、IDを初期化
  const list = MASTER_PRODUCTS.map(m => ({ ...m }));
  
  if (customProductsData) {
    Object.keys(customProductsData).forEach(key => {
      const p = customProductsData[key];
      const normalize = (s) => s ? s.replace(/\s+/g, '').replace(/\n/g, '') : '';
      const masterItem = list.find(m => {
        // 先に明示的なIDやproductIdでの一致を確認し、なければ名前での一致を確認
        const idMatches = (p.productId && m.id === p.productId) || (m.id === key);
        const nameMatches = (normalize(m.name) === normalize(p.name)) || 
                            (m.id === 'moai_lure_stand' && normalize(p.name) === 'モアイルアースタンド');
        return idMatches || nameMatches;
      });
      
      if (masterItem) {
        // 重要：FirestoreのID（dev_xxxなど）をマスターデータに引き継ぐ
        masterItem.id = key;
      } else {
        // 重複がない場合は新規カスタム作品として追加
        list.push({
          id: key,
          name: p.name,
          desc: p.desc || '鋭意制作中...！',
          image: p.image || null,
          status: p.status !== undefined ? p.status : 0,
          isDev: p.isDev !== undefined ? p.isDev : true
        });
      }
    });
  }
  
  // まだIDがないものにデフォルトIDを付与
  list.forEach((p, i) => {
    if (!p.id) {
      p.id = p.image ? p.image.split('/').pop().split('.')[0] : "item_" + i;
    }
  });

  return list;
};
