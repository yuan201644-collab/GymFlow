"""修正 phase 标签：静态拉伸(等长) → stretch，动态激活/绕环 → warmup，有氧 → cardio"""
import re

with open('js/exercises.js', 'r', encoding='utf-8') as f:
    content = f.read()

def new_phase(name, mechanics, region):
    n = name
    m = mechanics or ''
    if region == '全身.有氧' or any(k in n for k in ['跑', '跳绳', '开合跳', '高抬腿', '蹬车', '单车', '踏步', '划船机']):
        return 'cardio'
    if m == '等长' and ('拉伸' in n or '婴儿式' in n or '鸽子式' in n or '抱膝' in n):
        return 'stretch'
    if any(k in n for k in ['拉伸', '滚动', '绕环', '激活', '预热', '热身', '天使', '猫牛', 'YTW', '死虫', '鸟狗']):
        return 'warmup'
    return 'main'

count = 0
# 匹配每个动作块，替换 phase
def fix_block(m):
    global count
    block = m.group(0)
    name = re.search(r'name:"([^"]+)"', block).group(1)
    mech = re.search(r'mechanics:"([^"]+)"', block)
    mech = mech.group(1) if mech else ''
    reg = re.search(r'region:"([^"]+)"', block)
    reg = reg.group(1) if reg else ''
    newp = new_phase(name, mech, reg)
    # 替换 phase
    block = re.sub(r'phase:"[^"]*"', f'phase:"{newp}"', block)
    count += 1
    return block

content = re.sub(r'\{[^{}]*(?:{[^{}]*}[^{}]*)*\}', fix_block, content)

with open('js/exercises.js', 'w', encoding='utf-8') as f:
    f.write(content)
print(f'Fixed {count} phase tags')
