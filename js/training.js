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
            pickHint: '2选1',
            exercises: [
              { name: '门框胸肌静态拉伸', sets: '每侧30秒', equipment: '', tip: '手肘90°放在门框上，同侧腿前跨一步缓慢前移身体。感受胸大肌+胸小肌拉伸。圆肩者每天必做，可延长至45秒', default: true },
              { name: '双手背后交握拉伸', sets: '30秒×2组', equipment: '', tip: '双手背后交握，缓慢抬高手臂，同时挺胸。感受胸肌和三角肌前束同时拉伸。保持躯干直立', default: false },
            ],
          },
          {
            id: 'push-stretch-front-delt',
            label: '三角肌前束拉伸',
            pickHint: '2选1',
            exercises: [
              { name: '背后交握抬臂', sets: '每侧30秒', equipment: '', tip: '双手背后交握，缓慢抬高手臂直至肩前侧有拉伸感。保持躯干直立不弯腰。肩峰撞击者勿强行抬高', default: true },
              { name: '门框单侧肩前束拉伸', sets: '每侧30秒', equipment: '', tip: '侧对门框，同侧手伸直向后扶门框，身体缓慢向前旋转。感受三角肌前束独立拉伸', default: false },
            ],
          },
          {
            id: 'push-stretch-triceps',
            label: '肱三头肌拉伸',
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
            pickHint: '2选1',
            exercises: [
              { name: 'YTW激活', sets: '每个字母10次×2组', equipment: '', tip: '俯身约45°，Y：手臂过头拇指朝上；T：侧平举肩胛后缩；W：屈肘下拉肩胛全力挤压。每个姿势顶端停1秒', default: true },
              { name: '俯身哑铃飞鸟（轻重量）', sets: '15次×2组', equipment: '轻哑铃(1-3kg)', tip: '俯身背部挺直，双手持轻哑铃向两侧打开至肩胛骨后缩。感受后束发力，慢放3秒', default: false },
            ],
          },
          {
            id: 'pull-warmup-rotator',
            label: '肩袖激活',
            pickHint: '2选1',
            exercises: [
              { name: '弹力带肩外旋', sets: '15次×2组', equipment: '弹力带', tip: '上臂贴紧身体，只外旋小臂。强化肩袖后侧肌群，对抗肱骨前移', default: true },
              { name: '弹力带肩内旋', sets: '15次×2组', equipment: '弹力带', tip: '弹力带固定在侧面，上臂贴身体，从外向内旋转小臂。训练肩胛下肌，肩袖肌群前后平衡', default: false },
            ],
          },
          {
            id: 'pull-warmup-scapula',
            label: '肩胛控制',
            pickHint: '2选1',
            exercises: [
              { name: '沉肩+肩胛后缩', sets: '15次×2组', equipment: '', tip: '先"沉肩"（肩膀远离耳朵），再"后缩"（肩胛骨向脊柱夹）。分两步做建立神经肌肉控制。圆肩者重建肩胛位置感', default: true },
              { name: '弹力带肩胛后缩', sets: '15次×2组', equipment: '弹力带', tip: '双手各持弹力带一端于胸前，手臂伸直，做肩胛骨后缩动作（手不弯曲），感受中下斜方发力', default: false },
            ],
          },
          {
            id: 'pull-warmup-pulldown',
            label: '下拉预热',
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
            pickHint: '2选1',
            exercises: [
              { name: '固定物背阔肌拉伸', sets: '每侧30秒', equipment: '', tip: '双手抓稳固定物，身体后坐，感受背阔肌从腋下到腰侧的拉伸。圆肩者此区域通常也紧张', default: true },
              { name: '跪姿背阔肌拉伸', sets: '每侧30秒', equipment: '瑜伽垫', tip: '跪姿双手伸直放地面，臀部向后坐至脚跟，感受背阔肌和腰部拉伸。婴儿式变体', default: false },
            ],
          },
          {
            id: 'pull-stretch-biceps',
            label: '肱二头肌拉伸',
            pickHint: '2选1',
            exercises: [
              { name: '站姿肱二头肌拉伸', sets: '每侧30秒', equipment: '', tip: '手臂伸直向身体后方伸展，手掌朝上。保持躯干直立，不要弯腰代偿', default: true },
              { name: '门框肱二头肌拉伸', sets: '每侧30秒', equipment: '', tip: '手伸直侧平举扶门框，身体缓慢向另一侧旋转，拉伸肱二头肌和前肩', default: false },
            ],
          },
          {
            id: 'pull-stretch-chest-again',
            label: '胸肌再拉伸（对抗圆肩）',
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
            pickHint: '2选1',
            exercises: [
              { name: '髋绕环', sets: '每侧10次', equipment: '', tip: '单腿站立，另一腿屈髋屈膝由内向外画大圈绕环。感受髋关节囊充分活动开', default: true },
              { name: '弹力带髋屈伸', sets: '每侧10次', equipment: '弹力带', tip: '弹力带固定于脚踝，向前向后各踢腿10次。激活髋屈肌和臀大肌', default: false },
            ],
          },
          {
            id: 'legs-warmup-glute-med',
            label: '臀中肌激活',
            pickHint: '2选1',
            exercises: [
              { name: '蚌式开合', sets: '每侧15次×2组', equipment: '弹力带（可选）', tip: '侧卧双膝弯曲并拢，上侧膝盖像蚌壳向上打开。顶峰停1秒。激活臀中肌，改善膝盖内扣', default: true },
              { name: '侧卧抬腿', sets: '每侧15次×2组', equipment: '', tip: '侧卧，上方腿伸直抬高约30°，脚尖微朝下。慢放3秒。臀中肌孤立训练', default: false },
            ],
          },
          {
            id: 'legs-warmup-squat',
            label: '下肢预热',
            pickHint: '2选1',
            exercises: [
              { name: '自重深蹲', sets: '15次×2组', equipment: '', tip: '双脚与肩同宽，下蹲时髋部先动像坐椅子，膝盖沿脚尖方向走。大腿至少平行地面。膝盖内扣说明臀中肌未激活', default: true },
              { name: '高脚杯深蹲', sets: '15次×1组', equipment: '轻哑铃/壶铃', tip: '双手托一个轻哑铃于胸前做深蹲。重量帮助保持躯干直立，激活核心。预热效果好', default: false },
            ],
          },
          {
            id: 'legs-warmup-legpress',
            label: '腿举预热',
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
            pickHint: '2选1',
            exercises: [
              { name: '鸽子式', sets: '每侧30秒', equipment: '', tip: '一腿屈膝横放前，后腿伸直，身体前倾至臀大肌和臀中肌有拉伸感。髋紧张者在前腿臀下垫毛巾', default: true },
              { name: '仰卧抱膝拉伸', sets: '每侧30秒', equipment: '', tip: '仰卧，一侧膝盖双手抱向胸部。感受臀大肌拉伸。保持深呼吸', default: false },
            ],
          },
          {
            id: 'legs-stretch-quads',
            label: '股四头肌拉伸',
            pickHint: '2选1',
            exercises: [
              { name: '站姿股四头肌拉伸', sets: '每侧30秒', equipment: '', tip: '单腿站立，同侧手抓脚踝向后拉，膝盖并拢。膝盖不适者动作轻柔', default: true },
              { name: '侧卧股四头肌拉伸', sets: '每侧30秒', equipment: '', tip: '侧卧，上方腿屈膝手抓脚踝向后拉。比站姿更容易放松，不会摔倒', default: false },
            ],
          },
          {
            id: 'legs-stretch-hamstrings',
            label: '腘绳肌拉伸',
            pickHint: '2选1',
            exercises: [
              { name: '坐姿体前屈', sets: '每侧30秒', equipment: '', tip: '坐姿一腿伸直一腿屈膝，身体前倾手够脚尖。够不到够小腿即可。保持背部挺直', default: true },
              { name: '仰卧弹力带拉伸', sets: '每侧30秒', equipment: '弹力带/毛巾', tip: '仰卧一腿伸直套弹力带，手拉弹力带将腿拉向身体。比坐姿更容易控制强度', default: false },
            ],
          },
          {
            id: 'legs-stretch-calves',
            label: '小腿拉伸',
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
            pickHint: '2选1',
            exercises: [
              { name: '门框胸肌拉伸（加长版）', sets: '每侧45秒×2组', equipment: '', tip: '比训练日拉伸更久！手肘90°放门框，身体缓慢前移。圆肩的根本原因是胸肌过紧，休息日投入更多时间拉伸', default: true },
              { name: '仰卧泡沫轴胸椎伸展', sets: '2分钟', equipment: '泡沫轴', tip: '泡沫轴纵向放在脊柱下方（头到臀部），双手打开成T字形，膝盖弯曲。让重力自然打开胸椎和胸肌。深呼吸放松', default: false },
            ],
          },
          {
            id: 'rest-posture-neck',
            label: '颈部+上斜方放松',
            pickHint: '2选1',
            exercises: [
              { name: '下巴回缩（Chin Tuck）', sets: '10次×3组', equipment: '', tip: '坐直或站直，下巴水平向后缩（像做双下巴），后脑勺有轻微拉伸感。保持2秒放松。纠正头前伸姿势', default: true },
              { name: '上斜方肌拉伸', sets: '每侧30秒×2组', equipment: '', tip: '坐姿一侧手抓住凳子边缘，头向对侧侧屈，另一手轻辅助。感受脖子侧面到肩膀的拉伸。不要耸肩', default: false },
            ],
          },
          {
            id: 'rest-posture-hips',
            label: '髋部+下背放松',
            pickHint: '2选1',
            exercises: [
              { name: '90-90髋部拉伸', sets: '每侧30秒×2组', equipment: '瑜伽垫', tip: '坐姿前腿屈膝90°外旋，后腿屈膝90°内旋（呈两个90°角）。身体前倾拉伸前腿臀部和后腿髋屈肌。改善髋关节灵活性', default: true },
              { name: '婴儿式（Child\'s Pose）', sets: '60秒×2组', equipment: '瑜伽垫', tip: '跪姿臀部坐脚跟，双手向前伸直，额头贴地。深呼吸感受整个背部和髋部放松。减压恢复动作', default: false },
            ],
          },
          {
            id: 'rest-posture-scapula',
            label: '肩胛稳定性（防溜肩）',
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
  return TRAINING_PLANS[type] || TRAINING_PLANS.push;
}

