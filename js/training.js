/* ============================================
   训练计划数据 + 训练页渲染/交互
   动作组模式：每个肌群位置有2-3个可选替换动作
   ============================================ */

// ========== 训练计划定义 ==========

const TRAINING_PLANS = {
  push: {
    label: '推日',
    subtitle: '胸 + 肩前束 + 三头',
    emoji: '🏋️',
    sections: [
      {
        type: 'warmup',
        title: '热身（10-15分钟）',
        badge: '热身',
        badgeClass: 'warmup-badge',
        groups: [
          {
            id: 'push-warmup-chest-stretch',
            label: '胸肌预拉伸',
            region: '胸',
            pickHint: '3选1',
            exercises: [
              { name: '门框胸肌拉伸', sets: '每侧30秒×2组', equipment: '', tip: '手肘与肩同高或略低于肩（避免肩峰撞击⚠️），身体缓慢前倾至胸肌有拉伸感。圆肩者胸小肌通常过度紧张，重点感受锁骨下方到肩前侧的牵拉', default: true },
              { name: '泡沫轴胸椎伸展', sets: '10次慢速', equipment: '泡沫轴', tip: '泡沫轴横放于胸椎段（肩胛骨位置），双手抱头，缓慢后仰伸展胸椎。改善胸椎活动度，间接缓解圆肩', default: false },
              { name: '猫牛式胸椎活动', sets: '10次', equipment: '瑜伽垫', tip: '四足跪姿，吸气时塌腰抬头（牛式），呼气时拱背低头（猫式）。重点感受胸椎段的逐节活动', default: false },
            ],
          },
          {
            id: 'push-warmup-scapula',
            label: '肩胛激活',
            region: '肩',
            pickHint: '3选1',
            exercises: [
              { name: '墙面天使', sets: '15次×2组', equipment: '', tip: '背、臀、后脑勺三点贴墙，手臂呈W形上下滑动，手背和肘关节全程努力贴墙。核心收紧，腰部离墙不超一掌厚。激活中下斜方肌和前锯肌，矫正肱骨前移', default: true },
              { name: '俯身I-Y-T', sets: '每个姿势10次×2组', equipment: '', tip: '俯身45°，双手依次做出I（过头）、Y（斜上）、T（侧平举）三个姿势，拇指向上的同时肩胛后缩。每个姿势顶端停1秒', default: false },
              { name: '弹力带拉开', sets: '15次×2组', equipment: '弹力带', tip: '双手握弹力带于胸前，向两侧拉开至手臂成T字形，肩胛骨全力后缩。慢放还原，控制节奏', default: false },
            ],
          },
          {
            id: 'push-warmup-rotator',
            label: '肩袖激活',
            region: '肩',
            pickHint: '3选1',
            exercises: [
              { name: '弹力带肩外旋', sets: '15次×2组', equipment: '弹力带', tip: '上臂贴紧身体侧面，肘关节屈曲90°，双手握弹力带向外旋转。只有小臂动，大臂不离开身体。激活冈下肌和小圆肌，稳定肩关节防撞击⚠️', default: true },
              { name: '侧卧肩外旋', sets: '15次×2组/侧', equipment: '小哑铃(1-2kg)', tip: '侧卧，上臂贴身体侧面肘屈90°，手握小哑铃从腹部前方向上旋转至最高点。慢放4秒，感受肩袖后侧发力', default: false },
              { name: '弹力带肩环绕', sets: '每方向10次', equipment: '弹力带', tip: '双手握弹力带举过头顶，保持手臂伸直画大圈从前到后。肩关节全方位动态热身，适合肩部无疼痛时做', default: false },
            ],
          },
          {
            id: 'push-warmup-press',
            label: '推胸预热',
            region: '胸',
            pickHint: '3选1',
            exercises: [
              { name: '轻重量坐姿推胸机预热', sets: '15次×1组', equipment: '坐姿推胸机', tip: '最轻配重，目的是润滑关节、建立神经连接。沉肩，肩胛骨全程贴紧靠背，控制节奏2秒推2秒回', default: true },
              { name: '轻重量哑铃卧推预热', sets: '15次×1组', equipment: '轻哑铃', tip: '平板凳上做轻重量卧推。沉肩，手肘约30°，感受胸肌发力而非肩膀。慢速控制', default: false },
              { name: '跪姿俯卧撑', sets: '15次×1组', equipment: '', tip: '膝盖着地做俯卧撑，手略宽于肩。下降时肘关节向后约30°，感受胸肌拉伸。推起时沉肩', default: false },
            ],
          },
        ],
      },
      {
        type: 'main',
        title: '正式训练',
        badge: '正式',
        badgeClass: 'section-badge',
        groups: [
          {
            id: 'push-main-mid-chest',
            label: '胸大肌 — 中胸',
            region: '胸.中胸',
            pickHint: '3选1-2',
            exercises: [
              { name: '坐姿推胸机（平板）', sets: '4组×10-12次', equipment: '可调角度推胸机', tip: '①坐姿：臀部坐实，肩胛骨收紧下压贴紧靠背；②手肘：向下约30°（非水平外展！），避免肩峰撞击⚠️；③推法：推至肘微屈不锁死，顶峰夹胸1秒；④节奏：3秒离心下放，1秒向心推起。全程沉肩', default: true },
              { name: '哑铃平板卧推', sets: '4组×10-12次', equipment: '哑铃+平板凳', tip: '仰卧平板凳，哑铃推至胸部正上方。下放时肘关节约30°，哑铃降至胸两侧。推起时挤压胸肌。哑铃训练对肩峰撞击者更友好，手肘可自由调整角度', default: false },
              { name: '史密斯机平板卧推', sets: '4组×10-12次', equipment: '史密斯机+平板凳', tip: '平板凳置于史密斯机杠铃正下方，杠铃下放至胸中部。轨迹固定适合新手，但肩峰撞击者注意杠铃最低点不要过低导致肩前侧挤压', default: false },
            ],
          },
          {
            id: 'push-main-upper-chest',
            label: '胸大肌 — 上胸',
            region: '胸.上胸',
            pickHint: '3选1-2',
            exercises: [
              { name: '坐姿推胸机（上斜30°）', sets: '3组×10-12次', equipment: '可调角度推胸机', tip: '座椅调至上斜30°（不超过45°⚠️）。手肘保持向下约30°。推起时感受锁骨下方发力。肩峰撞击者注意推起末段不要完全伸直肘关节', default: true },
              { name: '上斜哑铃卧推', sets: '3组×10-12次', equipment: '哑铃+可调凳(30°)', tip: '可调凳调至30°，仰卧推哑铃。手肘保持约30°。哑铃对肩关节更友好。顶峰夹胸1秒', default: false },
              { name: '上斜史密斯机卧推', sets: '3组×10-12次', equipment: '史密斯机+可调凳(30°)', tip: '凳子调30°置于史密斯机下，杠铃轨迹略微倾斜于锁骨方向。感受上胸发力。新手可从空杆开始', default: false },
            ],
          },
          {
            id: 'push-main-lower-chest',
            label: '胸大肌 — 下胸 + 肩前束',
            region: '胸.下胸',
            pickHint: '3选1',
            exercises: [
              { name: '蝴蝶机反向夹胸', sets: '3组×12-15次', equipment: '蝴蝶机', tip: '面朝靠背坐，双手握前方把手做夹胸。打造下胸和胸中缝线条。顶峰停1秒，慢放2-3秒。肩胛骨全程贴靠背', default: true },
              { name: '双杠臂屈伸（辅助）', sets: '3组×8-12次', equipment: '双杠/辅助臂屈伸机', tip: '身体微前倾，下降至上臂与地面平行。推起时感受下胸和三头肌发力。肩峰撞击者谨慎⚠️，下降不要太低。可用辅助机减轻体重', default: false },
              { name: '低位绳索夹胸', sets: '3组×12-15次', equipment: '绳索龙门架', tip: '绳索调至高位→低位（约膝盖高度），双手从低位向胸前上方夹。感受下胸和胸部中缝收缩。顶峰停1秒', default: false },
            ],
          },
          {
            id: 'push-main-front-delt',
            label: '三角肌前束 + 中束',
            region: '肩.前束',
            pickHint: '3选1',
            exercises: [
              { name: '器械肩推（轻重量）', sets: '3组×12-15次', equipment: '坐姿肩推机', tip: '⚠️用轻重量！手肘微内收（向前15-20°），不要完全侧展。推至3/4不锁死，下放至上臂略低于水平即停。肩前刺痛立即停止', default: true },
              { name: '哑铃坐姿推举', sets: '3组×12-15次', equipment: '哑铃+靠背凳', tip: '坐姿，哑铃置于肩两侧，推举至头顶上方不锁死。手肘微内收。哑铃允许自然轨迹，对肩关节压力较小', default: false },
              { name: '杠铃站姿推举', sets: '3组×10-12次', equipment: '杠铃', tip: '站姿杠铃置于锁骨前，推举至头顶上方。需要核心稳定。肩峰撞击者用轻重量或避免此动作', default: false },
            ],
          },
          {
            id: 'push-main-triceps',
            label: '肱三头肌',
            region: '手臂.三头',
            pickHint: '3选2',
            exercises: [
              { name: '绳索下压（三头）', sets: '3组×12-15次', equipment: '高位绳索', tip: '大臂锁定在身体两侧，只动肘关节下压至手臂伸直。最低点手腕微外旋让三头内侧头充分收缩。肱骨前移者保持肩胛后收位', default: true },
              { name: '哑铃颈后臂屈伸', sets: '3组×12次/侧', equipment: '单手哑铃', tip: '坐姿单手举哑铃于头后，肘关节朝前上方不外张。仅小臂上下弯举。⚠️轻重量！肩关节处于极限屈曲位，肱骨前移者控制幅度', default: false },
              { name: '窄距俯卧撑', sets: '3组×力竭', equipment: '', tip: '双手拇指和食指形成钻石形置于胸下。下降时肘关节贴身体向后，推起时集中三头肌发力。不需要器械，随时可做', default: false },
            ],
          },
        ],
      },
      {
        type: 'stretch',
        title: '收尾拉伸',
        badge: '拉伸',
        badgeClass: 'stretch-badge',
        groups: [
          {
            id: 'push-stretch-chest',
            label: '胸肌拉伸',
            region: '胸',
            pickHint: '2选1',
            exercises: [
              { name: '门框胸肌静态拉伸', sets: '每侧30秒', equipment: '', tip: '手肘90°放在门框上，同侧腿前跨一步缓慢前移身体。感受胸大肌+胸小肌拉伸。圆肩者每天必做，可延长至45秒', default: true },
              { name: '双手背后交握拉伸', sets: '30秒×2组', equipment: '', tip: '双手背后交握，缓慢抬高手臂，同时挺胸。感受胸肌和三角肌前束同时拉伸。保持躯干直立', default: false },
            ],
          },
          {
            id: 'push-stretch-front-delt',
            label: '三角肌前束拉伸',
            region: '肩',
            pickHint: '2选1',
            exercises: [
              { name: '背后交握抬臂', sets: '每侧30秒', equipment: '', tip: '双手背后交握，缓慢抬高手臂直至肩前侧有拉伸感。保持躯干直立不弯腰。肩峰撞击者勿强行抬高', default: true },
              { name: '门框单侧肩前束拉伸', sets: '每侧30秒', equipment: '', tip: '侧对门框，同侧手伸直向后扶门框，身体缓慢向前旋转。感受三角肌前束独立拉伸', default: false },
            ],
          },
          {
            id: 'push-stretch-triceps',
            label: '肱三头肌拉伸',
            region: '手臂',
            pickHint: '2选1',
            exercises: [
              { name: '过头三头肌拉伸', sets: '每侧30秒', equipment: '', tip: '一侧手臂屈肘过头，手摸向对侧肩胛骨，另一只手轻推肘关节向后。肱骨前移者肘关节保持指向上方而非前上方', default: true },
              { name: '毛巾辅助三头肌拉伸', sets: '每侧30秒', equipment: '毛巾', tip: '一侧手拿毛巾从上方垂到背后，另一侧手从下方抓住毛巾另一端，上下手互拉感受三头肌拉伸', default: false },
            ],
          },
        ],
      },
    ],
  },

  pull: {
    label: '拉日',
    subtitle: '背 + 肩后束 + 二头',
    emoji: '🏋️',
    sections: [
      {
        type: 'warmup',
        title: '热身（10-15分钟）',
        badge: '热身',
        badgeClass: 'warmup-badge',
        groups: [
          {
            id: 'pull-warmup-ytw',
            label: '肩胛+后束激活',
            region: '背',
            pickHint: '2选1',
            exercises: [
              { name: 'YTW激活', sets: '每个字母10次×2组', equipment: '', tip: '俯身约45°，Y：手臂过头拇指朝上；T：侧平举肩胛后缩；W：屈肘下拉肩胛全力挤压。每个姿势顶端停1秒', default: true },
              { name: '俯身哑铃飞鸟（轻重量）', sets: '15次×2组', equipment: '轻哑铃(1-3kg)', tip: '俯身背部挺直，双手持轻哑铃向两侧打开至肩胛骨后缩。感受后束发力，慢放3秒', default: false },
            ],
          },
          {
            id: 'pull-warmup-rotator',
            label: '肩袖激活',
            region: '肩',
            pickHint: '2选1',
            exercises: [
              { name: '弹力带肩外旋', sets: '15次×2组', equipment: '弹力带', tip: '上臂贴紧身体，只外旋小臂。强化肩袖后侧肌群，对抗肱骨前移', default: true },
              { name: '弹力带肩内旋', sets: '15次×2组', equipment: '弹力带', tip: '弹力带固定在侧面，上臂贴身体，从外向内旋转小臂。训练肩胛下肌，肩袖肌群前后平衡', default: false },
            ],
          },
          {
            id: 'pull-warmup-scapula',
            label: '肩胛控制',
            region: '背',
            pickHint: '2选1',
            exercises: [
              { name: '沉肩+肩胛后缩', sets: '15次×2组', equipment: '', tip: '先"沉肩"（肩膀远离耳朵），再"后缩"（肩胛骨向脊柱夹）。分两步做建立神经肌肉控制。圆肩者重建肩胛位置感', default: true },
              { name: '弹力带肩胛后缩', sets: '15次×2组', equipment: '弹力带', tip: '双手各持弹力带一端于胸前，手臂伸直，做肩胛骨后缩动作（手不弯曲），感受中下斜方发力', default: false },
            ],
          },
          {
            id: 'pull-warmup-pulldown',
            label: '下拉预热',
            region: '背',
            pickHint: '2选1',
            exercises: [
              { name: '轻重量高位下拉预热', sets: '15次×1组', equipment: '高位下拉机', tip: '最轻配重，下拉前先沉肩再拉，感受肩胛骨的下降和后缩。不要用上斜方肌发力', default: true },
              { name: '弹力带下拉', sets: '15次×1组', equipment: '弹力带', tip: '弹力带挂在头顶高处，模拟下拉动作。适合在没有器械时做预热', default: false },
            ],
          },
        ],
      },
      {
        type: 'main',
        title: '正式训练',
        badge: '正式',
        badgeClass: 'section-badge',
        groups: [
          {
            id: 'pull-main-lats',
            label: '背阔肌、大圆肌',
            region: '背.背阔',
            pickHint: '3选1-2',
            exercises: [
              { name: '高位下拉（宽握）', sets: '4组×10-12次', equipment: '高位下拉机', tip: '握距约1.5倍肩宽。启动前先沉肩肩胛下压后缩。杆拉到上胸/锁骨高度。慢放2-3秒，手臂伸直时肩胛顺势上提——不要猛放！改善圆肩', default: true },
              { name: '引体向上（辅助）', sets: '4组×力竭', equipment: '引体向上机/弹力带', tip: '宽握，拉起时下巴过杆。上拉前先沉肩。做不了可用辅助机或弹力带减体重。王牌背阔肌动作', default: false },
              { name: '反握高位下拉', sets: '4组×10-12次', equipment: '高位下拉机', tip: '与肩同宽反握（掌心朝自己），下拉时肘关节贴身体向后。更强调背阔肌下部。拉起时挺胸', default: false },
            ],
          },
          {
            id: 'pull-main-mid-back',
            label: '中下斜方肌、菱形肌',
            region: '背.中背',
            pickHint: '3选1-2',
            exercises: [
              { name: '坐姿划船', sets: '4组×10-12次', equipment: '坐姿划船机', tip: '拉向腹部时先肩胛后缩再用手臂拉。顶峰肩胛全力挤压1秒。直接对抗圆肩体态', default: true },
              { name: '单臂哑铃划船', sets: '4组×10-12次/侧', equipment: '哑铃+平板凳', tip: '一侧手和膝支撑在凳上，另手持哑铃沿身体侧面拉向髋部。顶峰肩胛后缩1秒。单侧训练可纠正左右不平衡', default: false },
              { name: 'T杆划船', sets: '4组×10-12次', equipment: 'T杆划船机', tip: '俯身手握T杆把手，拉向胸部。先肩胛后缩再拉。全程背部挺直。中背部厚度训练好动作', default: false },
            ],
          },
          {
            id: 'pull-main-lats-iso',
            label: '背阔肌（孤立）',
            region: '背.背阔',
            pickHint: '3选1',
            exercises: [
              { name: '直臂下压', sets: '3组×12-15次', equipment: '高位绳索', tip: '手臂伸直微屈肘，从头顶上方压至大腿前侧。肘关节角度不变，只有肩关节动。感受背阔肌全幅度收缩', default: true },
              { name: '哑铃直臂上拉', sets: '3组×12-15次', equipment: '哑铃+平板凳', tip: '仰卧平板凳，双手托哑铃从头后拉至胸前上方。手臂微屈，感受背阔肌拉伸和收缩。老派健美动作', default: false },
              { name: '仰卧绳索直臂下拉', sets: '3组×12-15次', equipment: '绳索龙门架', tip: '仰卧在凳上，头上方绳索从头顶拉至大腿。比站姿更容易孤立背阔肌', default: false },
            ],
          },
          {
            id: 'pull-main-rear-delt',
            label: '三角肌后束 + 肩袖（矫正重点⭐）',
            region: '肩.后束',
            pickHint: '3选1',
            exercises: [
              { name: '面拉（Face Pull）', sets: '3组×15次', equipment: '绳索+绳索附件', tip: '⭐最重要矫正动作！拉到脸前时双手外旋（拇指向后），手肘向两侧打开，肩胛全力后缩。改善肱骨前移、强化肩后束和肩袖后侧', default: true },
              { name: '弹力带面拉', sets: '3组×15次', equipment: '弹力带', tip: '弹力带固定在面部高度，做面拉动作。无器械替代方案，同样外旋+后缩。可随时做', default: false },
              { name: '绳索高拉（High Pull）', sets: '3组×12-15次', equipment: '绳索龙门架', tip: '绳索调至面部高度，双手向面部拉的同时略微外旋。类似面拉但轨迹更宽', default: false },
            ],
          },
          {
            id: 'pull-main-rear-delt-iso',
            label: '三角肌后束（孤立）',
            region: '肩.后束',
            pickHint: '3选1',
            exercises: [
              { name: '反向飞鸟', sets: '3组×15次', equipment: '蝴蝶机反向', tip: '面朝靠背坐，手臂微屈向后方打开至肩胛后缩。顶峰停1秒慢放2秒。⚠️轻重量，不要用上斜方肌借力', default: true },
              { name: '俯身哑铃飞鸟', sets: '3组×15次', equipment: '轻哑铃(2-5kg)', tip: '俯身约45°背部挺直，手臂微屈向两侧打开至肩胛后缩。慢放3秒。感受后束孤立发力', default: false },
              { name: '侧卧单臂飞鸟', sets: '3组×15次/侧', equipment: '轻哑铃', tip: '侧卧在平板凳上，外侧手做飞鸟。孤立单侧后束，更好地感受发力。交替进行', default: false },
            ],
          },
          {
            id: 'pull-main-biceps',
            label: '肱二头肌',
            region: '手臂.二头',
            pickHint: '3选1-2',
            exercises: [
              { name: '哑铃弯举', sets: '3组×12次', equipment: '哑铃', tip: '上臂贴紧身体两侧不动，仅屈肘举至肩前。顶峰挤压1秒，慢放3秒（离心最重要）。身体不借力摆动', default: true },
              { name: '杠铃弯举', sets: '3组×12次', equipment: '杠铃/EZ杠', tip: '站姿杠铃弯举，上臂贴身体。EZ杠对手腕更友好。顶峰挤压1秒', default: false },
              { name: '绳索弯举', sets: '3组×12-15次', equipment: '低位绳索', tip: '面对低位绳索做弯举。绳索提供持续张力，离心阶段控制感更好', default: false },
            ],
          },
        ],
      },
      {
        type: 'stretch',
        title: '收尾拉伸',
        badge: '拉伸',
        badgeClass: 'stretch-badge',
        groups: [
          {
            id: 'pull-stretch-lats',
            label: '背阔肌拉伸',
            region: '背',
            pickHint: '2选1',
            exercises: [
              { name: '固定物背阔肌拉伸', sets: '每侧30秒', equipment: '', tip: '双手抓稳固定物，身体后坐，感受背阔肌从腋下到腰侧的拉伸。圆肩者此区域通常也紧张', default: true },
              { name: '跪姿背阔肌拉伸', sets: '每侧30秒', equipment: '瑜伽垫', tip: '跪姿双手伸直放地面，臀部向后坐至脚跟，感受背阔肌和腰部拉伸。婴儿式变体', default: false },
            ],
          },
          {
            id: 'pull-stretch-biceps',
            label: '肱二头肌拉伸',
            region: '手臂',
            pickHint: '2选1',
            exercises: [
              { name: '站姿肱二头肌拉伸', sets: '每侧30秒', equipment: '', tip: '手臂伸直向身体后方伸展，手掌朝上。保持躯干直立，不要弯腰代偿', default: true },
              { name: '门框肱二头肌拉伸', sets: '每侧30秒', equipment: '', tip: '手伸直侧平举扶门框，身体缓慢向另一侧旋转，拉伸肱二头肌和前肩', default: false },
            ],
          },
          {
            id: 'pull-stretch-chest-again',
            label: '胸肌再拉伸（对抗圆肩）',
            region: '胸',
            pickHint: '2选1',
            exercises: [
              { name: '门框胸肌拉伸×2', sets: '30-45秒', equipment: '', tip: '拉日结束时再拉伸胸肌！圆肩的根源是前紧后弱。训练后胸肌疲劳是拉伸最佳时机', default: true },
              { name: '仰卧胸椎伸展', sets: '30秒', equipment: '泡沫轴', tip: '泡沫轴纵向放于脊柱下方，双手打开成T字形，感受胸肌和肩前侧拉伸。放松深呼吸', default: false },
            ],
          },
        ],
      },
    ],
  },

  legs: {
    label: '臀腿日',
    subtitle: '臀 + 腿',
    emoji: '🏋️',
    sections: [
      {
        type: 'warmup',
        title: '热身（10-15分钟）',
        badge: '热身',
        badgeClass: 'warmup-badge',
        groups: [
          {
            id: 'legs-warmup-hip',
            label: '髋部激活',
            region: '臀腿',
            pickHint: '2选1',
            exercises: [
              { name: '髋绕环', sets: '每侧10次', equipment: '', tip: '单腿站立，另一腿屈髋屈膝由内向外画大圈绕环。感受髋关节囊充分活动开', default: true },
              { name: '弹力带髋屈伸', sets: '每侧10次', equipment: '弹力带', tip: '弹力带固定于脚踝，向前向后各踢腿10次。激活髋屈肌和臀大肌', default: false },
            ],
          },
          {
            id: 'legs-warmup-glute-med',
            label: '臀中肌激活',
            region: '臀腿',
            pickHint: '2选1',
            exercises: [
              { name: '蚌式开合', sets: '每侧15次×2组', equipment: '弹力带（可选）', tip: '侧卧双膝弯曲并拢，上侧膝盖像蚌壳向上打开。顶峰停1秒。激活臀中肌，改善膝盖内扣', default: true },
              { name: '侧卧抬腿', sets: '每侧15次×2组', equipment: '', tip: '侧卧，上方腿伸直抬高约30°，脚尖微朝下。慢放3秒。臀中肌孤立训练', default: false },
            ],
          },
          {
            id: 'legs-warmup-squat',
            label: '下肢预热',
            region: '臀腿',
            pickHint: '2选1',
            exercises: [
              { name: '自重深蹲', sets: '15次×2组', equipment: '', tip: '双脚与肩同宽，下蹲时髋部先动像坐椅子，膝盖沿脚尖方向走。大腿至少平行地面。膝盖内扣说明臀中肌未激活', default: true },
              { name: '高脚杯深蹲', sets: '15次×1组', equipment: '轻哑铃/壶铃', tip: '双手托一个轻哑铃于胸前做深蹲。重量帮助保持躯干直立，激活核心。预热效果好', default: false },
            ],
          },
          {
            id: 'legs-warmup-legpress',
            label: '腿举预热',
            region: '臀腿',
            pickHint: '2选1',
            exercises: [
              { name: '轻重量腿举预热', sets: '15次×1组', equipment: '腿举机', tip: '轻配重润滑膝关节和髋关节。脚放踏板中间，下放时膝盖靠近胸部但不让臀部离开靠背。节奏3秒下2秒上', default: true },
              { name: '箱式深蹲（自重）', sets: '15次×1组', equipment: '箱子/凳子', tip: '面对凳子，下蹲至臀部轻触凳面再站起。教会正确的深蹲深度和髋部后坐模式', default: false },
            ],
          },
        ],
      },
      {
        type: 'main',
        title: '正式训练',
        badge: '正式',
        badgeClass: 'section-badge',
        groups: [
          {
            id: 'legs-main-squat',
            label: '股四头肌 + 臀大肌（复合）',
            region: '臀腿.股四头',
            pickHint: '3选1-2',
            exercises: [
              { name: '正向哈克深蹲', sets: '4组×10-12次', equipment: '哈克深蹲机', tip: '背部全程贴靠垫。重心偏脚跟，下蹲时膝盖沿脚尖方向——绝不内扣！蹲至大腿平行即停。推起时脚跟发力', default: true },
              { name: '杠铃深蹲（史密斯机）', sets: '4组×10-12次', equipment: '史密斯机', tip: '杠铃置于斜方肌上（非颈椎），双脚略宽于肩。下蹲时先髋后膝。史密斯机提供稳定轨迹，适合新手', default: false },
              { name: '哑铃高脚杯深蹲', sets: '4组×10-12次', equipment: '哑铃', tip: '双手托哑铃于胸前，深蹲模式。哑铃帮助保持躯干直立。没有深蹲架时的好替代', default: false },
            ],
          },
          {
            id: 'legs-main-hip-thrust',
            label: '臀大肌（上臀）+ 腘绳肌',
            region: '臀腿.腘绳',
            pickHint: '3选1-2',
            exercises: [
              { name: '腿举（脚高位）', sets: '4组×10-12次', equipment: '腿举机', tip: '脚放踏板偏上位置，髋关节屈曲角度更大，上臀和腘绳肌参与更多。下放时不过度让臀部离背。推起不锁膝', default: true },
              { name: '保加利亚分腿蹲', sets: '4组×10-12次/侧', equipment: '哑铃+凳子', tip: '后脚搭在凳子上，前腿下蹲至大腿平行。身体微前倾让臀肌更多参与。单侧训练纠正不平衡', default: false },
              { name: '罗马尼亚硬拉', sets: '4组×10-12次', equipment: '杠铃/哑铃', tip: '膝盖微屈，髋部后推使上半身前倾。杠铃沿小腿下降至膝盖下方。感受腘绳肌和臀肌拉伸收缩', default: false },
            ],
          },
          {
            id: 'legs-main-glute-thrust',
            label: '臀大肌（王牌动作）',
            region: '臀腿.臀',
            pickHint: '3选1',
            exercises: [
              { name: '器械臀推', sets: '4组×10-12次', equipment: '臀推机/杠铃', tip: '上背靠凳边，杠铃横跨髋部。推起时臀部全力收缩顶峰夹臀2秒。⚠️腰部不代偿。瘦大腿+提臀的王牌', default: true },
              { name: '杠铃臀推', sets: '4组×10-12次', equipment: '杠铃+软垫+凳子', tip: '杠铃放髋部（用软垫），上背靠凳推起。和器械臀推相同动作但自由重量。顶峰夹臀2秒', default: false },
              { name: '单腿臀推', sets: '4组×10-12次/侧', equipment: '凳子', tip: '单腿做臀推，另一腿屈膝悬空。强度翻倍，适合进阶。同样顶峰夹臀2秒', default: false },
            ],
          },
          {
            id: 'legs-main-abduction',
            label: '臀中肌 + 臀小肌',
            region: '臀腿.臀',
            pickHint: '3选1',
            exercises: [
              { name: '髋外展', sets: '3组×15次', equipment: '髋外展机', tip: '身体微前倾15°让力集中在上臀。顶峰停1秒慢放3秒。打造臀部上侧弧度', default: true },
              { name: '弹力带侧向行走', sets: '3组×15步/侧', equipment: '弹力带', tip: '弹力带套在膝盖上方，微蹲姿势侧向行走。全程保持弹力带张力。臀中肌灼烧感极强', default: false },
              { name: '站姿绳索髋外展', sets: '3组×15次/侧', equipment: '低位绳索', tip: '踝部套绳索，站姿向外侧打开。顶峰停1秒。绳索提供持续张力', default: false },
            ],
          },
          {
            id: 'legs-main-quads',
            label: '股四头肌（孤立）',
            region: '臀腿.股四头',
            pickHint: '3选1',
            exercises: [
              { name: '腿屈伸', sets: '3组×12-15次', equipment: '腿屈伸机', tip: '伸膝踢至水平位，顶峰收缩1秒。慢放3秒。脚尖微外旋可更好刺激股四头内侧头', default: true },
              { name: '反向北欧弯举', sets: '3组×8-12次', equipment: '软垫', tip: '跪姿脚踝固定，身体缓慢前倾用股四头控制下放再拉回。自重股四头孤立训练，强烈灼烧感', default: false },
              { name: '坐姿腿屈伸（单腿）', sets: '3组×12-15次/侧', equipment: '腿屈伸机', tip: '单腿做腿屈伸，纠正左右不平衡。弱侧先做，强侧匹配弱侧次数', default: false },
            ],
          },
          {
            id: 'legs-main-hamstrings',
            label: '腘绳肌（孤立）',
            region: '臀腿.腘绳',
            pickHint: '3选1',
            exercises: [
              { name: '腿弯举', sets: '3组×12-15次', equipment: '俯卧/坐姿腿弯举', tip: '屈膝拉向臀部，顶峰停1秒慢放3秒。腿前后肌群力量需平衡防膝盖受伤', default: true },
              { name: '瑞士球腿弯举', sets: '3组×12-15次', equipment: '瑞士球', tip: '仰卧脚跟搭瑞士球上，臀部抬高后屈膝将球滚向臀部。同时练到臀和腘绳肌', default: false },
              { name: '北欧弯举', sets: '3组×力竭', equipment: '软垫+固定物', tip: '跪姿脚踝固定，身体缓慢前倾用腘绳肌对抗。腘绳肌离心训练之王，做不到可用手推辅助', default: false },
            ],
          },
        ],
      },
      {
        type: 'stretch',
        title: '收尾拉伸',
        badge: '拉伸',
        badgeClass: 'stretch-badge',
        groups: [
          {
            id: 'legs-stretch-glute',
            label: '臀部拉伸',
            region: '臀腿',
            pickHint: '2选1',
            exercises: [
              { name: '鸽子式', sets: '每侧30秒', equipment: '', tip: '一腿屈膝横放前，后腿伸直，身体前倾至臀大肌和臀中肌有拉伸感。髋紧张者在前腿臀下垫毛巾', default: true },
              { name: '仰卧抱膝拉伸', sets: '每侧30秒', equipment: '', tip: '仰卧，一侧膝盖双手抱向胸部。感受臀大肌拉伸。保持深呼吸', default: false },
            ],
          },
          {
            id: 'legs-stretch-quads',
            label: '股四头肌拉伸',
            region: '臀腿',
            pickHint: '2选1',
            exercises: [
              { name: '站姿股四头肌拉伸', sets: '每侧30秒', equipment: '', tip: '单腿站立，同侧手抓脚踝向后拉，膝盖并拢。膝盖不适者动作轻柔', default: true },
              { name: '侧卧股四头肌拉伸', sets: '每侧30秒', equipment: '', tip: '侧卧，上方腿屈膝手抓脚踝向后拉。比站姿更容易放松，不会摔倒', default: false },
            ],
          },
          {
            id: 'legs-stretch-hamstrings',
            label: '腘绳肌拉伸',
            region: '臀腿',
            pickHint: '2选1',
            exercises: [
              { name: '坐姿体前屈', sets: '每侧30秒', equipment: '', tip: '坐姿一腿伸直一腿屈膝，身体前倾手够脚尖。够不到够小腿即可。保持背部挺直', default: true },
              { name: '仰卧弹力带拉伸', sets: '每侧30秒', equipment: '弹力带/毛巾', tip: '仰卧一腿伸直套弹力带，手拉弹力带将腿拉向身体。比坐姿更容易控制强度', default: false },
            ],
          },
          {
            id: 'legs-stretch-calves',
            label: '小腿拉伸',
            region: '臀腿',
            pickHint: '2选1',
            exercises: [
              { name: '弓步小腿拉伸', sets: '每侧30秒', equipment: '', tip: '弓步后腿伸直脚后跟着地，身体前倾。感受腓肠肌拉伸。久坐者此区域通常很紧', default: true },
              { name: '台阶小腿下放', sets: '每侧30秒', equipment: '台阶', tip: '前脚掌站在台阶边缘，脚后跟缓慢下沉低于台阶。拉伸小腿深层比目鱼肌', default: false },
            ],
          },
        ],
      },
    ],
  },

  rest: {
    label: '休息日',
    subtitle: '核心激活 + 体态矫正',
    emoji: '🧘',
    sections: [
      {
        type: 'warmup',
        title: '低强度核心训练',
        badge: '核心',
        badgeClass: 'warmup-badge',
        groups: [
          {
            id: 'rest-core-deadbug',
            label: '核心稳定性',
            region: '核心',
            pickHint: '3选1-2',
            exercises: [
              { name: '死虫式（Dead Bug）', sets: '3组×10次/侧', equipment: '瑜伽垫', tip: '仰卧四肢朝天，腰部贴紧地面（手离地一掌厚）。对侧手脚缓慢下放至接近地面，呼气收回。全程核心收紧，腰部不离开地面。改善核心稳定性和骨盆控制', default: true },
              { name: '鸟狗式（Bird Dog）', sets: '3组×8次/侧', equipment: '瑜伽垫', tip: '四足跪姿，对侧手臂和腿缓慢伸展至与身体平行。核心收紧保持躯干不晃动，停2秒后收回。改善核心抗旋能力和脊柱稳定', default: false },
              { name: '平板支撑', sets: '3组×30-45秒', equipment: '瑜伽垫', tip: '前臂撑地，身体成一条直线。核心收紧、臀部夹紧、肩胛骨前伸（不要塌腰或拱背）。呼吸均匀，力竭即停', default: false },
            ],
          },
          {
            id: 'rest-core-rotation',
            label: '核心抗旋',
            region: '核心',
            pickHint: '2选1',
            exercises: [
              { name: '帕洛夫推（Pallof Press）', sets: '3组×10次/侧', equipment: '弹力带/绳索', tip: '弹力带固定在侧面，双手握于胸前向前推出，对抗弹力带的旋转拉力。停2秒后收回。训练核心抗旋能力', default: true },
              { name: '侧平板支撑', sets: '3组×20-30秒/侧', equipment: '瑜伽垫', tip: '侧身手肘撑地，髋部抬高身体成斜线。核心收紧不塌腰。可膝盖着地降阶', default: false },
            ],
          },
        ],
      },
      {
        type: 'stretch',
        title: '体态矫正拉伸（重点）',
        badge: '矫正',
        badgeClass: 'stretch-badge',
        groups: [
          {
            id: 'rest-posture-chest',
            label: '胸肌+前肩（对抗圆肩）',
            region: '胸',
            pickHint: '2选1',
            exercises: [
              { name: '门框胸肌拉伸（加长版）', sets: '每侧45秒×2组', equipment: '', tip: '比训练日拉伸更久！手肘90°放门框，身体缓慢前移。圆肩的根本原因是胸肌过紧，休息日投入更多时间拉伸', default: true },
              { name: '仰卧泡沫轴胸椎伸展', sets: '2分钟', equipment: '泡沫轴', tip: '泡沫轴纵向放在脊柱下方（头到臀部），双手打开成T字形，膝盖弯曲。让重力自然打开胸椎和胸肌。深呼吸放松', default: false },
            ],
          },
          {
            id: 'rest-posture-neck',
            label: '颈部+上斜方放松',
            region: '肩',
            pickHint: '2选1',
            exercises: [
              { name: '下巴回缩（Chin Tuck）', sets: '10次×3组', equipment: '', tip: '坐直或站直，下巴水平向后缩（像做双下巴），后脑勺有轻微拉伸感。保持2秒放松。纠正头前伸姿势', default: true },
              { name: '上斜方肌拉伸', sets: '每侧30秒×2组', equipment: '', tip: '坐姿一侧手抓住凳子边缘，头向对侧侧屈，另一手轻辅助。感受脖子侧面到肩膀的拉伸。不要耸肩', default: false },
            ],
          },
          {
            id: 'rest-posture-hips',
            label: '髋部+下背放松',
            region: '臀腿',
            pickHint: '2选1',
            exercises: [
              { name: '90-90髋部拉伸', sets: '每侧30秒×2组', equipment: '瑜伽垫', tip: '坐姿前腿屈膝90°外旋，后腿屈膝90°内旋（呈两个90°角）。身体前倾拉伸前腿臀部和后腿髋屈肌。改善髋关节灵活性', default: true },
              { name: '婴儿式（Child\'s Pose）', sets: '60秒×2组', equipment: '瑜伽垫', tip: '跪姿臀部坐脚跟，双手向前伸直，额头贴地。深呼吸感受整个背部和髋部放松。减压恢复动作', default: false },
            ],
          },
          {
            id: 'rest-posture-scapula',
            label: '肩胛稳定性（防溜肩）',
            region: '背',
            pickHint: '2选1',
            exercises: [
              { name: '靠墙天使（慢速版）', sets: '10次×2组', equipment: '', tip: '比训练日速度更慢，每个位置停留3秒。重点感受中下斜方肌和前锯肌发力。闭眼做，专注肌肉感受', default: true },
              { name: '弹力带拉开+后缩', sets: '15次×2组', equipment: '弹力带', tip: '弹力带在胸前拉开至手臂成T字，同时肩胛骨后缩。慢放5秒。肩胛骨控制训练', default: false },
            ],
          },
        ],
      },
    ],
  },
};