/** 获取所有动作（扁平化，遍历所有group的所有exercise） */
function getAllExercisesFlat(plan) {
  const exercises = [];
  plan.sections.forEach(section => {
    if (section.groups) {
      section.groups.forEach(group => {
        group.exercises.forEach((ex, i) => {
          exercises.push({ ...ex, groupId: group.id, groupLabel: group.label, isDefault: ex.default });
        });
      });
    }
  });
  return exercises;
}

/** 获取所有动作组 */
function getAllGroups(plan) {
  const groups = [];
  plan.sections.forEach(section => {
    if (section.groups) section.groups.forEach(g => groups.push(g));
  });
  return groups;
}

/** 检查一个组是否已完成（至少完成1个动作） */
function isGroupCompleted(group, record) {
  return group.exercises.some(ex => {
    const recEx = record.exercises.find(e => e.name === ex.name && e.groupId === group.id);
    return recEx && recEx.completed;
  });
}

// ========== 渲染训练页 ==========

function renderTrainingPage() {
  const container = document.getElementById('training-content');
  const record = getTodayRecord();
  const plan = getTrainingPlan(record.type);

  const allGroups = getAllGroups(plan);
  const totalGroups = allGroups.length;

  // 计算完成部位数
  let completedGroups = 0;
  allGroups.forEach(group => {
    if (isGroupCompleted(group, record)) completedGroups++;
  });

  let html = '';

  // 新安装检测：无任何记录时显示导入提示
  const allRecords = getRecords();
  const allWeights = getWeights();
  if (allRecords.length === 0 && allWeights.length === 0) {
    html += `
      <div class="fresh-install-banner">
        <div class="fresh-install-icon">📂</div>
        <div class="fresh-install-text">
          <b>首次使用或更换了文件夹？</b><br>
          如有备份文件，请先导入恢复数据
        </div>
        <button class="btn btn-sm btn-outline" onclick="navigateTo('settings')" style="width:auto;flex-shrink:0;">去导入 →</button>
      </div>
    `;
  }

  // 进度头部
  html += `
    <div class="progress-section">
      <div class="day-switcher mb-16">
        ${['push','pull','legs','rest'].map(type => {
          const p = getTrainingPlan(type);
          const isActive = record.type === type;
          return `
            <button class="day-switch-btn ${isActive ? 'active' : ''}"
              onclick="switchTrainingDay('${type}')">
              <span class="day-switch-emoji">${p.emoji}</span>
              <span class="day-switch-label">${p.label}</span>
            </button>
          `;
        }).join('')}
      </div>

      <div class="progress-header">
        <div>
          <div class="day-label">${plan.emoji} ${plan.label}</div>
          <div class="day-subtitle">${plan.subtitle}</div>
        </div>
        <div class="progress-count">
          <span id="completed-count">${completedGroups}</span>/<span>${totalGroups}</span> 部位完成
        </div>
      </div>
      <div class="progress-bar mt-8">
        <div class="progress-fill" id="progress-fill" style="width: ${totalGroups ? (completedGroups / totalGroups * 100) : 0}%"></div>
      </div>
    </div>
  `;

  let globalIdx = 0;

  // 遍历每个 section
  plan.sections.forEach((section, secIdx) => {
    html += `<div class="mb-16">`;
    html += `<span class="${section.badgeClass || 'section-badge'}">${section.badge}</span>`;
    html += `<h3 class="mb-8" style="font-size:15px;color:var(--text-secondary);">${section.title}</h3>`;

    section.groups.forEach((group) => {
      // 组头部标签 — 显示几选几提示
      const pickHint = group.pickHint || `${group.exercises.length}选1-${group.exercises.length}`;
      const groupDone = isGroupCompleted(group, record);
      html += `
        <div class="group-header ${groupDone ? 'group-done' : ''}">
          <span class="group-target-label">${groupDone ? '✅' : '🎯'} ${group.label}</span>
          <span class="group-pick-hint">${pickHint}</span>
        </div>
      `;

      group.exercises.forEach((exercise) => {
        const idx = globalIdx++;
        const recEx = record.exercises.find(e => e.name === exercise.name && e.groupId === group.id);
        const isCompleted = recEx ? recEx.completed : false;
        const weight = recEx ? (recEx.weight || '') : '';

        html += `
          <div class="card group-exercise-card ${isCompleted ? 'completed' : ''}" id="card-${idx}">
            <div class="card-header">
              <div class="checkbox-wrapper" onclick="toggleFlatExercise(${idx},'${group.id}','${escapeHtml(exercise.name)}')">
                <div class="checkbox-custom ${isCompleted ? 'checked' : ''}" id="check-${idx}">
                  ${isCompleted ? '✓' : ''}
                </div>
                <div style="flex:1;">
                  <div class="card-title" style="font-size:15px;${isCompleted ? 'text-decoration:line-through;color:var(--accent);' : ''}">${exercise.name}</div>
                  <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px;">
                    ${exercise.equipment ? `<span class="card-equipment">${exercise.equipment}</span>` : ''}
                  </div>
                  <div class="card-meta">${exercise.sets}</div>
                  ${(section.type === 'main' && exercise.equipment) ? `
                  <div class="weight-row" onclick="stopPropagation(event)">
                    <span class="weight-label">🏋️</span>
                    <input type="number" class="weight-input-sm" placeholder="重量" value="${weight}"
                      onchange="updateExerciseWeight('${group.id}','${escapeHtml(exercise.name)}',this.value)"
                      onfocus="this.select()" inputmode="decimal" step="5" min="0" max="500">
                    <span class="weight-unit">kg</span>
                  </div>` : ''}
                </div>
              </div>
            </div>
            ${exercise.tip ? `<div class="card-tip">💡 ${exercise.tip}</div>` : ''}
          </div>
        `;
      });
    });

    html += `</div>`;
  });

  // 有氧提醒卡片（仅推/拉/臀腿日显示）
  if (record.type !== 'rest') {
    html += `
      <div class="card cardio-card mt-16">
        <div class="cardio-header">
          <span>🏃 今日有氧计划</span>
          <span class="cardio-split">上午无氧 → 傍晚有氧</span>
        </div>
        <div class="cardio-detail">
          <div class="cardio-item">
            <span class="cardio-label">方式</span>
            <span>坡度爬坡</span>
          </div>
          <div class="cardio-item">
            <span class="cardio-label">心率</span>
            <span>60% 目标心率 ≈ <b>126次/分</b></span>
          </div>
          <div class="cardio-item">
            <span class="cardio-label">时长</span>
            <span>30-40分钟</span>
          </div>
          <div class="cardio-item">
            <span class="cardio-label">频率</span>
            <span>每周4-5次</span>
          </div>
        </div>
        <div class="cardio-note">
          ⚠️ 睡眠差或身体疲惫时，降低时长/强度或暂停有氧
        </div>
      </div>
    `;
  }

  // 重量标准提示
  html += `
    <div class="weight-standard mt-16">
      <span class="weight-standard-icon">⚖️</span>
      <span>动作形态优先于重量 · 动作不变形前提下，最后2次发力吃力为宜</span>
    </div>
  `;

  // 完成按钮
  const allDone = completedGroups >= totalGroups;
  html += `
    <button class="btn btn-accent mt-16" id="finish-btn"
      ${allDone ? '' : 'disabled'}
      onclick="finishTraining()">
      ${allDone ? '🎉 训练完成！' : `请完成所有训练部位 (${completedGroups}/${totalGroups})`}
    </button>
  `;

  container.innerHTML = html;
}