// ========== 工具函数 ==========

function getTrainingPlan(type) {
  // 自定义方案日
  if (type && type.startsWith('custom_')) {
    const idx = parseInt(type.replace('custom_', ''));
    const pid = getActivePlanId();
    if (pid !== 'default') {
      const plans = getPlans();
      const ap = plans.find(p => p.id === pid);
      if (ap && ap.days && ap.days[idx]) {
        const day = ap.days[idx];
        return {
          label: day.label,
          subtitle: ap.name,
          emoji: '📋',
          sections: (() => {
            const dayIdx = idx;
            // 数据防御：清洗可能畸形的 day 数据
            if (!day || typeof day !== 'object') return [{ type:'main',title:'训练',badge:'正式',badgeClass:'section-badge',groups:[] }];
            // 优先使用 AI 返回的 sections（新格式），否则用旧格式 groups 构造
            if (day.sections && Array.isArray(day.sections)) {
              return day.sections.map((sec, si) => ({
                type: sec.type || 'main',
                title: sec.title || day.label,
                badge: sec.type === 'warmup' ? '热身' : sec.type === 'stretch' ? '拉伸' : sec.type === 'cardio' ? '有氧' : '正式',
                badgeClass: sec.type === 'warmup' ? 'warmup-badge' : sec.type === 'stretch' ? 'stretch-badge' : 'section-badge',
                groups: (sec.groups || []).map((g, gi) => ({
                  id: 'cust_' + dayIdx + '_' + si + '_' + gi,
                  label: g.label || '训练组',
                  region: g.label || '',
                  pickHint: g.pickHint || (g.exercises && g.exercises.length > 1 ? g.exercises.length + '选1-2' : '1选1'),
                  exercises: (g.exercises || []).map((ex, ei) => {
                    let dbEx = null;
                    if (typeof EXERCISE_DB !== 'undefined') {
                      dbEx = EXERCISE_DB.find(e => e.name === ex.name || e.name.includes(ex.name) || ex.name.includes(e.name));
                    }
                    return {
                      name: ex.name,
                      sets: ex.sets || '3组×10-12次',
                      equipment: dbEx ? dbEx.equipment : '',
                      tip: dbEx ? dbEx.name + ' · ' + dbEx.mechanics + ' · ' + dbEx.difficulty + '级 · ' + (dbEx.risk==='高'?'注意⚠️高风险':'标准动作') : '💡 AI推荐动作，请根据实际情况调整重量和姿势',
                      default: ei === 0
                    };
                  })
                }))
              }));
            }
            // 旧格式兼容：硬编码warmup+main+stretch
            return [
              { type:'warmup',title:'热身',badge:'热身',badgeClass:'warmup-badge',groups:[
                { id:'cust_w'+dayIdx+'_0',label:'有氧预热',pickHint:'2选1',region:'全身',exercises:[
                  { name:'跑步机快走',sets:'5分钟',equipment:'跑步机',tip:'心率110-120微汗即可',default:true },
                  { name:'跳绳',sets:'3分钟×2组',equipment:'跳绳',tip:'轻跳不耗体力',default:false }
                ]},
                { id:'cust_w'+dayIdx+'_1',label:'关节激活',pickHint:'2选1',region:'全身',exercises:[
                  { name:'肩髋动态拉伸',sets:'5分钟',equipment:'',tip:'肩绕环+髋绕环+体转',default:true },
                  { name:'泡沫轴滚动',sets:'3分钟',equipment:'泡沫轴',tip:'滚胸椎和髋部',default:false }
                ]}
              ]},
              { type:'main',title:day.label,badge:'正式',badgeClass:'section-badge',
                groups:(day.groups||[]).map((g,gi)=>({
                  id:'cust_m'+dayIdx+'_'+gi,label:g.label||'训练组',region:g.label||'',
                  pickHint:g.pickHint||(g.exercises&&g.exercises.length>1?g.exercises.length+'选1-2':'1选1'),
                  exercises:(g.exercises||[]).map((ex,ei)=>{
                    let dbEx=null;
                    if(typeof EXERCISE_DB!=='undefined') dbEx=EXERCISE_DB.find(e=>e.name===ex.name||e.name.includes(ex.name)||ex.name.includes(e.name));
                    return {name:ex.name,sets:ex.sets||'3组×10-12次',equipment:dbEx?dbEx.equipment:'',tip:dbEx?dbEx.name+' · '+dbEx.mechanics+' · '+dbEx.difficulty+'级':'💡 AI推荐动作',default:ei===0};
                  })
                }))
              },
              { type:'stretch',title:'拉伸',badge:'拉伸',badgeClass:'stretch-badge',groups:[
                { id:'cust_s'+dayIdx+'_0',label:'上肢拉伸',pickHint:'2选1',region:'全身',exercises:[
                  { name:'胸肌门框拉伸',sets:'每侧30秒',equipment:'',tip:'手肘90°放门框',default:true },
                  { name:'背阔肌拉伸',sets:'每侧30秒',equipment:'',tip:'双手抓固定物后坐',default:false }
                ]},
                { id:'cust_s'+dayIdx+'_1',label:'下肢拉伸',pickHint:'2选1',region:'全身',exercises:[
                  { name:'股四头肌拉伸',sets:'每侧30秒',equipment:'',tip:'单腿站抓脚踝后拉',default:true },
                  { name:'腘绳肌拉伸',sets:'每侧30秒',equipment:'',tip:'坐姿体前屈',default:false }
                ]}
              ]}
            ];
          })()
        };
      }
    }
  }
  return TRAINING_PLANS[type] || TRAINING_PLANS.push;
}

function getAllExercisesFlat(plan) {
  const exercises = [];
  plan.sections.forEach(section => {
    if (section.groups) {
      section.groups.forEach(group => {
        group.exercises.forEach(ex => {
          exercises.push({ ...ex, groupId: group.id, groupLabel: group.label, isDefault: ex.default });
        });
      });
    }
  });
  return exercises;
}

function getAllGroups(plan) {
  const groups = [];
  plan.sections.forEach(section => {
    if (section.groups) section.groups.forEach(g => groups.push(g));
  });
  return groups;
}

// 该组动作集合 = 方案动作 + 当日自定义替换动作（P1：替换动作也计入组完成）
function groupExerciseSet(group, record) {
  const customExs = (record.exercises || []).filter(e => e.groupId === group.id && e.custom && !(group.exercises || []).some(x => x.name === e.name));
  return (group.exercises || []).concat(customExs);
}

function isGroupCompleted(group, record) {
  const exs = groupExerciseSet(group, record);
  if (exs.length === 0) return false;
  const skipped = exs.filter(ex => { const r = record.exercises.find(e => e.name === ex.name && e.groupId === group.id); return r && r.skipped; }).length;
  if (skipped >= exs.length) return false; // 全跳过组不算完成（单独记跳过）
  const completed = exs.filter(ex => { const r = record.exercises.find(e => e.name === ex.name && e.groupId === group.id); return r && r.completed; }).length;
  const active = exs.length - skipped;
  // 完成阈值取 pickHint 下限（3选1-2 → 1；3选2 → 2）；不选满也能完成（15.2 决策）
  let threshold = 1;
  if (group.pickHint) {
    const rangeMatch = group.pickHint.match(/(\d+)选(\d+)-(\d+)/);
    if (rangeMatch) threshold = parseInt(rangeMatch[2]); // 下限
    else {
      const singleMatch = group.pickHint.match(/(\d+)选(\d+)/);
      if (singleMatch) threshold = parseInt(singleMatch[2]);
    }
  }
  return completed >= Math.min(threshold, active);
}