// ========== 交互处理 ==========

function updateExerciseWeight(groupId, exerciseName, value) {
  const record = getTodayRecord();
  let recEx = record.exercises.find(e => e.name === exerciseName && e.groupId === groupId);
  if (!recEx) {
    recEx = { name: exerciseName, groupId: groupId, completed: false };
    record.exercises.push(recEx);
  }
  recEx.weight = parseFloat(value) || 0;
  saveTodayRecord(record);
}

function toggleFlatExercise(idx, groupId, exerciseName) {
  const record = getTodayRecord();

  let recEx = record.exercises.find(e => e.name === exerciseName && e.groupId === groupId);
  const currentCompleted = recEx ? recEx.completed : false;

  if (!recEx) {
    recEx = { name: exerciseName, groupId: groupId, completed: false };
    record.exercises.push(recEx);
  }

  recEx.completed = !currentCompleted;
  saveTodayRecord(record);

  // 更新 UI
  const checkbox = document.getElementById(`check-${idx}`);
  const card = document.getElementById(`card-${idx}`);
  const titleEl = card ? card.querySelector('.card-title') : null;

  if (!currentCompleted) {
    if (checkbox) { checkbox.classList.add('checked'); checkbox.textContent = '✓'; }
    if (card) card.classList.add('completed');
    if (titleEl) { titleEl.style.textDecoration = 'line-through'; titleEl.style.color = 'var(--accent)'; }
  } else {
    if (checkbox) { checkbox.classList.remove('checked'); checkbox.textContent = ''; }
    if (card) card.classList.remove('completed');
    if (titleEl) { titleEl.style.textDecoration = ''; titleEl.style.color = ''; }
  }

  updateProgress();
  updateFinishButton();
}