// 组内全部动作被跳过 → 记「已跳过」组（单独统计，不进完成率分子）
function isGroupSkipped(group, record) {
  const exs = groupExerciseSet(group, record);
  if (exs.length === 0) return false;
  return exs.every(ex => { const r = record.exercises.find(e => e.name === ex.name && e.groupId === group.id); return r && r.skipped; });
}

function getSelectedExercise(group, record) {
  if (!record.groupSelections) record.groupSelections = {};
  const saved = record.groupSelections[group.id];
  if (saved) {
    const found = group.exercises.find(e => e.name === saved);
    if (found) return found;
  }
  return group.exercises.find(e => e.default) || group.exercises[0];
}

function renderTrainingPage() {
  const container = document.getElementById('training-content');
  const record = getTodayRecord();
  const plan = getTrainingPlan(record.type);
  if (!record.groupSelections) { record.groupSelections = {}; saveTodayRecord(record); }

  const allGroups = getAllGroups(plan);
  const totalGroups = allGroups.length;
  let completedGroups = 0, skippedGroups = 0;
  allGroups.forEach(g => { if (isGroupCompleted(g, record)) completedGroups++; if (isGroupSkipped(g, record)) skippedGroups++; });

  let html = '';

  // 方案选择器
  const activePlanId = getActivePlanId();
  const plans = getPlans();
  const ap = plans.find(p => p.id === activePlanId);
  html += `<div class="plan-selector" onclick="${plans.length > 0 ? 'switchPlan()' : "navigateTo('features');setTimeout(function(){openFeatureModule('ai-coach')},100)"}">`;
  html += `<span>📋 ${ap ? ap.name : '默认三分化'}</span>`;
  html += `<span style="font-size:11px;color:var(--muted);">${plans.length > 0 ? '点击切换方案 →' : '去AI定制方案 →'}</span>`;
  html += `</div>`;

  // 方案切换弹层
  html += `<div id="plan-switcher" class="plan-switcher-hidden">`;
  html += `<div class="plan-switcher-backdrop" onclick="closePlanSwitcher()"></div>`;
  html += `<div class="plan-switcher-sheet"><h3 style="margin-bottom:10px;">切换训练方案</h3>`;
  html += `<div class="card ${activePlanId==='default'?'completed':''}" onclick="switchToPlan('default')"><div class="flex-between"><div><div class="card-title">📌 默认三分化</div><div class="card-meta">推/拉/臀腿 · 4天轮转</div></div>${activePlanId==='default'?'<span style=\"color:var(--accent);\">✓</span>':''}</div></div>`;
  plans.forEach(p => {
    html += `<div class="card ${p.id===activePlanId?'completed':''}" onclick="switchToPlan('${p.id}')"><div class="flex-between"><div><div class="card-title">${p.name}</div><div class="card-meta">${p.type==='5day'?'五分化':'三分化'} · ${p.days.length}天</div></div>${p.id===activePlanId?'<span style=\"color:var(--accent);\">✓</span>':''}</div></div>`;
  });
  html += `</div></div>`;

  // 今日建议（基于最近训练数据本地计算）
  const recentRecords = getRecords().filter(r => r.completed).slice(-3);
  if (recentRecords.length > 0) {
    let tip = '';
    const lastType = recentRecords[recentRecords.length-1].type;
    if (lastType === 'legs' || (lastType && lastType.startsWith('custom_'))) {
      const lastDate = new Date(recentRecords[recentRecords.length-1].date);
      const daysSince = Math.floor((new Date() - lastDate) / 86400000);
      if (daysSince >= 2) tip = '💪 上次训练已过' + daysSince + '天，今天适合上强度';
      else if (daysSince === 0) tip = '⚠️ 今天已训练过，注意休息恢复';
      else tip = '✅ 状态良好，按计划推进';
    }
    if (recentRecords.length >= 2) {
      // 检查是否真的连续天数
      let consecutive = 1;
      for (let i = recentRecords.length - 1; i > 0; i--) {
        const d1 = new Date(recentRecords[i].date);
        const d2 = new Date(recentRecords[i-1].date);
        if ((d1 - d2) / 86400000 <= 2) consecutive++; else break;
      }
      if (consecutive >= 2) tip = '🔥 连续' + consecutive + '天完成训练，势头很好！';
    }
    if (tip) {
      html += `<div class="card" style="border-left:3px solid var(--accent);padding:10px 14px;margin-bottom:10px;font-size:13px;">${tip}</div>`;
    }
  }

  html += `<div class="day-switcher mb-8">`;
  // 检查是否有自定义方案
  const activePid = getActivePlanId();
  if (activePid !== 'default') {
    const plans = getPlans();
    const ap = plans.find(p => p.id === activePid);
    if (ap && ap.days) {
      ap.days.forEach((d, i) => {
        const dayType = 'custom_' + i;
        html += `<button class="day-switch-btn ${record.type===dayType?'active':''}" onclick="switchTrainingDay('${dayType}')">${d.label}</button>`;
      });
      const hasRestDay = ap.days.some(d => d.label && d.label.includes('休息'));
      if (!hasRestDay) {
        html += `<button class="day-switch-btn ${record.type==='rest'?'active':''}" onclick="switchTrainingDay('rest')">🧘 休息</button>`;
      }
    } else {
      // fallback to default
      ['push','pull','legs','rest'].forEach(type => {
        const p = getTrainingPlan(type);
        html += `<button class="day-switch-btn ${record.type===type?'active':''}" onclick="switchTrainingDay('${type}')">${p.emoji} ${p.label}</button>`;
      });
    }
  } else {
    ['push','pull','legs','rest'].forEach(type => {
      const p = getTrainingPlan(type);
      html += `<button class="day-switch-btn ${record.type===type?'active':''}" onclick="switchTrainingDay('${type}')">${p.emoji} ${p.label}</button>`;
    });
  }
  html += `</div>`;

  html += `<div class="progress-section"><div class="progress-header"><div><div class="day-label" style="font-size:17px;">${plan.emoji} ${plan.label}</div><div class="day-subtitle" style="font-size:12px;color:var(--muted);">${plan.subtitle} · <span class="history-link" onclick="showHistory()">📋 历史</span> · <span class="history-link" onclick="generateWeeklyReport()">📊 周报</span></div></div><div class="progress-count"><span class="history-link" onclick="resetTodayProgress()" style="color:var(--danger);margin-right:8px;font-size:12px;">🔄</span><span id="completed-count">${completedGroups}</span>/<span>${totalGroups}</span> 部位${skippedGroups?' <span style="color:var(--muted);font-size:11px;">跳过'+skippedGroups+'</span>':''}</div></div><div class="progress-bar"><div class="progress-fill" id="progress-fill" style="width:${totalGroups?(completedGroups/totalGroups*100):0}%"></div></div></div>`;

  plan.sections.forEach((section, secIdx) => {
    html += `<div class="mb-8"><span class="${section.badgeClass||'section-badge'}" style="opacity:0.7;">${section.badge}</span>`;

    section.groups.forEach((group, grpIdx) => {
      const groupDone = isGroupCompleted(group, record);
      const currentEx = getSelectedExercise(group, record);
      const recEx = record.exercises.find(e => e.name === currentEx.name && e.groupId === group.id);
      const isDone = recEx ? recEx.completed : false;
      const pickHint = group.pickHint || (group.exercises.length + '选1-' + group.exercises.length);
      const weight = recEx ? (recEx.weight || '') : '';
      const groupId = group.id;

      html += `<div class="group-header ${groupDone?'group-done':''}" onclick="toggleGroup('${secIdx}-${grpIdx}')" id="gh-${secIdx}-${grpIdx}">`;
      html += `<span class="group-target-label">${groupDone?'✅':'🎯'} ${group.label}</span>`;
      html += `<div class="group-right"><span class="group-pick-hint">${pickHint}</span>${section.type==='main'?`<button class="fav-star-btn" onclick="event.stopPropagation();openExercisePicker('${secIdx}','${grpIdx}','${groupId}','${(group.region||'').replace(/'/g,"\\'")}')" title="替换/新增动作">🔄</button>`:''}<span class="group-expand-icon" id="ge-${secIdx}-${grpIdx}">▼</span></div></div>`;

      html += `<div class="group-exercises" id="gx-${secIdx}-${grpIdx}">`;

      // 合并方案组动作 + 当日自定义动作（15.5：替换/新增的动作用户自定义，仅当日有效）
      const customExs = record.exercises.filter(e => e.groupId === groupId && e.custom && !(group.exercises || []).some(x => x.name === e.name));
      const renderExs = (group.exercises || []).concat(customExs.map(e => {
        const dbEx = (typeof EXERCISE_DB !== 'undefined') ? EXERCISE_DB.find(x => x.name === e.name) : null;
        return { name: e.name, sets: dbEx ? (dbEx.type === '复合' ? '3-4组×8-12次' : '2-3组×8-12次') : '自定义', equipment: dbEx ? dbEx.equipment : '', custom: true };
      }));
      renderExs.forEach((ex, exIdx) => {
        if (!ex || !ex.name) return;
        const exRec = record.exercises.find(e => e.name === ex.name && e.groupId === groupId);
        const exDone = exRec ? exRec.completed : false;
        const exSkipped = exRec ? exRec.skipped : false;
        const exWeight = exRec ? (exRec.weight || '') : '';
        const exReps = exRec ? (exRec.reps || '') : '';
        const isSelected = ex.name === currentEx.name;
        const uid = secIdx + '-' + grpIdx + '-' + exIdx;

        html += `<div class="card group-exercise-card ${exDone?'completed':''} ${exSkipped?'exercise-skipped':''}" style="margin-bottom:6px;${!isSelected?'opacity:0.55;':''}" id="card-${uid}">`;
        html += `<div class="card-header"><div class="checkbox-wrapper" onclick="selectAndToggle('${secIdx}','${grpIdx}','${exIdx}','${groupId}','${escapeHtml(ex.name)}')">`;
        html += `<div class="checkbox-custom ${exDone?'checked':''}" id="check-${uid}">${exDone?'✓':''}</div>`;
        html += `<div style="flex:1;"><div class="card-title" style="font-size:14px;${exDone?'text-decoration:line-through;color:var(--accent);':''}${exSkipped?'text-decoration:line-through;color:var(--muted);':''}">${ex.name}${exSkipped?'<span class="card-default-tag" style="background:var(--border);color:var(--muted);">已跳过</span>':''}${ex.default?'<span class="card-default-tag">推荐</span>':''}</div>`;
        if(ex.equipment) html += `<span class="card-equipment">${ex.equipment}</span>`;
        html += `<div class="card-meta">${ex.sets}</div>`;
        if(section.type==='main'&&ex.equipment){
          html += `<div class="weight-row" onclick="stopPropagation(event)"><span class="weight-label">🏋️</span><input type="number" class="weight-input-sm" value="${exWeight}" onchange="updateExerciseWeight('${groupId}','${escapeHtml(ex.name)}',this.value)" onfocus="this.select()" step="5" min="0" max="500" placeholder="${getLastWeightHint(ex.name)}"><span class="weight-unit">kg</span><span class="weight-label" style="margin-left:6px;">次</span><input type="number" class="weight-input-sm" value="${exReps}" onchange="updateExerciseReps('${groupId}','${escapeHtml(ex.name)}',this.value)" onfocus="this.select()" step="1" min="0" max="60" style="width:52px;"></div>`;
        }
        html += `</div><div style="display:flex;align-items:center;gap:2px;"><button class="fav-star-btn skip-btn ${exSkipped?'skip-active':''}" onclick="event.stopPropagation();toggleSkip('${secIdx}','${grpIdx}','${groupId}','${escapeHtml(ex.name)}')" title="跳过此动作">⏭</button><button class="fav-star-btn" data-ex="${escapeHtml(ex.name)}" onclick="event.stopPropagation();var el=this;try{toggleFavorite(this.getAttribute('data-ex'));el.textContent=isFavorite(this.getAttribute('data-ex'))?'⭐':'☆';el.classList.add('pop');setTimeout(function(){el.classList.remove('pop')},500)}catch(e){}">☆</button></div></div></div>`;
        if(ex.tip) html += `<div class="card-tip">💡 ${ex.tip}</div>`;
        html += `</div>`;
      });

      html += `</div>`;
    });
    html += `</div>`;
  });

  if (record.type !== 'rest') {
    const cardio = record.cardio || {};
    html += `<div class="card cardio-card mt-16 ${cardio.done?'completed':''}"><div class="cardio-header"><div class="checkbox-wrapper" onclick="toggleCardio()"><div class="checkbox-custom ${cardio.done?'checked':''}" id="check-cardio">${cardio.done?'✓':''}</div><span style="font-weight:600;font-size:15px;">🏃 今日有氧</span></div><span class="cardio-split">上午无氧→傍晚有氧</span></div><div class="cardio-inputs" onclick="stopPropagation(event)"><div class="cardio-field"><label>时长(分钟)</label><input type="number" value="${cardio.duration||''}" placeholder="30" onchange="updateCardioData('duration',this.value)" onfocus="this.select()"></div><div class="cardio-field"><label>坡度(%)</label><input type="number" value="${cardio.incline||''}" placeholder="10" step="0.5" onchange="updateCardioData('incline',this.value)" onfocus="this.select()"></div><div class="cardio-field"><label>距离(km)</label><input type="number" value="${cardio.distance||''}" placeholder="3.0" step="0.1" onchange="updateCardioData('distance',this.value)" onfocus="this.select()"></div></div><div class="cardio-note">⚠️ 60%心率≈126次/分 · 疲惫可减量或暂停</div></div>`;
  }

  const existingRating = record.aiRating || '';
  html += `<div id="rating-section" class="mt-16">`;
  if (existingRating) {
    html += `<div class="rating-card"><div class="rating-card-header"><span>📊 AI 训练评分</span><span class="rating-refresh" onclick="submitForRating()">🔄 重新评估</span></div><div class="rating-card-body">${existingRating.replace(/\n/g,'<br>')}</div></div>`;
  }
  html += `</div>`;

  html += `<div style="height:80px;"></div>`;
  container.innerHTML = html;
  renderBottomBar(completedGroups, totalGroups);
  // 已完成组初始折叠未完成项
  document.querySelectorAll('.group-done').forEach(gh => {
    const gx = gh.nextElementSibling;
    if (gx && gx.classList.contains('group-exercises')) {
      gx.querySelectorAll('.group-exercise-card').forEach(c => {
        if (!c.querySelector('.checkbox-custom.checked')) c.classList.add('collapse-hide');
      });
      const icon = gh.querySelector('.group-expand-icon');
      if (icon) icon.textContent = '▶';
    }
  });
  // 初始化收藏星标状态
  if (typeof isFavorite === 'function') {
    setTimeout(() => {
      document.querySelectorAll('.fav-star-btn').forEach(btn => {
        const name = btn.getAttribute('data-ex') || '';
        if (name && isFavorite(name)) btn.textContent = '⭐';
      });
    }, 50);
  }
}

function renderBottomBar(completedGroups, totalGroups) {
  let bar = document.getElementById('bottom-bar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'bottom-bar';
    document.getElementById('app').appendChild(bar);
  }
  const allDone = completedGroups >= totalGroups;
  // 完成按钮始终可点：部分完成也能结束训练（15.4 决策）
  bar.innerHTML = `
    <button class="btn btn-outline" style="flex:1;" onclick="submitForRating()">📝 评分</button>
    <button class="btn btn-accent" style="flex:1;" id="finish-btn" onclick="finishTraining()">${allDone?'✅ 完成训练':'🏁 结束训练('+completedGroups+'/'+totalGroups+')'}</button>
  `;
}

function toggleGroup(uid) {
  const el = document.getElementById('gx-' + uid);
  const icon = document.getElementById('ge-' + uid);
  if (!el) return;
  const cards = el.querySelectorAll('.group-exercise-card');
  const anyCollapsed = Array.from(cards).some(c => c.classList.contains('collapse-hide'));
  if (anyCollapsed) {
    // 展开全部
    cards.forEach(c => c.classList.remove('collapse-hide'));
    if(icon) icon.textContent = '▼';
  } else {
    // 折叠未完成/未选中的动作
    cards.forEach(c => {
      const cb = c.querySelector('.checkbox-custom');
      if (!cb || !cb.classList.contains('checked')) {
        c.classList.add('collapse-hide');
      }
    });
    if(icon) icon.textContent = '▶';
  }
}