function updateProgress() {
  const record = getTodayRecord();
  const plan = getTrainingPlan(record.type);
  const allGroups = getAllGroups(plan);

  let completedGroups = 0;
  allGroups.forEach(group => {
    if (isGroupCompleted(group, record)) completedGroups++;
  });

  const countEl = document.getElementById('completed-count');
  const fillEl = document.getElementById('progress-fill');
  if (countEl) countEl.textContent = completedGroups;
  if (fillEl) fillEl.style.width = allGroups.length ? (completedGroups / allGroups.length * 100) + '%' : '0%';

  // 更新组头部状态
  allGroups.forEach((group, i) => {
    const done = isGroupCompleted(group, record);
    const headers = document.querySelectorAll('.group-header');
    if (headers[i]) {
      const label = headers[i].querySelector('.group-target-label');
      if (done) {
        headers[i].classList.add('group-done');
        if (label) label.textContent = label.textContent.replace('🎯', '✅');
      } else {
        headers[i].classList.remove('group-done');
        if (label) label.textContent = label.textContent.replace('✅', '🎯');
      }
    }
  });
}

function updateFinishButton() {
  const record = getTodayRecord();
  const plan = getTrainingPlan(record.type);
  const allGroups = getAllGroups(plan);

  let completedGroups = 0;
  allGroups.forEach(group => {
    if (isGroupCompleted(group, record)) completedGroups++;
  });

  const allDone = completedGroups >= allGroups.length;
  const btn = document.getElementById('finish-btn');
  if (btn) {
    if (allDone) {
      btn.disabled = false;
      btn.textContent = '🎉 训练完成！';
    } else {
      btn.disabled = true;
      btn.textContent = `请完成所有训练部位 (${completedGroups}/${allGroups.length})`;
    }
  }
}