function selectAndToggle(secIdx, grpIdx, exIdx, groupId, exName) {
  const record = getTodayRecord();
  if (!record.groupSelections) record.groupSelections = {};
  record.groupSelections[groupId] = exName;
  let recEx = record.exercises.find(e => e.name === exName && e.groupId === groupId);
  if (!recEx) { recEx = { name: exName, groupId: groupId, completed: false }; record.exercises.push(recEx); }
  recEx.completed = !recEx.completed;
  if (recEx.completed) recEx.skipped = false; // P2-1：勾选完成时清除跳过标记，避免同卡 completed+skipped 冲突
  saveTodayRecord(record);

  // ── 局部更新 DOM，不重渲染 ──

  const uid = secIdx + '-' + grpIdx + '-' + exIdx;
  const checkbox = document.getElementById('check-' + uid);
  const card = document.getElementById('card-' + uid);
  const titleEl = card ? card.querySelector('.card-title') : null;

  // 1. 勾选动画
  if (recEx.completed) {
    if (checkbox) { checkbox.classList.add('checked'); checkbox.textContent = '✓'; }
    if (card) card.classList.add('completed');
    if (titleEl) { titleEl.style.textDecoration = 'line-through'; titleEl.style.color = 'var(--accent)'; }
  } else {
    if (checkbox) { checkbox.classList.remove('checked'); checkbox.textContent = ''; }
    if (card) card.classList.remove('completed');
    if (titleEl) { titleEl.style.textDecoration = ''; titleEl.style.color = ''; }
  }

  // 2. 更新组头状态
  const plan = getTrainingPlan(record.type);
  let group = null;
  plan.sections.forEach(s => { if(s.groups) s.groups.forEach(g => { if(g.id===groupId) group=g; }); });
  if (group) {
    const groupDone = isGroupCompleted(group, record);
    const gh = document.getElementById('gh-' + secIdx + '-' + grpIdx);
    const gx = document.getElementById('gx-' + secIdx + '-' + grpIdx);
    const label = gh ? gh.querySelector('.group-target-label') : null;
    if (groupDone) {
      if (gh) gh.classList.add('group-done');
      if (label) label.textContent = (label.textContent || '').replace('🎯', '✅');
      // 完成时折叠未完成的 + 弹跳；取消完成时全部展开
      if (gx) {
        const icon = document.getElementById('ge-' + secIdx + '-' + grpIdx);
        if (recEx.completed) {
          // 完成了 → 折叠未完成项
          if (gh) { gh.classList.add('just-done'); setTimeout(() => gh.classList.remove('just-done'), 600); }
          setTimeout(() => {
            gx.querySelectorAll('.group-exercise-card').forEach(c => {
              const cb = c.querySelector('.checkbox-custom');
              if (!cb || !cb.classList.contains('checked')) c.classList.add('collapse-hide');
            });
            if (icon) icon.textContent = '▶';
          }, 400);
        } else {
          // 取消完成 → 全部展开
          gx.querySelectorAll('.group-exercise-card').forEach(c => c.classList.remove('collapse-hide'));
          if (icon) icon.textContent = '▼';
        }
      }
    } else {
      if (gh) gh.classList.remove('group-done');
      if (label) label.textContent = (label.textContent || '').replace('✅', '🎯');
      // 取消完成 → 全部展开
      if (gx) {
        gx.querySelectorAll('.group-exercise-card').forEach(c => c.classList.remove('collapse-hide'));
        const icon = document.getElementById('ge-' + secIdx + '-' + grpIdx);
        if (icon) icon.textContent = '▼';
      }
    }
  }

  // 3. 更新进度条 + 清零按钮
  const allGroups = getAllGroups(plan);
  let completedGroups = 0;
  allGroups.forEach(g => { if (isGroupCompleted(g, record)) completedGroups++; });
  const ce = document.getElementById('completed-count');
  const fe = document.getElementById('progress-fill');
  if (ce) ce.textContent = completedGroups;
  if (fe) fe.style.width = allGroups.length ? (completedGroups / allGroups.length * 100) + '%' : '0%';

  // 4. 更新底部按钮
  renderBottomBar(completedGroups, allGroups.length);

  // 5. 刷新评分区域（如果有评分内容）
  const rs = document.getElementById('rating-section');
  if (rs && rs.querySelector('.rating-card:not(.rating-loading)')) {
    rs.innerHTML = '';
  }
}

function toggleCardio() {
  const record = getTodayRecord();
  if (!record.cardio) record.cardio = {};
  record.cardio.done = !record.cardio.done;
  saveTodayRecord(record);
  renderTrainingPage();
}

function updateCardioData(field, value) {
  const record = getTodayRecord();
  if (!record.cardio) record.cardio = {};
  record.cardio[field] = parseFloat(value) || 0;
  saveTodayRecord(record);
}

function updateExerciseWeight(groupId, exName, value) {
  const record = getTodayRecord();
  let recEx = record.exercises.find(e => e.name === exName && e.groupId === groupId);
  if (!recEx) { recEx = { name: exName, groupId: groupId, completed: false }; record.exercises.push(recEx); }
  recEx.weight = parseFloat(value) || 0;
  saveTodayRecord(record);
}

// 次数录入（15.6）
function updateExerciseReps(groupId, exName, value) {
  const record = getTodayRecord();
  let recEx = record.exercises.find(e => e.name === exName && e.groupId === groupId);
  if (!recEx) { recEx = { name: exName, groupId: groupId, completed: false }; record.exercises.push(recEx); }
  recEx.reps = parseInt(value) || 0;
  saveTodayRecord(record);
}

// 建议重量提示：该动作最近一次历史重量（15.6）
function getLastWeightHint(exName) {
  const records = getRecords().filter(r => r.completed && r.exercises && r.exercises.some(e => e.name === exName && e.weight));
  if (records.length === 0) return '';
  const last = records[records.length - 1].exercises.find(e => e.name === exName && e.weight);
  return last && last.weight ? '上次 ' + last.weight + 'kg' : '';
}

// 动作级跳过（15.3）
function toggleSkip(secIdx, grpIdx, groupId, exName) {
  const record = getTodayRecord();
  let recEx = record.exercises.find(e => e.name === exName && e.groupId === groupId);
  if (!recEx) { recEx = { name: exName, groupId: groupId, completed: false }; record.exercises.push(recEx); }
  recEx.skipped = !recEx.skipped;
  if (recEx.skipped) { recEx.completed = false; showSkipOption(groupId, exName); }
  saveTodayRecord(record);
  renderTrainingPage();
}

// 跳过后弹轻量选项：仅今天 / 以后也别推荐（15.3）
function showSkipOption(groupId, exName) {
  const old = document.getElementById('skip-option-overlay');
  if (old) old.remove();
  const overlay = document.createElement('div');
  overlay.id = 'skip-option-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:500;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML = `<div style="background:var(--surface);border-radius:16px;padding:20px;max-width:300px;width:90%;text-align:center;">
    <div style="font-size:32px;margin-bottom:8px;">⏭</div>
    <h3 style="margin-bottom:4px;">已跳过「${exName}」</h3>
    <p style="font-size:13px;color:var(--muted);margin-bottom:16px;">今天先不练这个动作</p>
    <button class="btn btn-outline btn-sm" style="width:100%;margin-bottom:8px;" onclick="document.getElementById('skip-option-overlay').remove()">仅今天跳过</button>
    <button class="btn btn-accent btn-sm" style="width:100%;" onclick="persistDislike('${exName.replace(/'/g, "\\'")}');document.getElementById('skip-option-overlay').remove()">以后也别推荐</button>
  </div>`;
  document.body.appendChild(overlay);
}

// 「以后也别推荐」→ 写入持久偏好，引擎 buildContext 合并进 dislike（15.3）
function persistDislike(name) {
  const s = getSettings();
  if (!s.userDislike) s.userDislike = [];
  if (!s.userDislike.includes(name)) s.userDislike.push(name);
  saveSettings(s);
  showToast('已记住：以后不再推荐「' + name + '」', 'success');
}

// ── 15.5 替换 / 新增动作：同部位 + 设备可用 选择器 ──
function openExercisePicker(secIdx, grpIdx, groupId, region) {
  const s = getSettings();
  const eq = (s.userInfo || {}).equipment;
  if (!eq) { showEquipmentPicker(secIdx, grpIdx, groupId, region); return; } // P2-3：首次先确认设备
  openExercisePickerInner(secIdx, grpIdx, groupId, region, eq);
}

// P2-3：设备偏好首次弹选择，存 settings.userInfo.equipment，之后过滤用保存值
function showEquipmentPicker(secIdx, grpIdx, groupId, region) {
  const old = document.getElementById('ex-picker-overlay');
  if (old) old.remove();
  const options = ['商业健身房(器械很全)', '社区健身房(基础器械够用)', '家庭健身(哑铃+弹力带+引体架)', '纯自重训练(无器械)'];
  const overlay = document.createElement('div');
  overlay.id = 'ex-picker-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:500;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML = `<div style="background:var(--surface);border-radius:16px;padding:20px;max-width:320px;width:90%;text-align:center;">
    <div style="font-size:30px;margin-bottom:8px;">🏋️</div>
    <h3 style="margin-bottom:4px;">你的器械条件？</h3>
    <p style="font-size:13px;color:var(--muted);margin-bottom:14px;">用于过滤可替换/新增的动作</p>
    ${options.map((o, i) => `<button class="btn btn-outline btn-sm" style="width:100%;margin-bottom:8px;" onclick="setEquipmentPref(${i})">${o}</button>`).join('')}
  </div>`;
  window._pickerCtx = { secIdx, grpIdx, groupId, region };
  document.body.appendChild(overlay);
}

function setEquipmentPref(idx) {
  const options = ['商业健身房(器械很全)', '社区健身房(基础器械够用)', '家庭健身(哑铃+弹力带+引体架)', '纯自重训练(无器械)'];
  const s = getSettings();
  if (!s.userInfo) s.userInfo = {};
  s.userInfo.equipment = options[idx];
  saveSettings(s);
  const ov = document.getElementById('ex-picker-overlay');
  if (ov) ov.remove();
  const c = window._pickerCtx || {};
  openExercisePickerInner(c.secIdx, c.grpIdx, c.groupId, c.region, options[idx]);
}

function openExercisePickerInner(secIdx, grpIdx, groupId, region, eqPref) {
  const old = document.getElementById('ex-picker-overlay');
  if (old) old.remove();
  const ctx = { equipment: eqPref };
  const regionFilter = [region || ''];
  const cands = EXERCISE_DB.filter(ex => {
    if (ex.phase !== 'main') return false;
    const r = ex.region || '';
    // P3：同子部位精确匹配——组 region 带子部位（如 胸.中胸）只换同子部位；无子部位（如 胸）匹配同大区
    if (!regionFilter.some(f => f && (r === f || r.startsWith(f + '.')))) return false;
    if (typeof isEquipmentAvailable === 'function' && !isEquipmentAvailable(ex, ctx)) return false;
    return true;
  });
  const renderList = (kw) => {
    const list = kw ? fuzzySearchExercises(kw, cands) : cands; // 第16节：模糊搜索（候选已是同部位+设备过滤子集）
    return list.slice(0, 50).map(e =>
      `<div class="card ex-card" style="padding:10px 14px;margin-bottom:6px;" onclick="addCustomExercise('${groupId}','${escapeHtml(e.name)}')"><div style="font-size:14px;font-weight:600;">${e.name}</div><div class="card-meta">${e.equipment} · ${e.mechanics} · ${e.difficulty}</div></div>`
    ).join('') || '<p class="text-muted text-center" style="padding:20px;">无可用动作</p>';
  };
  const overlay = document.createElement('div');
  overlay.id = 'ex-picker-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:500;background:rgba(0,0,0,.85);display:flex;flex-direction:column;';
  overlay.innerHTML = `<div style="background:var(--surface);height:100%;max-height:88vh;display:flex;flex-direction:column;border-radius:16px 16px 0 0;margin-top:auto;">
    <div style="padding:16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;"><b>替换/新增动作</b><span style="color:var(--muted);font-size:12px;">${region || '该部位'} · ${eqPref.replace(/\(.*/,'')}</span><button class="fav-star-btn" onclick="document.getElementById('ex-picker-overlay').remove()">✕</button></div>
    <input type="text" class="form-input" placeholder="搜索动作..." oninput="filterPicker(this.value)" style="margin:12px 16px 8px;">
    <div style="flex:1;overflow-y:auto;padding:0 16px 16px;" id="ex-picker-list">${renderList('')}</div>
  </div>`;
  window._pickerCands = cands;
  window._pickerRender = renderList;
  document.body.appendChild(overlay);
}

function filterPicker(kw) {
  const listEl = document.getElementById('ex-picker-list');
  if (listEl && window._pickerRender) listEl.innerHTML = window._pickerRender(kw.trim());
}

// 选中动作 → 写入当日记录（custom），并设为组当前选中；仅当日有效，不写回方案
function addCustomExercise(groupId, name) {
  const record = getTodayRecord();
  const existing = record.exercises.find(e => e.name === name && e.groupId === groupId);
  if (!existing) record.exercises.push({ name: name, groupId: groupId, completed: false, custom: true });
  if (!record.groupSelections) record.groupSelections = {};
  record.groupSelections[groupId] = name;
  saveTodayRecord(record);
  const ov = document.getElementById('ex-picker-overlay');
  if (ov) ov.remove();
  showToast('已选用「' + name + '」', 'success');
  renderTrainingPage();
}

function finishTraining() {
  const record = getTodayRecord();
  const plan = getTrainingPlan(record.type);
  const allGroups = getAllGroups(plan);
  const completedCount = allGroups.filter(g => isGroupCompleted(g, record) && !isGroupSkipped(g, record)).length;
  const skippedCount = allGroups.filter(g => isGroupSkipped(g, record)).length;
  if (completedCount === 0 && !confirm('你还没完成任何部位，确定要结束今天的训练吗？')) return;
  // 不再强制补全：只记录实际勾选的完成 + 跳过的动作（15.4 决策）
  record.completed = true;
  record.completedGroups = completedCount;
  record.totalGroups = allGroups.length;
  record.skippedGroups = skippedCount;
  saveTodayRecord(record);
  advanceWorkout(record.type);
  showCelebration();
}

async function submitForRating() {
  const record = getTodayRecord();
  const plan = getTrainingPlan(record.type);
  const allGroups = getAllGroups(plan);
  const cardio = record.cardio || {};
  const rs = document.getElementById('rating-section');
  if(rs) rs.innerHTML = `<div class="rating-card rating-loading"><div class="rating-card-header">📊 AI 分析中...</div><div class="rating-card-body text-center" style="padding:20px;">🤔 正在综合评估...</div></div>`;

  let completed = [], incomplete = [];
  allGroups.forEach(g => {
    const done = isGroupCompleted(g, record);
    const ex = getSelectedExercise(g, record);
    const recEx = record.exercises.find(e => e.name===ex.name && e.groupId===g.id);
    const w = recEx?.weight||0;
    const line = g.label + '：' + ex.name + (w>0?' '+w+'kg':'');
    if(done) completed.push(line); else incomplete.push(line);
  });

  let report = '## 今日训练报告\n**类型**：'+plan.label+'（'+plan.subtitle+'）\n\n### ✅ 已完成\n';
  report += completed.length?completed.join('\n'):'（无）';
  report += '\n\n---以下未完成---\n';
  report += incomplete.length?incomplete.join('\n'):'（全部完成！）';
  report += '\n\n部位完成率：'+completed.length+'/'+allGroups.length;
  if(cardio.done) report += '\n\n### 🏃 有氧（附加项）\n✅ '+ (cardio.duration||0) +'分钟 · 坡度'+(cardio.incline||0)+'% · '+(cardio.distance||0)+'km';
  else report += '\n\n### 🏃 有氧（附加项）\n⬜ 未进行';
  report += '\n\n请输出3行训练小结（每行不超过30字）：\n✅ 完成度与亮点\n📊 与近期对比\n💡 明日建议\n然后给出评分（满分100）和简短评价。格式：【小结】... 【评分】XX分 【评价】...';

  try{
    const resp = await aiFetch('/api/ask',{password:getAIPassword(),deviceId:getDeviceId(),content:report});
    const d = await resp.json();
    if(d.success){
      record.aiRating = d.answer; record.aiSummary = d.answer; saveTodayRecord(record);
      if(rs) rs.innerHTML = '<div class="rating-card"><div class="rating-card-header"><span>📊 AI 复盘小结</span><span class="rating-refresh" onclick="submitForRating()">🔄 重评</span></div><div class="rating-card-body">'+d.answer.replace(/\n/g,'<br>')+'</div></div>';
    }else{
      if(rs) rs.innerHTML = '<div class="rating-card" style="border-color:var(--danger);"><div class="rating-card-header">⚠️ 评分失败</div><div class="rating-card-body">'+d.error+'</div><button class="btn btn-outline mt-8" onclick="submitForRating()">重试</button></div>';
    }
  }catch(e){
    if(rs) rs.innerHTML = '<div class="rating-card" style="border-color:var(--danger);"><div class="rating-card-header">⚠️ 无法连接</div><div class="rating-card-body">请确认后端已启动</div><button class="btn btn-outline mt-8" onclick="submitForRating()">重试</button></div>';
  }
}

function showCelebration() {
  document.getElementById('celebration').classList.remove('celebration-hidden');
  // 彩屑
  const emojis = ['🎉','✨','💪','🔥','⭐','🏆'];
  for (let i = 0; i < 20; i++) {
    setTimeout(() => {
      const el = document.createElement('span');
      el.className = 'celebration-confetti';
      el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      el.style.left = Math.random() * 100 + '%';
      el.style.animationDuration = (2 + Math.random() * 3) + 's';
      el.style.animationDelay = (Math.random() * 0.5) + 's';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 3500);
    }, i * 80);
  }
}

function closeCelebration() {
  document.getElementById('celebration').classList.add('celebration-hidden');
  renderTrainingPage();
}

function switchPlan() {
  const el = document.getElementById('plan-switcher');
  if (el) el.classList.remove('plan-switcher-hidden');
}
function closePlanSwitcher() {
  const el = document.getElementById('plan-switcher');
  if (el) el.classList.add('plan-switcher-hidden');
}
function switchToPlan(id) {
  setActivePlan(id);
  closePlanSwitcher();
  if (id !== 'default') {
    const plans = getPlans();
    const ap = plans.find(p => p.id === id);
    if (ap && ap.days) {
      switchTodayWorkoutType('custom_0');
    }
  } else {
    switchTodayWorkoutType('push');
  }
  // 确保显示训练页
  if (typeof navigateTo === 'function') navigateTo('training');
  showToast(id === 'default' ? '已切换到默认三分化' : '已切换方案：' + (getPlans().find(p=>p.id===id)?.name || ''), 'success');
  renderTrainingPage();
}

function resetTodayProgress() {
  if (!confirm('确定要清除今日所有完成记录吗？此操作不可恢复。')) return;
  const record = getTodayRecord();
  record.exercises = []; // P2-2：一并清掉 skipped/weight/reps/custom/completed
  record.groupSelections = {};
  record.cardio = null;
  record.aiRating = '';
  record.aiSummary = '';
  record.completed = false;
  delete record.completedGroups;
  delete record.totalGroups;
  delete record.skippedGroups;
  saveTodayRecord(record);
  showToast('今日进度已清零', 'success');
  renderTrainingPage();
}

function switchTrainingDay(type) {
  const record = getTodayRecord();
  const hasProgress = record.exercises && record.exercises.some(e => e.completed);
  if (hasProgress && !confirm('切换训练日会清空当前勾选进度，确定吗？')) return;
  switchTodayWorkoutType(type);
  renderTrainingPage();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========== 历史 ==========

let historyView = null, historyDetailDate = null, historyEditMode = false;

function showHistory() { historyView = 'list'; historyEditMode = false; renderHistoryList(); }
function backToTraining() { historyView = null; historyDetailDate = null; historyEditMode = false; renderTrainingPage(); }

function renderHistoryList() {
  const container = document.getElementById('training-content');
  const today = todayStr();
  const records = getRecords().filter(r => r.date !== today).sort((a, b) => b.date.localeCompare(a.date));
  let h = '<div class="history-topbar"><button class="history-back-btn" onclick="backToTraining()">← 返回</button><span class="history-title">训练历史</span><button class="history-add-btn" onclick="addHistoryRecord()">+ 补录</button></div>';
  if(records.length===0) h += '<div class="empty-state mt-24"><span class="empty-icon">📋</span><p>暂无历史记录</p></div>';
  else records.forEach(r => {
    const plan = getTrainingPlan(r.type);
    const exDone = r.exercises.filter(e=>e.completed).length;
    h += '<div class="card history-card '+ (r.completed?'history-done':'') +'" onclick="viewHistoryRecord(\''+r.id+'\')"><div class="flex-between"><div><div style="font-weight:700;font-size:15px;">'+plan.emoji+' '+plan.label+' · '+formatDate(r.date)+'</div><div style="font-size:12px;color:var(--muted);margin-top:2px;">'+(r.completed?'✅':'⬜')+' · '+exDone+'个动作</div></div><div style="font-size:20px;color:var(--muted);">→</div></div></div>';
  });
  container.innerHTML = h;
}

function addHistoryRecord() {
  const typeMap = { 'push': '🏋️ 推日', 'pull': '🏋️ 拉日', 'legs': '🏋️ 臀腿日', 'rest': '🧘 休息日' };
  let h = '<div class="plan-switcher-hidden" id="hist-add-sheet" style="display:block;">';
  h += '<div style="position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:400;" onclick="document.getElementById(\'hist-add-sheet\').remove()"></div>';
  h += '<div style="position:fixed;bottom:0;left:50%;transform:translateX(-50%);z-index:401;background:var(--surface);width:100%;max-width:680px;border-radius:14px 14px 0 0;padding:20px;padding-bottom:calc(20px + env(safe-area-inset-bottom,0px));">';
  h += '<h3 style="margin-bottom:12px;">补录训练</h3>';
  h += '<input type="date" class="form-input mb-8" id="hist-date" value="' + todayStr() + '" max="' + todayStr() + '">';
  h += '<div class="day-switcher mb-8" id="hist-type">';
  Object.entries(typeMap).forEach(([k, v], i) => { h += '<button class="day-switch-btn' + (i===0?' active':'') + '" onclick="selectHistType(this,\'' + k + '\')">' + v + '</button>'; });
  h += '</div>';
  h += '<input type="hidden" id="hist-type-val" value="push">';
  h += '<button class="btn btn-accent mb-8" onclick="confirmAddHistory()">确认添加</button>';
  h += '<button class="btn btn-outline" onclick="document.getElementById(\'hist-add-sheet\').remove()">取消</button></div></div>';
  document.getElementById('training-content').insertAdjacentHTML('beforeend', h);
}

function selectHistType(btn, type) {
  document.getElementById('hist-type-val').value = type;
  document.querySelectorAll('#hist-type .day-switch-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function confirmAddHistory() {
  const date = document.getElementById('hist-date').value;
  const type = document.getElementById('hist-type-val').value;
  document.getElementById('hist-add-sheet').remove();
  if (!date) { showToast('请选择日期', 'error'); return; }
  const record = { id: generateId(), date, type, completed: false, exercises: [], groupSelections: {} };
  const records = getRecords(); records.push(record); saveRecords(records);
  showToast('已创建记录', 'success');
  historyDetailDate = date; historyView = 'detail'; historyEditMode = true;
  renderHistoryDetail(record);
}

function viewHistoryRecord(id) {
  const r = getRecords().find(r=>r.id===id);
  if(!r) return;
  historyView = 'detail'; historyDetailDate = r.date; historyEditMode = false;
  renderHistoryDetail(r);
}

function renderHistoryDetail(record) {
  const container = document.getElementById('training-content');
  const plan = getTrainingPlan(record.type);
  const allFlat = getAllExercisesFlat(plan);
  let h = '<div class="history-topbar"><button class="history-back-btn" onclick="showHistory()">← 返回</button><span class="history-title">'+plan.emoji+' '+plan.label+' · '+formatDate(record.date)+'</span>';
  h += '<div style="display:flex;gap:6px;"><button class="history-edit-btn" onclick="toggleHistEdit(\''+record.id+'\')">'+(historyEditMode?'💾 保存':'✏️ 编辑')+'</button><button class="btn btn-sm btn-outline" onclick="navigateTo(\'training\');backToTraining()" style="min-height:36px;">📍 今天</button></div></div>';

  if (allFlat.length > 0) {
    plan.sections.forEach(section => {
      h += '<div class="mb-8"><span class="'+(section.badgeClass||'section-badge')+'" style="opacity:0.6;">'+section.badge+'</span>';
      section.groups.forEach(group => {
        h += '<div class="group-header" style="opacity:0.7;"><span class="group-target-label">🎯 '+group.label+'</span></div>';
        group.exercises.forEach(ex => {
          const recEx = record.exercises.find(e => e.name===ex.name && e.groupId===group.id);
          const isDone = recEx ? recEx.completed : false;
          const w = recEx ? (recEx.weight||'') : '';
          if(historyEditMode){
            h += '<div class="card group-exercise-card '+(isDone?'completed':'')+'" style="margin-bottom:6px;"><div style="display:flex;align-items:center;gap:8px;"><div class="checkbox-custom '+(isDone?'checked':'')+'" onclick="toggleHistEx(\''+record.id+'\',\''+group.id+'\',\''+escapeHtml(ex.name)+'\',this)" style="cursor:pointer;">'+(isDone?'✓':'')+'</div><div style="flex:1;"><div class="card-title" style="font-size:14px;">'+ex.name+'</div><div class="card-meta">'+ex.sets+'</div>'+(section.type==='main'&&ex.equipment?'<div class="weight-row"><input type="number" class="weight-input-sm" value="'+w+'" onchange="updateHistWeight(\''+record.id+'\',\''+group.id+'\',\''+escapeHtml(ex.name)+'\',this.value)" onfocus="this.select()" step="5"> <span class="weight-unit">kg</span></div>':'')+'</div><button class="history-delete-ex" onclick="deleteHistEx(\''+record.id+'\',\''+group.id+'\',\''+escapeHtml(ex.name)+'\')" title="删除">🗑️</button></div></div>';
          }else{
            h += '<div class="card group-exercise-card '+(isDone?'completed':'')+'" style="opacity:'+(isDone?'1':'0.45')+';margin-bottom:6px;"><div style="display:flex;align-items:center;gap:8px;"><div class="checkbox-custom '+(isDone?'checked':'')+'" style="width:22px;height:22px;font-size:12px;">'+(isDone?'✓':'')+'</div><div><div class="card-title" style="font-size:14px;'+(isDone?'':'text-decoration:line-through;opacity:0.5;')+'">'+ex.name+'</div><div class="card-meta">'+ex.sets+(w?' · '+w+'kg':'')+'</div></div></div></div>';
          }
        });
      });
      h += '</div>';
    });
  } else {
    h += '<p class="text-muted mt-16">该日无训练数据</p>';
  }
  h += '<button class="btn btn-danger mt-16" onclick="deleteHistoryRecord(\''+record.id+'\')">🗑️ 删除此记录</button>';
  container.innerHTML = h;
}

function toggleHistEdit(id) {
  historyEditMode = !historyEditMode;
  const r = getRecords().find(r=>r.id===id);
  if(r) renderHistoryDetail(r);
}

function toggleHistEx(recordId, groupId, exName, el) {
  const records = getRecords(); const r = records.find(r=>r.id===recordId); if(!r) return;
  let recEx = r.exercises.find(e=>e.name===exName && e.groupId===groupId);
  if(!recEx){ recEx = {name:exName,groupId:groupId,completed:false}; r.exercises.push(recEx); }
  recEx.completed = !recEx.completed;
  r.completed = getAllExercisesFlat(getTrainingPlan(r.type)).every(ex=>{const re=r.exercises.find(e=>e.name===ex.name&&e.groupId===ex.groupId);return re&&re.completed;});
  saveRecords(records);
  if(el){ if(recEx.completed){el.classList.add('checked');el.textContent='✓';}else{el.classList.remove('checked');el.textContent='';} }
}

function updateHistWeight(recordId, groupId, exName, value) {
  const records = getRecords(); const r = records.find(r=>r.id===recordId); if(!r) return;
  let recEx = r.exercises.find(e=>e.name===exName && e.groupId===groupId);
  if(!recEx){ recEx = {name:exName,groupId:groupId,completed:false}; r.exercises.push(recEx); }
  recEx.weight = parseFloat(value)||0; saveRecords(records);
}

function deleteHistEx(recordId, groupId, exName) {
  const records = getRecords(); const r = records.find(r=>r.id===recordId); if(!r) return;
  r.exercises = r.exercises.filter(e=>!(e.name===exName && e.groupId===groupId));
  saveRecords(records);
  historyEditMode = true;
  renderHistoryDetail(r);
}

function deleteHistoryRecord(id) {
  if(!confirm('确定删除？不可恢复。')) return;
  deleteRecord(id); showToast('已删除','success'); showHistory();
}

// ===== 周记 =====
async function generateWeeklyReport() {
  const rs = document.getElementById('rating-section');
  if (rs) rs.innerHTML = '<div class="rating-card rating-loading"><div class="rating-card-header">📊 生成周报中...</div><div class="rating-card-body text-center">🧠 AI正在汇总本周训练...</div></div>';

  // 获取本周训练
  const now = new Date();
  const dayOfWeek = now.getDay() || 7; // 周日=7
  const monday = new Date(now); monday.setDate(now.getDate() - dayOfWeek + 1);
  const weekRecords = getRecords().filter(r => {
    const d = new Date(r.date);
    return d >= monday && d <= now && r.completed;
  });

  if (weekRecords.length === 0) {
    if (rs) rs.innerHTML = '<div class="rating-card"><div class="rating-card-header">📊 本周报告</div><div class="rating-card-body">本周暂无完成的训练记录</div></div>';
    return;
  }

  let report = '## 本周训练数据\n';
  weekRecords.forEach(r => {
    const plan = getTrainingPlan(r.type);
    report += `- ${r.date} ${plan.label}：${r.exercises.filter(e=>e.completed).length}个动作完成\n`;
  });
  const weights = getWeights().filter(w => new Date(w.date) >= monday);
  if (weights.length > 0) report += `\n体重变化：${weights[0].weight}kg → ${weights[weights.length-1].weight}kg`;

  report += '\n\n请生成本周训练周报，包含：部位覆盖分析、总训练量评估、体重趋势、下周训练建议。简洁凝练。';

  try {
    const resp = await aiFetch('/api/ask',{password:getAIPassword(),deviceId:getDeviceId(),content:report});
    const d = await resp.json();
    if (d.success) {
      const log = getCoachLog(); log.push({ week: monday.toISOString().slice(0,10), summary: d.answer }); saveCoachLog(log);
      if (rs) rs.innerHTML = '<div class="rating-card"><div class="rating-card-header"><span>📊 本周训练周报</span></div><div class="rating-card-body">'+d.answer.replace(/\n/g,'<br>')+'</div></div>';
    } else {
      if (rs) rs.innerHTML = '<div class="rating-card" style="border-color:var(--danger);"><div class="rating-card-header">⚠️ 生成失败</div><div class="rating-card-body">'+d.error+'</div></div>';
    }
  } catch(e) {
    if (rs) rs.innerHTML = '<div class="rating-card" style="border-color:var(--danger);"><div class="rating-card-header">⚠️ 无法连接</div><div class="rating-card-body">请确认后端已启动</div></div>';
  }
}

function getCoachLog() {
  try { return JSON.parse(localStorage.getItem('fitness_coach_log') || '[]'); } catch { return []; }
}
function saveCoachLog(log) {
  localStorage.setItem('fitness_coach_log', JSON.stringify(log.slice(-12)));
}

function escapeHtml(str) {
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}