function finishTraining() {
  const record = getTodayRecord();
  const plan = getTrainingPlan(record.type);
  const allGroups = getAllGroups(plan);

  // 每个组至少标记一个动作为完成
  allGroups.forEach(group => {
    const alreadyDone = group.exercises.some(ex => {
      const recEx = record.exercises.find(e => e.name === ex.name && e.groupId === group.id);
      return recEx && recEx.completed;
    });
    if (!alreadyDone) {
      const defaultEx = group.exercises.find(e => e.default) || group.exercises[0];
      let recEx = record.exercises.find(e => e.name === defaultEx.name && e.groupId === group.id);
      if (!recEx) {
        recEx = { name: defaultEx.name, groupId: group.id, completed: false };
        record.exercises.push(recEx);
      }
      recEx.completed = true;
    }
  });

  record.completed = true;
  saveTodayRecord(record);
  advanceWorkout(record.type);
  showCelebration();
  updateProgress();
  updateFinishButton();
}

function showCelebration() {
  const el = document.getElementById('celebration');
  el.classList.remove('celebration-hidden');
}

function closeCelebration() {
  const el = document.getElementById('celebration');
  el.classList.add('celebration-hidden');
  renderTrainingPage();
}

function switchTrainingDay(type) {
  switchTodayWorkoutType(type);
  renderTrainingPage();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  showToast(`已切换到${getTrainingPlan(type).label}`, 'success');
}

function escapeHtml(str) {
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}
